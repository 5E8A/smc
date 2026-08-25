import { useCallback, useRef } from "react";
import { runSsePost } from "./sse";
import { useRunConsole } from "./runConsole";

/**
 * Runs the server-side icon-map sync (`POST /api/icons/sync`) and streams its
 * output into the runner console under the "icons" source. Concurrent calls are
 * serialized: overlapping requests coalesce into one follow-up run.
 */
export function useIconsSync(): () => void {
  const runConsole = useRunConsole();
  const runningRef = useRef(false);
  const pendingRef = useRef(false);

  return useCallback((): void => {
    if (runningRef.current) {
      pendingRef.current = true;
      return;
    }
    runningRef.current = true;
    runConsole.begin("icons");
    void (async () => {
      for (;;) {
        pendingRef.current = false;
        try {
          await runSsePost("/api/icons/sync", {
            onLog: (line) => {
              for (const l of line.split("\n")) {
                if (l) runConsole.append("icons", l);
              }
            },
            onDone: (status) =>
              runConsole.finish("icons", status === "ok" ? "ok" : status === "error" ? "error" : `exit ${status}`),
          });
        } catch {
          runConsole.finish("icons", "error");
        }
        if (!pendingRef.current) break;
      }
      runningRef.current = false;
    })();
  }, [runConsole]);
}
