import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { slugHue } from "@smc/shared/hue";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modListFile = path.join(root, "@scripts", "mod-list.json");
const cacheDir = path.join(root, ".cache", "mod-icons");
const iconsDir = path.join(root, "@web", "public", "assets", "mod-icons");
const spritesDir = path.join(root, "@web", "public", "assets", "mod-sprites");
const modsFile = path.join(root, "@web", "src", "data", "mods.ts");
const blurhashScript = path.join(root, "@scripts", "generate-blurhash.mjs");

const MODRINTH_API = "https://api.modrinth.com/v2";
const USER_AGENT = "SMCSite/sync-mods (https://github.com/5E8A/smc)";

import { SPRITE_COLS } from "@smc/shared/sprite";
const TILE_FULL = 128;
const TILE_PLACEHOLDER = 8;
const DOWNLOAD_CONCURRENCY = 8;
const REQUEST_TIMEOUT_MS = 15_000;
const BATCH_SIZE = 100;

const flag = (name) => process.argv.includes(`--${name}`);
const argOf = (name) => {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
};

const retries = Number.parseInt(argOf("retries") || "3", 10);
const runBlurhash = !flag("no-blurhash");
const quiet = flag("quiet");
const failSlugs = new Set(
  process.argv.filter((a) => a.startsWith("--fail-slug=")).map((a) => a.slice("--fail-slug=".length))
);
const flakySlugs = new Set(
  process.argv.filter((a) => a.startsWith("--flaky-slug=")).map((a) => a.slice("--flaky-slug=".length))
);
if (!Number.isInteger(retries) || retries < 1) {
  console.error("--retries must be a positive integer");
  process.exit(1);
}

const loadModList = () => {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(modListFile, "utf8"));
  } catch (err) {
    console.error(`mod list not found or invalid: ${modListFile}`);
    console.error(err.message);
    process.exit(1);
  }
  const valid =
    Array.isArray(parsed) &&
    parsed.every(
      (cat) =>
        cat &&
        typeof cat.key === "string" &&
        Array.isArray(cat.slugs) &&
        cat.slugs.every((s) => typeof s === "string" && s.length > 0)
    );
  if (!valid) {
    console.error(`mod list must be an array of { key: string, slugs: string[] }`);
    process.exit(1);
  }
  return parsed;
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const mapLimit = async (items, limit, fn) => {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
};

const cachePath = (slug) => path.join(cacheDir, `${slug}.img`);

const forcedFail = (slug, attempt) => failSlugs.has(slug) || (flakySlugs.has(slug) && attempt < retries);

