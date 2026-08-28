export type Lang = "en" | "pl";
export type Kind = "posts" | "wiki";

export interface LocalizedText {
  en: string;
  pl: string;
}

export interface SocialLink {
  url: string;
  label?: string;
}

export interface AuthorSocials {
  twitter?: SocialLink;
  youtube?: SocialLink;
  github?: SocialLink;
  discord?: SocialLink;
}

export interface Author {
  id: string;
  avatar: string;
  name: LocalizedText;
  bio: LocalizedText;
  socials?: AuthorSocials;
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
  staticUrl?: string;
  dir: string;
  name: string;
  width: number;
  height: number;
  animated: boolean;
  format?: "webm";
  /** File size in bytes (absent in stale cached payloads). */
  size?: number;
  /** Absolute disk path of the file on this machine (absent in stale cached payloads). */
  diskPath?: string;
  /** Size in bytes of the `.static.webp` poster. */
  staticSize?: number;
}

export interface ImagesPayload {
  images: ImageInfo[];
  dirs: string[];
}

export type RefUsages = Record<string, string[]>;

export interface ModListColumn {
  key: string;
  slugs: string[];
}
