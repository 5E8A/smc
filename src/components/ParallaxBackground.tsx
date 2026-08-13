import { useEffect, useRef } from "react";

interface ParallaxBackgroundProps {
  className: string;
  variant?: "parallax" | "static";
  factor?: number;
}

const ParallaxBackground = ({ className, variant = "parallax", factor = 0.35 }: ParallaxBackgroundProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant !== "parallax") return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const needed = `${window.innerHeight + maxScroll * factor}px`;
      if (el.style.height !== needed) el.style.height = needed;
      el.style.transform = `translate3d(0, ${-window.scrollY * factor}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [variant, factor]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`-z-10 opacity-45 fixed inset-0 ${className}`}
      style={{ height: "calc(100vh + 1200px)" }}
    ></div>
  );
};

export default ParallaxBackground;
