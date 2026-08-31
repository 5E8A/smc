import { createFileRoute } from "@tanstack/react-router";
import { translations, type Language } from "../../utils/translations";

export const Route = createFileRoute("/$lang/modrinth")({
  validateSearch: (search: Record<string, unknown>) => ({
    type: typeof search.type === "string" ? search.type : null,
    slug: typeof search.slug === "string" ? search.slug : null,
  }),
  head: ({ params }) => {
    const lang = params.lang as Language;
    return {
      meta: [{ title: translations[lang].meta.titles.modrinth }],
    };
  },
});
