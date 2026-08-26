import { type CSSProperties } from "react";
import { getHash } from "@/utils/blurhash";
import { isAnimatedAsset, staticVariantSrc } from "@/utils/media";
import { usePlaybackGate, usePrefersReducedMotion } from "@/hooks/usePlaybackGate";
import { BlurhashCanvas } from "./BlurhashCanvas";
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
}: SmartImageProps) => {
  const hash = getHash(src);
  const animated = isAnimatedAsset(src);
  const reduced = usePrefersReducedMotion();
  const gated = animated && reduced;
  const gate = usePlaybackGate(gated);

  const wrapperStyle: CSSProperties = {};
  if (width && height) {
    wrapperStyle.width = width;
    wrapperStyle.height = height;
  }

  const imgLayout =
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

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={wrapperStyle}
      {...(gated ? gate.hoverProps : {})}
    >
      <BlurhashCanvas hash={hash ?? ""} className="absolute inset-0 size-full" />
      {gated ? (
        <>
          <img {...imgProps} src={gate.playing ? src : staticVariantSrc(src)} draggable={false} className={imgLayout} />
          <PlaybackToggleButton playing={gate.playing} onToggle={gate.toggle} className="absolute right-2 bottom-2" />
        </>
      ) : (
        <img {...imgProps} src={src} className={imgLayout} />
      )}
    </div>
  );
};

export default SmartImage;
