import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CaretRightIcon, CircleNotchIcon, FolderIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { getPruneCandidates, pruneMedia, ApiError, type PruneCandidates, type PruneResult } from "../../api";
import { Button } from "../ui/fields";
import { Banner } from "../ui/Banner";

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ModalShell = ({ title, onClose, children }: ModalShellProps) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
    <div
      className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-200">
          <XIcon size={15} />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">{children}</div>
    </div>
  </div>
);

type PruneItem =
  | { kind: "file"; path: string; name: string; dir: string; size?: number }
  | { kind: "dir"; path: string; currentlyEmpty: boolean; fileCount: number };

const dirPath = (d: string): string => d + "/";

interface TreeNode {
  name: string;
  rel: string;
  item?: PruneItem;
  children: TreeNode[];
}

function collectPaths(node: TreeNode): string[] {
  const paths: string[] = [];
  if (node.item) paths.push(node.item.kind === "dir" ? dirPath(node.item.path) : node.item.path);
  for (const child of node.children) paths.push(...collectPaths(child));
  return paths;
}

function buildPruneTree(items: PruneItem[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const dirNodes = new Map<string, TreeNode>();

  const getOrCreateDir = (rel: string): TreeNode => {
    const existing = dirNodes.get(rel);
    if (existing) return existing;
    const segs = rel.split("/");
    const name = segs[segs.length - 1] ?? rel;
    const node: TreeNode = { name, rel, children: [] };
    dirNodes.set(rel, node);
    const parentRel = segs.length > 1 ? segs.slice(0, -1).join("/") : "";
    if (parentRel) {
      getOrCreateDir(parentRel).children.push(node);
    } else {
      roots.push(node);
    }
    return node;
  };

  for (const item of items) {
    if (item.kind === "dir") {
      const node = getOrCreateDir(item.path);
      node.item = item;
    }
  }

  for (const item of items) {
    if (item.kind === "file") {
      if (item.dir) {
        getOrCreateDir(item.dir).children.push({ name: item.name, rel: item.path, item, children: [] });
      } else {
        roots.push({ name: item.name, rel: item.path, item, children: [] });
      }
    }
  }

  const sortNode = (nodes: TreeNode[]): void => {
    nodes.sort((a, b) => {
      const aDir = a.item?.kind === "dir" ? 1 : 0;
      const bDir = b.item?.kind === "dir" ? 1 : 0;
      if (aDir !== bDir) return aDir - bDir;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => sortNode(n.children));
  };
  sortNode(roots);

  return roots;
}

export const PruneMediaDialog = ({ onClose, onDone }: { onClose: () => void; onDone: () => void }) => {
  const [candidates, setCandidates] = useState<PruneCandidates | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState<PruneResult | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: PruneItem } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const items: PruneItem[] = useMemo(
    () =>
      candidates
        ? [
            ...candidates.unused.map((img) => ({
              kind: "file" as const,
              path: img.path,
              name: img.name,
              dir: img.dir,
              size: img.size,
            })),
            ...candidates.emptyDirs.map((d) => ({
              kind: "dir" as const,
              path: d.path,
              currentlyEmpty: d.currentlyEmpty,
              fileCount: d.fileCount,
            })),
          ]
        : [],
    [candidates]
  );

  const tree = useMemo(() => buildPruneTree(items), [items]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getPruneCandidates();
        if (cancelled) return;
        setCandidates(data);
        setSelected(new Set([...data.unused.map((u) => u.path), ...data.emptyDirs.map((d) => dirPath(d.path))]));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setScanning(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSelectable = items.length;
  const allSelected =
    totalSelectable > 0 && items.every((i) => selected.has(i.kind === "dir" ? dirPath(i.path) : i.path));

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => (i.kind === "dir" ? dirPath(i.path) : i.path))));
    }
  }, [allSelected, items]);

  const toggle = useCallback((path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const toggleNode = useCallback((node: TreeNode) => {
    setSelected((prev) => {
      const paths = collectPaths(node);
      if (paths.length === 0) return prev;
      const allSelected = paths.every((p) => prev.has(p));
      const next = new Set(prev);
      for (const p of paths) {
        if (allSelected) next.delete(p);
        else next.add(p);
      }
      return next;
    });
  }, []);

  const toggleCollapse = useCallback((rel: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(rel)) next.delete(rel);
      else next.add(rel);
      return next;
    });
  }, []);

  const applyResult = useCallback(
    (res: PruneResult) => {
      setResult(res);
      if (candidates) {
        const deletedSet = new Set(res.deleted);
        setCandidates({
          unused: candidates.unused.filter((u) => !deletedSet.has(u.path)),
          emptyDirs: candidates.emptyDirs.filter((d) => !deletedSet.has(dirPath(d.path))),
        });
        setSelected((prev) => {
          const next = new Set(prev);
          for (const p of res.deleted) next.delete(p);
          return next;
        });
      }
    },
    [candidates]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    setError(null);
    try {
      const paths = Array.from(selected);
      const res = await pruneMedia(paths);
      applyResult(res);
      if (res.deleted.length > 0) onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }, [selected, applyResult, onDone]);

  const handleSingleDelete = useCallback(
    async (item: PruneItem) => {
      setContextMenu(null);
      setError(null);
      const paths = item.kind === "dir" ? [dirPath(item.path)] : [item.path];
      try {
        const res = await pruneMedia(paths);
        applyResult(res);
        if (res.deleted.length > 0) onDone();
        if (res.errors.length > 0) {
          setError(`${res.errors[0].path}: ${res.errors[0].error}`);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : String(err));
      }
    },
    [applyResult, onDone]
  );

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  const renderNode = (node: TreeNode, depth: number): ReactNode => {
    const isDir = node.item?.kind === "dir" || node.children.length > 0;
    const selectable = node.item;
    const key =
      selectable?.kind === "dir" ? dirPath(selectable.path) : (selectable?.path ?? `__structural__${node.rel}`);
    const isChecked = selectable
      ? selected.has(selectable.kind === "dir" ? dirPath(selectable.path) : selectable.path)
      : false;
    const isCollapsed = collapsed.has(node.rel);
    const hasChildren = node.children.length > 0;

    return (
      <div key={key}>
        <div
          className={`flex items-center gap-2 py-1.5 text-xs ${
            isChecked ? "bg-zinc-900" : ""
          } cursor-default hover:bg-zinc-800/50`}
          style={{ paddingLeft: depth * 16 + 12, paddingRight: 12 }}
          onContextMenu={
            selectable
              ? (e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, item: selectable });
                }
              : undefined
          }
        >
          {isDir ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleCollapse(node.rel);
              }}
              className={`flex h-4 w-4 shrink-0 items-center justify-center text-zinc-600 ${
                hasChildren ? "hover:text-zinc-300" : "cursor-default"
              }`}
            >
              {hasChildren && (
                <CaretRightIcon size={10} className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`} />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}
          {selectable && (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => (selectable.kind === "dir" ? toggleNode(node) : toggle(key))}
              className="shrink-0 accent-green-500"
            />
          )}
          {isDir && <FolderIcon size={13} className="shrink-0 text-amber-400" />}
          <span className="truncate font-medium text-zinc-200">{node.name}</span>
          {selectable?.kind === "dir" && (
            <span className="truncate text-zinc-500">
              {selectable.currentlyEmpty ? "empty" : `${selectable.fileCount} files, all unused`}
            </span>
          )}
          {selectable?.kind === "file" && selectable.size != null && (
            <span className="ml-auto shrink-0 text-zinc-500">{formatBytes(selectable.size)}</span>
          )}
        </div>
        {isDir && !isCollapsed && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <ModalShell title="Prune Media" onClose={onClose}>
      {scanning ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400">
          <CircleNotchIcon size={18} className="animate-spin" />
          Scanning media and content…
        </div>
      ) : error && !candidates ? (
        <Banner variant="error">{error}</Banner>
      ) : totalSelectable === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No unused media or empty directories found.</p>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              {selected.size} of {totalSelectable} selected
            </span>
            <button type="button" onClick={toggleAll} className="text-green-500 hover:text-green-400">
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="max-h-[32rem] overflow-y-auto rounded-lg border border-zinc-800">
            {tree.map((node) => renderNode(node, 0))}
          </div>

          {error && (
            <Banner variant="error" dismissable onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}

          {result && !error && (
            <Banner
              variant={result.errors.length > 0 ? "warn" : "success"}
              dismissable
              onDismiss={() => setResult(null)}
            >
              {result.deleted.length > 0 && `Deleted ${result.deleted.length} item(s)`}
              {result.errors.length > 0 && ` - ${result.errors.length} failed`}
            </Banner>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleBulkDelete()} disabled={deleting || selected.size === 0}>
              {deleting ? (
                <>
                  <CircleNotchIcon size={14} className="animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <TrashIcon size={14} /> Delete {selected.size} item{selected.size === 1 ? "" : "s"}
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {contextMenu &&
        createPortal(
          <div
            className="fixed z-[80] min-w-32 rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-950/60 hover:text-red-300"
              onClick={() => void handleSingleDelete(contextMenu.item)}
            >
              <TrashIcon size={13} /> Delete
            </button>
          </div>,
          document.body
        )}
    </ModalShell>
  );
};
