import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPostAvailability, getPostBody } from "../../data/posts";

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
    return { body };
  },
});
