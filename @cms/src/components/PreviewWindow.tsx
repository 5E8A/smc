import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowClockwiseIcon, ArticleIcon, FrameCornersIcon, HouseIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "./fields";

const ORIGIN = "http://127.0.0.1:3000";
const HOME_URL = `${ORIGIN}/smc/`;

const MIN_W = 360;
const MIN_H = 240;
const DEFAULT_W = 720;
const DEFAULT_H = 520;
const MARGIN = 24;
const SCALE_MIN = 0.25;
const SCALE_MAX = 1;
const SCALE_STEP = 0.05;

type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Gesture =
  | { kind: "move"; dx: number; dy: number }
  | { kind: "resize"; dir: Dir; sx: number; sy: number; start: Rect; ratio: number | null };

const ZONES: Array<{ dir: Dir; cls: string; cursor: string }> = [
  { dir: "n", cls: "inset-x-4 top-0 h-4", cursor: "cursor-ns-resize" },
  { dir: "s", cls: "inset-x-4 bottom-0 h-4", cursor: "cursor-ns-resize" },
  { dir: "w", cls: "inset-y-4 left-0 w-4", cursor: "cursor-ew-resize" },
  { dir: "e", cls: "inset-y-4 right-0 w-4", cursor: "cursor-ew-resize" },
  { dir: "nw", cls: "top-0 left-0 size-5", cursor: "cursor-nwse-resize" },
  { dir: "ne", cls: "top-0 right-0 size-5", cursor: "cursor-nesw-resize" },
  { dir: "sw", cls: "bottom-0 left-0 size-5", cursor: "cursor-nesw-resize" },
  { dir: "se", cls: "bottom-0 right-0 size-5", cursor: "cursor-nwse-resize" },
];

const SCALE_OPTIONS = [1, 0.8, 0.66, 0.5, 0.33, 0.25];

