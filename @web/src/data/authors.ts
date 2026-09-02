import authorsJson from "../content/authors.json";
import type { LocalizedText, AuthorSocials } from "@smc/shared/content";

export type { SocialLink, AuthorSocials } from "@smc/shared/content";

export interface Author {
  name: string;
  avatar: string;
  bio: string;
  socials?: AuthorSocials;
}

interface AuthorRecord {
  id: string;
  avatar: string;
  name: LocalizedText;
  bio: LocalizedText;
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
  const result: Author = { name: author.name[lang], avatar: author.avatar, bio: author.bio[lang] };
  if (author.socials) result.socials = author.socials;
  return result;
};
