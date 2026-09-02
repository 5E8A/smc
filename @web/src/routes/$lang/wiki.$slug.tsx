import { createFileRoute, notFound } from "@tanstack/react-router";
import { getWikiDocAvailability, getWikiDocBody, getWikiDocBySlug } from "../../data/wiki";

const suffix = " | SMC";

export const Route = createFileRoute("/$lang/wiki/$slug")({
  beforeLoad: ({ params }) => {
    const availability = getWikiDocAvailability(params.slug);
    if (!availability.en && !availability.pl) {
      throw notFound();
    }
  },
  loader: ({ params }) => {
    const lang = params.lang === "pl" ? "pl" : "en";
    const body = getWikiDocBody(params.slug, lang);
    const doc = getWikiDocBySlug(params.slug, lang);
    return { body, title: doc?.title, summary: doc?.summary, coverImage: doc?.coverImage };
  },
  head: ({ loaderData }) => {
    const { title, summary, coverImage } = loaderData as {
      body: string | null;
      title: string | undefined;
      summary: string | undefined;
      coverImage: string | undefined;
    };
    const pageTitle = title ? `${title}${suffix}` : undefined;
    const imageUrl = coverImage ? `https://5e8a.github.io/smc${coverImage}` : undefined;
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
