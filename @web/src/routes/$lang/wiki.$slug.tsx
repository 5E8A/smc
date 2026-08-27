import { createFileRoute, notFound } from "@tanstack/react-router";
import { getWikiDocAvailability, getWikiDocBody } from "../../data/wiki";

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
    return { body };
  },
});
