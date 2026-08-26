import { type CSSProperties } from "react";
import { getHash } from "@/utils/blurhash";
import { BlurhashCanvas } from "./BlurhashCanvas";

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: "high" | "low";
  lazy?: boolean;
  fit?: "cover" | "contain";
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

  const wrapperStyle: CSSProperties = {};
  if (width && height) {
    wrapperStyle.width = width;
    wrapperStyle.height = height;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={wrapperStyle}>
      <BlurhashCanvas hash={hash ?? ""} className="absolute inset-0 size-full" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
        fetchPriority={priority}
        className={`absolute inset-0 size-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
      />
    </div>
  );
};

export default SmartImage;
