import path from "path";
import sharp from "sharp";
import yazl from "yazl";
import { clampMaxWidth, clampQuality, formatMb, MAX_ANIMATION_FRAMES, uploadLimitFor } from "./media.ts";
import { convertAnimatedToWebm, needsFfmpeg, resolveFfmpeg, VIDEO_FPS, FfmpegMissingError } from "./ffmpeg.ts";

const STATIC_IMAGE_EXTS = [".png", ".jpg", ".jpeg"];
const ANIMATED_IMAGE_EXTS = [".webp", ".gif"];

export const CONVERT_EXTS = new Set([...STATIC_IMAGE_EXTS, ...ANIMATED_IMAGE_EXTS, ".apng"]);

const MAX_CONVERT_BODY = 512 * 1024 * 1024;
export { MAX_CONVERT_BODY };

export interface MultipartFile {
  filename: string;
  data: Buffer;
}

export interface MultipartResult {
  fields: Record<string, string>;
  files: MultipartFile[];
}

export function parseMultipart(body: Buffer, contentType: string | undefined): MultipartResult {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType ?? "");
  if (!match) throw new Error("Missing multipart boundary");
  const boundary = Buffer.from(`--${(match[1] ?? match[2]).trim()}`);
  const fields: Record<string, string> = {};
  const files: MultipartFile[] = [];

  let pos = body.indexOf(boundary);
  if (pos === -1) throw new Error("Malformed multipart body");
  pos += boundary.length;
  for (;;) {
    if (body.subarray(pos, pos + 2).toString("latin1") === "--") break;
    pos += 2;
    const headerEnd = body.indexOf("\r\n\r\n", pos);
    if (headerEnd === -1) throw new Error("Malformed multipart part");
    const headers = body.subarray(pos, headerEnd).toString("utf8");
    const next = body.indexOf(boundary, headerEnd + 4);
    if (next === -1) throw new Error("Malformed multipart part");
    const data = body.subarray(headerEnd + 4, next - 2);
    const disp = /content-disposition:\s*form-data;([^\r\n]*)/i.exec(headers)?.[1] ?? "";
    const unquote = (v: string | undefined): string | undefined =>
      v ? /^"((?:[^"\\]|\\.)*)"$/.exec(v)?.[1]?.replace(/\\(.)/g, "$1") : v;
    const name = unquote(/[^;]*?\bname=([^;]+)/.exec(disp)?.[1]?.trim());
    const filename = unquote(/[^;]*?\bfilename=([^;]+)/.exec(disp)?.[1]?.trim());
    if (name && filename !== undefined && filename !== "") {
      files.push({ filename, data });
    } else if (name) {
      fields[name] = data.toString("utf8");
    }
    pos = next + boundary.length;
  }
  return { fields, files };
}

const sanitizeRelPath = (raw: string): string | null => {
  if (/[\p{Cc}]/u.test(raw)) return null;
  const parts = raw
    .replace(/\\/g, "/")
    .split("/")
    .filter((s) => s.length > 0);
  for (const p of parts) {
    if (p === "." || p === ".." || p.includes(":")) return null;
  }
  return parts.length > 0 ? parts.join("/") : null;
};

const toMediaName = (rel: string, ext: ".webp" | ".webm"): string => rel.replace(/\.[^.]+$/, "") + ext;

const toStaticName = (rel: string): string => rel.replace(/\.[^.]+$/, "") + ".static.webp";

export interface ConvertResult {
  converted: Array<{ relPath: string; data: Buffer }>;
  errors: Array<{ file: string; reason: string }>;
}

export type ConvertProgressEvent = ConvertProgressEnvelope & ConvertProgressStage;

type ConvertProgressEnvelope = { file: string; i: number; n: number };

type ConvertProgressStage =
  | { stage: "decoding" }
  | { stage: "re-encoding" }
  | { stage: "transcode"; pct: number | null; speed: string | null }
  | { stage: "static-frame" };

export type OnConvertProgress = (event: ConvertProgressEvent) => void;

interface ConvertedFile {
  webp: Buffer;
  staticFrame: Buffer | null;
  mediaExt: ".webp" | ".webm";
}

