import authorsJson from "../content/authors.json";

export interface AuthorRecord {
  id: string;
  avatar: string;
  name: { en: string; pl: string };
  bio: { en: string; pl: string };
}

const byId = new Map<string, AuthorRecord>(authorsJson.map((a) => [a.id, a]));

export const getAuthorById = (id: string): AuthorRecord => {
  const author = byId.get(id);
  if (!author) {
    throw new Error(`Unknown author id "${id}" - fix the content entry or add the author to src/content/authors.json`);
  }
  return author;
};

export const resolveAuthor = (id: string, lang: "en" | "pl"): { name: string; avatar: string; bio: string } => {
  const author = getAuthorById(id);
  return { name: author.name[lang], avatar: author.avatar, bio: author.bio[lang] };
};
