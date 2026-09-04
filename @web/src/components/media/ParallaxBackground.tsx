import { type CSSProperties } from "react";
import { useEffect, useRef } from "react";
import hashes from "@/data/blurhash.json";
import { usePrefersReducedMotion } from "@/hooks/usePlaybackGate";
import { BlurhashCanvas } from "./BlurhashCanvas";

const hashIndex = hashes as Record<string, string>;
const bgHash = hashIndex["assets/static/background.webp"] ?? hashIndex["assets/static/background.mobile.webp"] ?? "";

interface ParallaxBackgroundProps {
  className: string;
  factor?: number;
}

const ParallaxBackground = ({ className, factor = 0.15 }: ParallaxBackgroundProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      el.style.height = `${document.documentElement.scrollHeight}px`;
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      el.style.height = `${window.innerHeight + maxScroll * factor}px`;
      el.style.transform = `translate3d(0, ${-window.scrollY * factor}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [factor, reduced]);

  const style: CSSProperties = { height: "100vh" };

  return (
    <div ref={ref} aria-hidden className="-z-10 fixed opacity-45 inset-0 will-change-transform" style={style}>
      <BlurhashCanvas hash={bgHash} className="absolute inset-0 size-full" />
      <div className={`parallax-bg absolute inset-0 ${className}`} />
    </div>
  );
};

export default ParallaxBackground;
