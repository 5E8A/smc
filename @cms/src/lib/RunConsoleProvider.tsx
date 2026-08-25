import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { RunConsoleContext, type RunConsoleEntry, type RunConsoleValue, type RunStatus } from "./runConsole";

const SOURCE_BATCH = 40;

export const RunConsoleProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<RunConsoleEntry[]>([]);
  const [statuses, setStatuses] = useState<Record<string, RunStatus>>({});
  const [collapsed, setCollapsed] = useState(true);
  const batches = useRef(new Map<string, RunConsoleEntry[]>());

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

  const value = useMemo<RunConsoleValue>(
    () => ({ entries, statuses, collapsed, setCollapsed, begin, append, finish, clear, anyRunning }),
    [entries, statuses, collapsed, begin, append, finish, clear, anyRunning]
  );

  return <RunConsoleContext.Provider value={value}>{children}</RunConsoleContext.Provider>;
};
