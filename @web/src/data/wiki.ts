import { WikiDoc, WikiDocRaw } from "../types";
import { resolveAuthor } from "./authors";
import enDocs from "../content/en/wiki.json";
import plDocs from "../content/pl/wiki.json";

const withAuthor = (doc: WikiDocRaw, lang: "en" | "pl"): WikiDoc => ({
  ...doc,
  author: resolveAuthor(doc.author, lang),
});

const docsByLanguage: Record<"en" | "pl", WikiDoc[]> = {
  en: (enDocs as WikiDocRaw[]).map((d) => withAuthor(d, "en")),
  pl: (plDocs as WikiDocRaw[]).map((d) => withAuthor(d, "pl")),
};

export const getWikiDocs = (language: "en" | "pl"): WikiDoc[] => docsByLanguage[language];

export const getWikiDocBySlug = (slug: string, language: "en" | "pl"): WikiDoc | undefined =>
  getWikiDocs(language).find((d) => d.slug === slug);

export const getWikiDocAvailability = (slug: string): { en: WikiDoc | null; pl: WikiDoc | null } => ({
  en: getWikiDocBySlug(slug, "en") ?? null,
  pl: getWikiDocBySlug(slug, "pl") ?? null,
});
