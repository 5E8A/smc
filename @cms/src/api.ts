import type { Author, ImageInfo, ImagesPayload, Issue, Kind, Lang, ModListColumn, RefUsages } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly payload: { error?: string; issues?: Issue[]; usages?: RefUsages };

  constructor(status: number, payload: { error?: string; issues?: Issue[]; usages?: Record<string, string[]> }) {
    super(payload.error ?? `Request failed with status ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let payload: { error?: string; issues?: Issue[] } = {};
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }
  if (!res.ok) throw new ApiError(res.status, payload);
  return payload as T;
}

export interface SaveResult {
  ok: boolean;
  issues: Issue[];
  /** Prettier-formatted markdown keyed by slug - present only when entries were written. */
  formatted?: Record<string, string>;
}

export const getContent = <T>(kind: Kind, lang: Lang): Promise<T[]> =>
  request<{ data: T[] }>(`/api/content?kind=${kind}&lang=${lang}`).then((r) => r.data);

export const putContent = (kind: Kind, lang: Lang, data: unknown[], dirtySlugs: string[]): Promise<SaveResult> =>
  request<{ ok: boolean; issues: Issue[]; formatted?: Record<string, string> }>(
    `/api/content?kind=${kind}&lang=${lang}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: data, dirtySlugs }),
    }
  );

export const getAuthors = (): Promise<Author[]> => request<{ data: Author[] }>("/api/authors").then((r) => r.data);

export interface ModListSaveResult extends SaveResult {
  data?: ModListColumn[];
}

export const getModList = (): Promise<ModListColumn[]> =>
  request<{ data: ModListColumn[] }>("/api/mods").then((r) => r.data);

export interface GitChange {
  path: string;
  x: string;
  y: string;
}

export interface GitStatus {
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  changes: GitChange[];
  lastCommit: { hash: string; subject: string; date: string } | null;
}

export const getGitStatus = (): Promise<GitStatus> =>
  request<{ data: GitStatus }>("/api/git/status").then((r) => r.data);

export const putModList = (data: ModListColumn[]): Promise<ModListSaveResult> =>
  request<{ ok: boolean; issues: Issue[]; data?: ModListColumn[] }>("/api/mods", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export interface AuthorsSaveResult extends SaveResult {
  data?: Author[];
}

export const putAuthors = (data: Author[]): Promise<AuthorsSaveResult> =>
  request<{ ok: boolean; issues: Issue[]; data?: Author[] }>("/api/authors", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getMedia = (): Promise<ImagesPayload> => request<ImagesPayload>("/api/images");

export const validateContent = (kind: Kind, lang: Lang, data: unknown[]): Promise<SaveResult> =>
  request<{ ok: boolean; issues: Issue[] }>("/api/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, lang, data }),
  });

export interface UploadResult {
  savedAs: string;
  publicPath: string;
  width: number;
  height: number;
  animated?: boolean;
  frames?: number;
  staticPath?: string;
  format?: "webm" | "webp";
  mbPerSec?: number;
  oversized?: boolean;
}

export type UploadStage = "probe" | "transcode" | "decoding" | "re-encoding" | "static-frame" | "writing";

export interface UploadStageEvent {
  file: string;
  stage: UploadStage;
  pct?: number | null;
  speed?: string | null;
}

export type ConvertStageEvent =
  | { file: string; i: number; n: number; stage: "decoding" }
  | { file: string; i: number; n: number; stage: "re-encoding" }
  | { file: string; i: number; n: number; stage: "transcode"; pct: number | null; speed: string | null }
  | { file: string; i: number; n: number; stage: "static-frame" };

export interface EncodeOptions {
  quality?: number;
  maxWidth?: number;
  /** Output format override for animated sources; only honored for gif/`.webp` (others are webm-only). */
  format?: "webm" | "webp";
}

async function* ndjsonLines(body: ReadableStream<Uint8Array>): AsyncGenerator<Record<string, unknown>> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      if (done) buffer += decoder.decode();
      let nl = buffer.indexOf("\n");
      while (nl !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (line) yield JSON.parse(line) as Record<string, unknown>;
        nl = buffer.indexOf("\n");
      }
      if (done) return;
    }
  } finally {
    reader.releaseLock();
  }
}

const UPLOAD_LIMITS = { image: 25 * 1024 * 1024, video: 128 * 1024 * 1024 };
const FFMPEG_EXTS = new Set([".mp4", ".m4v", ".webm", ".mov", ".mkv", ".apng"]);

const uploadLimitFor = (name: string): number => {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  return FFMPEG_EXTS.has(ext) ? UPLOAD_LIMITS.video : UPLOAD_LIMITS.image;
};

