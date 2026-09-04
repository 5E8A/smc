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

const useCoarsePointer = () => {
  const [coarse, setCoarse] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const apply = () => setCoarse(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return coarse;
};

const ModChest = () => {
  const { t } = useLanguage();
  const { scale, wrapperRef } = useChestScale();
  const g = useMemo(() => geometry(scale), [scale]);
  const [activeCat, setActiveCat] = useState(0);
  const [paused, setPaused] = useState(false);
  const [userControlled, setUserControlled] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const coarse = useCoarsePointer();

  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pendingActionFocus = useRef(false);

  useSpritePreload();

  // On touch there is no cursor: anchor the tooltip to the tapped element instead.
  const anchorFromElement = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    setMouse({ x: rect.right, y: rect.top + rect.height / 2 });
  }, []);

  const handleSlotHover = useCallback(
    (mod: ModData | null, el?: HTMLElement) => {
      if (mod && coarse && el) anchorFromElement(el);
      setTooltip(mod ? { kind: "slot", mod } : null);
    },
    [coarse, anchorFromElement]
  );

  useEffect(() => {
    if (!coarse || !tooltip) {
      pendingActionFocus.current = false;
      return;
    }
    // Keyboard/tap activation moves focus straight to the tooltip's Modrinth button,
    // so keyboard users reach the link without tabbing through every slot.
    if (pendingActionFocus.current) {
      pendingActionFocus.current = false;
      tooltipRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    }
  }, [coarse, tooltip]);

  useEffect(() => {
    if (!coarse || !tooltip) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setTooltip(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [coarse, tooltip, wrapperRef]);

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

  // Tab name tooltip only for keyboard focus (the chest title already shows the active category;
  // :focus-visible keeps mouse clicks and touch taps from showing the duplicate).
  const showTabTooltip = (el: HTMLElement, col: number) => {
    anchorFromElement(el);
    setTooltip({ kind: "tab", col });
  };

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
      onFocus={(e) => {
        if (e.currentTarget.matches(":focus-visible")) showTabTooltip(e.currentTarget, col);
      }}
      onBlur={() => setTooltip(null)}
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
        onBlurCapture={(e) => {
          // Keep the tooltip (and its Modrinth link) mounted while focus moves into it.
          const next = e.relatedTarget as HTMLElement | null;
          if (next && tooltipRef.current?.contains(next)) return;
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
                asLink={!coarse}
                onActivate={coarse ? () => (pendingActionFocus.current = true) : undefined}
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
            action={
              coarse && tooltip.kind === "slot"
                ? { label: t.mods.open_mod, href: `https://modrinth.com/mod/${tooltip.mod.slug}` }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
};

export default memo(ModChest);
