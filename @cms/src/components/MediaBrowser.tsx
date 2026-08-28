import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUUpLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CircleNotchIcon,
  ClockIcon,
  CopyIcon,
  FolderIcon,
  FolderPlusIcon,
  HashIcon,
  ImagesIcon,
  LockSimpleIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlayIcon,
  TrashIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { createDir, deleteDir, deleteImage, getRefs, renameDir, renameImage, replaceImage, ApiError } from "../api";
import type { ImageInfo, RefUsages } from "../types";
import { buildDirTree, dirLabel, type DirNode } from "../lib/mediaTree";
import { formatUploadStage } from "../lib/stageLabels";
import { useMediaLibrary, type UploadJob } from "./useMediaLibrary";
import { Banner } from "./Banner";
import { Button } from "./fields";

const VALID_UPLOAD_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".apng", ".mp4", ".m4v", ".webm", ".mov", ".mkv"];
const VIDEO_EXTS = new Set([".mp4", ".m4v", ".webm", ".mov", ".mkv"]);
/** Animated sources sharp can re-encode to animated webp (so the webm/webp choice applies). */
const WEBP_CHOOSABLE = new Set([".gif", ".webp"]);

type AnimFormat = "webm" | "webp";

const extOf = (name: string): string => {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : "";
};

const isUploadable = (f: File): boolean => VALID_UPLOAD_EXTS.includes(extOf(f.name));
const isVideoFile = (f: File): boolean => VIDEO_EXTS.has(extOf(f.name));
/** Whether this animated source can optionally be output as animated webp (gif / animated webp). */
const canChooseWebp = (f: File): boolean => WEBP_CHOOSABLE.has(extOf(f.name));
/** Smart output default: gif/animated webp → webp (lightweight <img>, best for short loops); video/apng → webm. */
const smartFormat = (f: File): AnimFormat => (canChooseWebp(f) ? "webp" : "webm");

