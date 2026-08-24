import { useState, type ReactNode } from "react";
import { XIcon } from "@phosphor-icons/react";
import { MediaBrowser } from "./MediaBrowser";

export { AssetThumb } from "./ImageLibrary";

interface PickerProps {
  onClose: () => void;
  onSelect: (path: string) => void;
}

export const ImagePicker = ({ onClose, onSelect }: PickerProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
    <div
      className="flex h-full max-h-[720px] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-bold text-white">Pick an image</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-200">
          <XIcon size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <MediaBrowser onSelect={onSelect} />
      </div>
    </div>
  </div>
);

export function useImagePicker(onPick: (path: string, target: string) => void): {
  open: (target: string) => void;
  picker: ReactNode;
} {
  const [target, setTarget] = useState<string | null>(null);
  const picker =
    target !== null ? (
      <ImagePicker
        onClose={() => setTarget(null)}
        onSelect={(path) => {
          onPick(path, target);
          setTarget(null);
        }}
      />
    ) : null;
  return { open: setTarget, picker };
}
