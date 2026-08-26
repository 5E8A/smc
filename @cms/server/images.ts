import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import sharp from "sharp";
import {
  CONTENT_ASSETS_DIR,
  CONTENT_DIR,
  PUBLIC_ASSETS_DIR,
  REPO_ROOT,
  KINDS,
  LANGS,
  contentPath,
  mimeFor,
  writeJsonAtomic,
} from "./util.ts";
import { slugify } from "@smc/shared/slug";
import { convertVideoToWebp, needsFfmpeg, resolveFfmpeg, VIDEO_FPS } from "./ffmpeg.ts";

sharp.cache(false);

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
/** Raster formats whose animation sharp decodes natively (apng is handled by ffmpeg instead). */
const SHARP_ANIMATED_EXTS = new Set([".gif"]);

export const UPLOAD_EXTS = new Set([...IMAGE_EXTS, ...SHARP_ANIMATED_EXTS, ".apng"]);

export const UPLOAD_LIMITS = {
  image: 25 * 1024 * 1024,
  video: 128 * 1024 * 1024,
} as const;

export const uploadLimitFor = (ext: string): number => (needsFfmpeg(ext) ? UPLOAD_LIMITS.video : UPLOAD_LIMITS.image);

export const formatMb = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const MAX_ANIMATION_FRAMES = 600;

export interface ImageInfo {
  path: string;
  url: string;
  staticUrl?: string;
  dir: string;
  name: string;
  width: number;
  height: number;
  animated: boolean;
}

export const CONTENT_PUBLIC_PREFIX = "/smc/assets/content/";

const HEADER_BYTES = 32;

function webpDimensions(buf: Buffer): { width: number; height: number; animated: boolean } | null {
  if (buf.length < HEADER_BYTES) return null;
  if (buf.toString("latin1", 0, 4) !== "RIFF" || buf.toString("latin1", 8, 12) !== "WEBP") return null;
  const chunk = buf.toString("latin1", 12, 16);
  if (chunk === "VP8 ") {
    // lossy - frame header after the 3-byte frame tag + 0x9d 0x01 0x2a sync code
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff, animated: false };
  }
  if (chunk === "VP8L") {
    // lossless - 0x2f signature then packed 14-bit width-1 / height-1
    const b0 = buf[21]!;
    const b1 = buf[22]!;
    const b2 = buf[23]!;
    const b3 = buf[24]!;
    return {
      width: 1 + (((b1 & 0x3f) << 8) | b0),
      height: 1 + ((b3 << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      animated: false,
    };
  }
  if (chunk === "VP8X") {
    // extended - canvas size minus one as 24-bit LE pairs; flags byte carries the animation bit
    return {
      width: 1 + buf.readUIntLE(24, 3),
      height: 1 + buf.readUIntLE(27, 3),
      animated: (buf[20]! & 0x02) !== 0,
    };
  }
  return null;
}

function readWebpDimensions(file: string): { width: number; height: number; animated: boolean } {
  let fd: number | undefined;
  try {
    const buf = Buffer.alloc(HEADER_BYTES);
    fd = fs.openSync(file, "r");
    const read = fs.readSync(fd, buf, 0, HEADER_BYTES, 0);
    return webpDimensions(buf.subarray(0, read)) ?? { width: 1, height: 1, animated: false };
  } catch {
    return { width: 1, height: 1, animated: false };
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

const toPublicPath = (abs: string): string =>
  "/smc/assets/" + path.relative(PUBLIC_ASSETS_DIR, abs).replace(/\\/g, "/");

function walk(dir: string): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    if (e.isFile()) return [full];
    return [];
  });
}

function safeSegments(rel: string): string[] | null {
  const parts = rel.split(/[\\/]+/).filter((s) => s.length > 0);
  for (const p of parts) {
    if (p === "." || p === ".." || /^[a-zA-Z]:/.test(p)) return null;
  }
  const abs = parts.length === 0 ? CONTENT_ASSETS_DIR : path.resolve(CONTENT_ASSETS_DIR, ...parts);
  if (abs !== CONTENT_ASSETS_DIR && !abs.startsWith(CONTENT_ASSETS_DIR + path.sep)) return null;
  return parts;
}

const absOf = (parts: string[]): string =>
  parts.length === 0 ? CONTENT_ASSETS_DIR : path.join(CONTENT_ASSETS_DIR, ...parts);

