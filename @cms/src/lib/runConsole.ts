import { createContext, useContext } from "react";

export interface RunConsoleEntry {
  source: string;
  text: string;
}

export interface RunStatus {
  running: boolean;
  last: string | null;
}

export interface RunConsoleValue {
  entries: RunConsoleEntry[];
  statuses: Record<string, RunStatus>;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  begin: (source: string) => void;
  append: (source: string, text: string) => void;
  finish: (source: string, status: string) => void;
  clear: () => void;
  anyRunning: boolean;
}

export const RunConsoleContext = createContext<RunConsoleValue | null>(null);

export const useRunConsole = (): RunConsoleValue => {
  const value = useContext(RunConsoleContext);
  if (!value) throw new Error("useRunConsole must be used inside RunConsoleProvider");
  return value;
};
