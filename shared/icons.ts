export const KNOWN_ICONS = [
  "ArrowsClockwiseIcon",
  "CpuIcon",
  "DeviceMobileIcon",
  "DownloadIcon",
  "FolderIcon",
  "GearIcon",
  "GlobeIcon",
  "HouseIcon",
  "ImageIcon",
  "KeyboardIcon",
  "NoteIcon",
  "PushPinIcon",
  "RocketIcon",
  "ScissorsIcon",
  "SparkleIcon",
  "StarIcon",
  "TelevisionIcon",
  "UsersIcon",
  "WarningIcon",
  "WrenchIcon",
] as const;

export type KnownIconName = (typeof KNOWN_ICONS)[number];

const knownSet: ReadonlySet<string> = new Set(KNOWN_ICONS);

export const isKnownIcon = (name: string): boolean => knownSet.has(name);