export function listImages(): ImageInfo[] {
  const files = walk(CONTENT_ASSETS_DIR);
  return files
    .filter((f) => {
      const base = path.basename(f);
      const ext = path.extname(f).toLowerCase();
      return (
        ext === ".webp" &&
        !base.includes(".placeholder.") &&
        !base.includes(".mobile.") &&
        !base.includes(".static.")
      );
    })
    .sort((a, b) => a.localeCompare(b))
    .map((f) => {
      const relDir = path.relative(CONTENT_ASSETS_DIR, path.dirname(f)).replace(/\\/g, "/");
      const { width, height, animated } = readWebpDimensions(f);
      const info: ImageInfo = {
        path: toPublicPath(f),
        url: `/api/asset?path=${encodeURIComponent(toPublicPath(f))}`,
        dir: relDir === "." ? "" : relDir,
        name: path.basename(f),
        width,
        height,
        animated,
      };
      if (animated) {
        const staticAbs = f.replace(/\.webp$/i, ".static.webp");
        if (staticAbs !== f && fs.existsSync(staticAbs)) {
          info.staticUrl = `/api/asset?path=${encodeURIComponent(toPublicPath(staticAbs))}`;
        }
      }
      return info;
    });
}

export function listDirs(): string[] {
  const dirs: string[] = [];
  const visit = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const full = path.join(dir, e.name);
      dirs.push(path.relative(CONTENT_ASSETS_DIR, full).replace(/\\/g, "/"));
      visit(full);
    }
  };
  visit(CONTENT_ASSETS_DIR);
  return dirs.sort((a, b) => a.localeCompare(b));
}

export function serveAsset(publicPath: string, res: import("http").ServerResponse): boolean {
  if (!publicPath.startsWith("/smc/assets/")) return false;
  const abs = path.resolve(PUBLIC_ASSETS_DIR, publicPath.slice("/smc/assets/".length));
  if (!abs.startsWith(PUBLIC_ASSETS_DIR + path.sep)) return false;
  let stat: fs.Stats;
  try {
    stat = fs.statSync(abs);
  } catch {
    return false;
  }
  if (!stat.isFile()) return false;
  res.writeHead(200, {
    "Content-Type": mimeFor(abs),
    "Content-Length": stat.size,
    "Cache-Control": "no-store",
    "Content-Security-Policy": "sandbox",
    "X-Content-Type-Options": "nosniff",
  });
  fs.createReadStream(abs).pipe(res);
  return true;
}

export interface EncodeOptions {
  quality: number;
  maxWidth: number;
}

export type UploadProgressEvent =
  | { stage: "probe" }
  | { stage: "transcode"; pct: number | null; speed: string | null }
  | { stage: "decoding" }
  | { stage: "re-encoding" }
  | { stage: "static-frame" }
  | { stage: "writing" };

export type OnUploadProgress = (event: UploadProgressEvent) => void;

export interface UploadResult {
  savedAs: string;
  publicPath: string;
  width: number;
  height: number;
  animated: boolean;
  frames?: number;
  staticPath?: string;
}

export const clampQuality = (v: number): number => Math.min(Math.max(Math.round(v), 1), 100);
export const clampMaxWidth = (v: number): number => Math.min(Math.max(Math.round(v), 64), 4096);

const RETRYABLE_FS_CODES = new Set(["EBUSY", "EPERM", "EACCES"]);

