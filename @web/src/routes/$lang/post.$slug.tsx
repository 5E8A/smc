import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPostAvailability, getPostBody, getPostBySlug } from "../../data/posts";

const suffix = " | SMC";

export const Route = createFileRoute("/$lang/post/$slug")({
  beforeLoad: ({ params }) => {
    const availability = getPostAvailability(params.slug);
    if (!availability.en && !availability.pl) {
      throw notFound();
    }
  },
  loader: ({ params }) => {
    const lang = params.lang === "pl" ? "pl" : "en";
    const body = getPostBody(params.slug, lang);
    const post = getPostBySlug(params.slug, lang);
    return { body, title: post?.title, summary: post?.summary, coverImage: post?.coverImage };
  },
  head: ({ loaderData }) => {
    const { title, summary, coverImage } = loaderData as {
      body: string | null;
      title: string | undefined;
      summary: string | undefined;
      coverImage: string | undefined;
    };
    const pageTitle = title ? `${title}${suffix}` : undefined;
    const imageUrl = coverImage ? `https://5e8a.github.io${coverImage}` : undefined;
    return {
      meta: [
        { title: pageTitle },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: summary },
        { property: "og:image", content: imageUrl },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: pageTitle },
        { name: "twitter:description", content: summary },
        { name: "twitter:image", content: imageUrl },
      ],
    };
  },
});
