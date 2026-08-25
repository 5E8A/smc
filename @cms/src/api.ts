import type { Author, ImagesPayload, Issue, Kind, Lang, ModListColumn, RefUsages } from "./types";

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
}

export const getContent = <T>(kind: Kind, lang: Lang): Promise<T[]> =>
  request<{ data: T[] }>(`/api/content?kind=${kind}&lang=${lang}`).then((r) => r.data);

export const putContent = (kind: Kind, lang: Lang, data: unknown[]): Promise<SaveResult> =>
  request<{ ok: boolean; issues: Issue[] }>(`/api/content?kind=${kind}&lang=${lang}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

export const getAuthors = (): Promise<Author[]> => request<{ data: Author[] }>("/api/authors").then((r) => r.data);

export interface ModListSaveResult extends SaveResult {
  data?: ModListColumn[];
}

export const getModList = (): Promise<ModListColumn[]> =>
  request<{ data: ModListColumn[] }>("/api/mods").then((r) => r.data);

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
}

export interface EncodeOptions {
  quality?: number;
  maxWidth?: number;
}

export const uploadImage = (file: File, dir: string, opts: EncodeOptions = {}): Promise<UploadResult> => {
  const params = new URLSearchParams({ dir, name: file.name });
  if (opts.quality != null) params.set("quality", String(opts.quality));
  if (opts.maxWidth != null) params.set("maxWidth", String(opts.maxWidth));
  return request<UploadResult>(`/api/images?${params}`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: file,
  });
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
  request<DirActionResult>(
    `/api/image?path=${encodeURIComponent(path)}&name=${encodeURIComponent(newName)}`,
    { method: "PATCH" }
  );

export const getRefs = (paths: string[]): Promise<RefUsages> => {
  if (paths.length === 0) return Promise.resolve({});
  return request<{ usages: RefUsages }>(`/api/refs?paths=${encodeURIComponent(paths.join(","))}`).then(
    (r) => r.usages
  );
};

export interface ConvertOptions {
  quality?: number;
  resize?: boolean;
  maxWidth?: number;
}

export interface ConvertOutcome {
  blob: Blob;
  converted: number;
  errors: number;
}

export const convertImages = async (
  files: Array<{ file: File; relPath: string }>,
  opts: ConvertOptions
): Promise<ConvertOutcome> => {
  const fd = new FormData();
  fd.set("quality", String(opts.quality ?? 80));
  fd.set("resize", opts.resize ? "1" : "0");
  fd.set("maxWidth", String(opts.maxWidth ?? 1600));
  for (const { file, relPath } of files) fd.append("files", file, relPath);
  const res = await fetch("/api/convert", { method: "POST", body: fd });
  if (!res.ok) {
    let payload: { error?: string } = {};
    try {
      payload = await res.json();
    } catch {
      payload = {};
    }
    throw new ApiError(res.status, payload);
  }
  return {
    blob: await res.blob(),
    converted: Number(res.headers.get("X-Converted") ?? 0),
    errors: Number(res.headers.get("X-Errors") ?? 0),
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
