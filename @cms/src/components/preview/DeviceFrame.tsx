import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowClockwiseIcon,
  DeviceRotateIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react";
import type { DevicePreset, DeviceType } from "../../lib/presets";
import { MIN_DIM, MAX_DIM } from "../../lib/presets";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

const clamp = (v: number) => Math.min(Math.max(v, MIN_DIM), MAX_DIM);

const CHROME: Record<DeviceType, string> = {
  phone: "rounded-[44px] bg-zinc-900 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-2 ring-zinc-700/60",
  android:
    "rounded-[36px] bg-zinc-900 pt-10 pr-3 pb-11 pl-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ring-2 ring-zinc-700/60",
  tablet: "rounded-[22px] bg-zinc-900 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-2 ring-zinc-700/60",
  "tablet-android": "rounded-[22px] bg-zinc-900 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-2 ring-zinc-700/60",
  laptop: "rounded-t-[14px] bg-zinc-900 pt-3 pr-3 pl-3 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] ring-2 ring-zinc-700/60",
  desktop: "rounded-[14px] bg-zinc-900 p-3.5 pb-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-2 ring-zinc-700/60",
  custom: "rounded-[14px] bg-zinc-900 p-3.5 pb-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-2 ring-zinc-700/60",
};

const SCREEN_RADIUS: Record<DeviceType, string> = {
  phone: "rounded-[30px]",
  android: "rounded-[26px]",
  tablet: "rounded-[8px]",
  "tablet-android": "rounded-[8px]",
  laptop: "rounded-t-[8px]",
  desktop: "rounded-[6px]",
  custom: "rounded-[6px]",
};

interface DeviceFrameProps {
  preset: DevicePreset;
  src: string;
  turn: boolean;
  maxDeviceH: number;
  maxDeviceW: number;
  onVisible: (visible: boolean) => void;
  onIframeLoad: () => void;
  onReload: () => void;
  onCustomChange?: (w: number, h: number) => void;
}

