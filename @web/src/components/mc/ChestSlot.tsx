import { memo } from "react";
import type { ModData } from "@/data/mods";
import type { Geometry } from "./chest-utils";
import ModIcon from "./ModIcon";

interface ChestSlotProps {
  mod: ModData | null;
  index: number;
  g: Geometry;
  sprite: string;
  onHover: (mod: ModData, index: number, el: HTMLElement) => void;
  onLeave: () => void;
  asLink?: boolean;
}

const ChestSlot = ({ mod, index, g, sprite, onHover, onLeave, asLink = true }: ChestSlotProps) => {
  const col = index % 9;
  const row = Math.floor(index / 9);
  const left = g.slotOffsetX + col * g.slotPitch;
  const top = g.slotOffsetY + row * g.slotPitch;

  if (!mod) {
    return null;
  }

  const props = {
    className: "group absolute z-10 flex items-center justify-center",
    style: { left, top, width: g.slotSize, height: g.slotSize },
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => onHover(mod, index, e.currentTarget),
    onFocus: (e: React.FocusEvent<HTMLElement>) => onHover(mod, index, e.currentTarget),
    "aria-label": mod.title,
  };

  return asLink ? (
    <a
      href={`https://modrinth.com/mod/${mod.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      onBlur={onLeave}
      {...props}
    >
      <ModIcon sprite={sprite} spriteIndex={index} size={g.modIconSize} className="rounded-none" />
      <div className="pointer-events-none absolute inset-0 border-2 border-white/40 opacity-0 transition-opacity group-hover:opacity-100"></div>
    </a>
  ) : (
    <button type="button" onBlur={onLeave} {...props}>
      <ModIcon sprite={sprite} spriteIndex={index} size={g.modIconSize} className="rounded-none" />
      <div className="pointer-events-none absolute inset-0 border-2 border-white/40 opacity-0 transition-opacity group-hover:opacity-100"></div>
    </button>
  );
};

export default memo(ChestSlot);
