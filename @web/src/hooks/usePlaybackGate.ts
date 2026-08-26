import { useEffect, useState } from "react";

const useMediaFlag = (query: string): boolean => {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (): void => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
};

export const usePrefersReducedMotion = (): boolean => useMediaFlag("(prefers-reduced-motion: reduce)");

interface PlaybackGate {
  playing: boolean;
  toggle: () => void;
  hoverProps: {
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  };
}

export const usePlaybackGate = (enabled: boolean): PlaybackGate => {
  const canHover = useMediaFlag("(hover: hover)");
  const [playing, setPlaying] = useState(false);
  return {
    playing,
    toggle: () => setPlaying((prev) => !prev),
    hoverProps:
      enabled && canHover ? { onMouseEnter: () => setPlaying(true), onMouseLeave: () => setPlaying(false) } : {},
  };
};
