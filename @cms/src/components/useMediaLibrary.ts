import { useCallback, useEffect, useRef, useState } from "react";
import { uploadImage } from "../api";
import type { EncodeOptions } from "../api";
import type { ImagesPayload } from "../types";
import { loadMedia, invalidateMediaCache, type ImageNotice } from "../lib/mediaCache";
import { useRunConsole } from "../lib/runConsole";

export interface UploadJob {
  id: number;
  name: string;
  status: "queued" | "uploading" | "success" | "error";
  stage: string;
  pct: number | null;
  speed: string | null;
  error?: string;
  animated?: boolean;
  frames?: number;
}

const MAX_PARALLEL_UPLOADS = 3;
const SUCCESS_BANNER_MS = 5000;

const errorMessage = (err: unknown): string => {
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return "Network error - is the CMS server running?";
  }
  return err instanceof Error ? err.message : String(err);
};

export function useMediaLibrary() {
  const [media, setMedia] = useState<ImagesPayload | null>(null);
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<ImageNotice | null>(null);
  const runConsole = useRunConsole();
  const [lqipStale, setLqipStale] = useState(false);
  const nextJobId = useRef(1);
  const activeBatches = useRef(0);

  const refresh = useCallback(async () => {
    setMedia(await loadMedia(true));
  }, []);

  useEffect(() => {
    loadMedia()
      .then(setMedia)
      .catch((e) => setNotice({ kind: "error", text: String(e) }));
  }, []);

  const lqipRunning = !!runConsole.statuses.lqip?.running;
  const prevLqipRunning = useRef(false);
  useEffect(() => {
    const last = runConsole.statuses.lqip?.last;
    if (prevLqipRunning.current && !lqipRunning && last) {
      setLqipStale(last !== "ok");
      void refresh();
    }
    prevLqipRunning.current = lqipRunning;
  }, [lqipRunning, runConsole.statuses, refresh]);

  const runLqip = useCallback(() => {
    void runConsole.start("lqip", "/api/lqip", {
      onDone: () => invalidateMediaCache(),
      onError: (err) => setNotice({ kind: "error", text: err instanceof Error ? err.message : String(err) }),
    });
  }, [runConsole]);

  const patchJob = useCallback((id: number, patch: Partial<UploadJob>) => {
    setUploads((prev) => prev.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }, []);

  const dismissUpload = useCallback((id: number) => {
    setUploads((prev) => prev.filter((job) => job.id !== id));
  }, []);

  const uploadFiles = useCallback(
    async (files: File[], dir: string, encode?: EncodeOptions): Promise<void> => {
      if (files.length === 0) return;
      const jobs: UploadJob[] = files.map((file) => ({
        id: nextJobId.current++,
        name: file.name,
        status: "queued",
        stage: "queued",
        pct: null,
        speed: null,
      }));
      setUploads((prev) => [...prev, ...jobs]);
      activeBatches.current += 1;
      setUploading(true);

      let cursor = 0;
      const outcomes: Array<{ ok: boolean; animated: boolean }> = [];
      const worker = async (): Promise<void> => {
        while (cursor < files.length) {
          const index = cursor++;
          const job = jobs[index];
          patchJob(job.id, { status: "uploading", stage: "sending", pct: null, speed: null });
          try {
            const result = await uploadImage(files[index], dir, {
              ...encode,
              onProgress: (event) =>
                patchJob(job.id, {
                  stage: event.stage,
                  pct: event.pct ?? null,
                  speed: event.speed ?? null,
                }),
            });
            patchJob(job.id, {
              status: "success",
              stage: "done",
              pct: 100,
              speed: null,
              animated: result.animated,
              frames: result.frames,
            });
            outcomes.push({ ok: true, animated: !!result.animated });
            window.setTimeout(() => dismissUpload(job.id), SUCCESS_BANNER_MS);
          } catch (err) {
            patchJob(job.id, {
              status: "error",
              stage: "failed",
              pct: null,
              speed: null,
              error: errorMessage(err),
            });
            outcomes.push({ ok: false, animated: false });
          }
        }
      };

      try {
        await Promise.all(
          Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, files.length) }, () => worker())
        );
        await refresh();
        setLqipStale(true);
        const succeeded = outcomes.filter((o) => o.ok).length;
        const failed = files.length - succeeded;
        const animatedCount = outcomes.filter((o) => o.ok && o.animated).length;
        if (failed === 0) {
          setNotice({
            kind: "success",
            text: `Uploaded ${files.length} file${files.length > 1 ? "s" : ""} to public/assets/content${
              dir ? `/${dir}` : ""
            }${animatedCount > 0 ? ` - ${animatedCount} animated` : ""}`,
          });
        } else if (succeeded > 0) {
          setNotice({
            kind: "warn",
            text: `Uploaded ${succeeded}/${files.length} files - ${failed} failed, see the banner${
              failed > 1 ? "s" : ""
            } above`,
          });
        } else {
          setNotice({ kind: "error", text: `All ${files.length} upload(s) failed - see the banners above` });
        }
      } finally {
        activeBatches.current -= 1;
        if (activeBatches.current <= 0) {
          activeBatches.current = 0;
          setUploading(false);
        }
      }
    },
    [refresh, patchJob, dismissUpload]
  );

  return {
    media,
    images: media?.images ?? null,
    dirs: media?.dirs ?? [],
    uploading,
    uploads,
    dismissUpload,
    notice,
    setNotice,
    lqipRunning,
    lqipStale,
    setLqipStale,
    runLqip,
    refresh,
    uploadFiles,
  };
}
