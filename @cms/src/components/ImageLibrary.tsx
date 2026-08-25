import { assetUrl } from "../api";
import type { ImageInfo } from "../types";

export function AssetThumb({ path }: { path: string }) {
  if (!path) return <span className="inline-block h-9 w-14 shrink-0 rounded border border-dashed border-zinc-700" />;
  return <img src={assetUrl(path)} alt="" className="h-9 w-14 shrink-0 rounded border border-zinc-700 object-cover" />;
}

export type { ImageInfo };
