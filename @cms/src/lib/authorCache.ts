import { getAuthors } from "../api";
import type { Author } from "../types";

let cache: Author[] | null = null;
let cachePromise: Promise<Author[]> | null = null;

export const loadAuthorsList = (force = false): Promise<Author[]> => {
  if (!force && cache) return Promise.resolve(cache);
  if (!cachePromise || force) {
    cachePromise = getAuthors().then((a) => {
      cache = a;
      return a;
    });
  }
  return cachePromise;
};

export const invalidateAuthorCache = (): void => {
  cache = null;
  cachePromise = null;
};

export const setAuthorsCache = (authors: Author[]): void => {
  cache = authors;
  cachePromise = Promise.resolve(authors);
};

export const getCachedAuthors = (): Author[] | null => cache;
