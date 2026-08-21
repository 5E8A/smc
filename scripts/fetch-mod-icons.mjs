import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = path.join(root, "originals", "assets", "mod-icons");
const modsFile = path.join(root, "src", "data", "mods.ts");

const MODRINTH_API = "https://api.modrinth.com/v2";
const USER_AGENT = "SMCSite/fetch-mod-icons (https://github.com/5E8A/smc)";

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

const fetchProject = async (slug) => {
  const res = await fetch(`${MODRINTH_API}/project/${encodeURIComponent(slug)}`, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    console.warn(`  ⚠ ${slug}: HTTP ${res.status} — skipping`);
    return null;
  }
  return res.json();
};

const downloadIcon = async (slug, iconUrl) => {
  const res = await fetch(iconUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    console.warn(`  ⚠ ${slug}: icon download failed (HTTP ${res.status}) — skipping icon`);
    return false;
  }
  const ext = path.extname(new URL(iconUrl).pathname) || ".png";
  const outPath = path.join(iconsDir, `${slug}${ext}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buffer);
  return true;
};

const generateModFile = (categories) => {
  const lines = [
    "export interface ModData {",
    "  title: string;",
    "  slug: string;",
    "  icon: string;",
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
    lines.push(`  {`);
    lines.push(`    key: "${cat.key}",`);
    lines.push(`    mods: [`);
    for (const mod of cat.mods) {
      lines.push(`      { title: ${JSON.stringify(mod.title)}, slug: ${JSON.stringify(mod.slug)}, icon: ${JSON.stringify(mod.icon)}, description: ${JSON.stringify(mod.description)} },`);
    }
    lines.push(`    ],`);
    lines.push(`  },`);
  }

  lines.push("];");
  lines.push("");
  return lines.join("\n");
};

const main = async () => {
  fs.mkdirSync(iconsDir, { recursive: true });

  const results = [];

  for (const cat of MOD_CATEGORIES) {
    console.log(`\n📦 ${cat.key}`);
    const mods = [];

    for (const slug of cat.slugs) {
      process.stdout.write(`  fetching ${slug}...`);
      const project = await fetchProject(slug);
      if (!project) {
        console.log(" skipped");
        continue;
      }

      let iconPath = "";
      if (project.icon_url) {
        const downloaded = await downloadIcon(slug, project.icon_url);
        if (downloaded) {
          iconPath = `/smc/assets/mod-icons/${slug}.webp`;
          console.log(` ✓ icon saved`);
        } else {
          console.log(` (no icon)`);
        }
      } else {
        console.log(` (no icon)`);
      }

      mods.push({
        title: project.title,
        slug: project.slug,
        icon: iconPath,
        description: project.description || "",
      });
    }

    results.push({ key: cat.key, mods });
  }

  fs.writeFileSync(modsFile, generateModFile(results));
  console.log(`\n✅ Generated ${modsFile}`);
  console.log(`✅ Downloaded icons to ${iconsDir}`);
  console.log(`\nNext: run "npm run process-assets" to optimize icons.`);
};

main();
