export type Lang = "en" | "pl";
export type Kind = "posts" | "wiki";

export interface LocalizedText {
  en: string;
  pl: string;
}

export interface Author {
  id: string;
  avatar: string;
  name: LocalizedText;
  bio: LocalizedText;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  coverImage: string;
  summary: string;
  content: string;
}

export interface WikiDoc {
  id: string;
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
  coverImage: string;
  summary: string;
  content: string;
}

export type Entry = BlogPost | WikiDoc;

export const isBlogPost = (entry: Entry): entry is BlogPost => /^\d+$/.test(entry.id);

export interface Issue {
  entry: number;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ImageInfo {
  path: string;
  url: string;
  dir: string;
  name: string;
  width: number;
  height: number;
}

export interface ImagesPayload {
  images: ImageInfo[];
  dirs: string[];
}

export type RefUsages = Record<string, string[]>;