const fetchMetaBatch = async (slugs) => {
  const url = `${MODRINTH_API}/projects?ids=${encodeURIComponent(JSON.stringify(slugs))}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`projects request failed (HTTP ${res.status})`);
  const body = await res.json();
  if (!Array.isArray(body)) throw new Error("unexpected projects response shape");
  return body;
};

const downloadIcon = async (slug, iconUrl) => {
  let res;
  try {
    res = await fetch(iconUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    return { outcome: fs.existsSync(cachePath(slug)) ? "kept" : "failed" };
  }
  if (res.status === 404) {
    return { outcome: fs.existsSync(cachePath(slug)) ? "gone-kept" : "missing" };
  }
  if (!res.ok) {
    return { outcome: fs.existsSync(cachePath(slug)) ? "kept" : "failed" };
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0) {
    return { outcome: fs.existsSync(cachePath(slug)) ? "kept" : "failed" };
  }
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(cachePath(slug), buffer);
  return { outcome: "written", bytes: buffer.length };
};

const verifyCached = async (slug) => {
  const file = cachePath(slug);
  if (!fs.existsSync(file)) return false;
  try {
    const meta = await sharp(file).metadata();
    return (meta.width ?? 0) > 0 && (meta.height ?? 0) > 0;
  } catch {
    return false;
  }
};

const attemptOnce = async (targetSlugs, meta, permanent, attempt) => {
  const unseen = targetSlugs.filter((s) => !meta.has(s) && !permanent.has(s));
  if (unseen.length > 0) {
    const found = [];
    for (const batch of chunk(unseen, BATCH_SIZE)) {
      found.push(...(await fetchMetaBatch(batch)));
    }
    const pool = new Map(found.map((p) => [p.slug, p]));
    for (const slug of unseen) {
      const project = pool.get(slug) ?? found.find((p) => p.id === slug);
      if (!project) {
        permanent.set(slug, "not-found");
        if (!quiet) console.log(`  ✗ ${slug}: not found on Modrinth - excluded`);
        continue;
      }
      meta.set(slug, project);
      if (!project.icon_url) permanent.set(slug, "no-icon");
      if (!quiet)
        console.log(`  ✓ ${slug}: found on Modrinth ("${project.title}")${project.icon_url ? "" : " - no icon set"}`);
    }
  }

  const want = targetSlugs.filter((s) => meta.has(s) && meta.get(s).icon_url && !permanent.has(s));
  let saved = 0;
  let kept = 0;
  if (want.length > 0) {
    await mapLimit(want, DOWNLOAD_CONCURRENCY, async (slug) => {
      if (forcedFail(slug, attempt)) {
        console.warn(`  ⚠ ${slug}: [forced] icon download failed - will retry`);
        return;
      }
      const { outcome, bytes } = await downloadIcon(slug, meta.get(slug).icon_url);
      if (outcome === "written") {
        saved++;
        if (!quiet)
          console.log(`  ↓ ${slug}: icon saved to .cache/mod-icons/${slug}.img (${(bytes / 1024).toFixed(1)} KB)`);
      } else if (outcome === "gone-kept") {
        kept++;
        console.warn(`  ⚠ ${slug}: icon URL gone (HTTP 404) - keeping cached icon`);
      } else if (outcome === "kept") {
        kept++;
        if (!quiet) console.log(`  ↺ ${slug}: download failed - keeping cached copy`);
      } else if (outcome === "missing") {
        permanent.set(slug, "icon-missing");
        console.warn(`  ⚠ ${slug}: icon unavailable (HTTP 404), no cached copy - falling back to placeholder tile`);
      } else {
        console.warn(`  ⚠ ${slug}: icon download failed - will retry`);
      }
    });
  }

  const failed = [];
  for (const slug of want) {
    if (forcedFail(slug, attempt)) {
      failed.push(slug);
      console.log(`  ✗ ${slug}: cached icon failed verification [forced]`);
    } else if (!(await verifyCached(slug))) {
      failed.push(slug);
      if (!quiet) console.log(`  ✗ ${slug}: cached icon failed verification`);
    }
  }
  return { failed, saved, kept };
};

const loadTile = async (slug, tileSize, placeholder) => {
  const hue = slugHue(slug);
  const cached = cachePath(slug);
  if (fs.existsSync(cached)) {
    return sharp(cached)
      .resize(tileSize, tileSize, { fit: "cover", kernel: placeholder ? "nearest" : "lanczos3" })
      .toFormat(placeholder ? "webp" : "png", placeholder ? { quality: 30 } : {})
      .toBuffer();
  }
  if (placeholder) {
    const svg = `<svg width="${tileSize}" height="${tileSize}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${tileSize}" height="${tileSize}" fill="hsl(${hue}, 30%, 22%)"/>
    </svg>`;
    return sharp(Buffer.from(svg)).webp({ quality: 30 }).toBuffer();
  }
  const svg = `<svg width="${tileSize}" height="${tileSize}" viewBox="0 0 104 104" xmlns="http://www.w3.org/2000/svg">
    <rect width="104" height="104" fill="hsl(${hue}, 30%, 22%)"/>
    <path fill="none" stroke="#9a9a9a" stroke-width="5" d="M51.7 92.5V51.7L16.4 31.3l35.3 20.4L87 31.3 51.7 11 16.4 31.3v40.8l35.3 20.4L87 72V31.3L51.7 11"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
};

