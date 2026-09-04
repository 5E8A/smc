import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { runSsePost } from "../lib/sse";
import {
  RunConsoleContext,
  defaultMapDone,
  type RunConsoleEntry,
  type RunConsoleValue,
  type RunStatus,
  type RunTaskOptions,
} from "../lib/runConsole";

const SOURCE_BATCH = 40;

export const RunConsoleProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<RunConsoleEntry[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RunStatus>>({});
  const [collapsed, setCollapsed] = useState(true);
  const batches = useRef(new Map<string, RunConsoleEntry[]>());
  const controllers = useRef(new Map<string, AbortController>());

  const flush = useCallback(() => {
    for (const batch of batches.current.values()) {
      if (batch.length === 0) continue;
      setEntries((prev) => [...prev, ...batch]);
    }
    batches.current.clear();
  }, []);

  const begin = useCallback((source: string) => {
    batches.current.delete(source);
    setEntries((prev) => prev.filter((e) => e.source !== source));
    setStatuses((prev) => ({ ...prev, [source]: { running: true, last: null } }));
    setCollapsed(false);
  }, []);

  const append = useCallback(
    (source: string, text: string) => {
      const batch = batches.current.get(source);
      if (batch) batch.push({ source, text });
      else batches.current.set(source, [{ source, text }]);
      if (batches.current.get(source)!.length >= SOURCE_BATCH) flush();
    },
    [flush]
  );

  const finish = useCallback(
    (source: string, status: string) => {
      flush();
      setStatuses((prev) => ({ ...prev, [source]: { running: false, last: status } }));
    },
    [flush]
  );

  const clear = useCallback(() => {
    batches.current.clear();
    setEntries([]);
    setStatuses({});
  }, []);

  const anyRunning = useMemo(() => Object.values(statuses).some((s) => s.running), [statuses]);

  const start = useCallback(
    (source: string, url: string, opts?: RunTaskOptions): Promise<boolean> => {
      if (controllers.current.has(source)) return Promise.resolve(false);
      const controller = new AbortController();
      controllers.current.set(source, controller);
      begin(source);
      const mapDone = opts?.mapDone ?? defaultMapDone;
      return runSsePost(
        url,
        {
          onLog: (line) => {
            for (const l of line.split("\n")) {
              if (l) append(source, l);
            }
          },
          onDone: (status) => {
            finish(source, mapDone(status));
            opts?.onDone?.(status);
          },
        },
        controller.signal,
        opts?.body
      )
        .catch((err: unknown) => {
          if (controller.signal.aborted) finish(source, "cancelled");
          else {
            finish(source, "error");
            opts?.onError?.(err);
          }
        })
        .finally(() => {
          if (controllers.current.get(source) === controller) controllers.current.delete(source);
          opts?.onSettled?.();
        })
        .then(() => true);
    },
    [begin, append, finish]
  );

  const value = useMemo<RunConsoleValue>(
    () => ({ entries, statuses, collapsed, setCollapsed, begin, append, finish, clear, anyRunning, start }),
    [entries, statuses, collapsed, begin, append, finish, clear, anyRunning, start]
  );

  return <RunConsoleContext.Provider value={value}>{children}</RunConsoleContext.Provider>;
};
