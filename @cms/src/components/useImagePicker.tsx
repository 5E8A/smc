import { useState, type ReactNode } from "react";
import { ImagePicker } from "./ImagePicker";

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
