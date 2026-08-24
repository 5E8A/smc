import type { ReactNode } from "react";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "./fields";

export interface ListPanelProps<T> {
  items: T[];
  getKey: (item: T) => string;
  primary: (item: T) => string;
  secondary?: (item: T) => string | undefined;
  isDirty?: (item: T) => boolean;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onCreate: () => void;
  createLabel: string;
  emptyText?: string;
  rowActions?: (item: T) => ReactNode;
}

export function ListPanel<T>({
  items,
  getKey,
  primary,
  secondary,
  isDirty,
  selectedKey,
  onSelect,
  onCreate,
  createLabel,
  emptyText = "Nothing here yet.",
  rowActions,
}: ListPanelProps<T>) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          {createLabel} ({items.length})
        </span>
        <Button variant="ghost" className="px-2 py-1" onClick={onCreate} title={`New ${createLabel}`}>
          <PlusIcon size={15} />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {items.length === 0 && <p className="px-2 py-4 text-xs text-zinc-600">{emptyText}</p>}
        {items.map((item) => {
          const key = getKey(item);
          const selected = key === selectedKey;
          return (
            <div
              key={key}
              onClick={() => onSelect(key)}
              className={`group mb-1 cursor-pointer rounded-lg border px-2.5 py-2 transition-colors ${
                selected ? "border-green-600/60 bg-green-950/30" : "border-transparent hover:bg-zinc-900"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`size-1.5 shrink-0 rounded-full ${isDirty?.(item) ? "bg-amber-400" : "bg-transparent"}`}
                />
                <span
                  className={`min-w-0 flex-1 truncate text-sm font-medium ${selected ? "text-white" : "text-zinc-300"}`}
                >
                  {primary(item) || "(untitled)"}
                </span>
                {rowActions && (
                  <span className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                    {rowActions(item)}
                  </span>
                )}
              </div>
              {secondary && (
                <div className="mt-0.5 pl-3">
                  <span className="truncate font-mono text-[10px] text-zinc-500">{secondary(item)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
