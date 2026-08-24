import { type CSSProperties } from "react";
import hashes from "@/data/blurhash.json";
import { BlurhashCanvas } from "./BlurhashCanvas";

const hashIndex = hashes as Record<string, string>;

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: "high" | "low";
  lazy?: boolean;
  className?: string;
}

const SmartImage = ({ src, alt, width, height, priority, lazy = true, className = "" }: SmartImageProps) => {
  const hash = hashIndex[src.replace(/^\/smc\//, "")];

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
        className="absolute inset-0 size-full object-cover"
      />
    </div>
  );
};

export default SmartImage;
