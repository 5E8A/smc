import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = path.join(root, "public", "assets", "mod-icons");
const outDir = path.join(root, "public", "assets", "mod-sprites");

const SPRITE_COLS = 9;
const TILE_FULL = 128;
const TILE_PLACEHOLDER = 8;

const MOD_CATEGORIES = [
  {
    key: "performance",
    slugs: [
      "sodium", "sodium-extra", "lithium", "ferrite-core", "entity-culling", "moreculling", "immediatelyfast",
      "nvidium", "krypton", "modernfix", "vmp-fabric", "c2me-fabric", "zfastnoise", "badoptimizations",
      "better-block-entities", "scalablelux",
    ],
  },
  {
    key: "optifine",
    slugs: [
      "continuity", "capes", "zoomify", "entitytexturefeatures", "animaticarefabricated", "entity-model-features",
      "lambdynamiclights", "optigui", "skyboxify", "iris", "polytone", "bettergrassify",
    ],
  },
  {
    key: "qol",
    slugs: [
      "voxelmap-updated", "shulkerboxtooltip", "morechathistory", "gamma-utils", "talk-balloons",
      "durability-viewer-updated", "ping-view", "chat-heads", "rrls", "essential", "jei", "no-chat-reports",
      "fastquit", "dcch", "litematica", "bobby", "health-indicator-txf", "forcecloseworldloadingscreen",
      "smooth-skies",
    ],
  },
  {
    key: "utility",
    slugs: [
      "modmenu", "puzzle", "reeses-sodium-options", "spark", "notenoughcrashes", "auth-me", "respackopts",
      "craftpresence", "fast-ip-ping", "crash-assistant", "main-menu-credits", "debugify", "mixintrace",
    ],
  },
];

const slugHue = (slug) => {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
};

const loadTile = async (slug) => {
  const webpPath = path.join(iconsDir, `${slug}.webp`);
  if (fs.existsSync(webpPath)) {
    return sharp(webpPath).resize(TILE_FULL, TILE_FULL, { fit: "cover" }).png().toBuffer();
  }
  const hue = slugHue(slug);
  const svg = `<svg width="${TILE_FULL}" height="${TILE_FULL}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${TILE_FULL}" height="${TILE_FULL}" fill="hsl(${hue}, 30%, 22%)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
};

const loadTilePlaceholder = async (slug) => {
  const webpPath = path.join(iconsDir, `${slug}.webp`);
  if (fs.existsSync(webpPath)) {
    return sharp(webpPath).resize(TILE_PLACEHOLDER, TILE_PLACEHOLDER, { fit: "cover", kernel: "nearest" }).webp({ quality: 30 }).toBuffer();
  }
  const hue = slugHue(slug);
  const svg = `<svg width="${TILE_PLACEHOLDER}" height="${TILE_PLACEHOLDER}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${TILE_PLACEHOLDER}" height="${TILE_PLACEHOLDER}" fill="hsl(${hue}, 30%, 22%)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 30 }).toBuffer();
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

const main = async () => {
  fs.mkdirSync(outDir, { recursive: true });

  for (const cat of MOD_CATEGORIES) {
    process.stdout.write(`${cat.key}: loading tiles...`);

    const fullTiles = await Promise.all(cat.slugs.map(loadTile));
    const placeholderTiles = await Promise.all(cat.slugs.map(loadTilePlaceholder));

    process.stdout.write(" compositing...");
    const fullSprite = await compositeSprite(fullTiles, TILE_FULL);
    const placeholderSprite = await compositeSprite(placeholderTiles, TILE_PLACEHOLDER);

    const fullPath = path.join(outDir, `${cat.key}.webp`);
    const placeholderPath = path.join(outDir, `${cat.key}.placeholder.webp`);

    await Promise.all([
      fs.promises.writeFile(fullPath, fullSprite),
      fs.promises.writeFile(placeholderPath, placeholderSprite),
    ]);

    const fullSize = (await fs.promises.stat(fullPath)).size;
    const phSize = (await fs.promises.stat(placeholderPath)).size;
    console.log(` done (${(fullSize / 1024).toFixed(1)} KB + placeholder ${(phSize / 1024).toFixed(1)} KB)`);
  }

  console.log("Done.");
};

main();
