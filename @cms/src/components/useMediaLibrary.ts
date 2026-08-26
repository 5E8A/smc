import { useCallback, useEffect, useRef, useState } from "react";
import { uploadImage } from "../api";
import type { EncodeOptions } from "../api";
import type { ImagesPayload } from "../types";
import { loadMedia, invalidateMediaCache, type ImageNotice } from "../lib/mediaCache";
import { useRunConsole } from "../lib/runConsole";

export function useMediaLibrary() {
  const [media, setMedia] = useState<ImagesPayload | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [notice, setNotice] = useState<ImageNotice | null>(null);
  const runConsole = useRunConsole();
  const [lqipStale, setLqipStale] = useState(false);

  const refresh = useCallback(async () => {
    setMedia(await loadMedia(true));
  }, []);

  useEffect(() => {
    loadMedia()
      .then(setMedia)
      .catch((e) => setNotice({ kind: "err", text: String(e) }));
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
      onError: (err) => setNotice({ kind: "err", text: err instanceof Error ? err.message : String(err) }),
    });
  }, [runConsole]);

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
