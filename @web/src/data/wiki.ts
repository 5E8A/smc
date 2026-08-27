import { WikiDoc, WikiDocRaw } from "../types";
import { resolveAuthor } from "./authors";
import enDocs from "../content/en/wiki.json";
import plDocs from "../content/pl/wiki.json";

const enRaw = import.meta.glob<string>("../content/en/wiki/*.md", { query: "?raw", import: "default", eager: true });
const plRaw = import.meta.glob<string>("../content/pl/wiki/*.md", { query: "?raw", import: "default", eager: true });

function buildMap(entries: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [key, content] of Object.entries(entries)) {
    const slug = key.split("/").pop()?.replace(/\.md$/, "") ?? "";
    if (slug) map[slug] = content;
  }
  return map;
}

const enBodies = buildMap(enRaw);
const plBodies = buildMap(plRaw);
const bodies: Record<"en" | "pl", Record<string, string>> = { en: enBodies, pl: plBodies };

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

export const getWikiDocBody = (slug: string, lang: "en" | "pl"): string | null => {
  return bodies[lang][slug] ?? null;
};
