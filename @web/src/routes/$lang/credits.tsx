import { createFileRoute } from "@tanstack/react-router";
import { translations, type Language } from "../../utils/translations";

export const Route = createFileRoute("/$lang/credits")({
  head: ({ params }) => {
    const lang = params.lang as Language;
    return {
      meta: [{ title: translations[lang].meta.titles.credits }],
    };
  },
});
