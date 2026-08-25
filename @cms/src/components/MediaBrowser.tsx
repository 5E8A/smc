import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  CaretRightIcon,
  CircleNotchIcon,
  CopyIcon,
  FolderIcon,
  FolderPlusIcon,
  HashIcon,
  ImagesIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { createDir, deleteDir, deleteImage, getRefs, renameDir, renameImage, ApiError } from "../api";
import type { ImageInfo, RefUsages } from "../types";
import { buildDirTree, dirLabel, type DirNode } from "../lib/mediaTree";
import { useMediaLibrary } from "./useMediaLibrary";
import { Button } from "./fields";

const VALID_UPLOAD_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

const isUploadable = (f: File): boolean => {
  const dot = f.name.lastIndexOf(".");
  return dot >= 0 && VALID_UPLOAD_EXTS.includes(f.name.slice(dot).toLowerCase());
};

interface PendingFile {
  file: File;
  url: string;
}

type FolderPrompt = { mode: "create"; parent: string } | { mode: "rename"; dir: string };

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

const ModalShell = ({ title, onClose, children, wide = false }: ModalShellProps) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
    <div
      className={`flex max-h-full w-full ${wide ? "max-w-2xl" : "max-w-md"} flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl`}
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

const iconBtn =
  "rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200 disabled:pointer-events-none disabled:opacity-40";

const numberInputCls =
  "w-14 rounded bg-zinc-900 px-1 py-0.5 text-xs text-zinc-200 outline-none focus:border-green-500 border border-zinc-700";

const TARGET_ROW_HEIGHT = 160;
const GRID_GAP = 12;

const aspectRatioOf = (img: ImageInfo): number => Math.min(Math.max(img.width / img.height, 0.2), 5);

export interface MediaBrowserProps {
  manageFolders?: boolean;
  onSelect?: (path: string) => void;
}

