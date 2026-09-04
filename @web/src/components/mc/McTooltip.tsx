import type { CSSProperties, ReactNode, Ref } from "react";
import { ArrowSquareOutIcon } from "@phosphor-icons/react";
import McButton from "./McButton";

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
      className={`mc-tooltip text-left ${action ? "pointer-events-auto" : "pointer-events-none"} ${className}`}
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
        <div className="mt-1" style={{ fontSize: 5.5 * scale }}>
          <McButton
            as="a"
            variant="primary"
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-[0.6em] px-[1em] py-[0.5em] text-[1em] leading-none"
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowSquareOutIcon aria-hidden weight="bold" style={{ width: "1.15em", height: "1.15em" }} />
            {action.label}
          </McButton>
        </div>
      )}
    </div>
  );
};

export default McTooltip;
