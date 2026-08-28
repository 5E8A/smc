import { useState, type ReactNode } from "react";
import { ImagePicker, type PickedMedia } from "./ImagePicker";

interface UseImagePickerOptions {
  /** Instant mode: applies on pick (cover / avatar). */
  onPick?: (path: string, target: string) => void;
  /** Multi mode: applies the staged list on Done. */
  onPickMany?: (items: PickedMedia[], target: string) => void;
}

export function useImagePicker({ onPick, onPickMany }: UseImagePickerOptions): {
  open: (target: string, opts?: { multi?: boolean; title?: string }) => void;
  picker: ReactNode;
} {
  const [state, setState] = useState<{ target: string; multi?: boolean; title?: string } | null>(null);
  const picker =
    state !== null ? (
      <ImagePicker
        multi={state.multi}
        title={state.title}
        onClose={() => setState(null)}
        onConfirm={(items) => {
          const { target, multi } = state;
          setState(null);
          if (multi) {
            onPickMany?.(items, target);
          } else if (items[0]) {
            onPick?.(items[0].path, target);
          }
        }}
      />
    ) : null;
  return { open: (target, opts) => setState({ target, ...opts }), picker };
}
