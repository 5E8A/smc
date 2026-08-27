import media from "@/data/media.json";

const animatedIndex = media as { animated?: string[]; videos?: string[] };
const animatedSet = new Set(animatedIndex.animated ?? []);
const videoSet = new Set(animatedIndex.videos ?? []);

const toKey = (src: string) => src.replace(/^\/smc\//, "");

export const isAnimatedAsset = (src: string): boolean => animatedSet.has(toKey(src));

export const isVideoAsset = (src: string): boolean => videoSet.has(toKey(src));

export const staticVariantSrc = (src: string): string => src.replace(/\.webp$/, ".static.webp");

export const posterSrc = (src: string): string => src.replace(/\.[^.]+$/, ".static.webp");
