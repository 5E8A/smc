import { WikiDoc } from "../types";
import enDocs from "../content/en/wiki.json";
import plDocs from "../content/pl/wiki.json";

const docsByLanguage: Record<"en" | "pl", WikiDoc[]> = {
  en: enDocs as WikiDoc[],
  pl: plDocs as WikiDoc[],
};

export const getWikiDocs = (language: "en" | "pl"): WikiDoc[] => docsByLanguage[language];

export const getWikiDocBySlug = (slug: string, language: "en" | "pl"): WikiDoc | undefined =>
  getWikiDocs(language).find((d) => d.slug === slug);
