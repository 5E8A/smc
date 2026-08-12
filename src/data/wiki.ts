import { WikiDoc } from "../types";

export const fetchWikiDocs = async (language: "en" | "pl"): Promise<WikiDoc[]> => {
  try {
    const response = await fetch(`/smc/content/${language}/wiki.json`);
    if (!response.ok) {
      console.error("Failed to fetch wiki docs");
      return [];
    }
    const docs: WikiDoc[] = await response.json();
    return docs;
  } catch (error) {
    console.error("Error loading wiki docs:", error);
    return [];
  }
};

export const fetchWikiDocBySlug = async (slug: string, language: "en" | "pl"): Promise<WikiDoc | undefined> => {
  const docs = await fetchWikiDocs(language);
  return docs.find((d) => d.slug === slug);
};
