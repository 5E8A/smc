import { ImageIcon } from "@phosphor-icons/react";
import { assetUrl } from "../api";
import type { ImageInfo } from "../types";

export function AssetThumb({
  path,
  onPick,
  autoHeight,
}: {
  path: string;
  onPick?: () => void;
  /** Image drives the thumb height (aspect ratio kept), clamped to the 74px cover cap. */
  autoHeight?: boolean;
}) {
  if (!path) {
    if (onPick) {
      return (
        <button
          type="button"
          onClick={onPick}
          title="Pick image"
          className="flex h-[74px] w-14 shrink-0 items-center justify-center rounded border border-dashed border-zinc-700 text-zinc-600 transition-colors hover:border-green-500 hover:text-zinc-300"
        >
          <ImageIcon size={14} />
        </button>
      );
    }
    return <span className="inline-block h-9 w-14 shrink-0 rounded border border-dashed border-zinc-700" />;
  }
  if (onPick) {
    return (
      <button
        type="button"
        onClick={onPick}
        title="Pick image"
        className={`group relative flex shrink-0 overflow-hidden rounded border border-zinc-700 ${
          autoHeight ? "max-h-[74px]" : "h-[74px] w-auto"
        }`}
      >
        <img
          src={assetUrl(path)}
          alt=""
          className={autoHeight ? "block h-auto max-h-[74px] min-h-9 w-auto" : "block h-full w-auto"}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <ImageIcon size={14} weight="bold" />
        </span>
      </button>
    );
  }
  return <img src={assetUrl(path)} alt="" className="h-9 w-14 shrink-0 rounded border border-zinc-700 object-cover" />;
}

export type { ImageInfo };
