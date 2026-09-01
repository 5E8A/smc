import type { ServerResponse } from "http";

/**
 * Lightweight `/api/ping` endpoint used by the client to measure true
 * round-trip latency. It responds immediately so the client can time the
 * request/response round trip (the response time IS the RTT). No timestamps
 * are echoed - the client measures elapsed time on its own clock. HEAD skips
 * the body for an even lighter probe.
 */
export function servePing(res: ServerResponse, head = false): void {
  res.writeHead(200, { "Content-Type": "application/json" });
  if (head) {
    res.end();
  } else {
    res.end('{"ok":true}');
  }
}
