import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { useLanguage } from "@/context/useLanguage";
import { usePrefersReducedMotion } from "@/hooks/usePlaybackGate";
import type { ModData } from "@/data/mods";
import TabSprite from "./TabSprite";
import ItemIcon from "./ItemIcon";
import McTooltip from "./McTooltip";
import Chest from "./Chest";
import { CHESTS, CATEGORY_ICONS, SPRITE_URLS, geometry } from "./chest-utils";
import type { TooltipState } from "./chest-utils";

const BASE_CHEST_WIDTH = 176;

const useChestScale = () => {
  const [scale, setScale] = useState(2);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const wrapper = wrapperRef.current;
    let base = 2;
    const apply = () => {
      base = mq.matches ? 4 : 2;
      const available = wrapper?.clientWidth ?? 0;
      const next = available > 0 ? Math.min(base, Math.floor((available / BASE_CHEST_WIDTH) * 8) / 8) : base;
      setScale(next > 0 ? next : base);
    };
    apply();
    mq.addEventListener("change", apply);
    const obs = new ResizeObserver(apply);
    if (wrapper) obs.observe(wrapper);
    return () => {
      mq.removeEventListener("change", apply);
      obs.disconnect();
    };
  }, []);
  return { scale, wrapperRef };
};

const useSpritePreload = () => {
  useEffect(() => {
    for (const url of SPRITE_URLS) {
      const img = new Image();
      img.src = url;
    }
  }, []);
};

const AUTOPLAY_MS = 7000;

const ModChest = () => {
  const { t } = useLanguage();
  const { scale, wrapperRef } = useChestScale();
  const g = useMemo(() => geometry(scale), [scale]);
  const [activeCat, setActiveCat] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userControlled, setUserControlled] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useSpritePreload();

  const handleSlotHover = useCallback((mod: ModData | null) => setTooltip(mod ? { kind: "slot", mod } : null), []);

  useEffect(() => {
    if (paused || userControlled || reducedMotion) return;
    const id = setInterval(() => setActiveCat((c) => (c + 1) % CHESTS.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, userControlled, reducedMotion]);

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
      key={CHESTS[col]!.key}
      role="tab"
      id={`mod-tab-${col}`}
      aria-selected={col === activeCat}
      aria-controls={`mod-panel-${col}`}
      onClick={() => {
        setActiveCat(col);
        setUserControlled(true);
      }}
      onFocus={() => setTooltip({ kind: "tab", col })}
      onBlur={() => setTooltip(null)}
      onMouseEnter={() => setTooltip({ kind: "tab", col })}
      onMouseLeave={() => setTooltip(null)}
      className="absolute cursor-pointer"
      style={{ left: col * g.tabColumnWidth, width: g.tabWidth, height: g.tabHeight }}
      aria-label={t.mods[CHESTS[col]!.key as keyof typeof t.mods]}
    >
      <TabSprite selected={col === activeCat} column={col} className="absolute inset-0 size-full" />
      <ItemIcon
        id={CATEGORY_ICONS[col]!}
        className="absolute"
        style={{ left: g.tabIconX, top: g.tabIconY, width: 16 * g.scale, height: 16 * g.scale }}
      />
    </button>
  );

  return (
    <div ref={wrapperRef} className="relative mt-16 w-full md:mt-28">
      <div
        className="relative"
        style={{ width: g.chestWidth }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          setTooltip(null);
        }}
        onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => {
          setPaused(false);
          setTooltip(null);
        }}
      >
        {/* Tabs - split z-index: unselected behind chest, selected above */}
        <div role="tablist" aria-label={t.mods.title} className="absolute inset-x-0" style={{ top: g.tabTop }}>
          <div className="absolute inset-x-0 z-0">{CHESTS.map((_, col) => col !== activeCat && renderTab(col))}</div>
          <div className="absolute inset-x-0 z-20">{renderTab(activeCat)}</div>
        </div>

        {/* Chests - all mounted, only active one visible */}
        <div className="relative" style={{ width: g.chestWidth, height: g.chestHeight }}>
          {CHESTS.map((chest, i) => (
            <div
              key={chest.key}
              role="tabpanel"
              id={`mod-panel-${i}`}
              aria-labelledby={`mod-tab-${i}`}
              className="absolute inset-0"
              style={{ visibility: i === activeCat ? "visible" : "hidden" }}
            >
              <Chest
                title={t.mods[chest.key as keyof typeof t.mods]}
                mods={chest.mods}
                g={g}
                sprite={SPRITE_URLS[i]!}
                onHover={handleSlotHover}
              />
            </div>
          ))}
        </div>

        {/* Play/pause toggle - on the chest, far right, inline with the category name */}
        <button
          type="button"
          onClick={() => setUserControlled((prev) => !prev)}
          aria-label={userControlled ? t.mods.resume_autoplay : t.mods.pause_autoplay}
          className="absolute flex cursor-pointer items-center justify-center text-[#404040] transition-[color] duration-150 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{
            top: g.playBtnTop,
            right: g.playBtnRight,
            width: g.playBtnSize,
            height: g.playBtnSize,
          }}
        >
          {userControlled ? (
            <PlayIcon size={g.playIconSize} weight="fill" />
          ) : (
            <PauseIcon size={g.playIconSize} weight="fill" />
          )}
        </button>

        {/* Cursor-following tooltip (vanilla positioner, scaled with chest) */}
        {tooltip && (
          <McTooltip
            ref={tooltipRef}
            className="fixed z-100"
            style={{
              left: tooltipPos.left,
              top: tooltipPos.top,
              whiteSpace: tooltip.kind === "tab" ? "nowrap" : undefined,
            }}
            scale={g.scale}
            width={tooltip.kind === "slot" ? 96 * g.scale : undefined}
            title={
              tooltip.kind === "slot" ? tooltip.mod.title : t.mods[CHESTS[tooltip.col]!.key as keyof typeof t.mods]
            }
            description={tooltip.kind === "slot" ? tooltip.mod.description : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default memo(ModChest);
