import { useEffect, useRef, useState } from "react";
import { VersionText } from "./VersionText";

const parseVersion = (v: string) => {
  const numeric = v.split("-")[0] ?? "0";
  const [maj = 0, min = 0, pat = 0] = numeric.split(".").map(Number);
  return { maj, min, pat };
};

const versionToNumber = (v: string) => {
  const { maj, min, pat } = parseVersion(v);
  return maj + min / 10 + pat / 100;
};

const fromVersion = (n: number) => ({
  maj: Math.floor(n),
  min: Math.floor((n * 10) % 10),
  pat: Math.floor((n * 100) % 10),
});

const parseFormat = (fmt: string) => {
  const inner = fmt.replace(/^\{|\}$/g, "");
  const dotIdx1 = inner.indexOf(".");
  const dotIdx2 = inner.indexOf(".", dotIdx1 + 1);
  const prefix = inner.slice(0, inner.indexOf("0"));
  const groups = [
    inner.slice(inner.indexOf("0"), dotIdx1).length,
    inner.slice(dotIdx1 + 1, dotIdx2).length,
    inner.slice(dotIdx2 + 1).length,
  ] as const;
  return { prefix, groups };
};

const formatVersion = (
  maj: number,
  min: number,
  pat: number,
  prefix: string,
  groups: readonly [number, number, number]
) => {
  const pad = (n: number, w: number) => String(n).padStart(w, "0");
  return `${prefix}${pad(maj, groups[0])}.${pad(min, groups[1])}.${pad(pat, groups[2])}`;
};

export interface AnimatedVersionProps {
  /** Semver string (e.g. `"1.20.4"`), or `null` while loading. */
  version: string | null;
  /** Display format. `0` marks digit slots, everything else is literal. e.g. `"{0.0.0}"`, `"{v0.0.0}"`, `"{0.00.0}"`. */
  format?: string;
  /** Animation duration in ms. Default: 1500 */
  duration?: number;
  /** Loading loop start version. Default `"0.0.1"` */
  loadingHead?: string;
  /** Loading loop end version. Default `"9.9.9"` */
  loadingTail?: string;
  /** Optional CSS class(es) forwarded to the `<span>`. */
  className?: string;
}

export const AnimatedVersion = ({
  version,
  format = "{0.0.0}",
  duration = 1500,
  loadingHead = "0.0.1",
  loadingTail = "9.9.9",
  className,
}: AnimatedVersionProps) => {
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isSemver = version !== null && /^\d+\.\d+\.\d+/.test(version);

  const headNum = versionToNumber(loadingHead);
  const tailNum = versionToNumber(loadingTail);

  const [displayed, setDisplayed] = useState(() => {
    const { prefix, groups } = parseFormat(format);
    if (version !== null && !isSemver) return version;
    if (isSemver) {
      const { maj, min, pat } = parseVersion(version);
      if (maj * 100 + min * 10 + pat <= 1) return formatVersion(maj, min, pat, prefix, groups);
    }
    return loadingHead;
  });

  const lastValue = useRef(headNum);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;

    const { prefix, groups } = parseFormat(format);
    const fmt = (n: number) => {
      const v = fromVersion(n);
      return formatVersion(v.maj, v.min, v.pat, prefix, groups);
    };

    if (version === null) {
      const cycle = duration * 2;
      let raf: number;
      let start: number | null = null;
      const easeOut = (t: number) => 1 - Math.exp(-5 * t);

      const tick = (now: number) => {
        start ??= now;
        const elapsed = (now - start) % cycle;
        const t = elapsed < duration ? elapsed / duration : 2 - elapsed / duration;
        const current = headNum + (tailNum - headNum) * easeOut(t);
        lastValue.current = current;
        setDisplayed(fmt(current));
        raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    if (!isSemver) return undefined;

    const to = versionToNumber(version);
    const { maj: tMaj, min: tMin, pat: tPat } = parseVersion(version);
    const fromV = fromVersion(lastValue.current);
    const fromStep = fromV.maj * 100 + fromV.min * 10 + fromV.pat;
    const toStep = tMaj * 100 + tMin * 10 + tPat;
    const absSteps = Math.abs(toStep - fromStep);

    lastValue.current = to;

    if (absSteps <= 0) return undefined;

    lastValue.current = to;
    const countUp = fromStep <= toStep;

    const versions: string[] = [];
    if (countUp) {
      for (let s = fromStep; s <= toStep; s++) {
        versions.push(formatVersion(Math.floor(s / 100), Math.floor((s % 100) / 10), s % 10, prefix, groups));
      }
    } else {
      for (let s = fromStep; s >= toStep; s--) {
        versions.push(formatVersion(Math.floor(s / 100), Math.floor((s % 100) / 10), s % 10, prefix, groups));
      }
    }

    let raf: number;
    let start: number | null = null;
    const easeOut = (t: number) => 1 - Math.exp(-5 * t);

    const tick = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / duration, 1);
      if (t >= 0.99) {
        setDisplayed(versions[absSteps]!);
        return;
      }
      const idx = Math.round(absSteps * easeOut(t));
      setDisplayed(versions[idx]!);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [version, prefersReducedMotion, duration, format, isSemver, headNum, tailNum, loadingHead]);

  const formattedTarget = (() => {
    if (!version || !isSemver) return null;
    const { prefix, groups } = parseFormat(format);
    const { maj, min, pat } = parseVersion(version);
    return formatVersion(maj, min, pat, prefix, groups);
  })();

  const display = (() => {
    if (prefersReducedMotion) return version ?? loadingHead;
    if (formattedTarget && displayed === formattedTarget) return formattedTarget;
    return (isSemver ? displayed : version) ?? displayed;
  })();

  return <VersionText display={display} className={className} ariaLabel={version ?? ""} />;
};
