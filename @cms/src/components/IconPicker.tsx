import { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { ICON_CATALOG } from "@smc/shared/icon-catalog";
import { searchIcons } from "@smc/shared/icon-search";
import { ICON_COMPONENTS } from "./icon-map.generated";
import { Button } from "./fields";

const MAX_RESULTS = 48;
const recents: string[] = [];

const pushRecent = (name: string): void => {
  const index = recents.indexOf(name);
  if (index >= 0) recents.splice(index, 1);
  recents.unshift(name);
  if (recents.length > 12) recents.length = 12;
};

interface IconPickerProps {
  onPick: (name: string) => void;
  onClose: () => void;
}

export const IconPicker = ({ onPick, onClose }: IconPickerProps) => {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const queryTrimmed = query.trim();
  const results = useMemo(
    () => (queryTrimmed ? searchIcons(ICON_CATALOG, queryTrimmed, MAX_RESULTS) : []),
    [queryTrimmed]
  );
  const defaults = useMemo(() => ICON_CATALOG.slice(0, MAX_RESULTS), []);
  const list = queryTrimmed ? results : defaults;
  const activeIndex = Math.min(active, Math.max(0, list.length - 1));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = gridRef.current?.children[activeIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const pick = (name: string): void => {
    if (!name) return;
    pushRecent(name);
    onPick(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="flex max-h-[560px] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-bold text-white">
            Insert icon{" "}
            <span className="ml-1 font-mono text-[10px] font-normal text-zinc-600">
              {ICON_CATALOG.length} Phosphor icons
            </span>
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <XIcon size={16} />
          </Button>
        </div>

        <div className="border-b border-zinc-800 px-4 py-2.5">
          <div className="relative">
            <MagnifyingGlassIcon size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, list.length - 1));
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  pick(list[activeIndex]?.name ?? "");
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  onClose();
                }
              }}
              placeholder={`Search ${ICON_CATALOG.length} icons by name, tag or category…`}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-1.5 pr-2 pl-7 text-sm outline-none focus:border-green-500"
            />
          </div>
        </div>

        {!queryTrimmed && recents.length > 0 && (
          <div className="flex items-center gap-1 border-b border-zinc-800 px-4 py-2">
            <span className="mr-1 text-[10px] tracking-wider text-zinc-500 uppercase">Recent</span>
            {recents.map((name) => {
              const Comp = ICON_COMPONENTS[name];
              if (!Comp) return null;
              return (
                <button
                  key={name}
                  type="button"
                  title={`:${name}:`}
                  onClick={() => pick(name)}
                  className="rounded-md p-1.5 text-green-400 hover:bg-zinc-800 hover:text-white"
                >
                  <Comp className="size-5" />
                </button>
              );
            })}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {list.length === 0 ? (
            <p className="text-sm text-zinc-500">No icons match &quot;{queryTrimmed}&quot;.</p>
          ) : (
            <div ref={gridRef} className="grid grid-cols-8 gap-1">
              {list.map((entry, i) => {
                const Comp = ICON_COMPONENTS[entry.name];
                if (!Comp) return null;
                return (
                  <button
                    key={entry.name}
                    type="button"
                    title={`:${entry.name}:`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(entry.name)}
                    className={`flex items-center justify-center rounded-md p-2 text-zinc-300 ${
                      i === activeIndex ? "bg-green-600/20 text-green-300 ring-1 ring-green-500" : "hover:bg-zinc-800"
                    }`}
                  >
                    <Comp className="size-[22px]" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {list[activeIndex] && (
          <div className="flex items-center gap-3 border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-500">
            {(() => {
              const Comp = ICON_COMPONENTS[list[activeIndex].name];
              return Comp ? <Comp className="size-7 shrink-0 text-green-400" /> : null;
            })()}
            <code className="font-mono text-green-300">:{list[activeIndex].name}:</code>
            <span className="ml-auto">↑↓ navigate · Enter insert · Esc close</span>
          </div>
        )}
      </div>
    </div>
  );
};
