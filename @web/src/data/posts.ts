import { BlogPost, BlogPostRaw } from "../types";
import { resolveAuthor } from "./authors";
import { EN_MONTHS, PL_MONTHS } from "@smc/shared/months";
import enPosts from "../content/en/posts.json";
import plPosts from "../content/pl/posts.json";

const enRaw = import.meta.glob<string>("../content/en/posts/*.md", { query: "?raw", import: "default", eager: true });
const plRaw = import.meta.glob<string>("../content/pl/posts/*.md", { query: "?raw", import: "default", eager: true });

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

const parseDate = (dateStr: string): number => {
  let processedDate = dateStr;
  PL_MONTHS.forEach((pl, i) => {
    if (dateStr.includes(pl)) {
      processedDate = processedDate.replace(pl, EN_MONTHS[i]!);
    }
  });

  return new Date(processedDate).getTime();
};

const sortPosts = (a: BlogPost, b: BlogPost): number => {
  const dateA = parseDate(a.date);
  const dateB = parseDate(b.date);
  if (!isNaN(dateA) && !isNaN(dateB)) {
    return dateB - dateA;
  }
  return parseInt(b.id) - parseInt(a.id);
};

const withAuthor = (post: BlogPostRaw, lang: "en" | "pl"): BlogPost => ({
  ...post,
  author: resolveAuthor(post.author, lang),
});

const postsByLanguage: Record<"en" | "pl", BlogPost[]> = {
  en: (enPosts as BlogPostRaw[]).map((p) => withAuthor(p, "en")).sort(sortPosts),
  pl: (plPosts as BlogPostRaw[]).map((p) => withAuthor(p, "pl")).sort(sortPosts),
};

export const getPosts = (language: "en" | "pl"): BlogPost[] => postsByLanguage[language];

export const getRecentPosts = (language: "en" | "pl", limit: number): BlogPost[] => getPosts(language).slice(0, limit);

export const getPostBySlug = (slug: string, language: "en" | "pl"): BlogPost | undefined =>
  getPosts(language).find((p) => p.slug === slug);

export const getPostAvailability = (slug: string): { en: BlogPost | null; pl: BlogPost | null } => ({
  en: getPostBySlug(slug, "en") ?? null,
  pl: getPostBySlug(slug, "pl") ?? null,
});

export const getPostBody = (slug: string, lang: "en" | "pl"): string | null => {
  return bodies[lang][slug] ?? null;
};
