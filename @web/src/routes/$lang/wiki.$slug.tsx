import { createFileRoute, notFound } from "@tanstack/react-router";
import { getWikiDocAvailability } from "../../data/wiki";

export const Route = createFileRoute("/$lang/wiki/$slug")({
  beforeLoad: ({ params }) => {
    const availability = getWikiDocAvailability(params.slug);
    if (!availability.en && !availability.pl) {
      throw notFound();
    }
  },
});
