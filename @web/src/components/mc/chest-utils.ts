import type { ModData } from "@/data/mods";
import { modCategories } from "@/data/mods";
import type { ItemIconId } from "./ItemIcon";

export interface Geometry {
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
  playBtnTop: number;
  playBtnRight: number;
  playBtnSize: number;
  playIconSize: number;
}

export const geometry = (s: number): Geometry => ({
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
  playBtnTop: 5 * s,
  playBtnRight: 7 * s,
  playBtnSize: 11 * s,
  playIconSize: 8 * s,
});

export type TooltipState = { kind: "slot"; mod: ModData } | { kind: "tab"; col: number } | null;

export const CATEGORY_ICONS: ItemIconId[] = ["blaze_powder", "spyglass", "golden_apple", "experience_bottle"];

export const SPRITE_URLS = modCategories.map((cat) => `/smc/assets/mod-sprites/${cat.key}.webp`);

export const CHESTS = [
  { key: "performance", mods: modCategories[0]!.mods },
  { key: "optifine", mods: modCategories[1]!.mods },
  { key: "qol", mods: modCategories[2]!.mods },
  { key: "utility", mods: modCategories[3]!.mods },
] as const;
