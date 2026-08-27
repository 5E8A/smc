import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { getHash } from "@/utils/blurhash";
import { isAnimatedAsset, isVideoAsset, posterSrc, staticVariantSrc } from "@/utils/media";
import { usePlaybackGate, usePrefersReducedMotion } from "@/hooks/usePlaybackGate";
import { BlurhashCanvas } from "./BlurhashCanvas";
import { MediaControls } from "./MediaControls";
import { PlaybackToggleButton } from "./PlaybackToggleButton";

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: "high" | "low";
  lazy?: boolean;
  fit?: "cover" | "contain" | "natural";
  className?: string;
  controls?: boolean;
  onVideoRef?: (el: HTMLVideoElement | null) => void;
}

const SmartImage = ({
  src,
  alt,
  width,
  height,
  priority,
  lazy = true,
  fit = "cover",
  className = "",
  controls = false,
  onVideoRef,
}: SmartImageProps) => {
  const hash = getHash(src);
  const video = isVideoAsset(src);
  const animated = isAnimatedAsset(src) || video;
  const reduced = usePrefersReducedMotion();
  const gated = animated && reduced;
  const gate = usePlaybackGate(gated);

  const wrapperStyle: CSSProperties = {};
  if (width && height) {
    wrapperStyle.width = width;
    wrapperStyle.height = height;
  }

  const layout =
    fit === "natural"
      ? "relative block h-auto max-w-full"
      : `absolute inset-0 size-full ${fit === "contain" ? "object-contain" : "object-cover"}`;

  const imgProps = {
    alt,
    width,
    height,
    loading: (lazy ? "lazy" : "eager") as "lazy" | "eager",
    decoding: "async" as const,
    fetchPriority: priority,
  };

  if (video) {
    return (
      <VideoSmartImage
        src={src}
        layout={layout}
        className={className}
        wrapperStyle={wrapperStyle}
        hash={hash}
        gated={gated}
        gate={gate}
        controls={controls}
        onVideoRef={onVideoRef}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={wrapperStyle} {...(gated ? gate.hoverProps : {})}>
      <BlurhashCanvas hash={hash ?? ""} className="absolute inset-0 size-full" />
      {gated ? (
        <>
          <img {...imgProps} src={gate.playing ? src : staticVariantSrc(src)} draggable={false} className={layout} />
          <PlaybackToggleButton playing={gate.playing} onToggle={gate.toggle} className="absolute right-2 bottom-2" />
        </>
      ) : (
        <img {...imgProps} src={src} className={layout} />
      )}
    </div>
  );
};

interface VideoSmartImageProps {
  src: string;
  layout: string;
  className: string;
  wrapperStyle: CSSProperties;
  hash: string | null;
  gated: boolean;
  gate: { playing: boolean; toggle: () => void; hoverProps: { onMouseEnter?: () => void; onMouseLeave?: () => void } };
  controls: boolean;
  onVideoRef?: (el: HTMLVideoElement | null) => void;
}

const VideoSmartImage = ({
  src,
  layout,
  className,
  wrapperStyle,
  hash,
  gated,
  gate,
  controls,
  onVideoRef,
}: VideoSmartImageProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [controlsVisible, setControlsVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    if (!videoRef.current?.paused) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, []);

  const hideControls = useCallback(() => {
    clearTimeout(hideTimer.current);
    setControlsVisible(false);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !controls) return;
    const onPause = () => setControlsVisible(true);
    const onPlay = () => showControls();
    el.addEventListener("pause", onPause);
    el.addEventListener("play", onPlay);
    return () => {
      el.removeEventListener("pause", onPause);
      el.removeEventListener("play", onPlay);
    };
  }, [controls, showControls]);

  const videoProps = {
    src,
    poster: posterSrc(src),
    muted: true,
    loop: true,
    playsInline: true,
    controls: false,
    preload: "metadata" as const,
    className: layout,
    draggable: false,
  };

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }, []);

  return (
    <div
      data-video-wrapper
      className={`relative overflow-hidden ${controls ? "cursor-pointer" : ""} ${className}`}
      style={wrapperStyle}
      onClick={controls ? togglePlay : undefined}
      onMouseEnter={controls ? showControls : undefined}
      onMouseMove={controls ? showControls : undefined}
      onMouseLeave={controls ? hideControls : undefined}
      {...(gated ? gate.hoverProps : {})}
    >
      <BlurhashCanvas hash={hash ?? ""} className="absolute inset-0 size-full" />
      {gated ? (
        <>
          <video
            {...videoProps}
            autoPlay={gate.playing}
            ref={(el) => {
              (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
              onVideoRef?.(el);
              if (el) {
                if (gate.playing) void el.play().catch(() => {});
                else el.pause();
              }
            }}
          />
          <PlaybackToggleButton
            playing={gate.playing}
            onToggle={gate.toggle}
            className="absolute right-2 bottom-2 z-10"
          />
        </>
      ) : (
        <video
          ref={(el) => {
            videoRef.current = el;
            onVideoRef?.(el);
          }}
          {...videoProps}
          autoPlay
        />
      )}
      {controls && <MediaControls videoRef={videoRef} visible={controlsVisible} />}
    </div>
  );
};

export default SmartImage;