async function convertRaster(
  f: MultipartFile,
  ext: string,
  opts: { quality: number; maxWidth: number; resize?: boolean },
  report: (stage: Exclude<ConvertProgressStage, { stage: "transcode" }>) => void
): Promise<ConvertedFile> {
  report({ stage: "decoding" });
  let meta;
  try {
    meta = await sharp(f.data).metadata();
  } catch {
    throw new Error("decode failure");
  }
  const frames = meta.pages ?? 1;
  if (frames > MAX_ANIMATION_FRAMES) {
    throw new Error(`animation has ${frames} frames - the limit is ${MAX_ANIMATION_FRAMES}`);
  }
  const animated = frames > 1 || ext === ".gif";
  if (animated) report({ stage: "re-encoding" });
  let pipeline = animated ? sharp(f.data, { animated: true }) : sharp(f.data);
  pipeline = pipeline.rotate();
  if (opts.resize) pipeline = pipeline.resize({ width: opts.maxWidth, withoutEnlargement: true });
  const webp = await pipeline.webp({ quality: opts.quality }).toBuffer();
  let staticFrame: Buffer | null = null;
  if (animated) {
    report({ stage: "static-frame" });
    let framePipeline = sharp(f.data).rotate();
    if (opts.resize) framePipeline = framePipeline.resize({ width: opts.maxWidth, withoutEnlargement: true });
    staticFrame = await framePipeline.webp({ quality: opts.quality }).toBuffer();
  }
  return { webp, staticFrame, mediaExt: ".webp" };
}

async function convertOne(
  f: MultipartFile,
  ext: string,
  opts: { quality: number; maxWidth: number; resize?: boolean },
  report: (stage: ConvertProgressStage) => void
): Promise<ConvertedFile> {
  if (needsFfmpeg(ext)) {
    if (!(await resolveFfmpeg())) throw new FfmpegMissingError();
    const result = await convertAnimatedToWebm(f.data, {
      quality: opts.quality,
      maxWidth: opts.maxWidth,
      fps: VIDEO_FPS,
      onProgress: (p) => {
        if (p.stage === "transcode") report({ stage: "transcode", pct: p.pct, speed: p.speed });
        else if (p.stage === "static-frame") report({ stage: "static-frame" });
        else report({ stage: "decoding" });
      },
    });
    return { webp: result.media, staticFrame: result.staticFrame, mediaExt: ".webm" };
  }
  return convertRaster(f, ext, opts, report);
}

export async function convertBatch(
  files: MultipartFile[],
  opts: { quality?: number; resize?: boolean; maxWidth?: number; onProgress?: OnConvertProgress }
): Promise<ConvertResult> {
  const quality = clampQuality(opts.quality ?? 80);
  const maxWidth = clampMaxWidth(opts.maxWidth ?? 1600);
  const converted: ConvertResult["converted"] = [];
  const errors: ConvertResult["errors"] = [];
  const total = files.length;

  let index = 0;
  for (const f of files) {
    index += 1;
    const envelope = (): ConvertProgressEnvelope => ({ file: f.filename, i: index, n: total });
    const report = opts.onProgress ?? null;
    if (f.data.length === 0) {
      errors.push({ file: f.filename, reason: "empty file" });
      continue;
    }
    const rel = sanitizeRelPath(f.filename);
    if (!rel) {
      errors.push({ file: f.filename, reason: "unsafe path" });
      continue;
    }
    const ext = path.extname(rel).toLowerCase();
    if (!CONVERT_EXTS.has(ext) && !needsFfmpeg(ext)) {
      errors.push({ file: rel, reason: `unsupported type "${ext}"` });
      continue;
    }
    if (f.data.length > uploadLimitFor(ext)) {
      errors.push({ file: rel, reason: `exceeds the ${formatMb(uploadLimitFor(ext))} per-file limit` });
      continue;
    }
    try {
      const result = await convertOne(
        f,
        ext,
        { quality, maxWidth, resize: opts.resize },
        report ? (stage) => report({ ...envelope(), ...stage }) : (): void => {}
      );
      converted.push({ relPath: toMediaName(rel, result.mediaExt), data: result.webp });
      if (result.staticFrame) {
        converted.push({ relPath: toStaticName(rel), data: result.staticFrame });
      }
    } catch (err) {
      errors.push({ file: rel, reason: (err as Error).message || "decode failure" });
    }
  }
  return { converted, errors };
}

export function buildZip(result: ConvertResult): yazl.ZipFile {
  const zipfile = new yazl.ZipFile();
  for (const c of result.converted) zipfile.addBuffer(c.data, c.relPath);
  if (result.errors.length > 0) {
    const report = result.errors.map((e) => `${e.file}: ${e.reason}\n`).join("");
    zipfile.addBuffer(Buffer.from(report, "utf8"), "CONVERSION-ERRORS.txt");
  }
  zipfile.end();
  return zipfile;
}

export function streamConvertedZip(res: import("http").ServerResponse, result: ConvertResult): void {
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": 'attachment; filename="webp-converter.zip"',
    "X-Converted": String(result.converted.length),
    "X-Errors": String(result.errors.length),
    "Cache-Control": "no-store",
  });
  const zipfile = buildZip(result);
  zipfile.outputStream.on("error", () => res.destroy());
  zipfile.outputStream.pipe(res);
}
