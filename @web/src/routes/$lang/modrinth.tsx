import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$lang/modrinth")({
  validateSearch: (search: Record<string, unknown>) => ({
    type: typeof search.type === "string" ? search.type : null,
    slug: typeof search.slug === "string" ? search.slug : null,
  }),
});
