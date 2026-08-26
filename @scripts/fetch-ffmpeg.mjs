import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = path.join(root, ".cache", "ffmpeg");
const bin = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";

const works = async (candidate) => {
  try {
    await execFileP(candidate, ["-version"], { windowsHide: true, timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
};

const cachedPath = () => {
  const full = path.join(cacheDir, bin);
  return fs.existsSync(full) ? full : null;
};

if (process.env.SMC_FFMPEG_PATH && (await works(process.env.SMC_FFMPEG_PATH))) {
  console.log(`ffmpeg available via SMC_FFMPEG_PATH: ${process.env.SMC_FFMPEG_PATH}`);
  process.exit(0);
}

const cached = cachedPath();
if (cached && (await works(cached))) {
  console.log(`ffmpeg already cached at ${cached} - nothing to do`);
  process.exit(0);
}

if (await works(bin)) {
  console.log("ffmpeg found on PATH - nothing to do");
  process.exit(0);
}

try {
  const mod = await import("ffmpeg-static");
  const bundled = mod.default;
  if (typeof bundled === "string" && fs.existsSync(bundled) && (await works(bundled))) {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.copyFileSync(bundled, path.join(cacheDir, bin));
    console.log(`Copied the ffmpeg-static binary to ${path.join(cacheDir, bin)}`);
    console.log(`The CMS picks it up automatically. To use it everywhere, add this folder to your PATH:`);
    console.log(`  ${cacheDir}`);
    process.exit(0);
  }
} catch {
  // ffmpeg-static optional dependency not installed
}

console.error("No working ffmpeg found.");
console.error("Options:");
console.error("  1. Install ffmpeg system-wide, e.g.: winget install Gyan.FFmpeg   (or brew install ffmpeg)");
console.error("     and make sure it is on your PATH.");
console.error("  2. Or run `npm install -w @smc/cms` so the optional ffmpeg-static download is installed,");
console.error("     then re-run `npm run cms:ffmpeg` to copy it into .cache/ffmpeg.");
process.exit(1);
