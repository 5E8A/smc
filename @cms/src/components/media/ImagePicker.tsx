import { useEffect, useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { MediaBrowser } from "./MediaBrowser";
import { useMediaLibrary } from "./useMediaLibrary";
import { Button, TextInput } from "../ui/fields";

export interface PickedMedia {
  path: string;
  alt: string;
}

interface PickerProps {
  onClose: () => void;
  /** Multi mode: toggle-picking + staged alt text + Done/Cancel. Absent = instant apply on pick. */
  multi?: boolean;
  title?: string;
  onConfirm: (items: PickedMedia[]) => void;
}

export const ImagePicker = ({ onClose, multi = false, title, onConfirm }: PickerProps) => {
  const [staged, setStaged] = useState<PickedMedia[]>([]);
  const { images } = useMediaLibrary();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSelect = (path: string) => {
    if (!multi) {
      onConfirm([{ path, alt: "" }]);
      return;
    }
    setStaged((prev) =>
      prev.some((i) => i.path === path) ? prev.filter((i) => i.path !== path) : [...prev, { path, alt: "" }]
    );
  };

  const infoOf = (p: string) => images?.find((i) => i.path === p);
  const selected = new Set(staged.map((i) => i.path));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="flex h-full max-h-[800px] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-bold text-white">{title ?? "Pick media"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-200">
            <XIcon size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <MediaBrowser onSelect={handleSelect} previewOnRightClick selectedPaths={multi ? selected : undefined} />
        </div>
        {multi && staged.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-t border-zinc-800 px-4 py-2">
            {staged.map((item) => {
              const info = infoOf(item.path);
              const src = info?.staticUrl ?? info?.url;
              return (
                <div
                  key={item.path}
                  className="flex w-56 shrink-0 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 p-1.5"
                >
                  {src ? (
                    <img src={src} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded bg-zinc-800" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="truncate text-[10px] text-zinc-500">{info?.name ?? item.path}</div>
                    <TextInput
                      value={item.alt}
                      onChange={(e) =>
                        setStaged((prev) => prev.map((i) => (i.path === item.path ? { ...i, alt: e.target.value } : i)))
                      }
                      placeholder="Alt text…"
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => setStaged((prev) => prev.filter((i) => i.path !== item.path))}
                    className="shrink-0 text-zinc-500 hover:text-zinc-200"
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {multi && (
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
            <span className="text-xs text-zinc-500">{staged.length} selected</span>
            <div className="flex items-center gap-2">
              <Button variant="default" className="px-2.5 py-1 text-xs" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="px-2.5 py-1 text-xs"
                disabled={staged.length === 0}
                onClick={() => onConfirm(staged)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
