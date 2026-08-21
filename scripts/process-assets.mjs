import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "originals", "assets");
const outDir = path.join(root, "public", "assets");
const lqipManifestPath = path.join(root, "src", "data", "lqip.json");

// ── LQIP encoder (Lean Rada's CSS-only LQIP) ──────────────────────────────

function gammaInv(x) {
  return x >= 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92;
}

function rgbToOkLab({ r, g, b }) {
  const lr = gammaInv(r / 255);
  const lg = gammaInv(g / 255);
  const lb = gammaInv(b / 255);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  return {
    L: l * 0.2104542553 + m * 0.793617785 + s * -0.0040720468,
    a: l * 1.9779984951 + m * -2.428592205 + s * 0.4505937099,
    b: l * 0.0259040371 + m * 0.7827717662 + s * -0.808675766,
  };
}

function bitsToLab(ll, aaa, bbb) {
  return {
    L: (ll / 3) * 0.6 + 0.2,
    a: (aaa / 8) * 0.7 - 0.35,
    b: ((bbb + 1) / 8) * 0.7 - 0.35,
  };
}

function scaleComponentForDiff(x, chroma) {
  return x / (1e-6 + Math.pow(chroma, 0.5));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function findOklabBits(targetL, targetA, targetB) {
  const targetChroma = Math.hypot(targetA, targetB);
  const scaledTargetA = scaleComponentForDiff(targetA, targetChroma);
  const scaledTargetB = scaleComponentForDiff(targetB, targetChroma);

  let best = [0, 0, 0];
  let bestDiff = Infinity;

  for (let ll = 0; ll <= 3; ll++) {
    for (let aaa = 0; aaa <= 7; aaa++) {
      for (let bbb = 0; bbb <= 7; bbb++) {
        const { L, a, b } = bitsToLab(ll, aaa, bbb);
        const chroma = Math.hypot(a, b);
        const scaledA = scaleComponentForDiff(a, chroma);
        const scaledB = scaleComponentForDiff(b, chroma);

        const diff = Math.hypot(L - targetL, scaledA - scaledTargetA, scaledB - scaledTargetB);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = [ll, aaa, bbb];
        }
      }
    }
  }
  return { ll: best[0], aaa: best[1], bbb: best[2] };
}

async function encodeLQIP(imagePath) {
  const meta = await sharp(imagePath).metadata();
  if (meta.hasAlpha) {
    const channels = meta.channels;
    const raw = await sharp(imagePath).raw().toBuffer();
    let hasTransparency = false;
    for (let i = 3; i < raw.length; i += channels) {
      if (raw[i] < 255) {
        hasTransparency = true;
        break;
      }
    }
    if (hasTransparency) return null;
  }

  const previewBuf = await sharp(imagePath).resize(3, 2, { fit: "fill" }).sharpen({ sigma: 1 }).removeAlpha().toFormat("raw", { bitdepth: 8 }).toBuffer();

  const avgBuf = await sharp(imagePath).resize(1, 1, { fit: "fill" }).removeAlpha().toFormat("raw", { bitdepth: 8 }).toBuffer();

  const baseColor = rgbToOkLab({ r: avgBuf[0], g: avgBuf[1], b: avgBuf[2] });
  const { ll, aaa, bbb } = findOklabBits(baseColor.L, baseColor.a, baseColor.b);
  const baseL = bitsToLab(ll, aaa, bbb).L;

  const cells = [];
  for (let i = 0; i < 6; i++) {
    const cell = rgbToOkLab({ r: previewBuf[i * 3], g: previewBuf[i * 3 + 1], b: previewBuf[i * 3 + 2] });
    cells.push(clamp(0.5 + cell.L - baseL, 0, 1));
  }

  const ca = Math.round(cells[0] * 3);
  const cb = Math.round(cells[1] * 3);
  const cc = Math.round(cells[2] * 3);
  const cd = Math.round(cells[3] * 3);
  const ce = Math.round(cells[4] * 3);
  const cf = Math.round(cells[5] * 3);

  const lqip =
    -(2 ** 19) +
    ((ca & 3) << 18) +
    ((cb & 3) << 16) +
    ((cc & 3) << 14) +
    ((cd & 3) << 12) +
    ((ce & 3) << 10) +
    ((cf & 3) << 8) +
    ((ll & 3) << 6) +
    ((aaa & 7) << 3) +
    (bbb & 7);

  return lqip;
}

const AVATAR_SIZES = {
  "avatars/smc.png": 80,
  "avatars/seba.png": 48,
};

const FAVICON = "avatars/smc2.png";
const FAVICON_SIZE = 48;
const SQUIRCLE_RADIUS = 0.2237; // matches --radius-squircle in index.css

const PLACEHOLDER_WIDTH = 20;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const toWebpName = (file) => file.replace(/\.(png|jpe?g)$/i, ".webp");
const toPlaceholderName = (file) => file.replace(/\.(png|jpe?g|webp)$/i, ".placeholder.webp");

const FULL_WIDTH_BACKGROUND = "static/background.png";
const MOBILE_BG_MAX_WIDTH = 1200;

const STATIC_MAX_WIDTH = {
  "static/Artboard_3.png": 1600,
};

