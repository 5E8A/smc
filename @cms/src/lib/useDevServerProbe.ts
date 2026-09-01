import { useCallback, useEffect, useRef, useState } from "react";

const PROBE_URL = "http://127.0.0.1:3000/smc/en";
const PROBE_MS = 1000;
const ABORT_MS = 3000;
const EMA_ALPHA = 0.3;

export interface UseDevServerProbeResult {
  online: boolean | null;
  rtt: number | null;
  retry: () => void;
}

/**
 * Periodically probes the @web dev server ("Vite" on :3000) with a cross-origin
 * `no-cors` fetch and times each round trip. Because the response is opaque we
 * only learn whether the server answered and how long that took. RTT is smoothed
 * with an exponential moving average (alpha=0.3). `online === null` means the
 * first probe hasn't settled yet.
 */
export function useDevServerProbe(): UseDevServerProbeResult {
  const [online, setOnline] = useState<boolean | null>(null);
  const [rtt, setRtt] = useState<number | null>(null);
  const avgRef = useRef(0);

  const probe = useCallback(() => {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), ABORT_MS);
    fetch(PROBE_URL, { method: "HEAD", mode: "no-cors", signal: controller.signal })
      .then(() => {
        clearTimeout(timeout);
        const measured = Date.now() - start;
        avgRef.current = avgRef.current === 0 ? measured : avgRef.current * (1 - EMA_ALPHA) + measured * EMA_ALPHA;
        setRtt(Math.round(avgRef.current));
        setOnline(true);
      })
      .catch(() => {
        clearTimeout(timeout);
        avgRef.current = 0;
        setRtt(null);
        setOnline(false);
      });
  }, []);

  useEffect(() => {
    probe();
    const timer = window.setInterval(probe, PROBE_MS);
    return () => window.clearInterval(timer);
  }, [probe]);

  const retry = useCallback(() => {
    probe();
  }, [probe]);

  return { online, rtt, retry };
}
