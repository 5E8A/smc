import path from "path";
import fs from "fs";
import { LANGS, KINDS, type Lang, type Kind, isLang, isKind } from "@smc/shared/content";

export { LANGS, KINDS, type Lang, type Kind, isLang, isKind };

export const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
export const CONTENT_DIR = path.join(REPO_ROOT, "@web", "src", "content");
export const PUBLIC_ASSETS_DIR = path.join(REPO_ROOT, "@web", "public", "assets");
export const CONTENT_ASSETS_DIR = path.join(PUBLIC_ASSETS_DIR, "content");

export function contentPath(kind: Kind, lang: Lang): string {
  return path.join(CONTENT_DIR, lang, `${kind}.json`);
}

export function mdDir(kind: Kind, lang: Lang): string {
  return path.join(CONTENT_DIR, lang, kind);
}

export function mdPath(kind: Kind, lang: Lang, slug: string): string {
  return path.join(mdDir(kind, lang), `${slug}.md`);
}

export async function readMd(filePath: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function writeMdAtomic(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const tmp = filePath + ".tmp";
  const fd = await fs.promises.open(tmp, "w");
  try {
    await fd.writeFile(normalized, "utf8");
    await fd.sync();
  } finally {
    await fd.close();
  }
  await fs.promises.rename(tmp, filePath);
}

export async function deleteMd(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // ignore if file doesn't exist
  }
}

export async function readJson(filePath: string): Promise<unknown> {
  const text = await fs.promises.readFile(filePath, "utf8");
  return JSON.parse(text);
}

export async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2) + "\n";
  const tmp = filePath + ".tmp";
  const fd = await fs.promises.open(tmp, "w");
  try {
    await fd.writeFile(json, "utf8");
    await fd.sync();
  } finally {
    await fd.close();
  }
  await fs.promises.rename(tmp, filePath);
}

const TMP_SUFFIX = ".tmp"; /**
 * Removes leftover `*.tmp` files (from an interrupted atomic write) inside the
 * given directory tree. Best-effort: never throws.
 */
export async function cleanupOrphanTmp(dir: string): Promise<number> {
  let removed = 0;
  let entries: string[];
  try {
    entries = await fs.promises.readdir(dir);
  } catch {
    return 0;
  }
  for (const entry of entries) {
    if (entry.endsWith(TMP_SUFFIX)) {
      try {
        await fs.promises.unlink(path.join(dir, entry));
        removed++;
      } catch {
        // ignore
      }
    }
  }
  return removed;
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

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".apng": "image/apng",
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
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

export class BodyTooLargeError extends Error {
  readonly limit: number;

  constructor(limit: number) {
    super(`Body exceeds ${formatBytes(limit)} limit`);
    this.limit = limit;
  }
}

const formatBytes = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${Math.round(bytes / (1024 * 1024))} MB` : `${Math.round(bytes / 1024)} KB`;

export function readRawBody(req: import("http").IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const fail = (): void => {
      req.resume();
      reject(new BodyTooLargeError(maxBytes));
    };
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    req.on("data", (chunk: Buffer) => {
      if (settled) return;
      size += chunk.length;
      if (size > maxBytes) {
        settled = true;
        fail();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (settled) return;
      settled = true;
      resolve(Buffer.concat(chunks));
    });
    req.on("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

const stamp = (): string => new Date().toISOString();

function logGuarded(kind: string, err: unknown): void {
  console.error(`[cms-server] ${stamp()} ${kind}:`, err instanceof Error ? (err.stack ?? err.message) : err);
}

let processGuardsInstalled = false;

/** Keeps a stray async error from silently killing the whole CMS process. */
export function installProcessGuards(): void {
  // Vite re-evaluates the config module on every restart - key off globalThis
  // so handlers are registered exactly once per node process.
  const g = globalThis as typeof globalThis & { __smcCmsProcessGuards?: boolean };
  if (g.__smcCmsProcessGuards || processGuardsInstalled) return;
  g.__smcCmsProcessGuards = true;
  processGuardsInstalled = true;
  console.log(`[cms-server] ${stamp()} process guards installed`);
  process.on("uncaughtException", (err) => logGuarded("uncaughtException", err));
  process.on("unhandledRejection", (reason) => logGuarded("unhandledRejection", reason));
}

/**
 * Attaches logging error listeners to request/response streams so client
 * disconnects, aborted uploads and mid-stream kills can never surface as an
 * uncaught "error" event and take the server down.
 */
export function attachHttpGuards(req: import("http").IncomingMessage, res: import("http").ServerResponse): void {
  req.on("error", (err) => logGuarded("request stream error", err));
  res.on("error", (err) => logGuarded("response stream error", err));
}

export const isResponseClosed = (res: import("http").ServerResponse): boolean => res.destroyed || res.writableEnded;

/**
 * A promise-chain keyed mutex. Serializes async critical sections per key so
 * concurrent callers never interleave (last-write-wins, in FIFO order).
 */
export function createKeyedMutex(): <T>(key: string, fn: () => Promise<T>) => Promise<T> {
  const tails = new Map<string, Promise<unknown>>();
  return async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
    const prev = tails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const tail = new Promise<void>((resolve) => (release = resolve));
    tails.set(
      key,
      prev.then(() => tail)
    );
    await prev;
    try {
      return await fn();
    } finally {
      release();
      if (tails.get(key) === tail) tails.delete(key);
    }
  };
}
