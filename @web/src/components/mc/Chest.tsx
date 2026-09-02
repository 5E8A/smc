import { memo, useCallback } from "react";
import type { ModData } from "@/data/mods";
import type { Geometry } from "./chest-utils";
import ChestSlot from "./ChestSlot";
import ChestFrame from "./ChestFrame";

interface ChestProps {
  title: string;
  mods: ModData[];
  g: Geometry;
  sprite: string;
  onHover: (mod: ModData | null) => void;
}

const Chest = ({ title, mods, g, sprite, onHover }: ChestProps) => {
  const handleSlotHover = useCallback((mod: ModData) => onHover(mod), [onHover]);
  const handleSlotLeave = useCallback(() => onHover(null), [onHover]);

  const slots: (ModData | null)[] = Array.from({ length: 27 }, (_, i) => mods[i] ?? null);

  return (
    <div className="relative" style={{ width: g.chestWidth, height: g.chestHeight }}>
      <ChestFrame className="absolute inset-0 size-full select-none" />
      <h3
        className="pointer-events-none absolute font-mc leading-none whitespace-nowrap text-[#404040]"
        style={{ left: g.titleLeft, top: g.titleTop, fontSize: g.titleFontSize }}
      >
        {title}
      </h3>
      {slots.map((mod, i) => (
        <ChestSlot
          key={mod?.slug ?? `empty-${i}`}
          mod={mod}
          index={i}
          g={g}
          sprite={sprite}
          onHover={handleSlotHover}
          onLeave={handleSlotLeave}
        />
      ))}
    </div>
  );
};

export default memo(Chest);
