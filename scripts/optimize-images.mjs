import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "originals", "assets");
const outDir = path.join(root, "public", "assets");

const AVATAR_SIZES = {
  "avatars/smc.png": 80,
  "avatars/seba.png": 48,
};

const FAVICON = "avatars/smc2.png";
const FAVICON_SIZE = 48;

const PLACEHOLDER_WIDTH = 20;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

const toWebpName = (file) => file.replace(/\.(png|jpe?g)$/i, ".webp");
const toPlaceholderName = (file) => file.replace(/\.(png|jpe?g|webp)$/i, ".placeholder.webp");

const convert = async (file) => {
  const rel = path.relative(srcDir, file).replace(/\\/g, "/");

  if (rel === FAVICON) {
    const faviconOut = path.join(outDir, rel);
    fs.mkdirSync(path.dirname(faviconOut), { recursive: true });
    await sharp(file).resize(FAVICON_SIZE, FAVICON_SIZE, { fit: "cover" }).png().toFile(faviconOut);
    const size = (await fs.promises.stat(faviconOut)).size;
    console.log(`${rel} -> ${rel} (favicon, ${(size / 1024).toFixed(1)} KB)`);
    return;
  }

  const avatarSize = AVATAR_SIZES[rel];
  const out = path.join(outDir, toWebpName(rel));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  let pipeline = sharp(file);
  if (avatarSize) {
    pipeline = pipeline.resize(avatarSize, avatarSize, { fit: "cover" });
  }
  await pipeline.webp({ quality: 80 }).toFile(out);

  const placeholderOut = path.join(outDir, toPlaceholderName(rel));
  await sharp(file).resize(PLACEHOLDER_WIDTH, null, { fit: "inside" }).webp({ quality: 30 }).toFile(placeholderOut);

  const size = (await fs.promises.stat(out)).size;
  const phSize = (await fs.promises.stat(placeholderOut)).size;
  console.log(`${rel} -> ${toWebpName(rel)} (${(size / 1024).toFixed(1)} KB) + placeholder (${(phSize / 1024).toFixed(1)} KB)`);
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
};

const main = async () => {
  if (!fs.existsSync(srcDir)) {
    console.error(`Originals dir not found: ${srcDir}`);
    process.exit(1);
  }
  const files = walk(srcDir);
  for (const file of files) {
    if (/\.(png|jpe?g)$/i.test(file)) {
      await convert(file);
    } else if (/\.webp$/i.test(file)) {
      await optimizeWebp(file);
      await placeholderFor(file);
    }
  }
  console.log("Done.");
};

main();