async function fsRetry(fn: () => void, tries = 5, delayMs = 250): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      fn();
      return;
    } catch (err) {
      if (attempt >= tries || !RETRYABLE_FS_CODES.has((err as NodeJS.ErrnoException).code ?? "")) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

interface EncodedUpload {
  webp: Buffer;
  staticFrame: Buffer | null;
  frames: number;
  width: number;
  height: number;
}

async function encodeRaster(
  body: Buffer,
  ext: string,
  opts: EncodeOptions & { onProgress?: OnUploadProgress }
): Promise<EncodedUpload> {
  const report = opts.onProgress ?? ((): void => {});
  report({ stage: "decoding" });
  let meta;
  try {
    meta = await sharp(body).metadata();
  } catch {
    throw new Error("Could not decode image");
  }
  const frames = meta.pages ?? 1;
  if (frames > MAX_ANIMATION_FRAMES) {
    throw new Error(`Animation has ${frames} frames - the limit is ${MAX_ANIMATION_FRAMES}`);
  }
  const animated = frames > 1 || SHARP_ANIMATED_EXTS.has(ext);
  if (animated) report({ stage: "re-encoding" });
  const pipeline = animated ? sharp(body, { animated: true }) : sharp(body);
  const webp = await pipeline
    .rotate()
    .resize({ width: opts.maxWidth, withoutEnlargement: true })
    .webp({ quality: opts.quality })
    .toBuffer();
  const outMeta = await sharp(webp).metadata();
  let staticFrame: Buffer | null = null;
  if (animated) {
    report({ stage: "static-frame" });
    staticFrame = await sharp(body)
      .rotate()
      .resize({ width: opts.maxWidth, withoutEnlargement: true })
      .webp({ quality: opts.quality })
      .toBuffer();
  }
  return { webp, staticFrame, frames: animated ? frames : 1, width: outMeta.width ?? 1, height: outMeta.height ?? 1 };
}

async function encodeVideo(
  body: Buffer,
  ext: string,
  opts: EncodeOptions & { onProgress?: OnUploadProgress }
): Promise<EncodedUpload> {
  if (!needsFfmpeg(ext)) throw new Error(`Unsupported animated type "${ext}"`);
  if (!(await resolveFfmpeg())) {
    throw new Error("ffmpeg is required for video/apng uploads - run npm run cms:ffmpeg or install ffmpeg");
  }
  const result = await convertVideoToWebp(body, {
    quality: opts.quality,
    maxWidth: opts.maxWidth,
    ...(ext === ".apng" ? {} : { fps: VIDEO_FPS }),
    ...(opts.onProgress ? { onProgress: opts.onProgress } : {}),
  });
  const meta = await sharp(result.webp).metadata();
  return {
    webp: result.webp,
    staticFrame: result.staticFrame,
    frames: result.frames,
    width: meta.width ?? 1,
    height: meta.height ?? 1,
  };
}

export async function saveUpload(
  dir: string,
  rawName: string,
  body: Buffer,
  opts?: Partial<EncodeOptions> & { onProgress?: OnUploadProgress }
): Promise<UploadResult> {
  const ext = path.extname(rawName).toLowerCase();
  const useFfmpeg = needsFfmpeg(ext);
  if (!UPLOAD_EXTS.has(ext) && !useFfmpeg) {
    throw new Error(`Unsupported file type "${ext}" - use png, jpg, webp, gif, apng, mp4 or webm`);
  }
  const base = slugify(path.basename(rawName, path.extname(rawName)))
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
  if (!base) throw new Error("File name contains no usable characters");
  if (body.length === 0) throw new Error("Empty upload");
  const limit = uploadLimitFor(ext);
  if (body.length > limit) {
    throw new Error(
      `File is ${formatMb(body.length)} - the limit for ${needsFfmpeg(ext) ? "video/animation" : "image"} uploads is ${formatMb(limit)}`
    );
  }

  const encodeOpts = {
    quality: clampQuality(opts?.quality ?? 80),
    maxWidth: clampMaxWidth(opts?.maxWidth ?? 1600),
    ...(opts?.onProgress ? { onProgress: opts.onProgress } : {}),
  };
  const encoded = await (useFfmpeg ? encodeVideo(body, ext, encodeOpts) : encodeRaster(body, ext, encodeOpts));

  const parts = safeSegments(dir);
  if (parts === null) throw new Error("Invalid target folder");
  const dirAbs = absOf(parts);
  fs.mkdirSync(dirAbs, { recursive: true });

  let fileName = `${base}.webp`;
  let n = 2;
  while (fs.existsSync(path.join(dirAbs, fileName))) {
    fileName = `${base}-${n}.webp`;
    n += 1;
  }

  opts?.onProgress?.({ stage: "writing" });
  await fs.promises.writeFile(path.join(dirAbs, fileName), encoded.webp);
  const publicPath = CONTENT_PUBLIC_PREFIX + [...parts, fileName].join("/");

  let staticPath: string | undefined;
  if (encoded.staticFrame) {
    const staticName = fileName.replace(/\.webp$/, ".static.webp");
    await fs.promises.writeFile(path.join(dirAbs, staticName), encoded.staticFrame);
    staticPath = CONTENT_PUBLIC_PREFIX + [...parts, staticName].join("/");
  }

  return {
    savedAs: "public/assets/content/" + [...parts, fileName].join("/"),
    publicPath,
    width: encoded.width,
    height: encoded.height,
    animated: encoded.frames > 1 || !!encoded.staticFrame,
    ...(encoded.frames > 1 ? { frames: encoded.frames } : {}),
    ...(staticPath ? { staticPath } : {}),
  };
}

interface RefSource {
  label: string;
  file: string;
}

const REF_SOURCES: RefSource[] = [
  ...LANGS.flatMap((lang) => KINDS.map((kind) => ({ label: `${lang}/${kind}`, file: contentPath(kind, lang) }))),
  { label: "authors", file: path.join(CONTENT_DIR, "authors.json") },
];

type StringHit = { where: string; value: string };

function collectStrings(node: unknown, where: string, out: StringHit[]): void {
  if (typeof node === "string") {
    if (node.length > 0) out.push({ where, value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collectStrings(v, `${where}[${i}]`, out));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) collectStrings(v, where ? `${where}.${k}` : k, out);
  }
}

const referencesPath = (value: string, target: string): boolean => value === target || value.includes(`](${target})`);

export function findRefs(publicPaths: string[]): Record<string, string[]> {
  const targets = [...new Set(publicPaths)];
  const usages: Record<string, string[]> = {};
  if (targets.length === 0) return usages;
  for (const src of REF_SOURCES) {
    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(src.file, "utf8"));
    } catch {
      continue;
    }
    const strings: StringHit[] = [];
    collectStrings(data, "", strings);
    for (const { where, value } of strings) {
      for (const t of targets) {
        if (referencesPath(value, t)) (usages[t] ??= []).push(`${src.label}${where}`);
      }
    }
  }
  return usages;
}

