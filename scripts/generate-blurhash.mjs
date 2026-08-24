import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { encode } from "blurhash";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetsDir = path.join(root, "public", "assets");
const outFile = path.join(root, "src", "data", "blurhash.json");

const COMPONENTS_X = 4;
const COMPONENTS_Y = 3;
const ENCODE_MAX_WIDTH = 128;

const SKIP_DIRS = new Set(["fonts"]);
const isVariant = (name) => name.includes(".placeholder.") || name.includes(".mobile.");

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

  return encode(new Uint8Array(data), info.width, info.height, COMPONENTS_X, COMPONENTS_Y);
}

const hashes = {};
for (const file of walk(assetsDir)) {
  const key = "assets/" + path.relative(assetsDir, file).replace(/\\/g, "/");
  try {
    const hash = await encodeFile(file);
    if (hash) hashes[key] = hash;
  } catch (err) {
    console.warn(`skip ${key}: ${err.message}`);
  }
}

fs.writeFileSync(outFile, JSON.stringify(hashes, Object.keys(hashes).sort(), 2) + "\n");
console.log(`wrote ${Object.keys(hashes).length} blurhashes to ${path.relative(root, outFile)}`);
