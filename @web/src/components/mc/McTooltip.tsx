import type { CSSProperties, ReactNode, Ref } from "react";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";

interface McTooltipAction {
  label: string;
  href: string;
}

interface McTooltipProps {
  title: ReactNode;
  description?: ReactNode;
  action?: McTooltipAction;
  scale?: number;
  width?: number;
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLDivElement>;
}

const McTooltip = ({ title, description, action, scale = 2, width, className = "", style, ref }: McTooltipProps) => {
  return (
    <div
      ref={ref}
      className={`mc-tooltip ${action ? "pointer-events-auto" : "pointer-events-none"} ${className}`}
      style={{
        ...style,
        fontSize: 5.5 * scale,
        padding: 4 * scale,
        width,
      }}
    >
      <div className="leading-snug text-white" style={{ fontSize: 7 * scale }}>
        {title}
      </div>
      {description && (
        <div className="mt-1 leading-snug text-mc-text-muted" style={{ fontSize: 5.5 * scale }}>
          {description}
        </div>
      )}
      {action && (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1 leading-none font-bold text-green-400 hover:text-green-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{ fontSize: 5.5 * scale }}
        >
          <ArrowSquareOutIcon aria-hidden weight="bold" style={{ width: 6 * scale, height: 6 * scale }} />
          <span className="whitespace-nowrap">{action.label}</span>
        </a>
      )}
    </div>
  );
};

export default McTooltip;
