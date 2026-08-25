import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPostAvailability } from "../../data/posts";

export const Route = createFileRoute("/$lang/post/$slug")({
  beforeLoad: ({ params }) => {
    const availability = getPostAvailability(params.slug);
    if (!availability.en && !availability.pl) {
      throw notFound();
    }
  },
});
