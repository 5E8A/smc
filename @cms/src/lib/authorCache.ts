import { getAuthors } from "../api";
import type { Author } from "../types";

let cache: Author[] | null = null;
let cachePromise: Promise<Author[]> | null = null;

export const loadAuthorsList = (force = false): Promise<Author[]> => {
  if (!force && cache) return Promise.resolve(cache);
  if (!cachePromise || force) {
    const p = getAuthors().then(
      (a) => {
        cache = a;
        return a;
      },
      (err) => {
        if (cachePromise === p) cachePromise = null;
        throw err;
      }
    );
    cachePromise = p;
  }
  return cachePromise;
};

export const invalidateAuthorCache = (): void => {
  cache = null;
  cachePromise = null;
};

export const getCachedAuthors = (): Author[] | null => cache;