const formatMb = (bytes: number): string => `${Math.round(bytes / (1024 * 1024))} MB`;

export const uploadImage = async (
  file: File,
  dir: string,
  opts: EncodeOptions & { onProgress?: (event: UploadStageEvent) => void } = {}
): Promise<UploadResult> => {
  const limit = uploadLimitFor(file.name);
  if (file.size > limit) {
    throw new ApiError(413, {
      error: `${file.name} is ${formatMb(file.size)} - the upload limit is ${formatMb(limit)}`,
    });
  }
  const params = new URLSearchParams({ dir, name: file.name });
  if (opts.quality != null) params.set("quality", String(opts.quality));
  if (opts.maxWidth != null) params.set("maxWidth", String(opts.maxWidth));
  if (opts.format) params.set("format", opts.format);
  if (opts.onProgress) params.set("progress", "1");
  const res = await fetch(`/api/images?${params}`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    let payload: { error?: string } = {};
    try {
      payload = await res.json();
    } catch {
      payload = {};
    }
    throw new ApiError(res.status, payload);
  }
  if (!opts.onProgress || !res.body) return (await res.json()) as UploadResult;

  let final: UploadResult | null = null;
  let errorText: string | null = null;
  for await (const line of ndjsonLines(res.body)) {
    if (line.result) final = line.result as UploadResult;
    else if (typeof line.error === "string") errorText = line.error;
    else if (typeof line.stage === "string") {
      opts.onProgress({
        file: typeof line.file === "string" ? line.file : file.name,
        stage: line.stage as UploadStage,
        pct: typeof line.pct === "number" ? line.pct : null,
        speed: typeof line.speed === "string" ? line.speed : null,
      });
    }
  }
  if (!final) throw new ApiError(res.status, { error: errorText ?? "Upload failed" });
  return final;
};

