import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { BlurhashCanvas } from "@/components/media/BlurhashCanvas";
import { MediaControls } from "@/components/media/MediaControls";
import { PlaybackToggleButton } from "@/components/media/PlaybackToggleButton";
import { usePlaybackGate, usePrefersReducedMotion } from "@/hooks/usePlaybackGate";
import { getHash } from "@/utils/blurhash";
import { isAnimatedAsset, isVideoAsset, posterSrc, staticVariantSrc } from "@/utils/media";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const WHEEL_SPEED = 0.0025;
const SWIPE_THRESHOLD = 50;
const MOVE_EPSILON = 6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface Gesture {
  pointerId: number;
  button: number;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
  panning: boolean;
  moved: boolean;
}

interface StageProps {
  src: string;
  alt: string;
  initialTime?: number;
  onClose: () => void;
  onSwipe: (dir: 1 | -1) => void;
}

export const Stage = ({ src, alt, initialTime, onClose, onSwipe }: StageProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const video = isVideoAsset(src);
  const reduced = usePrefersReducedMotion();
  const gated = isAnimatedAsset(src) && reduced;
  const gate = usePlaybackGate(gated);

  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [smooth, setSmooth] = useState(true);
  const [ratio, setRatio] = useState<number | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  const gesture = useRef<Gesture | null>(null);
  const swallowClick = useRef(false);
  const rightButtonArmed = useRef(false);

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    if (video && !videoRef.current?.paused) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [video]);

  const hideControls = useCallback(() => {
    clearTimeout(hideTimer.current);
    setControlsVisible(false);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    if (video) return;
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0 && el.naturalHeight > 0) {
      setRatio(el.naturalWidth / el.naturalHeight);
    }
  }, [video]);

  function updateRatio(el: HTMLImageElement) {
    if (el.naturalWidth > 0 && el.naturalHeight > 0) {
      setRatio(el.naturalWidth / el.naturalHeight);
    }
  }

  function pointerOrigin(clientX: number, clientY: number) {
    const frame = frameRef.current;
    const stage = stageRef.current;
    if (!frame || !stage || stage.offsetWidth === 0 || stage.offsetHeight === 0) return;
    const frameRect = frame.getBoundingClientRect();
    const left = (frame.clientWidth - stage.offsetWidth) / 2;
    const top = (frame.clientHeight - stage.offsetHeight) / 2;
    setOrigin({
      x: clamp(((clientX - frameRect.left - left) / stage.offsetWidth) * 100, 0, 100),
      y: clamp(((clientY - frameRect.top - top) / stage.offsetHeight) * 100, 0, 100),
    });
  }

  useEffect(() => {
    if (video) return;
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (event: WheelEvent) => {
      pointerOrigin(event.clientX, event.clientY);
      setSmooth(false);
      const next = clamp(zoomRef.current * Math.exp(-event.deltaY * WHEEL_SPEED), MIN_ZOOM, MAX_ZOOM);
      setZoom(next);
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [video]);

  useEffect(() => {
    if (!video) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === " " || event.code === "Space") {
        const target = event.target;
        if (target instanceof Element && target.closest("button, a, input, select, textarea, [role='button']")) return;
        event.preventDefault();
        const el = videoRef.current;
        if (!el) return;
        if (el.paused) void el.play();
        else el.pause();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [video]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (video) return;
      if (event.pointerType === "mouse" && event.button !== 0 && event.button !== 2) return;
      if (event.button === 2) rightButtonArmed.current = true;
      gesture.current = {
        pointerId: event.pointerId,
        button: event.button,
        startX: event.clientX,
        startY: event.clientY,
        baseX: offsetRef.current.x,
        baseY: offsetRef.current.y,
        panning: zoomRef.current > MIN_ZOOM,
        moved: false,
      };
      if (zoomRef.current > MIN_ZOOM) setSmooth(false);
      frameRef.current?.setPointerCapture(event.pointerId);
    },
    [video]
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (video) resetHideTimer();
      const state = gesture.current;
      if (!state || event.pointerId !== state.pointerId) return;
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      if (Math.abs(dx) > MOVE_EPSILON || Math.abs(dy) > MOVE_EPSILON) state.moved = true;
      if (state.panning) setOffset({ x: state.baseX + dx, y: state.baseY + dy });
    },
    [video, resetHideTimer]
  );

  const endGesture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const state = gesture.current;
      if (!state || event.pointerId !== state.pointerId) return;
      gesture.current = null;
      if (state.button === 2) rightButtonArmed.current = false;
      frameRef.current?.releasePointerCapture(event.pointerId);
      swallowClick.current = state.moved;
      if (!state.panning && state.moved) {
        const dx = event.clientX - state.startX;
        const dy = event.clientY - state.startY;
        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > 2 * Math.abs(dy)) {
          setSmooth(true);
          onSwipe(dx < 0 ? 1 : -1);
        }
      }
    },
    [onSwipe]
  );

  const onStageClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (swallowClick.current) {
        swallowClick.current = false;
        return;
      }
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        onClose();
        return;
      }

      if (video) {
        const el = videoRef.current;
        if (el) {
          if (el.paused) void el.play();
          else el.pause();
        }
      }
    },
    [onClose, video]
  );

  const onContextMenu = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (rightButtonArmed.current || zoomRef.current > MIN_ZOOM || gesture.current) {
      event.preventDefault();
    }
  }, []);

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onClick={onStageClick}
      onContextMenu={onContextMenu}
      onMouseEnter={video ? resetHideTimer : undefined}
      onMouseLeave={video ? hideControls : undefined}
      {...(video ? {} : gate.hoverProps)}
      className="flex size-full min-h-0 touch-none select-none items-center justify-center"
    >
      <div
        ref={stageRef}
        data-video-wrapper
        className={`relative max-w-full overflow-hidden rounded-none md:rounded-lg ${ratio ? "" : "min-h-40 min-w-40"} ${
          video ? "cursor-pointer" : "cursor-default"
        }`}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: smooth ? "transform 250ms ease-out" : "none",
        }}
      >
        <BlurhashCanvas hash={getHash(src) ?? ""} className="absolute inset-0 size-full" />
        {video ? (
          <>
            <video
              ref={videoRef}
              src={src}
              poster={posterSrc(src)}
              aria-label={alt}
              muted
              loop
              playsInline
              autoPlay
              controls={false}
              preload="metadata"
              draggable={false}
              onPlay={resetHideTimer}
              onPause={() => setControlsVisible(true)}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth > 0 && v.videoHeight > 0) setRatio(v.videoWidth / v.videoHeight);
                if (initialTime && initialTime > 0) v.currentTime = initialTime;
              }}
              className={`relative block object-contain max-h-[80svh] supports-[height:100dvh]:max-h-[80dvh] ${
                ratio ? "" : "invisible"
              }`}
            />
            <MediaControls videoRef={videoRef} visible={controlsVisible} />
          </>
        ) : (
          <>
            <img
              ref={imgRef}
              src={gated && !gate.playing ? staticVariantSrc(src) : src}
              alt={alt}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              draggable={false}
              onLoad={(event) => updateRatio(event.currentTarget)}
              className={`relative block object-contain max-h-[80svh] supports-[height:100dvh]:max-h-[80dvh] ${
                ratio ? "" : "invisible"
              }`}
            />
            {gated && (
              <PlaybackToggleButton
                playing={gate.playing}
                onToggle={gate.toggle}
                className="absolute right-2 bottom-2"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
