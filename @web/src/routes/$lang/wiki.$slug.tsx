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
    return { body, title: doc?.title };
  },
  head: ({ loaderData }) => {
    const { title } = loaderData as { body: string | null; title: string | undefined };
    return {
      meta: [{ title: title ? `${title}${suffix}` : undefined }],
    };
  },
});
