import { useCallback, useEffect, useRef, useState } from "react";

export type PingStatus = "connecting" | "online" | "unresponsive" | "offline";

const POLL_MS = 500;
const UNRESPONSIVE_MS = 1000;
const OFFLINE_MS = 3000;
const ABORT_MS = 3000;
const PING_URL = "/api/ping";
const EMA_ALPHA = 0.3;

export interface UsePingResult {
  status: PingStatus;
  latency: number | null;
  retry: () => void;
}

/**
 * Measures true round-trip latency to the CMS server by polling `/api/ping`
 * and timing each request/response. Latency is smoothed with an exponential
 * moving average (alpha=0.3). The status is derived from the raw RTT:
 * <1s === online, 1-3s === unresponsive, >3s or a failed request === offline.
 */
export function usePing(): UsePingResult {
  const [status, setStatus] = useState<PingStatus>("connecting");
  const [latency, setLatency] = useState<number | null>(null);
  const avgRef = useRef(0);
  const stoppedRef = useRef(false);

  const ping = useCallback(() => {
    if (stoppedRef.current) return;
    const start = Date.now();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), ABORT_MS);
    fetch(PING_URL, { method: "HEAD", signal: controller.signal })
      .then(() => {
        clearTimeout(timeout);
        if (stoppedRef.current) return;
        const rtt = Date.now() - start;
        avgRef.current = avgRef.current === 0 ? rtt : avgRef.current * (1 - EMA_ALPHA) + rtt * EMA_ALPHA;
        setLatency(Math.round(avgRef.current));
        setStatus(rtt > OFFLINE_MS ? "offline" : rtt > UNRESPONSIVE_MS ? "unresponsive" : "online");
      })
      .catch(() => {
        clearTimeout(timeout);
        if (stoppedRef.current) return;
        avgRef.current = 0;
        setLatency(null);
        setStatus("offline");
      });
  }, []);

  useEffect(() => {
    stoppedRef.current = false;
    const timer = window.setInterval(ping, POLL_MS);
    return () => {
      stoppedRef.current = true;
      window.clearInterval(timer);
    };
  }, [ping]);

  const retry = useCallback(() => {
    stoppedRef.current = false;
    setStatus("connecting");
    setLatency(null);
    avgRef.current = 0;
    ping();
  }, [ping]);

  return { status, latency, retry };
}
