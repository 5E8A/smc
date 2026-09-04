import { useCallback, useMemo, useState } from "react";
import { ArrowClockwiseIcon, HouseIcon, PlayIcon } from "@phosphor-icons/react";
import { DEVICE_GROUPS, CUSTOM_PRESET, type DevicePreset } from "../lib/presets";
import { ORIGIN, HOME_URL } from "../lib/devServer";
import { PreviewStage } from "../components/preview/PreviewStage";
import { Button } from "../components/ui/fields";
import { MultiSelect, type MultiSelectOption } from "../components/ui/MultiSelect";

const GROUP_OPTIONS: MultiSelectOption[] = [
  ...DEVICE_GROUPS.map((g) => ({ value: g.label, label: g.label })),
  { value: "Custom", label: "Custom" },
];

interface PreviewTabProps {
  entryPath: string | null;
  online: boolean | null;
  onRetry: () => void;
}

export const PreviewTab = ({ entryPath, online, onRetry }: PreviewTabProps) => {
  const defaultUrl = entryPath ? `${ORIGIN}${entryPath}` : HOME_URL;
  const [url, setUrl] = useState(defaultUrl);
  const [applied, setApplied] = useState(defaultUrl);
  const [selected, setSelected] = useState<string[]>(() => GROUP_OPTIONS.map((o) => o.value));
  const [customApplied, setCustomApplied] = useState({ w: CUSTOM_PRESET.w, h: CUSTOM_PRESET.h });
  const [loadedCount, setLoadedCount] = useState(0);

  const presets = useMemo(() => {
    const allSelected = selected.length === GROUP_OPTIONS.length;
    const list: DevicePreset[] = [];
    for (const g of DEVICE_GROUPS) {
      if (allSelected || selected.includes(g.label)) list.push(...g.presets);
    }
    if (allSelected || selected.includes("Custom")) {
      list.push({ ...CUSTOM_PRESET, w: customApplied.w, h: customApplied.h });
    }
    return list;
  }, [selected, customApplied]);

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
        <div className="flex w-36 items-center text-[11px] whitespace-nowrap text-zinc-500">
          {loadedCount}/{presets.length} loaded
        </div>
        <div className="mx-auto flex w-full min-w-0 flex-1 items-center justify-center">
          <div className="flex w-full max-w-lg items-center rounded-md border border-zinc-700 bg-zinc-900">
            <Button variant="ghost" className="rounded-r-none border-none px-1.5 py-1.5" title="Reload all" onClick={reloadAll}>
              <ArrowClockwiseIcon size={13} />
            </Button>
            <Button
              variant="ghost"
              className="rounded-none border-none px-1.5 py-1.5"
              title="Home"
              onClick={() => {
                setUrl(defaultUrl);
                setApplied(defaultUrl);
              }}
            >
              <HouseIcon size={13} />
            </Button>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") go();
              }}
              placeholder="127.0.0.1:3000/smc/…"
              aria-label="Preview URL"
              className="flex-1 bg-transparent px-1 py-1.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            />
            <Button variant="ghost" className="rounded-l-none border-none px-1.5 py-1.5" title="Load" onClick={go}>
              <PlayIcon size={13} />
            </Button>
          </div>
        </div>

        <div className="flex w-36 shrink-0 items-center justify-center">
          <MultiSelect
            options={GROUP_OPTIONS}
            value={selected}
            onChange={setSelected}
            placeholder="All"
          />
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