type StringRewrite = { next: string; hits: number } | null;

async function rewriteRefsInContent(apply: (value: string) => StringRewrite): Promise<number> {
  let replaced = 0;
  for (const src of REF_SOURCES) {
    let data: unknown;
    try {
      data = JSON.parse(await fs.promises.readFile(src.file, "utf8"));
    } catch {
      continue;
    }
    let changed = false;
    const visit = (node: unknown): unknown => {
      if (typeof node === "string") {
        const result = apply(node);
        if (!result) return node;
        changed = true;
        replaced += result.hits;
        return result.next;
      }
      if (Array.isArray(node)) return node.map(visit);
      if (node && typeof node === "object") {
        return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, visit(v)]));
      }
      return node;
    };
    const next = visit(data);
    if (changed) await writeJsonAtomic(src.file, next);
  }
  return replaced;
}

async function rewritePrefix(from: string, to: string): Promise<number> {
  return rewriteRefsInContent((value) => {
    if (!value.includes(from)) return null;
    return { next: value.split(from).join(to), hits: value.split(from).length - 1 };
  });
}

export async function createDir(rel: string): Promise<void> {
  const parts = safeSegments(rel);
  if (parts === null) throw new Error("Invalid folder path");
  if (parts.length === 0) throw new Error("Name contains no usable characters");
  const abs = absOf(parts);
  if (fs.existsSync(abs)) throw new Error("That folder already exists");
  fs.mkdirSync(abs, { recursive: true });
}

export async function renameDir(oldRel: string, newName: string): Promise<number> {
  const parts = safeSegments(oldRel);
  if (parts === null) throw new Error("Invalid folder path");
  if (parts.length === 0) throw new Error("Cannot rename the content root");
  const clean = slugify(newName).toLowerCase();
  if (!clean) throw new Error("Name contains no usable characters");
  const oldAbs = absOf(parts);
  if (!fs.existsSync(oldAbs)) throw new Error("Folder does not exist");
  const newParts = [...parts.slice(0, -1), clean];
  const newAbs = absOf(newParts);
  if (fs.existsSync(newAbs)) throw new Error("A folder with that name already exists");
  fs.renameSync(oldAbs, newAbs);
  const from = CONTENT_PUBLIC_PREFIX + parts.join("/") + "/";
  const to = CONTENT_PUBLIC_PREFIX + newParts.join("/") + "/";
  return rewritePrefix(from, to);
}

export type DeletionResult = { blocked: true; usages: Record<string, string[]> } | { blocked: false };

