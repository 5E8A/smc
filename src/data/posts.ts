import { BlogPost, BlogPostRaw } from "../types";
import { resolveAuthor } from "./authors";
import enPosts from "../content/en/posts.json";
import plPosts from "../content/pl/posts.json";

const parseDate = (dateStr: string): number => {
  const plMonths: { [key: string]: string } = {
    Sty: "Jan",
    Lut: "Feb",
    Mar: "Mar",
    Kwi: "Apr",
    Maj: "May",
    Cze: "Jun",
    Lip: "Jul",
    Sie: "Aug",
    Wrz: "Sep",
    Paź: "Oct",
    Lis: "Nov",
    Gru: "Dec",
  };

  let processedDate = dateStr;
  Object.keys(plMonths).forEach((pl) => {
    if (dateStr.includes(pl)) {
      processedDate = dateStr.replace(pl, plMonths[pl]);
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

export const getRecentPosts = (language: "en" | "pl", limit: number): BlogPost[] =>
  getPosts(language).slice(0, limit);

export const getPostBySlug = (slug: string, language: "en" | "pl"): BlogPost | undefined =>
  getPosts(language).find((p) => p.slug === slug);

export const getPostAvailability = (
  slug: string,
): { en: BlogPost | null; pl: BlogPost | null } => ({
  en: getPostBySlug(slug, "en") ?? null,
  pl: getPostBySlug(slug, "pl") ?? null,
});