function applyResize(g: Extract<Gesture, { kind: "resize" }>, px: number, py: number): Rect {
  const east = g.dir.includes("e");
  const west = g.dir.includes("w");
  const north = g.dir.includes("n");
  const south = g.dir.includes("s");
  const dx = px - g.sx;
  const dy = py - g.sy;

  let w: number;
  let h: number;

  if (g.ratio != null) {
    const hasH = east || west;
    const hasV = north || south;
    const horizDriven = hasH && (!hasV || Math.abs(dx) >= Math.abs(dy));
    const maxW = window.innerWidth - MARGIN;
    const maxH = window.innerHeight - MARGIN;
    if (horizDriven) {
      w = Math.min(Math.max(g.start.w + dx, MIN_W), maxW);
      h = w / g.ratio;
      if (h < MIN_H) {
        h = MIN_H;
        w = h * g.ratio;
      } else if (h > maxH) {
        h = maxH;
        w = h * g.ratio;
      }
    } else {
      h = Math.min(Math.max(g.start.h + dy, MIN_H), maxH);
      w = h * g.ratio;
      if (w < MIN_W) {
        w = MIN_W;
        h = w / g.ratio;
      } else if (w > maxW) {
        w = maxW;
        h = w / g.ratio;
      }
    }
  } else {
    w = east || west ? Math.max(MIN_W, g.start.w + dx) : g.start.w;
    h = north || south ? Math.max(MIN_H, g.start.h + dy) : g.start.h;
    w = Math.min(w, window.innerWidth - MARGIN);
    h = Math.min(h, window.innerHeight - MARGIN);
  }

  let x = g.start.x;
  let y = g.start.y;
  if (west) x = g.start.x + (g.start.w - w);
  if (north) y = g.start.y + (g.start.h - h);
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

export const PreviewWindow = ({ entryPath, onClose }: { entryPath: string | null; onClose: () => void }) => {
  const [rect, setRect] = useState<Rect>(() => {
    const w = Math.max(MIN_W, Math.min(DEFAULT_W, window.innerWidth - MARGIN * 2));
    const h = Math.max(MIN_H, Math.min(DEFAULT_H, window.innerHeight - 120));
    return { x: Math.max(MARGIN, window.innerWidth - w - MARGIN), y: 64, w, h };
  });
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [src, setSrc] = useState(HOME_URL);
  const [frameKey, setFrameKey] = useState(0);
  const [online, setOnline] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const [scale, setScale] = useState(1);
  const [ctrlHeld, setCtrlHeld] = useState(false);
  const gestureRef = useRef<Gesture | null>(null);
  const widthRef = useRef(0);
  const lockRatioRef = useRef<number | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    widthRef.current = rect.w;
  }, [rect.w]);

  const gesturing = gesture !== null;

  const probe = useCallback(
    () =>
      fetch(HOME_URL, { mode: "no-cors" })
        .then(() => setOnline(true))
        .catch(() => setOnline(false)),
    []
  );

  useEffect(() => {
    let alive = true;
    const guarded = () => {
      if (!alive) return;
      void probe();
    };
    guarded();
    const t = window.setInterval(guarded, 10000);
    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, [probe]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setScale((s) => Math.min(SCALE_MAX, Math.max(SCALE_MIN, s + (e.deltaY < 0 ? SCALE_STEP : -SCALE_STEP))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const sync = (e: KeyboardEvent) => setCtrlHeld(e.ctrlKey || e.metaKey);
    const off = () => setCtrlHeld(false);
    window.addEventListener("keydown", sync);
    window.addEventListener("keyup", sync);
    window.addEventListener("blur", off);
    return () => {
      window.removeEventListener("keydown", sync);
      window.removeEventListener("keyup", sync);
      window.removeEventListener("blur", off);
    };
  }, []);

  const beginMove = (e: React.MouseEvent) => {
    if (e.button !== 2 || gesturing) return;
    e.preventDefault();
    const g: Gesture = { kind: "move", dx: e.clientX - rect.x, dy: e.clientY - rect.y };
    gestureRef.current = g;
    setGesture(g);
  };

  const beginResize = (dir: Dir) => (e: React.MouseEvent) => {
    if (e.button !== 2 || gesturing) return;
    e.preventDefault();
    e.stopPropagation();
    const g: Gesture = { kind: "resize", dir, sx: e.clientX, sy: e.clientY, start: rect, ratio: lockRatioRef.current };
    gestureRef.current = g;
    setGesture(g);
  };

  useEffect(() => {
    if (!gesturing) return;
    const clampPos = (x: number, y: number) => ({
      x: Math.min(Math.max(x, -(widthRef.current - 80)), window.innerWidth - 80),
      y: Math.min(Math.max(y, 0), Math.max(0, window.innerHeight - 40)),
    });
    const onMove = (e: MouseEvent) => {
      const g = gestureRef.current;
      if (!g) return;
      if (g.kind === "move") {
        const p = clampPos(e.clientX - g.dx, e.clientY - g.dy);
        setRect((prev) => ({ ...prev, ...p }));
      } else {
        setRect(applyResize(g, e.clientX, e.clientY));
      }
    };
    const onUp = () => {
      gestureRef.current = null;
      setGesture(null);
    };
    const onCtx = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("contextmenu", onCtx);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("contextmenu", onCtx);
    };
  }, [gesturing]);

  const toggleLock = () => {
    const next = !locked;
    lockRatioRef.current = next ? rect.w / rect.h : null;
    setLocked(next);
  };

  const reload = () => {
    void probe();
    setFrameKey((k) => k + 1);
  };

  const goHome = () => {
    setSrc(HOME_URL);
    setFrameKey((k) => k + 1);
  };

  const openEntry = () => {
    if (!entryPath) return;
    setSrc(ORIGIN + entryPath);
    setFrameKey((k) => k + 1);
  };

  const dotCls = online === true ? "bg-green-500" : online === false ? "bg-red-500" : "animate-pulse bg-amber-400";

  return (
    <div
      className="fixed z-50 flex touch-none flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl select-none"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
      onMouseDown={beginMove}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
        <span className={`size-2 rounded-full ${dotCls}`} />
        <span className="text-xs font-bold text-white">Live preview</span>
        <span className="font-mono text-[10px] text-zinc-500">127.0.0.1:3000</span>
        <button
          type="button"
          aria-label="Close preview"
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="ml-auto rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
        >
          <XIcon size={13} />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-800 px-2 py-1.5">
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={goHome}>
          <HouseIcon size={12} /> Home
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={reload}>
          <ArrowClockwiseIcon size={12} /> Reload
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={openEntry} disabled={!entryPath}>
          <ArticleIcon size={12} /> Open current entry
        </Button>
        <Button
          variant={locked ? "primary" : "ghost"}
          className="px-2 py-1 text-xs"
          title={locked ? "Aspect ratio locked - click to unlock" : "Lock aspect ratio while resizing"}
          onClick={toggleLock}
        >
          <FrameCornersIcon size={12} />
        </Button>
        <span className="ml-auto hidden pr-1 text-[10px] whitespace-nowrap text-zinc-600 xl:inline">
          right-drag to move · edges resize · ctrl+scroll scales
        </span>
        <select
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          title="Preview zoom"
          className="rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-xs text-zinc-300 outline-none focus:border-green-500"
        >
          {SCALE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {Math.round(s * 100)}%
            </option>
          ))}
        </select>
      </div>

      <div ref={bodyRef} className="relative min-h-0 flex-1 overflow-hidden bg-zinc-900">
        <div
          className="origin-top-left"
          style={{ width: `${100 / scale}%`, height: `${100 / scale}%`, transform: `scale(${scale})` }}
        >
          <iframe
            key={`${frameKey}:${src}`}
            src={src}
            title="Live site preview"
            className={`h-full w-full border-0 bg-white ${gesturing ? "pointer-events-none" : ""}`}
          />
        </div>
        {gesturing && <div className="absolute inset-0 z-10 cursor-move" />}
        {ctrlHeld && (
          <div title="Ctrl+scroll to zoom preview" className="absolute inset-0 z-[15] cursor-zoom-in bg-green-500/5" />
        )}
        {online === false && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center">
            <p className="text-sm font-semibold text-red-400">Dev server not reachable on port 3000</p>
            <p className="max-w-sm text-xs text-zinc-500">
              Start the main site with <code className="rounded bg-zinc-800 px-1 font-mono">npm run dev</code>, then
              retry. The preview embeds your locally running dev server.
            </p>
            <Button variant="default" className="px-3 py-1.5 text-xs" onClick={() => void probe()}>
              <ArrowClockwiseIcon size={12} /> Retry
            </Button>
          </div>
        )}
      </div>

      {ZONES.map((z) => (
        <div
          key={z.dir}
          onMouseDown={beginResize(z.dir)}
          className={`absolute z-30 ${z.cls} ${z.cursor} ${gesturing ? "pointer-events-none" : ""}`}
        />
      ))}
    </div>
  );
};
