import { createFileRoute } from "@tanstack/react-router";
import { translations, type Language } from "../../../utils/translations";

export const Route = createFileRoute("/$lang/wiki/")({
  head: ({ params }) => {
    const lang = params.lang as Language;
    return {
      meta: [
        { title: translations[lang].meta.titles.wiki },
        { property: "og:title", content: translations[lang].meta.titles.wiki },
        { name: "twitter:title", content: translations[lang].meta.titles.wiki },
      ],
    };
  },
});
