import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLanguage } from "../context/useLanguage";
import { modCategories } from "../data/mods";
import type { ModData } from "../data/mods";
import ModIcon from "./ModIcon";
import ChestFrame from "./ChestFrame";
import TabSprite from "./TabSprite";
import ItemIcon, { type ItemIconId } from "./ItemIcon";
import McTooltip from "./McTooltip";

const useChestScale = () => {
  const [scale, setScale] = useState(2);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setScale(mq.matches ? 4 : 2);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return scale;
};

interface Geometry {
  scale: number;
  slotPitch: number;
  slotSize: number;
  slotOffsetX: number;
  slotOffsetY: number;
  chestWidth: number;
  chestHeight: number;
  tabWidth: number;
  tabHeight: number;
  tabColumnWidth: number;
  tabTop: number;
  tabIconX: number;
  tabIconY: number;
  titleLeft: number;
  titleTop: number;
  modIconSize: number;
  titleFontSize: number;
}

const geometry = (s: number): Geometry => ({
  scale: s,
  slotPitch: 18 * s,
  slotSize: 16 * s,
  slotOffsetX: 8 * s,
  slotOffsetY: 18 * s,
  chestWidth: 176 * s,
  chestHeight: 78 * s,
  tabWidth: 26 * s,
  tabHeight: 32 * s,
  tabColumnWidth: 27 * s,
  tabTop: -28 * s,
  tabIconX: 5 * s,
  tabIconY: 9 * s,
  titleLeft: 7 * s,
  titleTop: 4 * s,
  modIconSize: Math.round(13 * s),
  titleFontSize: Math.round(12 * s),
});

const CATEGORY_ICONS: ItemIconId[] = ["blaze_powder", "spyglass", "golden_apple", "experience_bottle"];

const SPRITE_URLS = modCategories.map((cat) => `/smc/assets/mod-sprites/${cat.key}.webp`);

const useSpritePreload = () => {
  useEffect(() => {
    for (const url of SPRITE_URLS) {
      const img = new Image();
      img.src = url;
    }
  }, []);
};

type TooltipState =
  | { kind: "slot"; mod: ModData }
  | { kind: "tab"; col: number }
  | null;

interface ChestSlotProps {
  mod: ModData | null;
  index: number;
  g: Geometry;
  sprite: string;
  onHover: (mod: ModData, index: number) => void;
  onLeave: () => void;
}