const compositeSprite = async (tiles, tileSize) => {
  const rows = Math.ceil(tiles.length / SPRITE_COLS);
  const width = SPRITE_COLS * tileSize;
  const height = rows * tileSize;
  const composites = tiles.map((tile, i) => ({
    input: tile,
    left: (i % SPRITE_COLS) * tileSize,
    top: Math.floor(i / SPRITE_COLS) * tileSize,
  }));
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .webp({ quality: 80 })
    .toBuffer();
};

const generateModFile = (categories) => {
  const lines = [
    "export interface ModData {",
    "  title: string;",
    "  slug: string;",
    "  description: string;",
    "}",
    "",
    "export interface ModCategory {",
    "  key: string;",
    "  mods: ModData[];",
    "}",
    "",
    "export const modCategories: ModCategory[] = [",
  ];
  for (const cat of categories) {
    if (cat.mods.length === 0) continue;
    lines.push("  {");
    lines.push(`    key: "${cat.key}",`);
    lines.push("    mods: [");
    for (const mod of cat.mods) {
      lines.push(
        `      { title: ${JSON.stringify(mod.title)}, slug: ${JSON.stringify(mod.slug)}, description: ${JSON.stringify(mod.description)} },`
      );
    }
    lines.push("    ],");
    lines.push("  },");
  }
  lines.push("];");
  lines.push("");
  return lines.join("\n");
};

