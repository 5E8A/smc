import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowsCounterClockwiseIcon,
  CircleNotchIcon,
  GitBranchIcon,
  RocketLaunchIcon,
  XIcon,
} from "@phosphor-icons/react";
import { getGitStatus, type GitStatus } from "../api";
import { runSsePost } from "../lib/sse";
import { useRunConsole } from "../lib/runConsole";
import { Button } from "./fields";

const statusLabel: Record<string, string> = {
  "??": "untracked",
  M: "modified",
  A: "added",
  D: "deleted",
  R: "renamed",
  C: "copied",
  U: "updated-unmerged",
};

const statusClass = (x: string): string => {
  if (x === "D") return "bg-red-950 text-red-400";
  if (x === "R" || x === "C") return "bg-cyan-950 text-cyan-400";
  if (x === "A" || x === "??") return "bg-green-950 text-green-400";
  return "bg-amber-950 text-amber-400";
};

const selectAll = (status: GitStatus): Set<string> => new Set(status.changes.map((c) => c.path));

export function GitView() {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const runConsole = useRunConsole();
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await getGitStatus();
      setStatus(next);
      setSelected(selectAll(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    getGitStatus()
      .then((next) => {
        setStatus(next);
        setSelected(selectAll(next));
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
    return () => abortRef.current?.abort();
  }, []);

  const toggle = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleAll = () => {
    if (!status) return;
    setSelected((prev) =>
      prev.size === status.changes.length && status.changes.length > 0 ? new Set() : selectAll(status)
    );
  };

  const deploy = useCallback(async () => {
    if (running || !status) return;
    const paths = [...selected];
    const msg = message.trim();
    if (paths.length === 0 || !msg) return;
    if (!window.confirm(`Commit ${paths.length} file${paths.length === 1 ? "" : "s"} and deploy to main?`)) return;
    setRunning(true);
    setError(null);
    setNotice(null);
    const controller = new AbortController();
    abortRef.current = controller;
    runConsole.begin("deploy");
    try {
      await runSsePost(
        "/api/git/deploy",
        {
          onLog: (line) => runConsole.append("deploy", line),
          onDone: (result) => {
            if (result === "ok") {
              runConsole.finish("deploy", "ok");
              setNotice("Deployed - GitHub Pages is rebuilding the site");
              setMessage("");
            } else if (result === "nothing to commit") {
              runConsole.finish("deploy", "none");
              setNotice("Nothing to commit");
            } else {
              runConsole.finish("deploy", `exit ${result}`);
              setError(`Deploy failed: ${result} - see the runner console`);
            }
          },
        },
        controller.signal,
        { message: msg, paths }
      );
    } catch (err) {
      if (!controller.signal.aborted) {
        runConsole.finish("deploy", "error");
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setRunning(false);
      void refresh();
    }
  }, [running, status, selected, message, refresh, runConsole]);

  const pull = useCallback(async () => {
    if (running || !status || status.behind === 0) return;
    setRunning(true);
    setError(null);
    setNotice(null);
    const controller = new AbortController();
    abortRef.current = controller;
    runConsole.begin("pull");
    try {
      await runSsePost(
        "/api/git/pull",
        {
          onLog: (line) => runConsole.append("pull", line),
          onDone: (result) => {
            if (result === "ok") {
              runConsole.finish("pull", "ok");
              setNotice("Pulled latest changes");
            } else {
              runConsole.finish("pull", `exit ${result}`);
              setError(`Pull failed (${result}) - your branch may have diverged, sync in a terminal`);
            }
          },
        },
        controller.signal
      );
    } catch (err) {
      if (!controller.signal.aborted) {
        runConsole.finish("pull", "error");
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setRunning(false);
      void refresh();
    }
  }, [running, status, refresh, runConsole]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {status && (
          <>
            <span className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-2 py-1 font-mono font-bold text-white">
              <GitBranchIcon size={13} /> {status.branch}
            </span>
            {status.upstream && status.upstream !== status.branch && (
              <span className="font-mono text-zinc-500">↔ {status.upstream}</span>
            )}
            {status.ahead > 0 && (
              <span
                title="unpushed local commits"
                className="rounded bg-green-950 px-1.5 py-0.5 font-mono font-bold text-green-400"
              >
                ↑{status.ahead}
              </span>
            )}
            {status.behind > 0 && (
              <span
                title="remote commits not pulled"
                className="rounded bg-amber-950 px-1.5 py-0.5 font-mono font-bold text-amber-400"
              >
                ↓{status.behind}
              </span>
            )}
            <span className="text-zinc-500">
              {status.changes.length} changed file{status.changes.length === 1 ? "" : "s"}
            </span>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="default" className="px-2 py-1 text-xs" onClick={() => void refresh()} disabled={running}>
            <ArrowsCounterClockwiseIcon size={13} /> Refresh
          </Button>
          <Button
            variant="default"
            className="px-2 py-1 text-xs"
            onClick={() => void pull()}
            disabled={running || !status || status.behind === 0}
          >
            Pull (ff-only)
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-red-900/60 bg-red-950/40 p-3 text-xs text-red-300">
          <span className="font-mono break-all">{error}</span>
          <button
            type="button"
            title="Dismiss"
            onClick={() => setError(null)}
            className="shrink-0 rounded p-0.5 text-red-400 hover:text-red-200"
          >
            <XIcon size={12} />
          </button>
        </div>
      )}
      {notice && !error && <span className="text-xs font-semibold text-green-400">{notice}</span>}

      {status && (
        <>
          <section className="rounded-lg border border-zinc-800 bg-zinc-950/60">
            <header className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-white">
                <input
                  type="checkbox"
                  checked={status.changes.length > 0 && selected.size === status.changes.length}
                  onChange={toggleAll}
                />
                Changes
              </label>
              <span className="text-[11px] text-zinc-500">
                {selected.size} of {status.changes.length} selected
              </span>
            </header>
            {status.changes.length === 0 ? (
              <p className="px-3 py-4 text-center text-[11px] text-zinc-600">
                Working tree is clean - nothing to commit or deploy.
              </p>
            ) : (
              <ul className="p-1">
                {status.changes.map((chg) => {
                  const letter = chg.x === " " ? chg.y : chg.x;
                  return (
                    <li key={chg.path}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-zinc-900">
                        <input type="checkbox" checked={selected.has(chg.path)} onChange={() => toggle(chg.path)} />
                        <span
                          title={statusLabel[letter] ?? letter}
                          className={`w-14 shrink-0 rounded px-1.5 py-0.5 text-center font-mono font-bold text-[10px] ${statusClass(letter)}`}
                        >
                          {letter}
                        </span>
                        <span className="min-w-0 truncate font-mono text-zinc-300">{chg.path}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.nativeEvent.isComposing &&
                  !running &&
                  message.trim() &&
                  selected.size > 0
                ) {
                  void deploy();
                }
              }}
              placeholder="Commit message (e.g. feat(post): add modpack 3.0)"
              className="min-w-64 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-green-600 focus:outline-none"
            />
            <Button
              variant="primary"
              onClick={() => void deploy()}
              disabled={running || selected.size === 0 || !message.trim()}
            >
              {running ? <CircleNotchIcon size={14} className="animate-spin" /> : <RocketLaunchIcon size={14} />}
              Deploy
            </Button>
          </div>
          <p className="text-[11px] text-zinc-600">
            Commits {selected.size} file{selected.size === 1 ? "" : "s"} to {status.branch}, then pushes main
            (production) - GitHub Pages rebuilds automatically. All output in the runner console.
          </p>

          {status.lastCommit && (
            <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="mb-1.5 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Latest commit</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-zinc-500">{status.lastCommit.hash}</span>
                <span className="truncate text-zinc-200">{status.lastCommit.subject}</span>
                <span className="ml-auto text-[10px] text-zinc-600">{status.lastCommit.date}</span>
              </div>
            </section>
          )}
        </>
      )}

      {!status && !error && (
        <div className="flex items-center gap-2 p-2 text-sm text-zinc-400">
          <CircleNotchIcon size={18} className="animate-spin" /> Check git status…
        </div>
      )}
    </div>
  );
}
