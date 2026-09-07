import { BlogPost, BlogPostRaw } from "../types";
import { resolveAuthor } from "./authors";
import { type Language } from "@smc/shared/content";
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
const bodies: Record<Language, Record<string, string>> = { en: enBodies, pl: plBodies };

const sortPosts = (a: BlogPost, b: BlogPost): number => b.date.localeCompare(a.date) || parseInt(b.id) - parseInt(a.id);

const withAuthor = (post: BlogPostRaw, lang: Language): BlogPost => ({
  ...post,
  author: resolveAuthor(post.author, lang),
});

const postsByLanguage: Record<Language, BlogPost[]> = {
  en: (enPosts as BlogPostRaw[]).map((p) => withAuthor(p, "en")).sort(sortPosts),
  pl: (plPosts as BlogPostRaw[]).map((p) => withAuthor(p, "pl")).sort(sortPosts),
};

export const getPosts = (language: Language): BlogPost[] => postsByLanguage[language];

export const getRecentPosts = (language: Language, limit: number): BlogPost[] => getPosts(language).slice(0, limit);

export const getPostBySlug = (slug: string, language: Language): BlogPost | undefined =>
  getPosts(language).find((p) => p.slug === slug);

export const getPostAvailability = (slug: string): { en: BlogPost | null; pl: BlogPost | null } => ({
  en: getPostBySlug(slug, "en") ?? null,
  pl: getPostBySlug(slug, "pl") ?? null,
});

export const getPostBody = (slug: string, lang: Language): string | null => {
  return bodies[lang][slug] ?? null;
};
