/* global document, getComputedStyle */
import { spawn, execFile } from "node:child_process";
import net from "node:net";
import { root, BASE_PATH, SCREENSHOT_PORT } from "./config.mjs";

export const SCREENSHOT_ENV = { ...process.env, VITE_SCREENSHOT: "true" };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const portInUse = (port) =>
  new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1");
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });

const isReady = async (baseUrl) => {
  try {
    const res = await fetch(baseUrl, { method: "HEAD" });
    return res.status < 500;
  } catch {
    return false;
  }
};

const waitUntilReady = async (baseUrl, timeoutMs) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isReady(baseUrl)) return true;
    await sleep(500);
  }
  return false;
};

const pidOnPort = (port) =>
  new Promise((resolve) => {
    execFile("netstat", ["-ano", "-p", "TCP"], { windowsHide: true }, (err, stdout) => {
      if (err) return resolve(null);
      const line = stdout.split("\n").find((l) => l.includes(`:${port}`) && l.includes("LISTENING"));
      if (!line) return resolve(null);
      const pid = Number(line.trim().split(/\s+/).pop());
      resolve(Number.isInteger(pid) ? pid : null);
    });
  });

const killPid = (pid) => {
  if (!pid) return;
  if (process.platform === "win32") {
    spawn(`taskkill /pid ${pid} /T /F`, { shell: true, stdio: "ignore" });
  }
};

const runBuild = () =>
  new Promise((resolve, reject) => {
    const child = spawn("npm.cmd run build:screenshot", {
      cwd: root,
      env: SCREENSHOT_ENV,
      shell: true,
      stdio: "inherit",
    });
    child.once("exit", (code) => (code === 0 ? resolve() : reject(new Error(`build failed with exit code ${code}`))));
  });

export const probeScreenshotMode = async (baseUrl) => {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    try {
      await page.goto(`${baseUrl}/about`, { waitUntil: "domcontentloaded", timeout: 30000 });
    } catch {
      return false;
    }
    try {
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch {
      // third-party stat APIs may stall — proceed once the page has settled
    }
    await page.waitForTimeout(1500);
    const fixed = await page.evaluate(() => {
      const el = [...document.querySelectorAll("[class*=warped]")][0];
      return el ? getComputedStyle(el).position === "fixed" : null;
    });
    return fixed === false;
  } finally {
    await browser.close();
  }
};

export const ensureServer = async ({ port, reuse, prod }) => {
  const baseUrl = `http://localhost:${port}${BASE_PATH}`;
  const inUse = await portInUse(port);

  if (inUse) {
    if (await waitUntilReady(baseUrl, 5000)) {
      if (!reuse) {
        console.error(`✗ port ${port} is busy — use --reuse to reuse it, or stop it and rerun`);
        process.exit(1);
      }
      const screenshotMode = await probeScreenshotMode(baseUrl);
      if (!screenshotMode) {
        console.error(
          `✗ server on port ${port} is NOT running with VITE_SCREENSHOT=true — full-page backgrounds will be broken`
        );
        console.error(
          `  restart it with "npm run dev:screenshot" or drop --reuse to use a dedicated server on port ${SCREENSHOT_PORT}`
        );
        process.exit(1);
      }
      console.log(`✓ reusing server on port ${port} (screenshot mode verified)`);
      return { child: null, baseUrl };
    }
    console.error(`✗ port ${port} is busy but not serving ${baseUrl} — stop the other process and retry`);
    process.exit(1);
  }

  if (prod) {
    console.log("▶ building with screenshot mode...");
    await runBuild();
  }

  const args = prod ? `npm.cmd run preview -- --port ${port}` : `npm.cmd run dev:screenshot -- --port ${port}`;
  const child = spawn(args, {
    cwd: root,
    env: SCREENSHOT_ENV,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (data) => process.stdout.write(`  [server] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`  [server] ${data}`));

  const ready = await waitUntilReady(baseUrl, prod ? 30000 : 90000);
  if (!ready) {
    console.error("✗ server did not become ready in time");
    killPid(child.pid);
    process.exit(1);
  }
  console.log(`✓ ${prod ? "preview" : "dev"} server ready on port ${port}`);
  const serverPid = await pidOnPort(port);
  return { child, baseUrl, serverPid };
};

export const stopServer = async (server, port) => {
  if (!server) return;
  killPid(server.serverPid ?? server.child?.pid);
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline && (await portInUse(port))) {
    await sleep(200);
  }
};
