import { useCallback, useEffect, useRef, useState } from "react";
import { uploadImage } from "../api";
import type { EncodeOptions } from "../api";
import type { ImagesPayload } from "../types";
import { loadMedia, type ImageNotice } from "../lib/mediaCache";
import { runSsePost } from "../lib/sse";
import { useRunConsole } from "../lib/runConsole";

export function useMediaLibrary() {
  const [media, setMedia] = useState<ImagesPayload | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [notice, setNotice] = useState<ImageNotice | null>(null);
  const [lqipRunning, setLqipRunning] = useState(false);
  const runConsole = useRunConsole();
  const [lqipStale, setLqipStale] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    setMedia(await loadMedia(true));
  }, []);

  useEffect(() => {
    loadMedia()
      .then(setMedia)
      .catch((e) => setNotice({ kind: "err", text: String(e) }));
    return () => abortRef.current?.abort();
  }, []);

  const finishLqip = useCallback(() => {
    setLqipRunning(false);
    void refresh();
  }, [refresh]);

  const runLqip = useCallback(() => {
    if (lqipRunning) return;
    runConsole.begin("lqip");
    setLqipRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    void (async () => {
      try {
        await runSsePost(
          "/api/lqip",
          {
            onLog: (line) => {
              for (const l of line.split("\n")) {
                if (l) runConsole.append("lqip", l);
              }
            },
            onDone: (status) => {
              runConsole.finish("lqip", status === "ok" ? "ok" : `exit ${status}`);
              setLqipStale(status !== "ok");
              finishLqip();
            },
          },
          controller.signal
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          runConsole.finish("lqip", "error");
          setNotice({ kind: "err", text: err instanceof Error ? err.message : String(err) });
        }
        setLqipRunning(false);
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    })();
  }, [lqipRunning, finishLqip, runConsole]);

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
          }/`,
        });
        setLqipStale(true);
        return true;
      } catch (err) {
        setNotice({ kind: "err", text: err instanceof Error ? err.message : String(err) });
        return false;
      } finally {
        setUploading(false);
        setProgress(null);
      }
    },
    [refresh]
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
    lqipStale,
    setLqipStale,
    runLqip,
    refresh,
    uploadFiles,
  };
}
