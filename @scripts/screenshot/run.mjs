import fs from "fs";
import path from "path";
import { parseArgs } from "node:util";
import { chromium, firefox, webkit } from "playwright";
import {
  BASE_PATH,
  DEFAULT_BROWSERS,
  DEFAULT_OUT_DIR,
  DEFAULT_VIEWPORTS,
  LANGUAGES,
  MOBILE_BREAKPOINT,
  SCREENSHOT_PORT,
  SERVER_PORT,
} from "./config.mjs";
import { getAllRoutes, routeToFilename } from "./routes.mjs";
import { capturePage } from "./capture.mjs";
import { ensureServer, stopServer } from "./server.mjs";

/* global localStorage */
const BROWSERS = { chromium, firefox, webkit };

const { values } = parseArgs({
  options: {
    browsers: { type: "string" },
    viewports: { type: "string" },
    only: { type: "string" },
    lang: { type: "string", default: "en" },
    "no-fold": { type: "boolean", default: false },
    "menu-open": { type: "boolean", default: false },
    prod: { type: "boolean", default: false },
    reuse: { type: "boolean", default: false },
    "skip-existing": { type: "boolean", default: false },
    list: { type: "boolean", default: false },
    out: { type: "string" },
    concurrency: { type: "string", default: "4" },
  },
  strict: false,
});

const parseViewports = (input) =>
  input.split(",").map((part) => {
    const [width, height] = part.split("x").map(Number);
    if (!width || !height) {
      console.error(`✗ invalid viewport: ${part} (expected WIDTHxHEIGHT, e.g. 390x844)`);
      process.exit(1);
    }
    return { name: part, width, height };
  });

const resolveBrowsers = (input) => {
  const names = input.split(",").map((name) => name.trim());
  for (const name of names) {
    if (!BROWSERS[name]) {
      console.error(`✗ unknown browser: ${name} (expected ${Object.keys(BROWSERS).join(", ")})`);
      process.exit(1);
    }
  }
  return names;
};

const resolveLang = (input) => {
  if (!LANGUAGES.includes(input)) {
    console.error(`✗ unknown language: ${input} (expected ${LANGUAGES.join(", ")})`);
    process.exit(1);
  }
  return input;
};

const uniqueFilename = (seen, name) => {
  let candidate = name;
  let suffix = 2;
  while (seen.has(candidate)) candidate = `${name}-${suffix++}`;
  seen.add(candidate);
  return candidate;
};