export async function deleteDir(rel: string): Promise<DeletionResult> {
  const parts = safeSegments(rel);
  if (parts === null) throw new Error("Invalid folder path");
  if (parts.length === 0) throw new Error("Cannot delete the content root");
  const abs = absOf(parts);
  if (!fs.existsSync(abs)) throw new Error("Folder does not exist");
  const targets = walk(abs).map(toPublicPath);
  const usages = findRefs(targets);
  if (Object.keys(usages).length > 0) return { blocked: true, usages };
  await fsRetry(() => fs.rmSync(abs, { recursive: true, force: true }));
  return { blocked: false };
}

export async function deleteImage(publicPath: string): Promise<DeletionResult> {
  if (!publicPath.startsWith(CONTENT_PUBLIC_PREFIX)) {
    throw new Error("Path must point inside public/assets/content");
  }
  const parts = safeSegments(publicPath.slice(CONTENT_PUBLIC_PREFIX.length));
  if (parts === null || parts.length === 0) throw new Error("Invalid image path");
  const abs = absOf(parts);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) throw new Error("File does not exist");
  const usages = findRefs([publicPath]);
  if (Object.keys(usages).length > 0) return { blocked: true, usages };
  await fsRetry(() => fs.unlinkSync(abs));
  const staticAbs = abs.replace(/\.webp$/, ".static.webp");
  if (staticAbs !== abs && fs.existsSync(staticAbs)) await fsRetry(() => fs.unlinkSync(staticAbs));
  return { blocked: false };
}

export async function renameImage(publicPath: string, newName: string): Promise<number> {
  if (!publicPath.startsWith(CONTENT_PUBLIC_PREFIX)) {
    throw new Error("Path must point inside public/assets/content");
  }
  const parts = safeSegments(publicPath.slice(CONTENT_PUBLIC_PREFIX.length));
  if (parts === null || parts.length === 0) throw new Error("Invalid image path");
  const abs = absOf(parts);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) throw new Error("File does not exist");
  if (path.extname(abs).toLowerCase() !== ".webp") throw new Error("Only .webp library images can be renamed");
  const base = slugify(newName)
    .toLowerCase()
    .replace(/\.webp$/i, "")
    .replace(/^-+|-+$/g, "");
  if (!base) throw new Error("Name contains no usable characters");
  const fileName = `${base}.webp`;
  const dirParts = parts.slice(0, -1);
  const targetAbs = path.join(absOf(dirParts), fileName);
  if (fs.existsSync(targetAbs)) throw new Error("A file with that name already exists in that folder");
  await fsRetry(() => fs.renameSync(abs, targetAbs));
  const staticAbs = abs.replace(/\.webp$/, ".static.webp");
  if (staticAbs !== abs && fs.existsSync(staticAbs)) {
    await fsRetry(() => fs.renameSync(staticAbs, targetAbs.replace(/\.webp$/, ".static.webp")));
  }
  const newPath = CONTENT_PUBLIC_PREFIX + [...dirParts, fileName].join("/");
  return rewriteRefsInContent((value) => {
    if (value === publicPath) return { next: newPath, hits: 1 };
    const marker = `](${publicPath})`;
    const hits = value.split(marker).length - 1;
    return hits > 0 ? { next: value.split(marker).join(`](${newPath})`), hits } : null;
  });
}

let running = false;

export function runLqip(res: import("http").ServerResponse): void {
  if (running) {
    res.writeHead(409, { "Content-Type": "text/plain" });
    res.end("blurhash generation already running");
    return;
  }
  running = true;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  });

  const send = (event: string, data: string) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const child = spawn(process.execPath, ["@scripts/generate-blurhash.mjs"], {
    cwd: REPO_ROOT,
    windowsHide: true,
  });

  const onLine = (buf: Buffer) => send("log", buf.toString("utf8"));
  child.stdout.on("data", onLine);
  child.stderr.on("data", onLine);

  child.on("error", (err) => {
    send("log", `Failed to start: ${err.message}`);
    send("done", "error");
    running = false;
    res.end();
  });

  child.on("close", (code) => {
    send("done", code === 0 ? "ok" : `exit ${code}`);
    running = false;
    res.end();
  });

  res.on("close", () => {
    if (!child.killed) child.kill();
    running = false;
  });
}
