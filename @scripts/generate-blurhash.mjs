import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { encode } from "blurhash";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(root, "@web", "public", "assets");
const outDir = path.join(root, "@web", "src", "data");
const outFile = path.join(outDir, "blurhash.json");
const mediaOutFile = path.join(outDir, "media.json");

const COMPONENTS_X = 4;
const COMPONENTS_Y = 3;
const ENCODE_MAX_WIDTH = 128;

const SKIP_DIRS = new Set(["fonts"]);
const isVariant = (name) =>
  name.includes(".placeholder.") || name.includes(".mobile.") || name.includes(".static.");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) && dir === assetsDir ? [] : walk(full);
    if (!/\.(png|jpe?g|webp)$/i.test(e.name)) return [];
    if (isVariant(e.name)) return [];
    return [full];
  });

async function encodeFile(file) {
  const stats = await sharp(file).stats();
  const alpha = stats.channels[3];
  if (alpha && alpha.min < 255) return null;

  const { data, info } = await sharp(file)
    .resize({ width: ENCODE_MAX_WIDTH, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    hash: encode(new Uint8Array(data), info.width, info.height, COMPONENTS_X, COMPONENTS_Y),
    width: info.width,
    height: info.height,
  };
}

const hashes = {};
const animatedKeys = [];
let transparentSkipped = 0;
for (const file of walk(assetsDir)) {
  const key = "assets/" + path.relative(assetsDir, file).replace(/\\/g, "/");
  try {
    const meta = await sharp(file).metadata();
    if ((meta.pages ?? 1) > 1) {
      animatedKeys.push(key);
      const staticSibling = file.replace(/\.webp$/i, ".static.webp");
      if (/\.webp$/i.test(file) && !fs.existsSync(staticSibling)) {
        console.warn(`warn ${key}: animated but missing ${path.basename(staticSibling)} static fallback`);
      }
    }
    const result = await encodeFile(file);
    if (result) {
      hashes[key] = result.hash;
      console.log(`hash ${key} (${result.width}x${result.height}): ${result.hash}`);
    } else {
      transparentSkipped++;
      console.log(`skip ${key}: transparent`);
    }
  } catch (err) {
    console.warn(`skip ${key}: ${err.message}`);
  }
}

fs.writeFileSync(outFile, JSON.stringify(hashes, Object.keys(hashes).sort(), 2) + "\n");
console.log(
  `wrote ${Object.keys(hashes).length} blurhashes (${transparentSkipped} transparent skipped) to ${path.relative(root, outFile)}`
);

animatedKeys.sort();
fs.writeFileSync(mediaOutFile, JSON.stringify({ animated: animatedKeys }, ["animated"], 2) + "\n");
console.log(
  `wrote ${animatedKeys.length} animated asset${animatedKeys.length === 1 ? "" : "s"} to ${path.relative(root, mediaOutFile)}`
);
