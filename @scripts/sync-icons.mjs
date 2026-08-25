// Regenerates the Phosphor icon catalog (@shared/icon-catalog.ts), the CMS
// full icon map, and the web icon map (icons actually referenced by content).
// Runs automatically from the CMS on entry save / icon insert; use manually
// after hand-editing content JSON or bumping @phosphor-icons packages.
import { syncIcons } from "@smc/cms/server/icons";

const force = process.argv.includes("--force");

const result = await syncIcons((line) => console.log(line), { force });

if (result.unknown.length > 0) {
  console.error(`sync-icons: ${result.unknown.length} unknown placeholder(s) - fix or remove them in content`);
  process.exit(1);
}
console.log("sync-icons: ok");
