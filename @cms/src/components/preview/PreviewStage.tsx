import { useEffect, useMemo, useState } from "react";
import type { DevicePreset, DeviceType } from "../../lib/presets";
import { DeviceFrame } from "./DeviceFrame";

interface FrameState {
  visible: boolean;
  loaded: boolean;
}

interface StageState {
  frames: Record<string, FrameState>;
  loadingId: string | null;
}

const idOf = (p: DevicePreset) => `${p.name}:${p.w}x${p.h}`;

const isWide = (t: DeviceType): boolean => t === "laptop" || t === "desktop";
const isTablet = (t: DeviceType): boolean => t === "tablet" || t === "tablet-android";

const MAX_DEVICE_H_FRACTION = 0.8;
const MAX_DEVICE_W_FRACTION = 0.4;

function withFrame(prev: StageState, id: string, patch: (f: FrameState) => FrameState): StageState {
  const frames = { ...prev.frames, [id]: patch(prev.frames[id]) };
  return { frames, loadingId: prev.loadingId };
}

interface PreviewStageProps {
  presets: DevicePreset[];
  url: string;
  onCustomChange?: (w: number, h: number) => void;
  onLoadedCountChange?: (loaded: number) => void;
}

export const PreviewStage = ({ presets, url, onCustomChange, onLoadedCountChange }: PreviewStageProps) => {
  const [state, setState] = useState<StageState>({ frames: {}, loadingId: null });
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  const loadedCount = useMemo(
    () => presets.filter((p) => state.frames[idOf(p)]?.loaded).length,
    [presets, state.frames]
  );

  useEffect(() => {
    onLoadedCountChange?.(loadedCount);
  }, [loadedCount, onLoadedCountChange]);

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const maxDeviceH = viewport.h * MAX_DEVICE_H_FRACTION;
  const maxDeviceW = viewport.w * MAX_DEVICE_W_FRACTION;

  const phones = useMemo(() => presets.filter((p) => !isWide(p.type) && !isTablet(p.type)), [presets]);
  const tablets = useMemo(() => presets.filter((p) => isTablet(p.type)), [presets]);
  const wide = useMemo(() => presets.filter((p) => isWide(p.type)), [presets]);

  const tick = (frames: Record<string, FrameState>): string | null => {
    const next = presets.find((p) => {
      const f = frames[idOf(p)];
      return f && f.visible && !f.loaded;
    });
    return next ? idOf(next) : null;
  };

  const handleVisible = (p: DevicePreset) => (visible: boolean) => {
    const id = idOf(p);
    setState((prev) => {
      if (prev.frames[id]?.visible === visible) return prev;
      const next = withFrame(prev, id, (f) => ({ visible, loaded: f?.loaded ?? false }));
      let loadingId = prev.loadingId;
      if (!visible && loadingId === id) loadingId = null;
      if (loadingId === null) loadingId = tick(next.frames);
      return { ...next, loadingId };
    });
  };

  const handleIframeLoad = (p: DevicePreset) => () => {
    const id = idOf(p);
    setState((prev) => {
      let next = withFrame(prev, id, (f) => ({ visible: f?.visible ?? false, loaded: true }));
      if (prev.loadingId === id) {
        const assigned = tick(next.frames);
        next = { ...next, loadingId: assigned };
      }
      return next;
    });
  };

  const handleReload = (p: DevicePreset) => () => {
    const id = idOf(p);
    setState((prev) => {
      let next = withFrame(prev, id, (f) => ({ visible: f?.visible ?? false, loaded: false }));
      if (prev.loadingId === null) {
        const assigned = tick(next.frames);
        next = { ...next, loadingId: assigned };
      }
      return next;
    });
  };

  const renderFrame = (p: DevicePreset) => {
    const id = idOf(p);
    const frame = state.frames[id];
    const turn = state.loadingId === id && !frame?.loaded;
    return (
      <DeviceFrame
        key={id}
        preset={p}
        src={url}
        turn={turn}
        maxDeviceH={maxDeviceH}
        maxDeviceW={maxDeviceW}
        onVisible={handleVisible(p)}
        onIframeLoad={handleIframeLoad(p)}
        onReload={handleReload(p)}
        onCustomChange={onCustomChange}
      />
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {phones.length > 0 && (
        <div className="flex flex-wrap justify-center items-end gap-6">{phones.map(renderFrame)}</div>
      )}
      {tablets.length > 0 && (
        <div className="flex flex-wrap justify-center items-end gap-6">{tablets.map(renderFrame)}</div>
      )}
      {wide.length > 0 && <div className="flex flex-wrap justify-center items-end gap-6">{wide.map(renderFrame)}</div>}
    </div>
  );
};