const convert = async (file) => {
  const rel = path.relative(srcDir, file).replace(/\\/g, "/");

  if (rel === FAVICON) {
    const faviconOut = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(faviconOut), { recursive: true });
    const radius = FAVICON_SIZE * SQUIRCLE_RADIUS;
    const mask = Buffer.from(
      `<svg width="${FAVICON_SIZE}" height="${FAVICON_SIZE}" xmlns="http://www.w3.org/2000/svg"><rect width="${FAVICON_SIZE}" height="${FAVICON_SIZE}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
    );
    await sharp(file).resize(FAVICON_SIZE, FAVICON_SIZE, { fit: "cover" }).composite([{ input: mask, blend: "dest-in" }]).png().toFile(faviconOut);
    const size = (await fs.promises.stat(faviconOut)).size;
    console.log(`${rel} -> ${rel} (favicon squircle, ${(size / 1024).toFixed(1)} KB)`);
    return null;
  }

  const avatarSize = AVATAR_SIZES[rel];
  const staticMaxWidth = STATIC_MAX_WIDTH[rel];
  const out = path.join(outDir, toWebpName(rel));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let pipeline = sharp(file);
  if (avatarSize) {
    pipeline = pipeline.resize(avatarSize, avatarSize, { fit: "cover" });
  } else if (staticMaxWidth) {
    pipeline = pipeline.resize(staticMaxWidth, null, { fit: "inside" });
  }
  await pipeline.webp({ quality: 80 }).toFile(out);

  if (rel === FULL_WIDTH_BACKGROUND) {
    const mobileOut = out.replace(/\.webp$/i, ".mobile.webp");
    await sharp(file)
      .resize(MOBILE_BG_MAX_WIDTH, null, { fit: "inside" })
      .webp({ quality: 70 })
      .toFile(mobileOut);
    const size = (await fs.promises.stat(out)).size;
    const mobileSize = (await fs.promises.stat(mobileOut)).size;
    console.log(`${rel} -> ${toWebpName(rel)} (${(size / 1024).toFixed(1)} KB) + mobile (${(mobileSize / 1024).toFixed(1)} KB)`);
  }

  const placeholderOut = path.join(outDir, toPlaceholderName(rel));
  await sharp(file).resize(PLACEHOLDER_WIDTH, null, { fit: "inside" }).webp({ quality: 30 }).toFile(placeholderOut);

  const size = (await fs.promises.stat(out)).size;
  const phSize = (await fs.promises.stat(placeholderOut)).size;
  console.log(`${rel} -> ${toWebpName(rel)} (${(size / 1024).toFixed(1)} KB) + placeholder (${(phSize / 1024).toFixed(1)} KB)`);

  const lqipKey = `assets/${toWebpName(rel)}`;
  const lqip = await encodeLQIP(file);
  return lqip != null ? [lqipKey, lqip] : null;
};

const placeholderFor = async (file) => {
  const rel = path.relative(srcDir, file).replace(/\\/g, "/");
  const placeholderOut = path.join(outDir, toPlaceholderName(rel));
  fs.mkdirSync(path.dirname(placeholderOut), { recursive: true });
  await sharp(file).resize(PLACEHOLDER_WIDTH, null, { fit: "inside" }).webp({ quality: 30 }).toFile(placeholderOut);
  const size = (await fs.promises.stat(placeholderOut)).size;
  console.log(`placeholder for ${rel} (${(size / 1024).toFixed(1)} KB)`);
};

const WEBP_OPTS = {
  "static/background.webp": { quality: 70 },
  "posts/": { quality: 75, width: 768 },
};

const optimizeWebp = async (file) => {
  const rel = path.relative(srcDir, file).replace(/\\/g, "/");
  const out = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const match = Object.entries(WEBP_OPTS).find(([key]) => (key.endsWith("/") ? rel.startsWith(key) : rel === key));
  if (match) {
    const opts = match[1];
    let pipeline = sharp(file);
    if (opts.width) {
      pipeline = pipeline.resize(opts.width, null, { fit: "inside" });
    }
    await pipeline.webp({ quality: opts.quality }).toFile(out);
    console.log(`${rel} -> ${rel} (optimized q${opts.quality}${opts.width ? `, max ${opts.width}w` : ""})`);
  } else {
    await fs.promises.copyFile(file, out);
    console.log(`${rel} -> ${rel} (copied)`);
  }

  const lqipKey = `assets/${rel}`;
  const lqip = await encodeLQIP(out);
  return lqip != null ? [lqipKey, lqip] : null;
};

const main = async () => {
  if (!fs.existsSync(srcDir)) {
    console.error(`Originals dir not found: ${srcDir}`);
    process.exit(1);
  }
  const files = walk(srcDir);
  const lqipEntries = [];
  for (const file of files) {
    if (/\.(png|jpe?g)$/i.test(file)) {
      const entry = await convert(file);
      if (entry) lqipEntries.push(entry);
    } else if (/\.webp$/i.test(file)) {
      const entry = await optimizeWebp(file);
      await placeholderFor(file);
      if (entry) lqipEntries.push(entry);
    }
  }

  const lqipMap = Object.fromEntries(lqipEntries);
  fs.mkdirSync(path.dirname(lqipManifestPath), { recursive: true });
  fs.writeFileSync(lqipManifestPath, JSON.stringify(lqipMap, null, 2) + "\n");
  console.log(`LQIP manifest written (${lqipEntries.length} entries) -> ${path.relative(root, lqipManifestPath)}`);
  console.log("Done.");
};

main();
