import { execFile, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import sharp from "sharp";
import { REPO_ROOT } from "./util.ts";

const FFMPEG_CACHE_DIR = path.join(REPO_ROOT, ".cache", "ffmpeg");
const FFMPEG_BIN = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";

export const VIDEO_FPS = 24;
export const MAX_VIDEO_SECONDS = 60;

let resolved: string | null | undefined;

const runsFfmpeg = (bin: string): Promise<boolean> =>
  new Promise((resolve) => {
    execFile(bin, ["-version"], { windowsHide: true, timeout: 15_000 }, (err) => resolve(!err));
  });

export const isVideoExt = (ext: string): boolean => [".mp4", ".webm", ".mov", ".mkv", ".m4v"].includes(ext);

export const FFMPEG_ANIMATED_IMAGE_EXTS = [".apng", ".gif"];

export const needsFfmpeg = (ext: string): boolean => isVideoExt(ext) || FFMPEG_ANIMATED_IMAGE_EXTS.includes(ext);

export async function resolveFfmpeg(): Promise<string | null> {
  if (resolved !== undefined) return resolved;
  const candidates: string[] = [];
  if (process.env.SMC_FFMPEG_PATH) candidates.push(process.env.SMC_FFMPEG_PATH);
  candidates.push(path.join(FFMPEG_CACHE_DIR, FFMPEG_BIN));
  candidates.push("ffmpeg");
  try {
    const mod = (await import("ffmpeg-static")) as { default?: string };
    if (typeof mod.default === "string" && mod.default) candidates.push(mod.default);
  } catch {
    // optional dependency not installed - system lookup still applies
  }
  for (const candidate of candidates) {
    if (await runsFfmpeg(candidate)) {
      resolved = candidate;
      return candidate;
    }
  }
  resolved = null;
  return null;
}

interface ProbeInfo {
  duration: number | null;
  fps: number | null;
  width: number | null;
}

const probeVideo = (bin: string, input: string): Promise<ProbeInfo> =>
  new Promise((resolve) => {
    execFile(bin, ["-hide_banner", "-i", input], { windowsHide: true, timeout: 30_000 }, (_error, _stdout, stderr) => {
      const durationMatch = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(stderr);
      const duration = durationMatch
        ? Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3])
        : null;
      const fpsMatch = /(\d+(?:\.\d+)?) fps/.exec(stderr);
      const sizeMatch = /Stream #\d+:\d+(?:\[[^\]]*\])?(?:\([^)]*\))?: Video:.*?, (\d{2,5})x(\d{2,5})/.exec(stderr);
      resolve({
        duration,
        fps: fpsMatch ? Number(fpsMatch[1]) : null,
        width: sizeMatch ? Number(sizeMatch[1]) : null,
      });
    });
  });

const runFfmpeg = (bin: string, args: string[]): Promise<void> =>
  new Promise((resolve, reject) => {
    execFile(bin, ["-hide_banner", "-loglevel", "error", "-y", ...args], { windowsHide: true, timeout: 300_000 }, (err, _stdout, stderr) => {
      if (err) reject(new Error(`ffmpeg failed: ${stderr.toString().trim() || err.message}`));
      else resolve();
    });
  });

export type VideoProgress =
  | { stage: "probe" }
  | { stage: "transcode"; pct: number | null; speed: string | null }
  | { stage: "static-frame" };

interface ProgressBlock {
  outTimeSec: number | null;
  speed: string | null;
}

const parseOutTime = (value: string | undefined): number | null => {
  if (!value) return null;
  const clock = /^(\d+):(\d{2}):(\d{2}(?:\.\d+)?)$/.exec(value);
  if (clock) return Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
  const num = Number(value);
  return Number.isFinite(num) ? num / 1_000_000 : null;
};

