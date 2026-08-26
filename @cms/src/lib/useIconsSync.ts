import { useCallback, useRef } from "react";
import { useRunConsole } from "./runConsole";

/**
 * Runs the server-side icon-map sync (`POST /api/icons/sync`) and streams its
 * output into the runner console under the "icons" source. Concurrent calls are
 * serialized: overlapping requests coalesce into one follow-up run.
 */
export function useIconsSync(): () => void {
  const { start } = useRunConsole();
  const runningRef = useRef(false);
  const pendingRef = useRef(false);

  return useCallback((): void => {
    if (runningRef.current) {
      pendingRef.current = true;
      return;
    }
    runningRef.current = true;
    void (async () => {
      for (;;) {
        pendingRef.current = false;
        await start("icons", "/api/icons/sync");
        if (!pendingRef.current) break;
      }
      runningRef.current = false;
    })();
  }, [start]);
}
