export const languages = ["en", "pl"] as const;
export type Language = (typeof languages)[number];

export const KINDS = ["posts", "wiki"] as const;
export type Kind = (typeof KINDS)[number];

export const isLanguage = (v: string | null): v is Language => languages.includes(v as Language);
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
