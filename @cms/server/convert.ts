import path from "path";
import sharp from "sharp";
import yazl from "yazl";
import { clampMaxWidth, clampQuality } from "./images.ts";

export const CONVERT_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

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

const toWebpName = (rel: string): string => rel.replace(/\.[^.]+$/, "") + ".webp";

export interface ConvertResult {
  converted: Array<{ relPath: string; data: Buffer }>;
  errors: Array<{ file: string; reason: string }>;
}

export async function convertBatch(
  files: MultipartFile[],
  opts: { quality?: number; resize?: boolean; maxWidth?: number }
): Promise<ConvertResult> {
  const quality = clampQuality(opts.quality ?? 80);
  const maxWidth = clampMaxWidth(opts.maxWidth ?? 1600);
  const converted: ConvertResult["converted"] = [];
  const errors: ConvertResult["errors"] = [];

  for (const f of files) {
    if (f.data.length === 0) {
      errors.push({ file: f.filename, reason: "empty file" });
      continue;
    }
    if (f.data.length > 100 * 1024 * 1024) {
      errors.push({ file: f.filename, reason: "exceeds 100 MB per-file limit" });
      continue;
    }
    const rel = sanitizeRelPath(f.filename);
    if (!rel) {
      errors.push({ file: f.filename, reason: "unsafe path" });
      continue;
    }
    const ext = path.extname(rel).toLowerCase();
    if (!CONVERT_EXTS.has(ext)) {
      errors.push({ file: rel, reason: `unsupported type "${ext}"` });
      continue;
    }
    try {
      let pipeline = sharp(f.data).rotate();
      if (opts.resize) pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
      const data = await pipeline.webp({ quality }).toBuffer();
      converted.push({ relPath: toWebpName(rel), data });
    } catch (err) {
      errors.push({ file: rel, reason: (err as Error).message || "decode failure" });
    }
  }
  return { converted, errors };
}

export function streamConvertedZip(res: import("http").ServerResponse, result: ConvertResult): void {
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": 'attachment; filename="webp-converter.zip"',
    "X-Converted": String(result.converted.length),
    "X-Errors": String(result.errors.length),
    "Cache-Control": "no-store",
  });

  const zipfile = new yazl.ZipFile();
  for (const c of result.converted) zipfile.addBuffer(c.data, c.relPath);
  if (result.errors.length > 0) {
    const report = result.errors.map((e) => `${e.file}: ${e.reason}\n`).join("");
    zipfile.addBuffer(Buffer.from(report, "utf8"), "CONVERSION-ERRORS.txt");
  }
  zipfile.end();
  zipfile.outputStream.on("error", () => res.destroy());
  zipfile.outputStream.pipe(res);
}
