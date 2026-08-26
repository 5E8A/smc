import type { ConvertStageEvent } from "../api";

const STAGE_LABELS: Record<string, string> = {
  sending: "sending",
  queued: "queued",
  probe: "probing",
  decoding: "decoding",
  "re-encoding": "re-encoding frames",
  "static-frame": "extracting static frame",
  writing: "saving",
};

export const formatStage = (
  stage: string,
  pct: number | null | undefined,
  speed: string | null | undefined
): string => {
  if (stage === "transcode") {
    if (pct == null) return speed ? `transcoding (${speed})` : "transcoding";
    return `transcoding ${Math.round(pct)}%${speed ? ` (${speed})` : ""}`;
  }
  return STAGE_LABELS[stage] ?? stage;
};

export interface StageInfo {
  stage: string;
  pct?: number | null;
  speed?: string | null;
}

export const formatUploadStage = (event: StageInfo): string =>
  formatStage(event.stage, event.pct ?? null, event.speed ?? null);

export const formatConvertStage = (event: ConvertStageEvent): string =>
  `${formatStage(event.stage, "pct" in event ? event.pct : null, "speed" in event ? event.speed : null)} - ${event.file} (${event.i}/${event.n})`;
