import { createFileRoute } from "@tanstack/react-router";
import { translations } from "../../utils/translations";
import { type Language } from "@smc/shared/content";

export const Route = createFileRoute("/$lang/archive")({
  head: ({ params }) => {
    const lang = params.lang as Language;
    return {
      meta: [
        { title: translations[lang].meta.titles.archive },
        { property: "og:title", content: translations[lang].meta.titles.archive },
        { name: "twitter:title", content: translations[lang].meta.titles.archive },
      ],
    };
  },
});
