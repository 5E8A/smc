import React, { useState } from "react";

interface SmartImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: "high" | "low";
  lazy?: boolean;
  className?: string;
}

const placeholderFor = (src: string): string => src.replace(/\.(png|jpe?g|webp)$/i, ".placeholder.$1");

const SmartImage: React.FC<SmartImageProps> = ({
  src,
  alt,
  width,
  height,
  priority,
  lazy = true,
  className = "",
}) => {
  const [loaded, setLoaded] = useState(false);
  const [placeholderOk, setPlaceholderOk] = useState(true);

  const wrapperStyle: React.CSSProperties = {};
  if (width && height) {
    wrapperStyle.width = width;
    wrapperStyle.height = height;
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={wrapperStyle}>
      {placeholderOk && !loaded && (
        <img
          src={placeholderFor(src)}
          alt=""
          aria-hidden="true"
          onError={() => setPlaceholderOk(false)}
          className="absolute inset-0 w-full h-full object-cover image-rendering-pixelated"
        />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? "lazy" : "eager"}
        decoding="async"
        fetchPriority={priority}
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity: loaded ? 1 : 0 }}
      />
    </div>
  );
};

export default SmartImage;