export const replaceImage = async (
  path: string,
  file: File,
  opts: EncodeOptions & { onProgress?: (event: UploadStageEvent) => void } = {}
): Promise<UploadResult> => {
  const limit = uploadLimitFor(file.name);
  if (file.size > limit) {
    throw new ApiError(413, {
      error: `${file.name} is ${formatMb(file.size)} - the upload limit is ${formatMb(limit)}`,
    });
  }
  const params = new URLSearchParams({ path, name: file.name });
  if (opts.quality != null) params.set("quality", String(opts.quality));
  if (opts.maxWidth != null) params.set("maxWidth", String(opts.maxWidth));
  if (opts.format) params.set("format", opts.format);
  if (opts.onProgress) params.set("progress", "1");
  const res = await fetch(`/api/image/replace?${params}`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
  if (!res.ok) {
    let payload: { error?: string } = {};
    try {
      payload = await res.json();
    } catch {
      payload = {};
    }
    throw new ApiError(res.status, payload);
  }
  if (!opts.onProgress || !res.body) return (await res.json()) as UploadResult;

  let final: UploadResult | null = null;
  let errorText: string | null = null;
  for await (const line of ndjsonLines(res.body)) {
    if (line.result) final = line.result as UploadResult;
    else if (typeof line.error === "string") errorText = line.error;
    else if (typeof line.stage === "string") {
      opts.onProgress({
        file: typeof line.file === "string" ? line.file : file.name,
        stage: line.stage as UploadStage,
        pct: typeof line.pct === "number" ? line.pct : null,
        speed: typeof line.speed === "string" ? line.speed : null,
      });
    }
  }
  if (!final) throw new ApiError(res.status, { error: errorText ?? "Replace failed" });
  return final;
};

export interface DirActionResult {
  ok: boolean;
  rewritten?: number;
}

const postDirAction = (body: { action: string; path: string; newName?: string }): Promise<DirActionResult> =>
  request<DirActionResult>("/api/dirs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const createDir = (dir: string): Promise<DirActionResult> => postDirAction({ action: "create", path: dir });

export const renameDir = (dir: string, newName: string): Promise<DirActionResult> =>
  postDirAction({ action: "rename", path: dir, newName });

export const deleteDir = (dir: string): Promise<DirActionResult> => postDirAction({ action: "delete", path: dir });

export const deleteImage = (path: string): Promise<{ ok: boolean }> =>
  request<{ ok: boolean }>(`/api/image?path=${encodeURIComponent(path)}`, { method: "DELETE" });

export const renameImage = (path: string, newName: string): Promise<DirActionResult> =>
  request<DirActionResult>(`/api/image?path=${encodeURIComponent(path)}&name=${encodeURIComponent(newName)}`, {
    method: "PATCH",
  });

export const getRefs = (paths: string[]): Promise<RefUsages> => {
  if (paths.length === 0) return Promise.resolve({});
  return request<{ usages: RefUsages }>(`/api/refs?paths=${encodeURIComponent(paths.join(","))}`).then((r) => r.usages);
};

export interface EmptyDirInfo {
  path: string;
  currentlyEmpty: boolean;
  fileCount: number;
}

export interface PruneCandidates {
  unused: ImageInfo[];
  emptyDirs: EmptyDirInfo[];
}

export interface PruneResult {
  deleted: string[];
  errors: Array<{ path: string; error: string }>;
}

export const getPruneCandidates = (): Promise<PruneCandidates> => request<PruneCandidates>("/api/prune");

export const pruneMedia = (paths: string[]): Promise<PruneResult> =>
  request<PruneResult>("/api/prune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paths }),
  });

export interface ConvertOptions {
  quality?: number;
  resize?: boolean;
  maxWidth?: number;
  onProgress?: (event: ConvertStageEvent) => void;
}

export interface ConvertOutcome {
  blob: Blob;
  converted: number;
  errors: number;
}

const concatBytes = (a: Uint8Array, b: Uint8Array): Uint8Array => {
  const out = new Uint8Array(a.length + b.length);
  out.set(a);
  out.set(b, a.length);
  return out;
};

export const convertImages = async (
  files: Array<{ file: File; relPath: string }>,
  opts: ConvertOptions
): Promise<ConvertOutcome> => {
  const fd = new FormData();
  fd.set("quality", String(opts.quality ?? 80));
  fd.set("resize", opts.resize ? "1" : "0");
  fd.set("maxWidth", String(opts.maxWidth ?? 1600));
  for (const { file, relPath } of files) fd.append("files", file, relPath);
  const res = await fetch(opts.onProgress ? "/api/convert?progress=1" : "/api/convert", { method: "POST", body: fd });
  if (!res.ok) {
    let payload: { error?: string } = {};
    try {
      payload = await res.json();
    } catch {
      payload = {};
    }
    throw new ApiError(res.status, payload);
  }
  if (!opts.onProgress || !res.body) {
    return {
      blob: await res.blob(),
      converted: Number(res.headers.get("X-Converted") ?? 0),
      errors: Number(res.headers.get("X-Errors") ?? 0),
    };
  }

  const reader = res.body.getReader();
  let carry: Uint8Array = new Uint8Array(0);
  let inZip = false;
  const zipChunks: BlobPart[] = [];
  let summary: { converted: number; errors: number } | null = null;
  let errorMessage: string | null = null;

  type LineResult =
    | { kind: "stage" }
    | { kind: "zip" }
    | { kind: "error"; message: string }
    | { kind: "summary"; converted: number; errors: number };

  const parseLine = (text: string): LineResult => {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (parsed.stage) {
      opts.onProgress?.(parsed as unknown as ConvertStageEvent);
      return { kind: "stage" };
    }
    if (parsed.zip) return { kind: "zip" };
    if (typeof parsed.error === "string") return { kind: "error", message: parsed.error };
    const s = parsed.summary as Record<string, unknown> | undefined;
    return s
      ? { kind: "summary", converted: Number(s.converted) || 0, errors: Number(s.errors) || 0 }
      : { kind: "stage" };
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (value) {
      if (inZip) {
        zipChunks.push(value as BlobPart);
      } else {
        carry = concatBytes(carry, value);
        for (;;) {
          const nl = carry.indexOf(10);
          if (nl === -1) break;
          const lineText = new TextDecoder().decode(carry.slice(0, nl)).trim();
          const rest = carry.slice(nl + 1);
          carry = rest;
          if (!lineText) continue;
          const line = parseLine(lineText);
          if (line.kind === "zip") {
            inZip = true;
            if (rest.length > 0) zipChunks.push(rest as BlobPart);
            carry = new Uint8Array(0);
            break;
          }
          if (line.kind === "summary") summary = { converted: line.converted, errors: line.errors };
          else if (line.kind === "error") errorMessage = line.message;
        }
      }
    }
    if (done) break;
  }
  if (errorMessage !== null) {
    throw new ApiError(res.status, { error: errorMessage });
  }
  if (summary === null) {
    throw new ApiError(res.status, { error: "Conversion failed" });
  }
  return {
    blob: new Blob(zipChunks, { type: "application/zip" }),
    converted: summary.converted,
    errors: summary.errors,
  };
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
};

export const assetUrl = (path: string): string => `/api/asset?path=${encodeURIComponent(path)}`;