const ChestSlot = ({ mod, index, g, sprite, onHover, onLeave }: ChestSlotProps) => {
  const col = index % 9;
  const row = Math.floor(index / 9);
  const left = g.slotOffsetX + col * g.slotPitch;
  const top = g.slotOffsetY + row * g.slotPitch;

  if (!mod) {
    return null;
  }

  return (
    <a
      href={`https://modrinth.com/mod/${mod.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={mod.title}
      className="group absolute z-10 flex items-center justify-center"
      style={{ left, top, width: g.slotSize, height: g.slotSize }}
      onMouseEnter={() => onHover(mod, index)}
      onMouseLeave={onLeave}
    >
      <ModIcon slug={mod.slug} icon={mod.icon} alt={mod.title} size={g.modIconSize} className="rounded-none" sprite={sprite} spriteIndex={index} />
      <div className="pointer-events-none absolute inset-0 border-2 border-white/40 opacity-0 transition-opacity group-hover:opacity-100"></div>
    </a>
  );
};

const Chest = ({ title, mods, g, sprite, onHover }: { title: string; mods: ModData[]; g: Geometry; sprite: string; onHover: (mod: ModData | null) => void }) => {
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
          onHover={(m) => onHover(m)}
          onLeave={() => onHover(null)}
        />
      ))}
    </div>
  );
};

const AUTOPLAY_MS = 7000;

const ModChest = () => {
  const { t } = useLanguage();
  const scale = useChestScale();
  const g = geometry(scale);
  const [activeCat, setActiveCat] = useState(0);
  const [paused, setPaused] = useState(false);

  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useSpritePreload();

  const chests = [
    { key: "performance", mods: modCategories[0].mods },
    { key: "optifine", mods: modCategories[1].mods },
    { key: "qol", mods: modCategories[2].mods },
    { key: "utility", mods: modCategories[3].mods },
  ];

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActiveCat((c) => (c + 1) % chests.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, activeCat, chests.length]);

  // Vanilla HoveredTooltipPositioner: (x+12, y-12), flip/clamp at screen edges
  useLayoutEffect(() => {
    if (!tooltip || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    let left = mouse.x + 12;
    let top = mouse.y - 12;
    if (left + rect.width > window.innerWidth) {
      left = Math.max(left - 24 - rect.width, 4);
    }
    if (top + rect.height + 3 > window.innerHeight) {
      top = window.innerHeight - rect.height - 3;
    }
    setTooltipPos({ left, top });
  }, [tooltip, mouse]);

  const renderTab = (col: number) => (
    <button
      key={chests[col].key}
      onClick={() => setActiveCat(col)}
      className="absolute cursor-pointer"
      style={{ left: col * g.tabColumnWidth, width: g.tabWidth, height: g.tabHeight }}
      aria-label={t.mods[chests[col].key as keyof typeof t.mods]}
    >
      <TabSprite selected={col === activeCat} column={col} className="absolute inset-0 size-full" />
      <ItemIcon
        id={CATEGORY_ICONS[col]}
        className="absolute"
        style={{ left: g.tabIconX, top: g.tabIconY, width: 16 * g.scale, height: 16 * g.scale }}
      />
      {/* Vanilla tab hover area: inner 21x27 rect of the 26x32 tab */}
      <span
        className="absolute"
        style={{ left: 3 * g.scale, top: 3 * g.scale, width: 21 * g.scale, height: 27 * g.scale }}
        onMouseEnter={() => setTooltip({ kind: "tab", col })}
        onMouseLeave={() => setTooltip(null)}
      />
    </button>
  );

  return (
    <div
      className="relative mt-16 md:mt-28"
      style={{ width: g.chestWidth }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setTooltip(null);
      }}
      onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
    >
      {/* Unselected tabs — behind the chest (vanilla paint order) */}
      <div className="absolute inset-x-0 z-0" style={{ top: g.tabTop }}>
        {chests.map((_, col) => col !== activeCat && renderTab(col))}
      </div>

      {/* Chests — all mounted, only active one visible */}
      <div className="relative" style={{ width: g.chestWidth, height: g.chestHeight }}>
        {chests.map((chest, i) => (
          <div
            key={chest.key}
            className="absolute inset-0"
            style={{ visibility: i === activeCat ? "visible" : "hidden" }}
          >
            <Chest
              title={t.mods[chest.key as keyof typeof t.mods]}
              mods={chest.mods}
              g={g}
              sprite={SPRITE_URLS[i]}
              onHover={(mod) => setTooltip(mod ? { kind: "slot", mod } : null)}
            />
          </div>
        ))}
      </div>

      {/* Selected tab — over the chest */}
      <div className="absolute inset-x-0 z-20" style={{ top: g.tabTop }}>
        {renderTab(activeCat)}
      </div>

      {/* Cursor-following tooltip (vanilla positioner, scaled with chest) */}
      {tooltip && (
        <McTooltip
          ref={tooltipRef}
          className="fixed z-100"
          style={{ left: tooltipPos.left, top: tooltipPos.top, whiteSpace: tooltip.kind === "tab" ? "nowrap" : undefined }}
          scale={g.scale}
          width={tooltip.kind === "slot" ? 96 * g.scale : undefined}
          title={tooltip.kind === "slot" ? tooltip.mod.title : t.mods[chests[tooltip.col].key as keyof typeof t.mods]}
          description={tooltip.kind === "slot" ? tooltip.mod.description : undefined}
        />
      )}
    </div>
  );
};

export default ModChest;