const runFfmpegWithProgress = (
  bin: string,
  args: string[],
  onBlock: (block: ProgressBlock) => void
): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(
      bin,
      ["-hide_banner", "-loglevel", "error", "-nostats", "-progress", "pipe:1", "-stats_period", "0.2", "-y", ...args],
      {
        windowsHide: true,
      }
    );
    let stderr = "";
    let buffer = "";
    let block: Record<string, string> = {};
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("ffmpeg timed out after 300s"));
    }, 300_000);

    const flushBlock = (): void => {
      const outTime = parseOutTime(block["out_time"] ?? block["out_time_us"] ?? block["out_time_ms"]);
      const speedRaw = block["speed"]?.trim();
      if (outTime !== null || (speedRaw && speedRaw !== "N/A")) {
        onBlock({ outTimeSec: outTime, speed: speedRaw && speedRaw !== "N/A" ? speedRaw : null });
      }
      block = {};
    };

    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      let newlineAt: number;
      while ((newlineAt = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineAt).trim();
        buffer = buffer.slice(newlineAt + 1);
        const eq = line.indexOf("=");
        if (eq > 0) {
          const key = line.slice(0, eq);
          block[key] = line.slice(eq + 1);
          if (key === "progress") flushBlock();
        }
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      if (stderr.length < 16_384) stderr += chunk.toString("utf8");
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`ffmpeg failed to start: ${err.message}`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed: ${stderr.trim() || `exit code ${code}`}`));
    });
  });

export interface AnimatedConversion {
  media: Buffer;
  staticFrame: Buffer;
  frames: number;
  durationSec: number | null;
  sizeBytes: number;
}

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "smc-cms-"));
  try {
    return await fn(dir);
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
}

export async function convertAnimatedToWebm(
  body: Buffer,
  opts: { quality: number; maxWidth: number; fps: number; onProgress?: (p: VideoProgress) => void }
): Promise<AnimatedConversion> {
  const bin = await resolveFfmpeg();
  if (!bin) throw new Error("ffmpeg not found - install it or run npm run cms:ffmpeg");
  const report = opts.onProgress ?? ((): void => {});

  return withTempDir(async (dir) => {
    const input = path.join(dir, "input.bin");
    const out = path.join(dir, "out.webm");
    const frame = path.join(dir, "frame.png");
    await fs.promises.writeFile(input, body);

    report({ stage: "probe" });
    const probe = await probeVideo(bin, input);
    if (probe.duration !== null && probe.duration > MAX_VIDEO_SECONDS) {
      throw new Error(
        `Animation is ${Math.round(probe.duration)}s long - the limit is ${MAX_VIDEO_SECONDS}s. Trim it first.`
      );
    }

    const filters = [`fps=${opts.fps}`, `scale='min(iw,${opts.maxWidth})':-2:flags=lanczos`];
    await runFfmpegWithProgress(
      bin,
      [
        "-i",
        input,
        "-vf",
        filters.join(","),
        "-c:v",
        "libvpx-vp9",
        "-crf",
        "36",
        "-b:v",
        "0",
        "-row-mt",
        "1",
        "-deadline",
        "good",
        "-cpu-used",
        "4",
        "-an",
        "-y",
        out,
      ],
      ({ outTimeSec, speed }) => {
        const pct =
          outTimeSec !== null && probe.duration !== null && probe.duration > 0
            ? Math.min(100, Math.max(0, Math.round((outTimeSec / probe.duration) * 100)))
            : null;
        report({ stage: "transcode", pct, speed });
      }
    );
    report({ stage: "static-frame" });
    await runFfmpeg(bin, ["-i", input, "-frames:v", "1", "-update", "1", frame]);

    const media = await fs.promises.readFile(out);
    const staticFrame = await sharpNormalizeFrame(frame, opts.maxWidth, opts.quality);
    const frames =
      probe.duration !== null ? Math.max(1, Math.round(probe.duration * opts.fps)) : 0;
    return { media, staticFrame, frames, durationSec: probe.duration, sizeBytes: media.length };
  });
}

async function sharpNormalizeFrame(frameFile: string, maxWidth: number, quality: number): Promise<Buffer> {
  return sharp(frameFile)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}
