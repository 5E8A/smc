import { useCallback, useMemo, useState } from "react";
import { ArrowClockwiseIcon, HouseIcon, PlayIcon } from "@phosphor-icons/react";
import { DEVICE_GROUPS, CUSTOM_PRESET, type DevicePreset } from "../lib/presets";
import { ORIGIN, HOME_URL } from "../lib/devServer";
import { PreviewStage } from "./devices/PreviewStage";
import { Button, TextInput } from "./fields";

const GROUP_OPTIONS = ["All", ...DEVICE_GROUPS.map((g) => g.label), "Custom"] as const;

interface PreviewTabProps {
  entryPath: string | null;
  online: boolean | null;
  onRetry: () => void;
}

export const PreviewTab = ({ entryPath, online, onRetry }: PreviewTabProps) => {
  const defaultUrl = entryPath ? `${ORIGIN}${entryPath}` : HOME_URL;
  const [url, setUrl] = useState(defaultUrl);
  const [applied, setApplied] = useState(defaultUrl);
  const [group, setGroup] = useState<(typeof GROUP_OPTIONS)[number]>("All");
  const [customApplied, setCustomApplied] = useState({ w: CUSTOM_PRESET.w, h: CUSTOM_PRESET.h });
  const [loadedCount, setLoadedCount] = useState(0);

  const presets = useMemo(() => {
    const list: DevicePreset[] = [];
    for (const g of DEVICE_GROUPS) {
      if (group === "All" || group === g.label) list.push(...g.presets);
    }
    if (group === "All" || group === "Custom") {
      list.push({ ...CUSTOM_PRESET, w: customApplied.w, h: customApplied.h });
    }
    return list;
  }, [group, customApplied]);

  const normalize = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      new URL(withScheme);
      return withScheme;
    } catch {
      return null;
    }
  };

  const go = () => {
    const normalized = normalize(url);
    if (normalized) {
      setApplied(normalized);
      setUrl(normalized);
    }
  };

  const reloadAll = () =>
    setApplied((cur) => `${cur}${cur.includes("?") ? "&" : "?"}_r=${Date.now()}`);

  const handleCustomChange = useCallback((w: number, h: number) => {
    setCustomApplied((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, []);

  const handleLoadedCountChange = useCallback((n: number) => setLoadedCount(n), []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-zinc-800 px-4 py-2">
        <div className="flex w-28 items-center text-[11px] whitespace-nowrap text-zinc-500">
          {loadedCount}/{presets.length} loaded
        </div>
        <div className="mx-auto flex w-full min-w-0 flex-1 items-center justify-center gap-1">
          <TextInput
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") go();
            }}
            placeholder="127.0.0.1:3000/smc/…"
            aria-label="Preview URL"
            className="w-full max-w-sm"
          />
          <Button className="px-1.5" title="Load" onClick={go}>
            <PlayIcon size={13} />
          </Button>
          <Button
            variant="ghost"
            className="px-1.5"
            title="Home"
            onClick={() => {
              setUrl(defaultUrl);
              setApplied(defaultUrl);
            }}
          >
            <HouseIcon size={13} />
          </Button>
          <Button variant="ghost" className="px-1.5" title="Reload all" onClick={reloadAll}>
            <ArrowClockwiseIcon size={13} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          {GROUP_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                group === g ? "bg-green-600 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {online === false ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-950 p-6 text-center">
            <p className="text-sm font-semibold text-red-400">Dev server not reachable on port 3000</p>
            <p className="max-w-sm text-xs text-zinc-500">
              Start the main site with <code className="rounded bg-zinc-800 px-1 font-mono">npm run dev</code>, then
              retry. The preview embeds your locally running dev server.
            </p>
            <Button className="px-3 py-1.5 text-xs" onClick={onRetry}>
              <ArrowClockwiseIcon size={12} /> Retry
            </Button>
          </div>
        ) : (
          <PreviewStage presets={presets} url={applied} onCustomChange={handleCustomChange} onLoadedCountChange={handleLoadedCountChange} />
        )}
      </div>
    </div>
  );
};
