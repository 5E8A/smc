import { type CSSProperties } from "react";
import lqipMap from "@/data/lqip.json";

const lqipIndex = lqipMap as Record<string, number>;

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
  const lqip = lqipIndex[src.replace(/^\/smc\//, "")];

  const wrapperStyle: CSSProperties & Record<string, unknown> = {};
  if (lqip != null) wrapperStyle["--lqip"] = lqip;
  if (width && height) {
    wrapperStyle.width = width;
    wrapperStyle.height = height;
  }

  return (
    <div className={`lqip lqip-bg relative overflow-hidden ${className}`} style={wrapperStyle}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
        fetchPriority={priority}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};

export default SmartImage;
