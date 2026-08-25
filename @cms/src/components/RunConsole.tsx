import { useEffect, useRef } from "react";
import { CaretDownIcon, CaretUpIcon, CircleNotchIcon, TrashIcon, TerminalIcon } from "@phosphor-icons/react";
import { useRunConsole } from "../lib/runConsole";

const TERMINAL_STYLE = "text-[11px] leading-relaxed whitespace-pre-wrap break-words font-mono";

const lineClass = (text: string): string => {
  const t = text.trim();
  if (/^(✗|❌)/u.test(t)) return "text-red-400";
  if (t.includes("⚠") || /^(warn|error|failed|failed to)/iu.test(t)) return "text-amber-400";
  return "text-zinc-400";
};

export const RunConsole = () => {
  const { entries, statuses, collapsed, setCollapsed, clear, anyRunning } = useRunConsole();
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const stickBottom = useRef(true);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (stickBottom.current) el.scrollTop = el.scrollHeight;
  }, [entries, collapsed]);

  const onScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    stickBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  };

  const sources = Object.keys(statuses).sort();

  return (
    <section className="flex shrink-0 flex-col border-t border-zinc-800 bg-zinc-950">
      <header className="flex min-h-8 shrink-0 items-center gap-2 px-3 py-1.5">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand runner console" : "Collapse runner console"}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <TerminalIcon size={14} className="shrink-0 text-zinc-500" />
          <span className="shrink-0 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">Runner console</span>
          {anyRunning ? (
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-green-400">
              <CircleNotchIcon size={12} className="animate-spin" />{" "}
              {sources.filter((s) => statuses[s]?.running).join(", ")} running
            </span>
          ) : (
            sources.length > 0 && (
              <span className="hidden shrink-0 items-center gap-1 text-[10px] sm:flex">
                {sources.map((source) => (
                  <span
                    key={source}
                    className={`rounded px-1.5 py-0.5 font-bold ${
                      statuses[source]?.last === "ok"
                        ? "bg-green-950 text-green-400"
                        : statuses[source]?.last && statuses[source]?.last !== "ok"
                          ? "bg-red-950 text-red-400"
                          : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {source} · {statuses[source]?.last ?? "idle"}
                  </span>
                ))}
              </span>
            )
          )}
          <span className="ml-auto shrink-0 text-[10px] text-zinc-600">
            {collapsed && entries.length > 0 ? `${entries.length} line${entries.length === 1 ? "" : "s"}` : ""}
          </span>
        </button>
        <button
          type="button"
          title="Clear console"
          disabled={entries.length === 0 && !anyRunning}
          onClick={clear}
          className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-40"
        >
          <TrashIcon size={13} />
        </button>
        <button
          type="button"
          title={collapsed ? "Expand runner console" : "Collapse runner console"}
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200"
        >
          {collapsed ? <CaretUpIcon size={13} /> : <CaretDownIcon size={13} />}
        </button>
      </header>

      {!collapsed && (
        <div className="border-t border-zinc-900">
          {entries.length === 0 ? (
            <div className="px-6 py-4 text-center text-[11px] text-zinc-600">
              {anyRunning ? "waiting for output…" : "No runs yet - triggered from Sync sprites / Regenerate blurhash."}
            </div>
          ) : (
            <div
              ref={bodyRef}
              onScroll={onScroll}
              className="max-h-56 overflow-y-auto px-3 py-2 scrollbar-gutter-stable"
            >
              {entries.map(({ source, text }, i) => (
                <div key={i} className={`${TERMINAL_STYLE} ${lineClass(text)}`}>
                  <span className="font-bold text-zinc-600 select-none">{source}</span>
                  <span className="text-zinc-700 select-none"> | </span>
                  {text}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
