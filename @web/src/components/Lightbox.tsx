import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import SmartImage from "@/components/SmartImage";
import { BlurhashCanvas } from "@/components/BlurhashCanvas";
import { getHash } from "@/utils/blurhash";
import { useLanguage } from "@/context/useLanguage";

interface LightboxProps {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const CLICK_ZOOM = 2;
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

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent";

interface StageProps {
  src: string;
  alt: string;
  onClose: () => void;
  onSwipe: (dir: 1 | -1) => void;
}

const Stage = ({ src, alt, onClose, onSwipe }: StageProps) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [smooth, setSmooth] = useState(true);
  const [ratio, setRatio] = useState<number | null>(null);

  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  const gesture = useRef<Gesture | null>(null);
  const swallowClick = useRef(false);
  const rightButtonArmed = useRef(false);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0 && el.naturalHeight > 0) {
      setRatio(el.naturalWidth / el.naturalHeight);
    }
  }, []);

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
    const frame = frameRef.current;
    if (!frame) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      pointerOrigin(event.clientX, event.clientY);
      setSmooth(false);
      const next = clamp(zoomRef.current * Math.exp(-event.deltaY * WHEEL_SPEED), MIN_ZOOM, MAX_ZOOM);
      setZoom(next);
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
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
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = gesture.current;
    if (!state || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (Math.abs(dx) > MOVE_EPSILON || Math.abs(dy) > MOVE_EPSILON) state.moved = true;
    if (state.panning) setOffset({ x: state.baseX + dx, y: state.baseY + dy });
  };

  const endGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
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
  };

  const onStageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
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
    pointerOrigin(event.clientX, event.clientY);
    setSmooth(true);
    if (zoomRef.current > MIN_ZOOM) {
      setZoom(MIN_ZOOM);
      setOffset({ x: 0, y: 0 });
    } else {
      setZoom(CLICK_ZOOM);
    }
  };

  const onContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (rightButtonArmed.current || zoomRef.current > MIN_ZOOM || gesture.current) {
      event.preventDefault();
    }
  };

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onClick={onStageClick}
      onContextMenu={onContextMenu}
      className={`flex size-full min-h-0 touch-none select-none items-center justify-center ${
        zoom > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
      }`}
    >
      <div
        ref={stageRef}
        className={`relative max-w-full overflow-hidden rounded-lg ${ratio ? "" : "min-h-40 min-w-40"}`}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: smooth ? "transform 250ms ease-out" : "none",
        }}
      >
        <BlurhashCanvas hash={getHash(src) ?? ""} className="absolute inset-0 size-full" />
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          draggable={false}
          onLoad={(event) => updateRatio(event.currentTarget)}
          className={`relative block object-contain max-h-[90svh] supports-[height:100dvh]:max-h-[90dvh] ${
            ratio ? "" : "invisible"
          }`}
        />
      </div>
    </div>
  );
};

const Lightbox = ({ images, index, onIndexChange, onClose }: LightboxProps) => {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);

  const go = useCallback(
    (dir: 1 | -1) => onIndexChange((index + dir + images.length) % images.length),
    [index, images.length, onIndexChange]
  );

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
        return;
      }
      if (event.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [go, onClose]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  useEffect(() => {
    [-1, 1].forEach((delta) => {
      new Image().src = images[(index + delta + images.length) % images.length];
    });
  }, [images, index]);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t.lightbox.label}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 backdrop-blur-sm"
    >
      <div className="flex shrink-0 items-center justify-end p-4">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t.lightbox.close}
          className={`rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-mc-green hover:text-black ${focusRing}`}
        >
          <XIcon size={22} weight="bold" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t.lightbox.prev}
              className={`absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-mc-green hover:text-black ${focusRing}`}
            >
              <CaretLeftIcon size={26} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t.lightbox.next}
              className={`absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-mc-green hover:text-black ${focusRing}`}
            >
              <CaretRightIcon size={26} />
            </button>
          </>
        )}

        <Stage
          key={index}
          src={images[index]}
          alt={`Slide ${index + 1}`}
          onClose={onClose}
          onSwipe={(dir) => go(dir)}
        />
      </div>

      {images.length > 1 && (
        <nav aria-label={t.lightbox.label} className="shrink-0 border-t border-white/10 bg-black/60 p-3">
          <div className="flex justify-center">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {images.map((src, slide) => (
                <button
                  key={`${src}-${slide}`}
                  ref={slide === index ? activeThumbRef : undefined}
                  type="button"
                  onClick={() => onIndexChange(slide)}
                  aria-current={slide === index || undefined}
                  aria-label={`Slide ${slide + 1}`}
                  className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-md border transition-opacity ${
                    slide === index ? "border-mc-green opacity-100" : "border-white/10 opacity-50 hover:opacity-90"
                  } ${focusRing}`}
                >
                  <SmartImage src={src} alt="" fit="cover" className="size-full" priority="low" />
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}
    </div>,
    document.body
  );
};

export default Lightbox;