const main = async () => {
  const lang = resolveLang(values.lang);
  const browsers = values.browsers ? resolveBrowsers(values.browsers) : DEFAULT_BROWSERS;
  const viewports = values.viewports ? parseViewports(values.viewports) : DEFAULT_VIEWPORTS;
  const only = values.only
    ? values.only
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
  const outDir = values.out ? path.resolve(values.out) : DEFAULT_OUT_DIR;
  const concurrency = Math.max(1, parseInt(values.concurrency, 10) || 4);
  const withFold = !values["no-fold"];
  const port = values.prod || !values.reuse ? SCREENSHOT_PORT : SERVER_PORT;
  const baseUrl = `http://localhost:${port}${BASE_PATH}`;

  let routes = getAllRoutes(lang);
  if (only) {
    routes = routes.filter((route) =>
      only.some((match) => route === match || (match.length > 1 && route.startsWith(match)))
    );
  }
  if (routes.length === 0) {
    console.error("✗ no routes match the --only filters");
    process.exit(1);
  }

  const seenByDir = new Map();
  const jobs = [];
  const pushJob = (browser, viewport, route, base, dir) => {
    jobs.push({
      browser,
      viewport,
      route,
      url: `${baseUrl}${route}`,
      fullPath: path.join(dir, `${base}.full.png`),
      foldPath: withFold ? path.join(dir, `${base}.fold.png`) : null,
    });
  };
  for (const browser of browsers) {
    for (const viewport of viewports) {
      const dir = path.join(outDir, browser, viewport.name);
      let seen = seenByDir.get(dir);
      if (!seen) {
        seen = new Set();
        seenByDir.set(dir, seen);
      }
      for (const route of routes) {
        pushJob(browser, viewport, route, uniqueFilename(seen, routeToFilename(route)), dir);
      }
    }
  }

  if (values["menu-open"]) {
    const mobileViewports = viewports.filter((viewport) => viewport.width < MOBILE_BREAKPOINT);
    if (mobileViewports.length === 0) {
      console.warn("⚠ --menu-open has no effect: no viewports narrower than the md breakpoint (768px)");
    }
    for (const browser of browsers) {
      for (const viewport of mobileViewports) {
        const dir = path.join(outDir, browser, viewport.name);
        let seen = seenByDir.get(dir);
        if (!seen) {
          seen = new Set();
          seenByDir.set(dir, seen);
        }
        for (const route of routes) {
          const base = uniqueFilename(seen, `${routeToFilename(route)}-menu`);
          pushJob(browser, viewport, route, base, dir);
          jobs[jobs.length - 1].openMenu = true;
        }
      }
    }
  }

  if (values.list) {
    for (const url of [...new Set(jobs.map((job) => job.url))]) console.log(url);
    process.exit(0);
  }

  const withSkipped = jobs.length;
  const pending = jobs.filter((job) => {
    if (!values["skip-existing"]) return true;
    const hasFull = fs.existsSync(job.fullPath);
    const hasFold = !job.foldPath || fs.existsSync(job.foldPath);
    return !(hasFull && hasFold);
  });
  const skipped = withSkipped - pending.length;

  const menuOpenCount = jobs.filter((job) => job.openMenu).length;
  console.log(
    `▶ ${withSkipped} captures planned against ${baseUrl} (${routes.length} routes × ${viewports.length} viewports × ${browsers.length} browsers${withFold ? " × fold+full" : " × full"}${menuOpenCount ? ` + ${menuOpenCount} menu-open` : ""}), ${skipped} skipped`
  );
  if (pending.length === 0) {
    console.log("✓ nothing to do");
    process.exit(0);
  }

  const serverChild = await ensureServer({ port, reuse: values.reuse, prod: values.prod });
  const failures = [];

  const attemptCapture = async (context, job) => {
    try {
      await capturePage(context, job);
      return null;
    } catch {
      try {
        await capturePage(context, job);
        return null;
      } catch (retryErr) {
        return retryErr;
      }
    }
  };

  const runJobs = async (context, browserJobs) => {
    let index = 0;
    const worker = async () => {
      while (index < browserJobs.length) {
        const job = browserJobs[index++];
        const error = await attemptCapture(context, job);
        if (error) {
          failures.push({ ...job, error });
          console.log(`✗ ${job.browser} ${job.viewport.name} ${job.route} - ${error.message}`);
        } else {
          console.log(`✓ ${job.browser} ${job.viewport.name} ${job.route}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, browserJobs.length) }, worker));
  };

  try {
    for (const browser of browsers) {
      const browserJobs = pending.filter((job) => job.browser === browser);
      console.log(`\n▶ ${browser} - ${browserJobs.length} captures`);
      const browserInstance = await BROWSERS[browser].launch();
      try {
        const byViewport = new Map();
        for (const job of browserJobs) {
          if (!byViewport.has(job.viewport.name)) byViewport.set(job.viewport.name, []);
          byViewport.get(job.viewport.name).push(job);
        }
        for (const viewportJobs of byViewport.values()) {
          const viewport = viewportJobs[0].viewport;
          const context = await browserInstance.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            locale: lang === "pl" ? "pl-PL" : "en-US",
          });
          if (lang === "pl") {
            await context.addInitScript(() => localStorage.setItem("smc-language", "pl"));
          }
          await runJobs(context, viewportJobs);
          await context.close();
        }
      } finally {
        await browserInstance.close();
      }
    }
  } finally {
    await stopServer(serverChild, port);
  }

  console.log(`\n=== done: ${pending.length - failures.length}/${pending.length} captures ===`);
  if (failures.length > 0) {
    console.log("failed:");
    for (const failure of failures) {
      console.log(`  ✗ ${failure.browser} ${failure.viewport.name} ${failure.route} - ${failure.error.message}`);
    }
    process.exit(1);
  }
  console.log("✓ all screenshots captured");
  process.exit(0);
};

main();
