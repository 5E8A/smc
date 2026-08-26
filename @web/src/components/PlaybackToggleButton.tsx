import { PlayIcon, StopIcon } from "@phosphor-icons/react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useLanguage } from "@/context/useLanguage";

interface PlaybackToggleButtonProps {
  playing: boolean;
  onToggle: () => void;
  className?: string;
}

export const PlaybackToggleButton = ({ playing, onToggle, className = "" }: PlaybackToggleButtonProps) => {
  const { t } = useLanguage();
  const label = playing ? t.media.stop : t.media.play;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      onPointerDown={(e: ReactPointerEvent<HTMLButtonElement>) => e.stopPropagation()}
      className={`z-10 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-mc-green hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-accent ${className}`}
    >
      {playing ? <StopIcon size={13} weight="fill" /> : <PlayIcon size={13} weight="fill" />}
    </button>
  );
};
