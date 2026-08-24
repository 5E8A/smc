import { useCallback, useEffect, useRef, useState } from "react";
import { assetUrl, getMedia, uploadImage } from "../api";
import type { ImageInfo, ImagesPayload } from "../types";
import type { EncodeOptions } from "../api";

let cache: ImagesPayload | null = null;
let cachePromise: Promise<ImagesPayload> | null = null;

export const loadMedia = (force = false): Promise<ImagesPayload> => {
  if (!force && cache) return Promise.resolve(cache);
  if (!cachePromise || force) {
    cachePromise = getMedia().then((payload) => {
      cache = payload;
      return payload;
    });
  }
  return cachePromise;
};

export const invalidateMediaCache = (): void => {
  cache = null;
  cachePromise = null;
};

export interface ImageNotice {
  kind: "ok" | "err";
  text: string;
}

export function useMediaLibrary() {
  const [media, setMedia] = useState<ImagesPayload | null>(cache);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [notice, setNotice] = useState<ImageNotice | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [lqipRunning, setLqipRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    setMedia(await loadMedia(true));
  }, []);

  useEffect(() => {
    if (!cache) {
      loadMedia()
        .then(setMedia)
        .catch((e) => setNotice({ kind: "err", text: String(e) }));
    }
    return () => abortRef.current?.abort();
  }, []);

  const finishLqip = useCallback(() => {
    setLqipRunning(false);
    void refresh();
  }, [refresh]);

  const runLqip = useCallback(() => {
    if (lqipRunning) return;
    setLogLines([]);
    setLqipRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    void (async () => {
      try {
        const res = await fetch("/api/lqip", { method: "POST", signal: controller.signal });
        if (!res.ok || !res.body) throw new Error(`blurhash generation failed (${res.status})`);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let sep: number;
          while ((sep = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, sep);
            buffer = buffer.slice(sep + 2);
            let event = "message";
            const dataLines: string[] = [];
            for (const line of frame.split("\n")) {
              if (line.startsWith("event:")) event = line.slice(6).trim();
              else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
            }
            if (event === "log") setLogLines((prev) => [...prev, JSON.parse(dataLines.join("\n"))]);
            if (event === "done") {
              void reader.cancel().catch(() => {});
              finishLqip();
              return;
            }
          }
        }
        finishLqip();
      } catch (err) {
        setLqipRunning(false);
        if (!controller.signal.aborted) {
          setNotice({ kind: "err", text: err instanceof Error ? err.message : String(err) });
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    })();
  }, [lqipRunning, finishLqip]);

  const clearLog = useCallback(() => setLogLines([]), []);

  const uploadFiles = useCallback(
    async (files: File[], dir: string, encode?: EncodeOptions): Promise<boolean> => {
      if (files.length === 0) return false;
      setUploading(true);
      setNotice(null);
      let done = 0;
      try {
        for (const file of files) {
          setProgress(`${done + 1}/${files.length} ${file.name}`);
          await uploadImage(file, dir, encode);
          done += 1;
        }
        await refresh();
        setNotice({
          kind: "ok",
          text: `Converted ${files.length} file${files.length > 1 ? "s" : ""} to public/assets/content${
            dir ? `/${dir}` : ""
          }/ — regenerating blurhash…`,
        });
        runLqip();
        return true;
      } catch (err) {
        setNotice({ kind: "err", text: err instanceof Error ? err.message : String(err) });
        return false;
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [refresh, runLqip]
  );

  return {
    media,
    images: media?.images ?? null,
    dirs: media?.dirs ?? [],
    uploading,
    progress,
    notice,
    setNotice,
    lqipRunning,
    logLines,
    runLqip,
    clearLog,
    refresh,
    uploadFiles,
  };
}

export function AssetThumb({ path }: { path: string }) {
  if (!path) return <span className="inline-block h-9 w-14 shrink-0 rounded border border-dashed border-zinc-700" />;
  return <img src={assetUrl(path)} alt="" className="h-9 w-14 shrink-0 rounded border border-zinc-700 object-cover" />;
}

export type { ImageInfo };
