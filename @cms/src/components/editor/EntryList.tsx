import { CopyIcon, TrashIcon } from "@phosphor-icons/react";
import type { Entry } from "../../types";
import { ListPanel } from "../ui/ListPanel";

interface EntryListProps {
  entries: Entry[];
  selectedId: string | null;
  dirtyIds: Set<string>;
  paritySuffix?: (entry: Entry) => string | undefined;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const EntryList = ({
  entries,
  selectedId,
  dirtyIds,
  paritySuffix,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
}: EntryListProps) => (
  <ListPanel
    items={entries}
    getKey={(e) => e.id}
    primary={(e) => e.title}
    secondary={(e) => `${e.slug} · ${e.date}${paritySuffix?.(e) ?? ""}`}
    isDirty={(e) => dirtyIds.has(e.id)}
    selectedKey={selectedId}
    onSelect={onSelect}
    onCreate={onAdd}
    createLabel="Entries"
    emptyText="No entries yet."
    rowActions={(entry) => (
      <>
        <button
          type="button"
          title="Duplicate"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(entry.id);
          }}
          className="rounded p-1 text-zinc-500 hover:text-zinc-200"
        >
          <CopyIcon size={13} />
        </button>
        <button
          type="button"
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          className="rounded p-1 text-zinc-500 hover:text-red-400"
        >
          <TrashIcon size={13} />
        </button>
      </>
    )}
  />
);
