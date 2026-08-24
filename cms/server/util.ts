import path from "path";
import fs from "fs";

export const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
export const CONTENT_DIR = path.join(REPO_ROOT, "src", "content");
export const PUBLIC_ASSETS_DIR = path.join(REPO_ROOT, "public", "assets");
export const CONTENT_ASSETS_DIR = path.join(PUBLIC_ASSETS_DIR, "content");

export const KINDS = ["posts", "wiki"] as const;
export type Kind = (typeof KINDS)[number];
export const LANGS = ["en", "pl"] as const;
export type Lang = (typeof LANGS)[number];

export const isKind = (v: string | null): v is Kind => KINDS.includes(v as Kind);
export const isLang = (v: string | null): v is Lang => LANGS.includes(v as Lang);

export function contentPath(kind: Kind, lang: Lang): string {
  return path.join(CONTENT_DIR, lang, `${kind}.json`);
}

export async function readJson(filePath: string): Promise<unknown> {
  const text = await fs.promises.readFile(filePath, "utf8");
  return JSON.parse(text);
}

export async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2) + "\n";
  const tmp = filePath + ".tmp";
  await fs.promises.writeFile(tmp, json, "utf8");
  await fs.promises.rename(tmp, filePath);
}

const ASSET_PREFIX = "/smc/assets/";

export function resolveAssetPath(publicPath: string): string | null {
  if (!publicPath.startsWith(ASSET_PREFIX)) return null;
  const rel = publicPath.slice(ASSET_PREFIX.length);
  const abs = path.resolve(PUBLIC_ASSETS_DIR, rel);
  if (!abs.startsWith(PUBLIC_ASSETS_DIR + path.sep)) return null;
  return abs;
}

export function assetExists(publicPath: string): boolean {
  const abs = resolveAssetPath(publicPath);
  if (!abs) return false;
  try {
    return fs.statSync(abs).isFile();
  } catch {
    return false;
  }
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/[^a-zA-Z0-9._~ -]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

export function mimeFor(filePath: string): string {
  return MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

export function sendJson(res: import("http").ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

export function readRawBody(req: import("http").IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error(`Body exceeds ${maxBytes} bytes`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
