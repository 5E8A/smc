import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPostAvailability } from "../data/posts";

export const Route = createFileRoute("/post/$slug")({
  beforeLoad: ({ params }) => {
    const availability = getPostAvailability(params.slug);
    if (!availability.en && !availability.pl) {
      throw notFound();
    }
  },
});
