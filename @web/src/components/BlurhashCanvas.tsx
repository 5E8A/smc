import { useEffect, useRef } from "react";
import { decode } from "@/lib/blurhash";

const W = 32;
const H = 24;

export const BlurhashCanvas = ({ hash, className }: { hash: string; className?: string }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !hash) return;
    try {
      const pixels = decode(hash, W, H);
      const imageData = ctx.createImageData(W, H);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
    } catch {
      canvas.width = 0;
    }
  }, [hash]);

  if (!hash) return null;
  return <canvas ref={ref} width={W} height={H} aria-hidden="true" className={className} />;
};
