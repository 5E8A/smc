import { memo, useLayoutEffect, useRef, useState } from "react";
import type { ModData } from "@/data/mods";
import type { Geometry } from "./chest-utils";
import { positionSlotTooltip } from "./chest-utils";
import ModIcon from "./ModIcon";
import McTooltip from "./McTooltip";

interface ChestSlotProps {
  mod: ModData | null;
  index: number;
  g: Geometry;
  sprite: string;
  onHover: (mod: ModData, index: number, el: HTMLElement) => void;
  asLink?: boolean;
  active?: boolean;
  onTap?: () => void;
  tooltipScale?: number;
  actionLabel?: string;
}

const ChestSlot = ({
  mod,
  index,
  g,
  sprite,
  onHover,
  asLink = true,
  active = false,
  onTap,
  tooltipScale = 2,
  actionLabel,
}: ChestSlotProps) => {
  const col = index % 9;
  const row = Math.floor(index / 9);
  const left = g.slotOffsetX + col * g.slotPitch;
  const top = g.slotOffsetY + row * g.slotPitch;

  if (!mod) {
    return null;
  }

  const slotIcon = (
    <>
      <ModIcon sprite={sprite} spriteIndex={index} size={g.modIconSize} className="rounded-none" />
      <div className="pointer-events-none absolute inset-0 border-2 border-white/40 opacity-0 transition-opacity group-hover:opacity-100"></div>
    </>
  );

  const slotStyle = { left, top, width: g.slotSize, height: g.slotSize };

  if (asLink) {
    return (
      <a
        href={`https://modrinth.com/mod/${mod.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={mod.title}
        onMouseEnter={(e) => onHover(mod, index, e.currentTarget)}
        onFocus={(e) => onHover(mod, index, e.currentTarget)}
        className="group absolute z-10 flex items-center justify-center"
        style={slotStyle}
      >
        {slotIcon}
      </a>
    );
  }

  return (
    <TouchSlotButton
      mod={mod}
      slotIcon={slotIcon}
      active={active}
      onTap={onTap}
      style={slotStyle}
      scale={tooltipScale}
      actionLabel={actionLabel}
    />
  );
};

export default memo(ChestSlot);

interface TouchSlotButtonProps {
  mod: ModData;
  slotIcon: React.ReactNode;
  active: boolean;
  onTap?: () => void;
  style: React.CSSProperties;
  scale: number;
  actionLabel?: string;
}

const TouchSlotButton = ({ mod, slotIcon, active, onTap, style, scale, actionLabel }: TouchSlotButtonProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      type="button"
      ref={ref}
      onClick={onTap}
      aria-label={mod.title}
      aria-expanded={active}
      className={`${active ? "z-100 " : ""}group absolute z-10 flex items-center justify-center`}
      style={style}
    >
      {slotIcon}
      {active && <InlineTooltip ref={ref} mod={mod} scale={scale} actionLabel={actionLabel} />}
    </button>
  );
};

interface InlineTooltipProps {
  ref: React.RefObject<HTMLButtonElement | null>;
  mod: ModData;
  scale: number;
  actionLabel?: string;
}

const InlineTooltip = ({ ref: anchorRef, mod, scale, actionLabel }: InlineTooltipProps) => {
  const tipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const el = tipRef.current;
    const anchor = anchorRef.current;
    if (!el || !anchor) return;
    setPos(positionSlotTooltip(anchor.getBoundingClientRect(), el.getBoundingClientRect()));
  }, [anchorRef, scale]);

  return (
    <McTooltip
      ref={tipRef}
      className="fixed z-100"
      style={{ left: pos.left, top: pos.top }}
      scale={scale}
      width={96 * scale}
      title={mod.title}
      description={mod.description}
      action={actionLabel ? { label: actionLabel, href: `https://modrinth.com/mod/${mod.slug}` } : undefined}
    />
  );
};
