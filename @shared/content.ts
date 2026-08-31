export const LANGS = ["en", "pl"] as const;
export type Lang = (typeof LANGS)[number];

export const KINDS = ["posts", "wiki"] as const;
export type Kind = (typeof KINDS)[number];

export const isLang = (v: string | null): v is Lang => LANGS.includes(v as Lang);
export const isKind = (v: string | null): v is Kind => KINDS.includes(v as Kind);

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
