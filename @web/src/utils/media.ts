import media from "@/data/media.json";

const animatedIndex = media as { animated: string[] };
const animatedSet = new Set(animatedIndex.animated);

const toKey = (src: string) => src.replace(/^\/smc\//, "");

export const isAnimatedAsset = (src: string): boolean => animatedSet.has(toKey(src));

export const staticVariantSrc = (src: string): string => src.replace(/\.webp$/, ".static.webp");
