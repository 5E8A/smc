import { getMedia } from "../api";
import type { ImagesPayload } from "../types";

let cache: ImagesPayload | null = null;
let cachePromise: Promise<ImagesPayload> | null = null;

export const loadMedia = (force = false): Promise<ImagesPayload> => {
  if (!force && cache) return Promise.resolve(cache);
  if (!cachePromise || force) {
    cachePromise = getMedia().then((payload) => {
      cache = payload;
      return payload;
    });
  }
  return cachePromise;
};

export const invalidateMediaCache = (): void => {
  cache = null;
  cachePromise = null;
};

export interface ImageNotice {
  kind: "ok" | "err";
  text: string;
}
