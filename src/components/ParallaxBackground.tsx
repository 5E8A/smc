import { type CSSProperties } from "react";
import { useEffect, useRef } from "react";
import lqipMap from "@/data/lqip.json";

const lqipIndex = lqipMap as Record<string, number>;
const bgLqip = lqipIndex["assets/static/background.webp"] ?? lqipIndex["assets/static/background.mobile.webp"];

interface ParallaxBackgroundProps {
  className: string;
  factor?: number;
}

const screenshotMode = import.meta.env.VITE_SCREENSHOT === "true";

const ParallaxBackground = ({ className, factor = 0.15 }: ParallaxBackgroundProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (screenshotMode) {
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
  }, [factor]);

  const style: CSSProperties & Record<string, unknown> = { height: "100vh" };
  if (bgLqip != null) style["--lqip"] = bgLqip;

  return (
    <div
      ref={ref}
      aria-hidden
      className={`lqip -z-10 opacity-45 ${screenshotMode ? "absolute" : "fixed"} inset-0 will-change-transform ${className}`}
      style={style}
    />
  );
};

export default ParallaxBackground;
