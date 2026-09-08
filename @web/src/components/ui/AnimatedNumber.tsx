import { useEffect, useRef, useState } from "react";

interface AnimatedIntProps {
  /** Target value, or `null` while data is loading. */
  value: number | null;
  /** Animation duration in ms when the value arrives. */
  duration?: number;
  /** Starting value for the loading loop. Must be > loadingTail. Default: 1_000_000 */
  loadingHead?: number;
  /** Ending value for the loading loop. Must be < loadingHead. Default: 1_000 */
  loadingTail?: number;
  /** Optional CSS class(es) forwarded to the `<span>`. */
  className?: string;
  /** Accessible label read by screen readers. */
  ariaLabel?: string;
}

export const AnimatedInt = ({
  value,
  duration = 1200,
  loadingHead = 1_000_000,
  loadingTail = 1_000,
  className,
  ariaLabel,
}: AnimatedIntProps) => {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!Number.isInteger(loadingHead) || !Number.isInteger(loadingTail) || loadingHead < 0 || loadingTail < 0) {
    throw new Error("AnimatedInt: loadingHead and loadingTail must be non-negative integers");
  }
  if (loadingHead <= loadingTail) {
    throw new Error("AnimatedInt: loadingHead must be greater than loadingTail");
  }

  const [displayed, setDisplayed] = useState(() => (prefersReducedMotion && value === null ? "…" : "0"));
  const lastValue = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    if (value === null) {
      const fmt = (n: number) => new Intl.NumberFormat().format(Math.round(n));
      const cycle = duration * 2;
      let raf: number;
      let start: number | null = null;

      const tick = (now: number) => {
        start ??= now;
        const elapsed = (now - start) % cycle;
        const t = elapsed < duration ? elapsed / duration : 2 - elapsed / duration;
        const current = loadingHead + (loadingTail - loadingHead) * t;
        lastValue.current = current;
        setDisplayed(fmt(current));
        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    const from = lastValue.current;
    lastValue.current = value;

    const fmt = (n: number) => new Intl.NumberFormat().format(Math.round(n));

    let raf: number;
    let start: number | null = null;

    const easeOut = (t: number) => 1 - Math.exp(-5 * t);

    const tick = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / duration, 1);
      const current = from + (value - from) * easeOut(t);
      setDisplayed(t >= 1 ? fmt(value) : fmt(current));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, prefersReducedMotion, duration, loadingHead, loadingTail]);

  if (prefersReducedMotion) {
    return (
      <span className={`${className ?? ""} tabular-nums`} role="img" aria-label={ariaLabel}>
        {value !== null ? new Intl.NumberFormat().format(value) : "…"}
      </span>
    );
  }

  return (
    <span className={`${className ?? ""} tabular-nums`} role="img" aria-label={ariaLabel}>
      {displayed}
    </span>
  );
};