export const MediaBrowser = ({ manageFolders = false, onSelect }: MediaBrowserProps) => {
  const lib = useMediaLibrary();
  const { images, dirs } = lib;

  const [query, setQuery] = useState("");
  const [selectedDir, setSelectedDir] = useState<string>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [pending, setPending] = useState<PendingFile[] | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [uploadDir, setUploadDir] = useState("");
  const [quality, setQuality] = useState(80);
  const [maxWidth, setMaxWidth] = useState(1600);

  const [imgDelete, setImgDelete] = useState<ImageInfo | null>(null);
  const [imgRefs, setImgRefs] = useState<RefUsages | null>(null);
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [dirDelete, setDirDelete] = useState<{ dir: string; count: number } | null>(null);
  const [dirRefs, setDirRefs] = useState<RefUsages | null>(null);

  const [folderPrompt, setFolderPrompt] = useState<FolderPrompt | null>(null);
  const [folderName, setFolderName] = useState("");

  const [filePrompt, setFilePrompt] = useState<ImageInfo | null>(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);

  const [menu, setMenu] = useState<{ x: number; y: number; img: ImageInfo } | null>(null);

  const anyModalOpen = !!pending || !!imgDelete || !!dirDelete || !!folderPrompt || !!filePrompt;

  const tree = useMemo(() => buildDirTree(dirs), [dirs]);

  const visible = useMemo(() => {
    if (!images) return [];
    const q = query.trim().toLowerCase();
    return images.filter((img) => {
      if (selectedDir !== "all" && img.dir !== selectedDir) return false;
      if (q && !img.path.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [images, selectedDir, query]);

  const currentTargetDir = selectedDir === "all" ? "" : selectedDir;

  const stageFiles = (files: File[]) => {
    const valid = files.filter(isUploadable);
    setSkippedCount(files.length - valid.length);
    if (valid.length === 0) {
      lib.setNotice({ kind: "err", text: "No supported files - use png, jpg or webp" });
      return;
    }
    setUploadDir(currentTargetDir);
    setPending(valid.map((file) => ({ file, url: URL.createObjectURL(file) })));
  };

  const openFileDialog = () => fileInputRef.current?.click();

  const cancelStaging = useCallback(() => {
    pending?.forEach((p) => URL.revokeObjectURL(p.url));
    setPending(null);
    setSkippedCount(0);
  }, [pending]);

  useEffect(() => {
    if (!anyModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pending) {
        cancelStaging();
        return;
      }
      setImgDelete(null);
      setDirDelete(null);
      setFolderPrompt(null);
      setFilePrompt(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [anyModalOpen, pending, cancelStaging]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("click", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const startUpload = async () => {
    if (!pending || lib.uploading) return;
    const ok = await lib.uploadFiles(
      pending.map((p) => p.file),
      uploadDir,
      { quality, maxWidth }
    );
    if (ok) {
      cancelStaging();
      setSelectedDir(uploadDir);
    }
  };

  const beginImgDelete = (img: ImageInfo) => {
    setImgDelete(img);
    setImgRefs(null);
    setScanning(true);
    getRefs([img.path])
      .then(setImgRefs)
      .catch((err) => lib.setNotice({ kind: "err", text: String(err) }))
      .finally(() => setScanning(false));
  };

  const confirmImgDelete = async () => {
    if (!imgDelete) return;
    setDeleting(true);
    try {
      await deleteImage(imgDelete.path);
      setImgDelete(null);
      await lib.refresh();
      lib.setLqipStale(true);
      lib.setNotice({ kind: "ok", text: `Deleted ${imgDelete.path}` });
    } catch (err) {
      if (err instanceof ApiError && err.payload.usages) {
        setImgRefs(err.payload.usages);
      } else {
        lib.setNotice({ kind: "err", text: String(err instanceof ApiError ? err.message : err) });
        setImgDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const beginDirDelete = (dir: string) => {
    const contained = (images ?? []).filter((i) => i.dir === dir || i.dir.startsWith(`${dir}/`));
    setDirDelete({ dir, count: contained.length });
    setDirRefs(null);
    setScanning(true);
    getRefs(contained.map((i) => i.path))
      .then((usages) => setDirRefs(Object.keys(usages).length > 0 ? usages : {}))
      .catch((err) => lib.setNotice({ kind: "err", text: String(err) }))
      .finally(() => setScanning(false));
  };

  const confirmDirDelete = async () => {
    if (!dirDelete) return;
    setDeleting(true);
    try {
      await deleteDir(dirDelete.dir);
      setDirDelete(null);
      setSelectedDir("all");
      await lib.refresh();
      lib.setLqipStale(true);
      lib.setNotice({ kind: "ok", text: `Deleted folder ${dirLabel(dirDelete.dir)}` });
    } catch (err) {
      if (err instanceof ApiError && err.payload.usages) {
        setDirRefs(err.payload.usages);
      } else {
        lib.setNotice({ kind: "err", text: String(err instanceof ApiError ? err.message : err) });
        setDirDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  const openFolderPrompt = (prompt: FolderPrompt) => {
    setFolderPrompt(prompt);
    setFolderName(prompt.mode === "rename" ? (prompt.dir.split("/").pop() ?? "") : "");
  };

  const submitFolderPrompt = async () => {
    if (!folderPrompt || busy) return;
    const name = folderName.trim();
    if (!name) return;
    setBusy(true);
    try {
      if (folderPrompt.mode === "create") {
        const rel = folderPrompt.parent ? `${folderPrompt.parent}/${name}` : name;
        await createDir(rel);
        lib.setNotice({ kind: "ok", text: `Created folder ${dirLabel(rel)}` });
      } else {
        const result = await renameDir(folderPrompt.dir, name);
        const segs = folderPrompt.dir.split("/");
        const newRel = [...segs.slice(0, -1), name].join("/");
        if (selectedDir === folderPrompt.dir || selectedDir.startsWith(`${folderPrompt.dir}/`)) {
          setSelectedDir(newRel + selectedDir.slice(folderPrompt.dir.length));
        }
        lib.setNotice({
          kind: "ok",
          text: `Renamed to ${dirLabel(newRel)}${result.rewritten ? ` - updated ${result.rewritten} reference(s) in content` : ""}`,
        });
        lib.setLqipStale(true);
      }
      await lib.refresh();
      setFolderPrompt(null);
    } catch (err) {
      lib.setNotice({ kind: "err", text: String(err instanceof ApiError ? err.message : err) });
    } finally {
      setBusy(false);
    }
  };

  const copyPath = (img: ImageInfo) => {
    void navigator.clipboard.writeText(img.path);
    lib.setNotice({ kind: "ok", text: `Copied ${img.path}` });
  };

  const openFilePrompt = (img: ImageInfo) => {
    setFilePrompt(img);
    setFileName(img.name.replace(/\.webp$/i, ""));
  };

  const submitFilePrompt = async () => {
    if (!filePrompt || busy) return;
    const name = fileName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const result = await renameImage(filePrompt.path, name);
      lib.setNotice({
        kind: "ok",
        text: `Renamed to ${name}.webp${result.rewritten ? ` - updated ${result.rewritten} reference(s) in content` : ""}`,
      });
      lib.setLqipStale(true);
      await lib.refresh();
      setFilePrompt(null);
    } catch (err) {
      lib.setNotice({ kind: "err", text: String(err instanceof ApiError ? err.message : err) });
    } finally {
      setBusy(false);
    }
  };

  const toggleCollapse = (rel: string) => setCollapsed((prev) => ({ ...prev, [rel]: !(prev[rel] ?? false) }));

  const renderDirNode = (node: DirNode, depth: number): ReactNode => {
    const active = selectedDir === node.rel;
    const hasChildren = node.children.length > 0;
    const isCollapsed = collapsed[node.rel] ?? false;
    return (
      <div key={node.rel}>
        <div
          className={`group flex items-center gap-0.5 rounded-md pl-1 pr-0.5 text-xs ${
            active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
          style={{ paddingLeft: depth * 12 + 4 }}
        >
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleCollapse(node.rel);
            }}
            className={`flex h-5 w-4 shrink-0 items-center justify-center text-zinc-600 ${hasChildren ? "hover:text-zinc-300" : "cursor-default"}`}
          >
            {hasChildren && (
              <CaretRightIcon size={10} className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`} />
            )}
          </button>
          <button
            type="button"
            onClick={() => setSelectedDir(node.rel)}
            title={node.rel}
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left"
          >
            <FolderIcon size={13} className="shrink-0 text-zinc-500" />
            <span className="truncate font-medium">{node.name}</span>
          </button>
          {manageFolders && (
            <span className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                title="New subfolder"
                className={`${iconBtn} hover:text-green-400`}
                onClick={(e) => {
                  e.stopPropagation();
                  openFolderPrompt({ mode: "create", parent: node.rel });
                }}
              >
                <FolderPlusIcon size={12} />
              </button>
              <button
                type="button"
                title="Rename folder"
                className={iconBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  openFolderPrompt({ mode: "rename", dir: node.rel });
                }}
              >
                <PencilSimpleIcon size={12} />
              </button>
              <button
                type="button"
                title="Delete folder"
                className={`${iconBtn} hover:text-red-400`}
                onClick={(e) => {
                  e.stopPropagation();
                  beginDirDelete(node.rel);
                }}
              >
                <TrashIcon size={12} />
              </button>
            </span>
          )}
        </div>
        {!isCollapsed && hasChildren && node.children.map((c) => renderDirNode(c, depth + 1))}
      </div>
    );
  };

  const hasGrid = visible.length > 0;
  const gridElRef = useRef<HTMLDivElement | null>(null);
  const [gridWidth, setGridWidth] = useState(0);

  useEffect(() => {
    const el = gridElRef.current;
    if (!el) return;
    setGridWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => setGridWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasGrid]);

  const rows = useMemo(() => {
    if (gridWidth <= 0) return [] as ImageInfo[][];
    const packed: ImageInfo[][] = [];
    let current: ImageInfo[] = [];
    let ratioSum = 0;
    for (const img of visible) {
      current.push(img);
      ratioSum += aspectRatioOf(img);
      if (ratioSum * TARGET_ROW_HEIGHT + (current.length - 1) * GRID_GAP >= gridWidth) {
        packed.push(current);
        current = [];
        ratioSum = 0;
      }
    }
    if (current.length > 0) packed.push(current);
    return packed;
  }, [visible, gridWidth]);

  const renderTile = (img: ImageInfo, rowHeight: number, stretch: boolean): ReactNode => {
    const inner = (
      <>
        <div className="overflow-hidden bg-zinc-950" style={{ height: rowHeight }}>
          <img src={img.url} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="flex items-center gap-1 bg-zinc-900 px-1.5 py-1">
          <span className="min-w-0 flex-1 truncate text-left text-[10px] text-zinc-400" title={img.path}>
            {selectedDir === "all" ? `${img.dir ? `${img.dir}/` : ""}${img.name}` : img.name}
          </span>
        </div>
      </>
    );
    const cls = `relative min-w-0 overflow-hidden rounded-lg border border-zinc-800 ${
      onSelect ? "transition-colors hover:border-green-500" : ""
    }`;
    const style = stretch
      ? { width: Math.min(aspectRatioOf(img) * rowHeight, gridWidth) }
      : { flexGrow: aspectRatioOf(img), flexBasis: 0 };
    const openMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMenu({
        x: Math.min(e.clientX, window.innerWidth - 190),
        y: Math.min(e.clientY, window.innerHeight - 140),
        img,
      });
    };
    if (onSelect) {
      return (
        <button
          key={img.path}
          type="button"
          title={img.path}
          style={style}
          className={cls}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(img.path);
          }}
          onContextMenu={openMenu}
        >
          {inner}
        </button>
      );
    }
    return (
      <div key={img.path} title={img.path} style={style} className={cls} onContextMenu={openMenu}>
        {inner}
      </div>
    );
  };

  const usagesList = (refs: RefUsages): ReactNode => (
    <ul className="space-y-1 rounded-md border border-red-900/60 bg-red-950/40 p-2.5 font-mono text-[11px] text-red-300">
      {Object.entries(refs).flatMap(([path, places]) =>
        places.map((place, i) => (
          <li key={`${path}:${i}`}>
            <span className="text-red-200">{path}</span> → {place}
          </li>
        ))
      )}
    </ul>
  );

  return (
    <div className="flex items-stretch gap-4">
      <aside className="w-52 shrink-0 self-start rounded-lg border border-zinc-800 bg-zinc-950 p-2">
        <button
          type="button"
          onClick={() => setSelectedDir("all")}
          className={`mb-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
            selectedDir === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          }`}
        >
          <ImagesIcon size={13} className="text-zinc-500" />
          All images
          <span className="ml-auto text-[10px] font-normal text-zinc-600">{images?.length ?? "…"}</span>
        </button>
        {tree.map((n) => renderDirNode(n, 0))}
        {manageFolders && (
          <Button
            variant="ghost"
            className="mt-2 w-full justify-start border border-dashed border-zinc-800 px-2 text-xs"
            onClick={() => openFolderPrompt({ mode: "create", parent: "" })}
          >
            <FolderPlusIcon size={13} /> New folder
          </Button>
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex items-center gap-2">
          <div className="relative min-w-52 flex-1">
            <MagnifyingGlassIcon size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by path…"
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 py-1.5 pr-2.5 pl-7 text-sm outline-none focus:border-green-500"
            />
          </div>
          <span className="text-[11px] whitespace-nowrap text-zinc-600">
            {visible.length} image{visible.length === 1 ? "" : "s"}
          </span>
          <Button variant="default" className="px-2.5 py-1.5 text-xs" onClick={openFileDialog}>
            <UploadSimpleIcon size={14} />
            Upload files
          </Button>
          {manageFolders && (
            <Button
              variant="default"
              className="px-2.5 py-1.5 text-xs"
              onClick={lib.runLqip}
              disabled={lib.lqipRunning}
            >
              <HashIcon size={14} />
              {lib.lqipRunning ? "Generating…" : "Regenerate blurhash"}
            </Button>
          )}
        </div>

        <div
          className="relative"
          onDragEnter={(e) => {
            e.preventDefault();
            if (![...e.dataTransfer.types].includes("Files")) return;
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) {
              dragDepth.current = 0;
              setDragging(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            stageFiles([...e.dataTransfer.files]);
          }}
        >
          {visible.length === 0 ? (
            <button
              type="button"
              onClick={openFileDialog}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-800 py-20 text-center transition-colors hover:border-green-600"
            >
              <UploadSimpleIcon size={34} className="text-zinc-600" />
              <p className="text-sm font-medium text-zinc-400">{images === null ? "Loading…" : "No images here yet"}</p>
              <p className="text-xs text-zinc-600">
                {images === null
                  ? ""
                  : `Click to browse, or drop files${selectedDir === "all" ? "" : ` into ${dirLabel(selectedDir)}`} - converts to webp`}
              </p>
            </button>
          ) : (
            <div ref={gridElRef} className="flex flex-col" style={{ gap: GRID_GAP }}>
              {rows.map((row, rowIndex) => {
                const isLast = rowIndex === rows.length - 1;
                const ratioSum = row.reduce((sum, img) => sum + aspectRatioOf(img), 0);
                const rowHeight = isLast ? TARGET_ROW_HEIGHT : (gridWidth - (row.length - 1) * GRID_GAP) / ratioSum;
                return (
                  <div key={row[0].path} className="flex" style={{ gap: GRID_GAP }}>
                    {row.map((img) => renderTile(img, rowHeight, isLast))}
                  </div>
                );
              })}
            </div>
          )}

          {dragging && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-500 bg-green-950/80 backdrop-blur-sm">
              <UploadSimpleIcon size={42} className="text-green-400" />
              <p className="text-lg font-bold text-green-300">Drop to upload</p>
              <p className="text-xs text-zinc-300">target folder: {dirLabel(currentTargetDir)}</p>
            </div>
          )}
        </div>

        {(lib.notice || lib.uploading || lib.lqipRunning || lib.lqipStale) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {lib.uploading ? (
              <span className="flex items-center gap-1.5 text-zinc-300">
                <CircleNotchIcon size={13} className="animate-spin" /> Uploading {lib.progress}
              </span>
            ) : lib.lqipRunning ? (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <HashIcon size={13} className="animate-pulse" /> Regenerating blurhash…
              </span>
            ) : lib.lqipStale ? (
              <span className="flex items-center gap-1.5 text-amber-400">
                <WarningCircleIcon size={13} /> Blurhash placeholders are out of date - run Regenerate blurhash
              </span>
            ) : (
              lib.notice && (
                <span className={lib.notice.kind === "ok" ? "text-green-400" : "text-red-400"}>{lib.notice.text}</span>
              )
            )}
          </div>
        )}
      </section>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          stageFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      {menu && (
        <div
          className="fixed z-[70] min-w-44 rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-2xl"
          style={{ left: menu.x, top: menu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
            onClick={() => {
              copyPath(menu.img);
              setMenu(null);
            }}
          >
            <CopyIcon size={13} className="text-zinc-500" /> Copy path
          </button>
          {manageFolders && (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() => {
                  const img = menu.img;
                  setMenu(null);
                  openFilePrompt(img);
                }}
              >
                <PencilSimpleIcon size={13} className="text-zinc-500" /> Rename…
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-950/60 hover:text-red-300"
                onClick={() => {
                  const img = menu.img;
                  setMenu(null);
                  beginImgDelete(img);
                }}
              >
                <TrashIcon size={13} /> Delete…
              </button>
            </>
          )}
        </div>
      )}

      {pending && (
        <ModalShell
          title={`Upload ${pending.length} file${pending.length > 1 ? "s" : ""}`}
          onClose={cancelStaging}
          wide
        >
          <div className="flex flex-wrap gap-2">
            {pending.map((p) => (
              <div key={p.url} className="w-28">
                <img src={p.url} alt="" className="h-20 w-28 rounded-md border border-zinc-800 object-cover" />
                <p className="mt-0.5 truncate text-center text-[10px] text-zinc-500" title={p.file.name}>
                  {p.file.name}
                </p>
              </div>
            ))}
          </div>

          {skippedCount > 0 && (
            <p className="text-xs text-amber-400">
              Skipped {skippedCount} unsupported file{skippedCount > 1 ? "s" : ""} - png, jpg or webp only
            </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <label className="col-span-3 block text-xs text-zinc-400 sm:col-span-1">
              <span className="mb-1 block font-semibold tracking-wide uppercase">Folder</span>
              <select
                value={uploadDir}
                onChange={(e) => setUploadDir(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-green-500"
              >
                <option value="">/content (root)</option>
                {dirs.map((d) => (
                  <option key={d} value={d}>
                    /content/{d}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-zinc-400">
              <span className="mb-1 block font-semibold tracking-wide uppercase">Quality</span>
              <input
                type="number"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className={`${numberInputCls} w-full`}
              />
            </label>
            <label className="block text-xs text-zinc-400">
              <span className="mb-1 block font-semibold tracking-wide uppercase">Max width</span>
              <input
                type="number"
                min={64}
                max={4096}
                step={64}
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                className={`${numberInputCls} w-full`}
              />
            </label>
          </div>

          <p className="text-[11px] text-zinc-600">
            Files convert to webp on save into public/assets/content - run Regenerate blurhash afterwards to update
            placeholders.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={cancelStaging} disabled={lib.uploading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void startUpload()} disabled={lib.uploading}>
              {lib.uploading ? (
                <>
                  <CircleNotchIcon size={14} className="animate-spin" /> {lib.progress}
                </>
              ) : (
                <>
                  <UploadSimpleIcon size={14} /> Upload {pending.length} file{pending.length > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </ModalShell>
      )}

      {imgDelete && (
        <ModalShell title="Delete image" onClose={() => setImgDelete(null)}>
          {scanning ? (
            <p className="flex items-center gap-2 text-sm text-zinc-400">
              <CircleNotchIcon size={15} className="animate-spin" /> Scanning content for references…
            </p>
          ) : imgRefs && Object.keys(imgRefs).length > 0 ? (
            <>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-red-400">
                <WarningCircleIcon size={15} /> Deletion blocked - still referenced by content:
              </p>
              {usagesList(imgRefs)}
              <p className="text-xs text-zinc-500">Remove these references first, then delete the image.</p>
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setImgDelete(null)}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm break-all text-zinc-300">
                Permanently delete <span className="font-mono text-white">{imgDelete.path}</span>?
              </p>
              <p className="rounded-md border border-red-900/60 bg-red-950/40 p-2.5 text-xs text-red-300">
                No references found, so it's safe from the site&apos;s perspective, but the file will be gone forever.
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setImgDelete(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => void confirmImgDelete()} disabled={deleting}>
                  {deleting ? <CircleNotchIcon size={14} className="animate-spin" /> : <TrashIcon size={14} />}
                  Delete permanently
                </Button>
              </div>
            </>
          )}
        </ModalShell>
      )}

      {dirDelete && (
        <ModalShell title="Delete folder" onClose={() => setDirDelete(null)}>
          {scanning ? (
            <p className="flex items-center gap-2 text-sm text-zinc-400">
              <CircleNotchIcon size={15} className="animate-spin" /> Scanning {dirDelete.count} image
              {dirDelete.count === 1 ? "" : "s"} for references…
            </p>
          ) : dirRefs && Object.keys(dirRefs).length > 0 ? (
            <>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-red-400">
                <WarningCircleIcon size={15} /> Deletion blocked - images in this folder are still referenced:
              </p>
              {usagesList(dirRefs)}
              <div className="flex justify-end">
                <Button variant="ghost" onClick={() => setDirDelete(null)}>
                  Close
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm break-all text-zinc-300">
                Permanently delete <span className="font-mono text-white">{dirLabel(dirDelete.dir)}</span> including{" "}
                {dirDelete.count} image{dirDelete.count === 1 ? "" : "s"}?
              </p>
              <p className="rounded-md border border-red-900/60 bg-red-950/40 p-2.5 text-xs text-red-300">
                The folder and everything inside it will be removed from disk. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDirDelete(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => void confirmDirDelete()} disabled={deleting}>
                  {deleting ? <CircleNotchIcon size={14} className="animate-spin" /> : <TrashIcon size={14} />}
                  Delete permanently
                </Button>
              </div>
            </>
          )}
        </ModalShell>
      )}

      {folderPrompt && (
        <ModalShell
          title={
            folderPrompt.mode === "create"
              ? folderPrompt.parent
                ? `New subfolder in ${folderPrompt.parent}`
                : "New folder"
              : `Rename ${folderPrompt.dir}`
          }
          onClose={() => setFolderPrompt(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitFolderPrompt();
            }}
            className="space-y-3"
          >
            <label className="block text-xs text-zinc-400">
              <span className="mb-1 block font-semibold tracking-wide uppercase">Name</span>
              <input
                autoFocus
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="tutorials"
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm outline-none focus:border-green-500"
              />
            </label>
            {folderPrompt.mode === "rename" && (
              <p className="text-[11px] text-zinc-600">
                References to this folder&apos;s images in posts/wiki/authors update automatically.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setFolderPrompt(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={busy || !folderName.trim()}>
                {busy && <CircleNotchIcon size={14} className="animate-spin" />}
                {folderPrompt.mode === "create" ? "Create" : "Rename"}
              </Button>
            </div>
          </form>
        </ModalShell>
      )}

      {filePrompt && (
        <ModalShell title="Rename image" onClose={() => setFilePrompt(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitFilePrompt();
            }}
            className="space-y-3"
          >
            <p className="font-mono text-[11px] break-all text-zinc-500">{filePrompt.path}</p>
            <label className="block text-xs text-zinc-400">
              <span className="mb-1 block font-semibold tracking-wide uppercase">Name</span>
              <input
                autoFocus
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm outline-none focus:border-green-500"
              />
            </label>
            <p className="text-[11px] text-zinc-600">
              Saved as .webp. References in posts/wiki/authors update automatically; run Regenerate blurhash afterwards
              to update placeholders.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setFilePrompt(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={busy || !fileName.trim()}>
                {busy && <CircleNotchIcon size={14} className="animate-spin" />}
                Rename
              </Button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};