export const DeviceFrame = ({
  preset,
  src,
  turn,
  maxDeviceH,
  maxDeviceW,
  onVisible,
  onIframeLoad,
  onReload,
  onCustomChange,
}: DeviceFrameProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(preset.zoom ?? 1);
  const [rotated, setRotated] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [token, setToken] = useState(0);
  const loadedRef = useRef(false);

  const isCustom = preset.name === "Custom";
  const [focused, setFocused] = useState(false);
  const [draftW, setDraftW] = useState(String(preset.w));
  const [draftH, setDraftH] = useState(String(preset.h));

  const commitCustom = useCallback(() => {
    const w = clamp(Number(draftW) || 0);
    const h = clamp(Number(draftH) || 0);
    if (w > 0 && h > 0 && (w !== preset.w || h !== preset.h)) onCustomChange?.(w, h);
  }, [draftW, draftH, preset.w, preset.h, onCustomChange]);

  useEffect(() => {
    if (!isCustom) return;
    const t = window.setTimeout(commitCustom, 1000);
    return () => window.clearTimeout(t);
  }, [draftW, draftH, isCustom, commitCustom]);

  const focusCustom = () => {
    setDraftW(String(preset.w));
    setDraftH(String(preset.h));
    setFocused(true);
  };

  const blurCustom = () => {
    commitCustom();
    setFocused(false);
  };

  const shownW = focused ? draftW : String(preset.w);
  const shownH = focused ? draftH : String(preset.h);

  const effW = rotated ? preset.h : preset.w;
  const effH = rotated ? preset.w : preset.h;
  // true 1:1 by default; scale down only to fit the stage (80vh / width caps)
  const fit = Math.min(1, maxDeviceH / effH, maxDeviceW / effW);
  const displayW = effW * fit;
  const displayH = effH * fit;
  const radius = SCREEN_RADIUS[preset.type];

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) onVisible(e.isIntersecting);
      },
      { rootMargin: "200px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onVisible]);

  useEffect(() => {
    if (turn && !loaded) loadedRef.current = false;
  }, [turn, loaded]);

  const handleLoad = () => {
    loadedRef.current = true;
    setLoaded(true);
    onIframeLoad();
  };

  const handleReload = () => {
    loadedRef.current = false;
    setLoaded(false);
    setToken((t) => t + 1);
    onReload();
  };

  const renderIframe = turn || loaded;

  return (
    <div ref={rootRef} className="flex w-fit shrink-0 flex-col items-center gap-2">
      <div className="flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap text-zinc-400">
        <span>{preset.name}</span>
        {isCustom ? (
          <span className="flex items-center gap-0.5 font-mono text-zinc-600">
            <input
              type="number"
              min={MIN_DIM}
              max={MAX_DIM}
              value={shownW}
              onChange={(e) => setDraftW(e.target.value)}
              onFocus={focusCustom}
              onBlur={blurCustom}
              aria-label="Custom width"
              className="w-12 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-right font-mono text-[10px] text-zinc-200 outline-none focus:border-green-500"
            />
            <span>×</span>
            <input
              type="number"
              min={MIN_DIM}
              max={MAX_DIM}
              value={shownH}
              onChange={(e) => setDraftH(e.target.value)}
              onFocus={focusCustom}
              onBlur={blurCustom}
              aria-label="Custom height"
              className="w-12 rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 text-right font-mono text-[10px] text-zinc-200 outline-none focus:border-green-500"
            />
          </span>
        ) : (
          <span className="font-mono text-zinc-600">
            {effW}×{effH}
          </span>
        )}
      </div>

      <div className={`relative ${CHROME[preset.type]}`}>
        {preset.type === "phone" && (
          <>
            <div className="absolute top-3.5 left-1/2 z-10 h-[24px] w-[60%] -translate-x-1/2 rounded-b-[16px] bg-zinc-900" />
            <div className="absolute bottom-3 left-1/2 z-10 h-[4px] w-[60%] -translate-x-1/2 rounded-full bg-white/25" />
          </>
        )}
        {preset.type === "android" && (
          <>
            <div className="absolute top-3 left-1/2 z-10 size-[10px] -translate-x-1/2 rounded-full border-2 border-zinc-700 bg-zinc-950" />
            <div className="absolute bottom-1.5 left-0 right-0 z-10 flex items-center justify-center gap-4 text-zinc-400">
              <span className="text-[11px] leading-none">◁</span>
              <span className="size-2 rounded-full border border-zinc-500" />
              <span className="text-[11px] leading-none">▢</span>
            </div>
          </>
        )}
        {preset.type === "tablet" && (
          <div className="absolute top-1/2 -right-1 z-10 h-6 w-[3px] -translate-y-1/2 rounded-r bg-zinc-700" />
        )}

        <div className={`relative overflow-hidden bg-black ${radius}`} style={{ width: displayW, height: displayH }}>
          {renderIframe && (
            <div
              className="origin-top-left"
              style={{
                width: effW / zoom,
                height: effH / zoom,
                transform: `scale(${fit * zoom})`,
              }}
            >
              <iframe
                key={`${token}:${src}`}
                src={src}
                title={`${preset.name} preview`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={handleLoad}
                className="block h-full w-full border-0 bg-white"
              />
            </div>
          )}

          {turn && !loaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/95">
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <span className="size-3 animate-spin rounded-full border-2 border-zinc-700 border-t-green-500" />
                Loading…
              </div>
            </div>
          )}

          {!turn && !loaded && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <span className="text-[10px] text-zinc-600">waiting…</span>
            </div>
          )}
        </div>
      </div>

      {loaded && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Rotate orientation"
            onClick={() => setRotated((r) => !r)}
            className={
              rotated
                ? "rounded bg-green-800 px-1 py-0.5 text-white hover:bg-green-700"
                : "rounded bg-zinc-800 px-1 py-0.5 text-zinc-300 hover:bg-zinc-700"
            }
          >
            <DeviceRotateIcon size={11} />
          </button>
          <button
            type="button"
            title="Zoom out"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100))}
            className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
          >
            <MagnifyingGlassMinusIcon size={11} />
          </button>
          <span
            className="w-8 text-center font-mono text-[9px] text-zinc-500"
            title={preset.zoom ? `recommended ${Math.round(preset.zoom * 100)}%` : undefined}
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            title="Zoom in"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100))}
            className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40"
          >
            <MagnifyingGlassPlusIcon size={11} />
          </button>
          <button
            type="button"
            title="Reload"
            onClick={handleReload}
            className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-300 hover:bg-zinc-700"
          >
            <ArrowClockwiseIcon size={11} />
          </button>
        </div>
      )}
    </div>
  );
};
