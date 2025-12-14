import { BlogPost } from "../types";

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

export const fetchPosts = async (language: "en" | "pl"): Promise<BlogPost[]> => {
  try {
    const response = await fetch(`/smc/content/${language}/posts.json`);
    if (!response.ok) {
      console.error("Failed to fetch posts");
      return [];
    }
    const posts: BlogPost[] = await response.json();

    // Sort by Date
    return posts.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateB - dateA;
      }
      return parseInt(b.id) - parseInt(a.id);
    });
  } catch (error) {
    console.error("Error loading posts:", error);
    return [];
  }
};

export const fetchRecentPosts = async (language: "en" | "pl", limit: number): Promise<BlogPost[]> => {
  const posts = await fetchPosts(language);
  return posts.slice(0, limit);
};

export const fetchPostBySlug = async (slug: string, language: "en" | "pl"): Promise<BlogPost | undefined> => {
  const posts = await fetchPosts(language);
  return posts.find((p) => p.slug === slug);
};
