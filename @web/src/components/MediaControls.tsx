import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ArrowsInSimpleIcon, ArrowsOutSimpleIcon, PauseIcon, PlayIcon } from "@phosphor-icons/react";

interface MediaControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  visible: boolean;
}

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

const formatTime = (s: number): string => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export const MediaControls = ({ videoRef, visible }: MediaControlsProps) => {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onDuration = () => setDuration(el.duration);
    const onRateChange = () => setSpeed(el.playbackRate);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onDuration);
    el.addEventListener("ratechange", onRateChange);
    setPlaying(!el.paused);
    setDuration(el.duration);
    setCurrentTime(el.currentTime);
    setSpeed(el.playbackRate);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onDuration);
      el.removeEventListener("ratechange", onRateChange);
    };
  }, [videoRef]);

  useEffect(() => {
    if (!speedOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) setSpeedOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [speedOpen]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const wrapper = videoRef.current?.closest("[data-video-wrapper]");
      setIsFullscreen(!!wrapper && document.fullscreenElement === wrapper);
      setSpeedOpen(false);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [videoRef]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  }, [videoRef]);

  const onSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const el = videoRef.current;
      if (!el) return;
      el.currentTime = Number(e.target.value);
    },
    [videoRef]
  );

  const cycleSpeed = useCallback(
    (rate: number) => {
      const el = videoRef.current;
      if (!el) return;
      el.playbackRate = rate;
      setSpeedOpen(false);
    },
    [videoRef]
  );

  const toggleFullscreen = useCallback(() => {
    const el = videoRef.current?.closest<HTMLDivElement>("[data-video-wrapper]");
    if (!el) return;
    void (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen()).catch(console.error);
  }, [videoRef]);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 pb-2 px-3 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* timeline */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.01}
        value={currentTime}
        onChange={onSeek}
        className="w-full h-1.5 mb-2 cursor-pointer appearance-none rounded-full bg-white/20 accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
        style={{
          background: `linear-gradient(to right, #fff ${pct}%, rgba(255,255,255,0.2) ${pct}%)`,
        }}
      />

      {/* bottom bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {playing ? <PauseIcon size={14} weight="fill" /> : <PlayIcon size={14} weight="fill" />}
        </button>

        <span className="font-mono text-xs text-white/80 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          {/* speed */}
          <div className="relative" ref={speedMenuRef}>
            <button
              type="button"
              onClick={() => setSpeedOpen((o) => !o)}
              className="rounded bg-black/50 px-2 py-1 font-mono text-xs text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {speed}x
            </button>
            {speedOpen && (
              <div className="absolute bottom-full right-0 mb-1 min-w-12 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
                {SPEEDS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => cycleSpeed(r)}
                    className={`block w-full px-3 py-1 text-left font-mono text-xs transition-colors hover:bg-zinc-800 ${
                      r === speed ? "font-bold text-white" : "text-zinc-300"
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isFullscreen ? <ArrowsInSimpleIcon size={14} /> : <ArrowsOutSimpleIcon size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
};
