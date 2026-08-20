import type { CSSProperties, ReactNode, Ref } from "react";

interface McTooltipProps {
  title: ReactNode;
  description?: ReactNode;
  scale?: number;
  width?: number;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
}

const McTooltip = ({
  title,
  description,
  scale = 2,
  width,
  className = "",
  style,
  ref,
}: McTooltipProps) => {
  return (
    <div
      ref={ref}
      className={`mc-tooltip pointer-events-none ${className}`}
      style={{
        ...style,
        fontSize: 5.5 * scale,
        padding: 4 * scale,
        width,
      }}
    >
      <div className="text-white leading-snug" style={{ fontSize: 7 * scale }}>
        {title}
      </div>
      {description && (
        <div className="text-mc-text-muted leading-snug mt-1" style={{ fontSize: 5.5 * scale }}>
          {description}
        </div>
      )}
    </div>
  );
};

export default McTooltip;
