import authorsJson from "../content/authors.json";

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
  name: string;
  avatar: string;
  bio: string;
  socials?: AuthorSocials;
}

interface AuthorRecord {
  id: string;
  avatar: string;
  name: { en: string; pl: string };
  bio: { en: string; pl: string };
  socials?: AuthorSocials;
}

const byId = new Map<string, AuthorRecord>((authorsJson as AuthorRecord[]).map((a) => [a.id, a]));

export const getAuthorById = (id: string): AuthorRecord => {
  const author = byId.get(id);
  if (!author) {
    throw new Error(`Unknown author id "${id}" - fix the content entry or add the author to src/content/authors.json`);
  }
  return author;
};

export const resolveAuthor = (id: string, lang: "en" | "pl"): Author => {
  const author = getAuthorById(id);
  return { name: author.name[lang], avatar: author.avatar, bio: author.bio[lang], socials: author.socials };
};