const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const formatDurSec = (s: number): string => {
  if (!Number.isFinite(s) || s <= 0) return "";
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}m ${sec}s`;
};

interface PendingFile {
  file: File;
  url: string;
  format: AnimFormat;
  durationSec?: number;
  animated?: boolean;
  probingVideo?: boolean;
}

/** Probe metadata for a staged upload so the modal can show a duration/animated hint before upload. */
function probeFileMeta(file: File, onMeta: (m: { durationSec?: number; animated?: boolean }) => void): () => void {
  const url = URL.createObjectURL(file);
  const ext = extOf(file.name);
  let cancelled = false;
  let img: HTMLImageElement | null = null;
  const finish = (m: { durationSec?: number; animated?: boolean }) => {
    if (!cancelled) onMeta(m);
    cleanup();
  };
  const cleanup = () => {
    cancelled = true;
    if (img) img.src = "";
    URL.revokeObjectURL(url);
  };

  if (ext === ".gif") {
    img = new Image();
    img.onerror = () => finish({});
    img.onload = () => finish({ animated: true });
    img.src = url;
    return cleanup;
  }

  if (ext === ".webp") {
    img = new Image();
    img.onerror = () => finish({});
    img.onload = () => {
      if (cancelled || !img) return;
      let animated = false;
      try {
        const canvas = document.createElement("canvas");
        const w = img.naturalWidth || 1;
        const h = img.naturalHeight || 1;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const a = ctx.getImageData(0, 0, 1, 1).data[0];
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0);
          const b = ctx.getImageData(0, 0, 1, 1).data[0];
          animated = a !== b;
        }
      } catch {
        animated = false;
      }
      finish({ animated });
    };
    img.src = url;
    return cleanup;
  }

  const video = document.createElement("video");
  let videoShown = false;
  const videoCleanup = () => {
    cancelled = true;
    if (videoShown) {
      video.src = "";
    }
    URL.revokeObjectURL(url);
  };
  video.muted = true;
  video.preload = "metadata";
  video.onloadedmetadata = () => {
    if (cancelled) return;
    const d = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : undefined;
    if (!cancelled) onMeta({ durationSec: d, animated: d !== undefined });
    cancelled = true;
    video.src = "";
    URL.revokeObjectURL(url);
  };
  video.onerror = () => {
    if (!cancelled) onMeta({});
    cancelled = true;
    URL.revokeObjectURL(url);
  };
  videoShown = true;
  video.src = url;
  video.load();
  return videoCleanup;
}

type FolderPrompt = { mode: "create"; parent: string } | { mode: "rename"; dir: string };

interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  xwide?: boolean;
}

const ModalShell = ({ title, onClose, children, wide = false, xwide = false }: ModalShellProps) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
    <div
      className={`flex max-h-full w-full ${xwide ? "max-w-4xl" : wide ? "max-w-2xl" : "max-w-md"} flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl`}
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
  "w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-green-500";

const UploadJobBanner = ({ job, onDismiss }: { job: UploadJob; onDismiss: () => void }) => {
  if (job.status === "success") {
    return (
      <Banner variant="success" title={job.name} dismissable onDismiss={onDismiss}>
        Converted to {job.animated ? (job.format === "webm" ? "webm" : "animated webp") : "webp"}
        {job.animated && job.frames ? ` (${job.frames} frames)` : ""}
        {job.oversized && job.mbPerSec != null
          ? ` - unusually large (${job.mbPerSec.toFixed(1)} MB/s): consider lowering quality or trimming`
          : ""}
      </Banner>
    );
  }
  if (job.status === "error") {
    return (
      <Banner variant="error" title={`${job.name} failed`} dismissable onDismiss={onDismiss}>
        <span className="whitespace-pre-line">{job.error}</span>
      </Banner>
    );
  }
  return (
    <Banner variant="info" busy title={job.name}>
      <div className="flex items-center gap-2">
        <span className="h-1 w-full max-w-48 overflow-hidden rounded bg-black/40">
          {job.pct != null ? (
            <span
              className="block h-full bg-green-400 transition-all duration-200"
              style={{ width: `${Math.max(3, Math.round(job.pct))}%` }}
            />
          ) : (
            <span className="block h-full w-full animate-pulse bg-green-400/60" />
          )}
        </span>
        <span className="shrink-0 whitespace-nowrap">{formatUploadStage(job)}</span>
      </div>
    </Banner>
  );
};

const TARGET_ROW_HEIGHT = 160;
const GRID_GAP = 12;

const aspectRatioOf = (img: ImageInfo): number => Math.min(Math.max(img.width / img.height, 0.2), 5);

interface MediaTileProps {
  img: ImageInfo;
  rowHeight: number;
  stretch: boolean;
  gridWidth: number;
  showDir: boolean;
  onSelect?: (path: string) => void;
  onOpenMenu: (e: React.MouseEvent) => void;
  selected?: boolean;
  previewOnRightClick?: boolean;
}

const PREVIEW_GAP = 12;
/** Total floating box budget (media + info panel). */
const PREVIEW_TOTAL_MAX_WIDTH = 800;
const PREVIEW_PANEL_WIDTH = 220;
const PREVIEW_MAX_HEIGHT_RATIO = 0.75;

const PreviewInfoPanel = ({ img }: { img: ImageInfo }) => {
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const copyDiskPath = () => {
    if (!img.diskPath) return;
    void navigator.clipboard.writeText(img.diskPath).then(() => {
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="flex w-[220px] shrink-0 flex-col gap-2.5 overflow-y-auto border-l border-zinc-800 bg-zinc-950 p-2.5 text-left">
      {img.diskPath && (
        <div>
          <div className="mb-1 text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Disk path</div>
          <div className="flex items-start gap-1.5">
            <code className="min-w-0 flex-1 font-mono text-[10px] leading-snug break-all text-zinc-300 select-all">
              {img.diskPath}
            </code>
            <button
              type="button"
              onClick={copyDiskPath}
              title="Copy full path"
              className="shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              {copied ? (
                <CheckIcon size={13} weight="bold" className="text-green-400" />
              ) : (
                <CopyIcon size={13} />
              )}
            </button>
          </div>
        </div>
      )}
      {typeof img.size === "number" && (
        <div>
          <div className="mb-1 text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Size</div>
          <div className="text-[11px] text-zinc-300">
            {formatBytes(img.size)}
            {typeof img.staticSize === "number" && (
              <span className="text-zinc-500"> · poster {formatBytes(img.staticSize)}</span>
            )}
          </div>
        </div>
      )}
      <div>
        <div className="mb-1 text-[9px] font-bold tracking-wider text-zinc-500 uppercase">Dimensions</div>
        <div className="text-[11px] text-zinc-300">
          {img.width} × {img.height} px
        </div>
      </div>
    </div>
  );
};

interface ImagePreviewOverlayProps {
  img: ImageInfo;
  tileRect: DOMRect;
  onHover: () => void;
  onLeave: () => void;
}

const ImagePreviewOverlay = ({ img, tileRect, onHover, onLeave }: ImagePreviewOverlayProps) => {
  const dims = useMemo(() => {
    const maxW = Math.min(
      img.width,
      PREVIEW_TOTAL_MAX_WIDTH - PREVIEW_PANEL_WIDTH,
      Math.max(window.innerWidth - 32 - PREVIEW_PANEL_WIDTH, 120),
    );
    const maxH = Math.min(img.height, window.innerHeight * PREVIEW_MAX_HEIGHT_RATIO);
    const ratio = img.width / img.height;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
    return { width: Math.round(w), height: Math.round(h) };
  }, [img.width, img.height]);

  const boxW = dims.width + PREVIEW_PANEL_WIDTH;

  const viewW = window.innerWidth;
  let left = tileRect.left;
  if (left + boxW > viewW - 16) left = viewW - boxW - 16;
  if (left < 16) left = 16;

  // Unstyled wrapper spans card + gap and touches the tile edge, so the pointer never leaves
  // a hover surface while crossing the gap between tile and card.
  const above = tileRect.top - PREVIEW_GAP - dims.height >= 8;

  return createPortal(
    <div
      className="pointer-events-auto"
      style={{
        position: "fixed",
        zIndex: 50,
        left,
        top: above ? tileRect.top - PREVIEW_GAP - dims.height : tileRect.bottom,
        width: boxW,
        height: dims.height + PREVIEW_GAP,
        paddingBottom: above ? PREVIEW_GAP : 0,
        paddingTop: above ? 0 : PREVIEW_GAP,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className="flex overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 shadow-2xl"
        style={{ width: boxW, height: dims.height }}
      >
        <div className="relative min-w-0" style={{ width: dims.width, height: dims.height }}>
          {img.format === "webm" ? (
            <video
              key={img.url}
              src={img.url}
              poster={img.staticUrl}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-contain"
            />
          ) : (
            <img src={img.url} alt={img.name} className="h-full w-full object-contain" draggable={false} />
          )}
          {img.animated && (
            <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold tracking-wider text-green-300 uppercase">
              <PlayIcon size={9} weight="bold" /> anim
            </span>
          )}
        </div>
        <PreviewInfoPanel img={img} />
      </div>
    </div>,
    document.body
  );
};

const MediaTile = ({
  img,
  rowHeight,
  stretch,
  gridWidth,
  showDir,
  onSelect,
  onOpenMenu,
  selected,
  previewOnRightClick,
}: MediaTileProps) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [tileRect, setTileRect] = useState<DOMRect | null>(null);
  // Grace window that keeps the preview alive while the pointer crosses the gap between tile and card.
  const hideTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const cancelHide = () => window.clearTimeout(hideTimer.current);
  const scheduleHide = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setPreviewVisible(false), 120);
  };

  const src = img.staticUrl ?? img.url;

  const inner = (
    <>
      <div className="relative overflow-hidden bg-zinc-950" style={{ height: rowHeight }}>
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
        {selected && (
          <span className="absolute top-1.5 left-1.5 flex items-center rounded bg-green-600 px-0.5 py-0.5 text-white">
            <CheckIcon size={10} weight="bold" />
          </span>
        )}
        {img.animated && (
          <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[9px] font-bold tracking-wider text-green-300 uppercase">
            <PlayIcon size={9} weight="bold" /> anim
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 bg-zinc-900 px-1.5 py-1">
        <span className="min-w-0 flex-1 truncate text-left text-[10px] text-zinc-400" title={img.path}>
          {showDir ? `${img.dir ? `${img.dir}/` : ""}${img.name}` : img.name}
        </span>
      </div>
    </>
  );
  const cls = `relative min-w-0 overflow-hidden rounded-lg border ${
    selected ? "border-green-500" : "border-zinc-800"
  } ${onSelect ? "transition-colors hover:border-green-500" : ""}`;
  const style = stretch
    ? { width: Math.min(aspectRatioOf(img) * rowHeight, gridWidth) }
    : { flexGrow: aspectRatioOf(img), flexBasis: 0 };

  const handleTileEnter = (e: React.MouseEvent) => {
    if (previewOnRightClick) return;
    cancelHide();
    setTileRect(e.currentTarget.getBoundingClientRect());
    setPreviewVisible(true);
  };
  const handleLeave = scheduleHide;

  const handleContextMenu = (e: React.MouseEvent) => {
    if (previewOnRightClick) {
      e.preventDefault();
      e.stopPropagation();
      cancelHide();
      setTileRect(e.currentTarget.getBoundingClientRect());
      setPreviewVisible(true);
      return;
    }
    onOpenMenu(e);
  };

  const preview =
    previewVisible && tileRect ? (
      <ImagePreviewOverlay
        img={img}
        tileRect={tileRect}
        onHover={cancelHide}
        onLeave={handleLeave}
      />
    ) : null;

  if (onSelect) {
    return (
      <>
        <button
          type="button"
          title={img.path}
          style={style}
          className={cls}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(img.path);
          }}
          onMouseEnter={handleTileEnter}
          onMouseLeave={handleLeave}
          onContextMenu={handleContextMenu}
        >
          {inner}
        </button>
        {preview}
      </>
    );
  }
  return (
    <>
      <div
        title={img.path}
        style={style}
        className={cls}
        onMouseEnter={handleTileEnter}
        onMouseLeave={handleLeave}
        onContextMenu={handleContextMenu}
      >
        {inner}
      </div>
      {preview}
    </>
  );
};

export interface MediaBrowserProps {
  manageFolders?: boolean;
  onSelect?: (path: string) => void;
  fullPageDrop?: boolean;
  /** Paths rendered with a persistent selected style (picker staging). */
  selectedPaths?: ReadonlySet<string>;
  /** Picker mode: hover preview opens on right-click instead of the context menu. */
  previewOnRightClick?: boolean;
}

export const MediaBrowser = ({
  manageFolders = false,
  onSelect,
  fullPageDrop = false,
  selectedPaths,
  previewOnRightClick = false,
}: MediaBrowserProps) => {
  const lib = useMediaLibrary();
  const { images, dirs } = lib;

  const [query, setQuery] = useState("");
  const [selectedDir, setSelectedDir] = useState<string>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceDialogOpen = useRef(false);
  const probeCleanups = useRef<Array<() => void>>([]);

  const [pending, setPending] = useState<PendingFile[] | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [rejectedNames, setRejectedNames] = useState<string[]>([]);
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

  const [replaceTarget, setReplaceTarget] = useState<ImageInfo | null>(null);

  const [menu, setMenu] = useState<{ x: number; y: number; img: ImageInfo } | null>(null);

  const anyModalOpen = !!pending || !!imgDelete || !!dirDelete || !!folderPrompt || !!filePrompt || !!replaceTarget;

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

  const stageFiles = useCallback(
    (files: File[]) => {
      probeCleanups.current.forEach((c) => c());
      probeCleanups.current = [];
      const valid = files.filter(isUploadable);
      const rejected = files.filter((f) => !isUploadable(f)).map((f) => f.name);
      setSkippedCount(rejected.length);
      setRejectedNames(rejected);
      if (valid.length === 0) return;
      setUploadDir(currentTargetDir);
      const staged: PendingFile[] = valid.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        format: smartFormat(file),
      }));
      const cleanups = staged.map((p, i) =>
        probeFileMeta(p.file, (m) => {
          setPending((prev) =>
            prev ? prev.map((x, j) => (j === i ? { ...x, durationSec: m.durationSec, animated: m.animated } : x)) : prev
          );
        })
      );
      probeCleanups.current = cleanups;
      setPending(staged);
    },
    [currentTargetDir]
  );

  useEffect(() => {
    if (!fullPageDrop) return;
    const hasFiles = (e: DragEvent): boolean => [...(e.dataTransfer?.types ?? [])].includes("Files");
    const onDragEnter = (e: DragEvent): void => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current += 1;
      setDragging(true);
    };
    const onDragOver = (e: DragEvent): void => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onDragLeave = (e: DragEvent): void => {
      if (!hasFiles(e)) return;
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) {
        dragDepth.current = 0;
        setDragging(false);
      }
    };
    const onDrop = (e: DragEvent): void => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      stageFiles([...(e.dataTransfer?.files ?? [])]);
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [fullPageDrop, stageFiles]);

  const openFileDialog = () => fileInputRef.current?.click();

  useEffect(() => {
    if (replaceTarget && !replaceDialogOpen.current) {
      replaceDialogOpen.current = true;
      replaceInputRef.current?.click();
    }
  }, [replaceTarget]);

  const cancelStaging = useCallback(() => {
    probeCleanups.current.forEach((c) => c());
    probeCleanups.current = [];
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

  const startUpload = () => {
    if (!pending) return;
    const items = pending.map((p) => ({ file: p.file, format: p.format }));
    cancelStaging();
    setSelectedDir(uploadDir);
    void lib.uploadFiles(items, uploadDir, { quality, maxWidth });
  };

  const startReplace = async () => {
    if (!pending || !replaceTarget) return;
    const file = pending[0].file;
    const target = replaceTarget;
    const format = pending[0].format;
    cancelStaging();
    setReplaceTarget(null);
    try {
      await replaceImage(target.path, file, { quality, maxWidth, format });
      await lib.refresh();
      lib.setLqipStale(true);
      lib.setNotice({ kind: "success", text: `Replaced ${target.name}` });
    } catch (err) {
      lib.setNotice({ kind: "error", text: String(err instanceof ApiError ? err.message : err) });
    }
  };

  const beginImgDelete = (img: ImageInfo) => {
    setImgDelete(img);
    setImgRefs(null);
    setScanning(true);
    getRefs([img.path])
      .then(setImgRefs)
      .catch((err) => lib.setNotice({ kind: "error", text: String(err) }))
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
      lib.setNotice({ kind: "success", text: `Deleted ${imgDelete.path}` });
    } catch (err) {
      if (err instanceof ApiError && err.payload.usages) {
        setImgRefs(err.payload.usages);
      } else {
        lib.setNotice({ kind: "error", text: String(err instanceof ApiError ? err.message : err) });
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
      .catch((err) => lib.setNotice({ kind: "error", text: String(err) }))
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
      lib.setNotice({ kind: "success", text: `Deleted folder ${dirLabel(dirDelete.dir)}` });
    } catch (err) {
      if (err instanceof ApiError && err.payload.usages) {
        setDirRefs(err.payload.usages);
      } else {
        lib.setNotice({ kind: "error", text: String(err instanceof ApiError ? err.message : err) });
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
        lib.setNotice({ kind: "success", text: `Created folder ${dirLabel(rel)}` });
      } else {
        const result = await renameDir(folderPrompt.dir, name);
        const segs = folderPrompt.dir.split("/");
        const newRel = [...segs.slice(0, -1), name].join("/");
        if (selectedDir === folderPrompt.dir || selectedDir.startsWith(`${folderPrompt.dir}/`)) {
          setSelectedDir(newRel + selectedDir.slice(folderPrompt.dir.length));
        }
        lib.setNotice({
          kind: "success",
          text: `Renamed to ${dirLabel(newRel)}${result.rewritten ? ` - updated ${result.rewritten} reference(s) in content` : ""}`,
        });
        lib.setLqipStale(true);
      }
      await lib.refresh();
      setFolderPrompt(null);
    } catch (err) {
      lib.setNotice({ kind: "error", text: String(err instanceof ApiError ? err.message : err) });
    } finally {
      setBusy(false);
    }
  };

  const copyPath = (img: ImageInfo) => {
    void navigator.clipboard.writeText(img.path);
    lib.setNotice({ kind: "success", text: `Copied ${img.path}` });
  };

  const openFilePrompt = (img: ImageInfo) => {
    setFilePrompt(img);
    setFileName(img.name.replace(/\.[^.]+$/i, ""));
  };

  const submitFilePrompt = async () => {
    if (!filePrompt || busy) return;
    const name = fileName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const ext = filePrompt.name.match(/\.[^.]+$/i)?.[0] ?? ".webp";
      const result = await renameImage(filePrompt.path, name);
      lib.setNotice({
        kind: "success",
        text: `Renamed to ${name}${ext}${result.rewritten ? ` - updated ${result.rewritten} reference(s) in content` : ""}`,
      });
      lib.setLqipStale(true);
      await lib.refresh();
      setFilePrompt(null);
    } catch (err) {
      lib.setNotice({ kind: "error", text: String(err instanceof ApiError ? err.message : err) });
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
    const openMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMenu({
        x: Math.min(e.clientX, window.innerWidth - 190),
        y: Math.min(e.clientY, window.innerHeight - 140),
        img,
      });
    };
    return (
      <MediaTile
        key={img.path}
        img={img}
        rowHeight={rowHeight}
        stretch={stretch}
        gridWidth={gridWidth}
        showDir={selectedDir === "all"}
        onSelect={onSelect}
        selected={selectedPaths?.has(img.path)}
        previewOnRightClick={previewOnRightClick}
        onOpenMenu={openMenu}
      />
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

  const scopedDropHandlers = fullPageDrop
    ? {}
    : ({
        onDragEnter: (e: React.DragEvent) => {
          e.preventDefault();
          if (![...e.dataTransfer.types].includes("Files")) return;
          dragDepth.current += 1;
          setDragging(true);
        },
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        },
        onDragLeave: (e: React.DragEvent) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
          }
        },
        onDrop: (e: React.DragEvent) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          stageFiles([...e.dataTransfer.files]);
        },
      } satisfies Pick<React.HTMLAttributes<HTMLDivElement>, "onDragEnter" | "onDragOver" | "onDragLeave" | "onDrop">);

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

        {(lib.uploads.length > 0 || lib.notice || lib.lqipRunning || lib.lqipStale || rejectedNames.length > 0) && (
          <div className="mb-3 space-y-2">
            {lib.uploads.map((job) => (
              <UploadJobBanner key={job.id} job={job} onDismiss={() => lib.dismissUpload(job.id)} />
            ))}
            {lib.lqipRunning && (
              <Banner busy variant="info" title="Regenerating blurhash…">
                Updating image placeholders
              </Banner>
            )}
            {lib.lqipStale && (
              <Banner
                variant="warn"
                title="Blurhash placeholders are out of date"
                actions={
                  manageFolders && (
                    <Button
                      variant="default"
                      className="px-2.5 py-1.5 text-xs"
                      onClick={lib.runLqip}
                      disabled={lib.lqipRunning}
                    >
                      <HashIcon size={14} /> Regenerate blurhash
                    </Button>
                  )
                }
              >
                Run Regenerate blurhash to refresh the site&apos;s image placeholders.
              </Banner>
            )}
            {lib.notice && (
              <Banner
                variant={lib.notice.kind === "success" ? "success" : lib.notice.kind === "warn" ? "warn" : "error"}
                dismissable
                onDismiss={() => lib.setNotice(null)}
              >
                {lib.notice.text}
              </Banner>
            )}
            {rejectedNames.length > 0 && (
              <Banner
                variant="error"
                title={`Skipped ${rejectedNames.length} unsupported file${rejectedNames.length > 1 ? "s" : ""}`}
                dismissable
                onDismiss={() => setRejectedNames([])}
              >
                <p>
                  {rejectedNames.slice(0, 5).join(", ")}
                  {rejectedNames.length > 5 && ` +${rejectedNames.length - 5} more`} - use png, jpg, webp, gif, apng or
                  video
                </p>
              </Banner>
            )}
          </div>
        )}

        <div className="relative" {...scopedDropHandlers}>
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
                  : `Click to browse, or drop files${selectedDir === "all" ? "" : ` into ${dirLabel(selectedDir)}`} - converts to webp / webm`}
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

          {dragging && !fullPageDrop && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-green-500 bg-green-950/80 backdrop-blur-sm">
              <UploadSimpleIcon size={42} className="text-green-400" />
              <p className="text-lg font-bold text-green-300">Drop to upload</p>
              <p className="text-xs text-zinc-300">target folder: {dirLabel(currentTargetDir)}</p>
            </div>
          )}
        </div>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.gif,.apng,.mp4,.m4v,.webm,.mov,.mkv"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          stageFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.gif,.apng,.mp4,.m4v,.webm,.mov,.mkv"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          if (replaceDialogOpen.current && replaceTarget && !pending) {
            replaceDialogOpen.current = false;
            setReplaceTarget(null);
          }
        }}
        onChange={(e) => {
          const file = (e.target.files ?? [])[0];
          e.target.value = "";
          replaceDialogOpen.current = false;
          if (!file || !replaceTarget) {
            setReplaceTarget(null);
            return;
          }
          if (!isUploadable(file)) {
            setReplaceTarget(null);
            return;
          }
          setUploadDir(replaceTarget.dir);
          setPending([{ file, url: URL.createObjectURL(file), format: smartFormat(file) }]);
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
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                onClick={() => {
                  const img = menu.img;
                  setMenu(null);
                  setReplaceTarget(img);
                }}
              >
                <ArrowUUpLeftIcon size={13} className="text-zinc-500" /> Replace…
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

      {dragging && fullPageDrop && (
        <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="flex aspect-video w-full max-w-3xl flex-col items-center justify-center gap-4 rounded-3xl border-4 border-dashed border-green-500 bg-green-950/80">
            <UploadSimpleIcon size={72} className="text-green-400" />
            <p className="text-5xl font-black tracking-tight text-green-300">Drop to upload</p>
            <p className="text-lg font-medium text-zinc-300">target folder: {dirLabel(currentTargetDir)}</p>
          </div>
        </div>
      )}

      {pending && (
        <ModalShell
          title={
            replaceTarget
              ? `Replace ${replaceTarget.name}`
              : `Upload ${pending.length} file${pending.length > 1 ? "s" : ""}`
          }
          onClose={() => {
            if (replaceTarget) setReplaceTarget(null);
            cancelStaging();
          }}
          xwide
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pending.map((p, i) => {
              const choosable = p.animated && canChooseWebp(p.file);
              const lockedVideo = isVideoFile(p.file) || extOf(p.file.name) === ".apng";
              return (
                <div
                  key={p.url}
                  className="flex flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-black">
                    {isVideoFile(p.file) ? (
                      <video src={p.url} muted loop autoPlay playsInline className="h-full w-full object-cover" />
                    ) : (
                      <img src={p.url} alt="" className="h-full w-full object-contain" />
                    )}
                    <span className="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-200">
                      {extOf(p.file.name).slice(1).toUpperCase()}
                    </span>
                    {p.durationSec ? (
                      <span className="absolute right-1 bottom-1 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-200">
                        <ClockIcon size={11} /> {formatDurSec(p.durationSec)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] leading-tight font-medium text-zinc-200" title={p.file.name}>
                        {p.file.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">{formatBytes(p.file.size)}</p>
                    </div>
                    {choosable || lockedVideo ? (
                      <div className="mt-auto">
                        <span className="mb-1 block text-[10px] font-semibold tracking-wide text-zinc-500 uppercase">
                          Output
                        </span>
                        {choosable ? (
                          <div className="flex rounded-md border border-zinc-700 text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={() =>
                                setPending((prev) =>
                                  prev ? prev.map((x, j) => (j === i ? { ...x, format: "webp" } : x)) : prev
                                )
                              }
                              className={`flex-1 rounded-l-md px-2 py-1 ${
                                p.format === "webp" ? "bg-green-700 text-white" : "text-zinc-300 hover:bg-zinc-800"
                              }`}
                            >
                              webp
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPending((prev) =>
                                  prev ? prev.map((x, j) => (j === i ? { ...x, format: "webm" } : x)) : prev
                                )
                              }
                              className={`flex-1 rounded-r-md px-2 py-1 ${
                                p.format === "webm" ? "bg-green-700 text-white" : "text-zinc-300 hover:bg-zinc-800"
                              }`}
                            >
                              webm
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-300">
                            <LockSimpleIcon size={11} /> webm
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {skippedCount > 0 && (
            <p className="text-xs text-amber-400">
              Skipped {skippedCount} unsupported file{skippedCount > 1 ? "s" : ""} - png, jpg, webp, gif, apng or video
              only
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 border-t border-zinc-800 pt-3 sm:grid-cols-3">
            {!replaceTarget && (
              <label className="block text-xs text-zinc-400">
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
            )}
            <label className="block text-xs text-zinc-400">
              <span className="mb-1 block font-semibold tracking-wide uppercase">Quality</span>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className={`${numberInputCls} pr-8`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-zinc-500">
                  %
                </span>
              </div>
            </label>
            <label className="block text-xs text-zinc-400">
              <span className="mb-1 block font-semibold tracking-wide uppercase">Max width</span>
              <div className="relative">
                <input
                  type="number"
                  min={64}
                  max={4096}
                  step={64}
                  value={maxWidth}
                  onChange={(e) => setMaxWidth(Number(e.target.value))}
                  className={`${numberInputCls} pr-9`}
                />
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-zinc-500">
                  px
                </span>
              </div>
            </label>
          </div>

          <p className="text-[11px] leading-relaxed text-zinc-600">
            Files convert on save into public/assets/content (animated ones get a .static.webp first-frame poster). Gifs
            and animated webp default to a lightweight webp - great for short loops - but you can switch each to VP9
            webm. Video and apng always become webm. Run Regenerate blurhash afterwards to update placeholders.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={() => {
                if (replaceTarget) setReplaceTarget(null);
                cancelStaging();
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={replaceTarget ? startReplace : startUpload}>
              <UploadSimpleIcon size={14} />
              {replaceTarget ? "Replace" : `Upload ${pending.length} file${pending.length > 1 ? "s" : ""}`}
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
              Saved as .webp (or .webm for video/animation). References in posts/wiki/authors update automatically; run
              Regenerate blurhash afterwards to update placeholders.
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