const main = async () => {
  const categories = loadModList();
  const allSlugs = categories.flatMap((cat) => cat.slugs);
  const slugCount = new Map();
  for (const slug of allSlugs) slugCount.set(slug, (slugCount.get(slug) ?? 0) + 1);
  for (const [slug, count] of slugCount) {
    if (count > 1) console.warn(`  ⚠ duplicate slug "${slug}" appears ${count}× in mod list - tiles will repeat`);
  }

  const knownSlugs = new Set(allSlugs);
  const forcedNote = [...failSlugs].map((s) => `fail:${s}`).concat([...flakySlugs].map((s) => `flaky:${s}`));
  for (const slug of [...failSlugs, ...flakySlugs]) {
    if (!knownSlugs.has(slug)) console.warn(`  ⚠ forced-fail slug "${slug}" is not in the mod list - no effect`);
  }

  console.log(
    `▶ sync-mods: ${allSlugs.length} slug(s) in ${categories.length} categories (retries=${retries}, blurhash=${
      runBlurhash ? "on" : "off"
    }${quiet ? ", quiet" : ""}${forcedNote.length > 0 ? `, FORCED FAILURES: ${forcedNote.join(", ")}` : ""})`
  );

  const meta = new Map();
  const permanent = new Map();
  let target = [...allSlugs];
  let hardFails = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    process.stdout.write(`\n[pass ${attempt}/${retries}] `);
    let result;
    try {
      result = await attemptOnce(target, meta, permanent, attempt);
    } catch (err) {
      if (attempt >= retries) {
        hardFails = [{ slug: "modrinth", message: err.message }];
        break;
      }
      console.warn(`metadata fetch failed (${err.message}) - retrying`);
      continue;
    }
    const { failed, saved, kept } = result;
    if (failed.length === 0) {
      console.log(`complete - ${saved} downloaded, ${kept} from cache`);
      break;
    }
    console.warn(`\n  ⚠ ${failed.length} slug(s) failed verification, retrying: ${failed.join(", ")}`);
    console.log(`  ${saved} downloaded, ${kept} from cache so far`);
    target = failed;
    if (attempt >= retries) {
      hardFails = failed.map((slug) => ({ slug, message: "no valid icon after retries" }));
      break;
    }
  }

  if (hardFails) {
    console.error(`\n✗ FATAL - ${hardFails.length} problem(s) survived ${retries} attempts:`);
    for (const { slug, message } of hardFails) console.error(`    ${slug}: ${message}`);
    console.error("Fix the mod list / connection and rerun npm run sync-mods.");
    process.exit(1);
  }

  const excluded = new Set(
    [...permanent.entries()].filter(([, reason]) => reason === "not-found").map(([slug]) => slug)
  );
  const warnings = [];
  for (const [slug, reason] of permanent) {
    if (reason === "not-found") warnings.push(`project not found - excluded from the site (${slug})`);
    else if (reason === "no-icon")
      warnings.push(`project has no icon - placeholder tile + cube fallback used (${slug})`);
    else if (reason === "icon-missing")
      warnings.push(`icon unavailable, no cached copy - placeholder tile used (${slug})`);
  }

  fs.mkdirSync(spritesDir, { recursive: true });

  console.log("🧩 compositing sprites...");
  const outputMods = [];
  for (const cat of categories) {
    const slugs = cat.slugs.filter((s) => !excluded.has(s));
    if (slugs.length === 0) {
      const staleFull = path.join(spritesDir, `${cat.key}.webp`);
      const stalePh = path.join(spritesDir, `${cat.key}.placeholder.webp`);
      if (fs.existsSync(staleFull)) fs.rmSync(staleFull);
      if (fs.existsSync(stalePh)) fs.rmSync(stalePh);
      continue;
    }
    const fullTiles = await Promise.all(slugs.map((slug) => loadTile(slug, TILE_FULL, false)));
    const placeholderTiles = await Promise.all(slugs.map((slug) => loadTile(slug, TILE_PLACEHOLDER, true)));
    const fullSprite = await compositeSprite(fullTiles, TILE_FULL);
    const placeholderSprite = await compositeSprite(placeholderTiles, TILE_PLACEHOLDER);
    await Promise.all([
      fs.promises.writeFile(path.join(spritesDir, `${cat.key}.webp`), fullSprite),
      fs.promises.writeFile(path.join(spritesDir, `${cat.key}.placeholder.webp`), placeholderSprite),
    ]);
    const fullSize = (await fs.promises.stat(path.join(spritesDir, `${cat.key}.webp`))).size;
    const phSize = (await fs.promises.stat(path.join(spritesDir, `${cat.key}.placeholder.webp`))).size;
    console.log(
      `  ${cat.key}: ${slugs.length} tiles (${(fullSize / 1024).toFixed(1)} KB + placeholder ${(phSize / 1024).toFixed(1)} KB)`
    );
    outputMods.push({
      key: cat.key,
      mods: slugs.map((slug) => ({
        title: meta.get(slug).title,
        slug,
        description: meta.get(slug).description || "",
      })),
    });
  }

  let prunedSprites = 0;
  const spriteKeys = new Set(outputMods.map((c) => c.key));
  for (const file of fs.readdirSync(spritesDir)) {
    const key = file.replace(/\.placeholder\.webp$|\.webp$/i, "");
    if (!spriteKeys.has(key)) {
      fs.rmSync(path.join(spritesDir, file));
      prunedSprites++;
    }
  }

  fs.writeFileSync(modsFile, generateModFile(outputMods));
  console.log(`✅ Wrote ${modsFile} (${outputMods.reduce((n, c) => n + c.mods.length, 0)} mods)`);
  if (fs.existsSync(iconsDir)) {
    fs.rmSync(iconsDir, { recursive: true, force: true });
    console.log("🧹 removed @web/public/assets/mod-icons (per-icon webps no longer generated)");
  }
  if (prunedSprites) console.log(`🧹 pruned ${prunedSprites} orphaned sprite file(s)`);

  for (const warning of warnings) console.warn(`  ⚠ ${warning}`);

  if (runBlurhash) {
    console.log("⏳ regenerating blurhash manifest...");
    const code = await new Promise((resolve) => {
      const child = spawn(process.execPath, [blurhashScript], { cwd: root, stdio: "inherit" });
      child.on("close", resolve);
    });
    if (code !== 0) {
      console.error(`\n✗ blurhash regeneration failed (exit ${code})`);
      process.exit(1);
    }
  }

  console.log("\nDone.");
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
