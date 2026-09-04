import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { CaretLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import type { CarouselImage } from "@smc/shared/markdown";
import SmartImage from "@/components/media/SmartImage";
import { Stage } from "@/components/media/Stage";
import { useLanguage } from "@/context/useLanguage";
import { focusRing } from "@/utils/focusRing";
import { isVideoAsset, posterSrc } from "@/utils/media";

interface LightboxProps {
  images: CarouselImage[];
  index: number;
  initialTime?: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const Lightbox = ({ images, index, initialTime = 0, onIndexChange, onClose }: LightboxProps) => {
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const activeThumbRef = useRef<HTMLButtonElement>(null);
  const [openingIndex] = useState(index);

  const slideAlt = (slideIndex: number) => {
    const alt = images[slideIndex]?.alt?.trim();
    return alt || t.lightbox.slide.replace("{n}", String(slideIndex + 1));
  };

  const go = useCallback(
    (dir: 1 | -1) => onIndexChange((index + dir + images.length) % images.length),
    [index, images.length, onIndexChange]
  );

  const onSwipe = useCallback((dir: 1 | -1) => go(dir), [go]);

  const onBackdropClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus();
  }, []);

  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;
    root.inert = true;
    return () => {
      root.inert = false;
    };
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
        const allFocusables = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)") ?? [];
        const focusables = Array.from(allFocusables).filter((el) => !el.closest("[inert]"));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (first && event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (last && !event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
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
      new Image().src = images[(index + delta + images.length) % images.length]!.src;
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
          className={`rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white hover:text-black ${focusRing}`}
        >
          <XIcon size={22} weight="bold" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center" onClick={onBackdropClick}>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t.lightbox.prev}
              className={`absolute top-1/2 left-4 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black md:flex ${focusRing}`}
            >
              <CaretLeftIcon size={26} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t.lightbox.next}
              className={`absolute top-1/2 right-4 z-10 hidden -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black md:flex ${focusRing}`}
            >
              <CaretRightIcon size={26} />
            </button>
          </>
        )}

        <Stage
          key={index}
          src={images[index]!.src}
          alt={slideAlt(index)}
          initialTime={index === openingIndex ? initialTime : 0}
          onClose={onClose}
          onSwipe={onSwipe}
        />
      </div>

      {images.length > 1 && (
        <nav aria-label={t.lightbox.label} className="shrink-0 border-t border-white/10 bg-black/60 p-3">
          <div className="flex justify-center">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {images.map((image, slide) => (
                <button
                  key={`${image.src}-${slide}`}
                  ref={slide === index ? activeThumbRef : undefined}
                  type="button"
                  onClick={() => onIndexChange(slide)}
                  aria-current={slide === index || undefined}
                  aria-label={slideAlt(slide)}
                  className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-md border transition-opacity ${
                    slide === index ? "border-mc-green opacity-100" : "border-white/10 opacity-50 hover:opacity-90"
                  } ${focusRing}`}
                >
                  {isVideoAsset(image.src) ? (
                    <img src={posterSrc(image.src)} alt="" className="size-full object-cover" draggable={false} />
                  ) : (
                    <SmartImage src={image.src} alt="" fit="cover" className="size-full" priority="low" />
                  )}
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
