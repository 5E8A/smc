import {
  ArrowsClockwiseIcon,
  CpuIcon,
  DeviceMobileIcon,
  DownloadIcon,
  FolderIcon,
  GearIcon,
  GlobeIcon,
  HouseIcon,
  ImageIcon,
  KeyboardIcon,
  NoteIcon,
  PushPinIcon,
  RocketIcon,
  ScissorsIcon,
  SparkleIcon,
  StarIcon,
  TelevisionIcon,
  UsersIcon,
  WarningIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import type { KnownIconName } from "@smc/shared/icons";

const iconMap: Record<KnownIconName, React.ComponentType<{ className?: string }>> = {
  ArrowsClockwiseIcon,
  CpuIcon,
  DeviceMobileIcon,
  DownloadIcon,
  FolderIcon,
  GearIcon,
  GlobeIcon,
  HouseIcon,
  ImageIcon,
  KeyboardIcon,
  NoteIcon,
  PushPinIcon,
  RocketIcon,
  ScissorsIcon,
  SparkleIcon,
  StarIcon,
  TelevisionIcon,
  UsersIcon,
  WarningIcon,
  WrenchIcon,
};

const Icon = ({ name, className }: { name: string; className?: string }) => {
  const Comp = iconMap[name as KnownIconName];
  if (!Comp) return null;
  return <Comp className={className ?? "icon-inline text-green-400"} />;
};

export default Icon;
