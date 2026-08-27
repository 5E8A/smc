import type { Author } from "./data/authors";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author: Author;
  date: string;
  category: string;
  coverImage: string;
  summary: string;
}

export interface WikiDoc {
  id: string;
  slug: string;
  title: string;
  author: Author;
  date: string;
  category: string;
  coverImage: string;
  summary: string;
}

export type BlogPostRaw = Omit<BlogPost, "author"> & { author: string };
export type WikiDocRaw = Omit<WikiDoc, "author"> & { author: string };

export type VersionData = {
  version_number: string;
  game_version: string;
};
