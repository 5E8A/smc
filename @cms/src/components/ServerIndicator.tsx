import type { UseDevServerProbeResult } from "../lib/useDevServerProbe";
import type { PingStatus, UsePingResult } from "../lib/usePing";

interface ServerIndicatorProps {
  ping: UsePingResult;
  probe: UseDevServerProbeResult;
}

const cmsDot = (status: PingStatus): string => {
  switch (status) {
    case "online":
      return "bg-emerald-500";
    case "unresponsive":
      return "bg-amber-500";
    case "offline":
      return "bg-red-500";
    default:
      return "bg-zinc-500";
  }
};

export function ServerIndicator({ ping, probe }: ServerIndicatorProps) {
  const cmsText = ping.status === "online" && ping.latency !== null ? `${ping.latency}ms` : ping.status;
  const webDot = probe.online === null ? "bg-zinc-500" : probe.online ? "bg-emerald-500" : "bg-red-500";
  const webText = probe.online === null ? "..." : probe.online && probe.rtt !== null ? `${probe.rtt}ms` : "offline";

  return (
    <div className="ml-auto flex items-center gap-4 text-[11px]">
      <button
        type="button"
        title="CMS server (responsiveness) - click to retry"
        onClick={ping.retry}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200"
      >
        <span className={`h-2 w-2 rounded-full ${cmsDot(ping.status)}`} />
        <span>{cmsText}</span>
        <span className="text-zinc-600">CMS</span>
      </button>

      <button
        type="button"
        title="@web dev server (:3000) - click to retry"
        onClick={probe.retry}
        className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200"
      >
        <span className={`h-2 w-2 rounded-full ${webDot}`} />
        <span>{webText}</span>
        <span className="text-zinc-600">dev</span>
      </button>
    </div>
  );
}
