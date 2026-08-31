import { createFileRoute } from "@tanstack/react-router";
import { translations, type Language } from "../../utils/translations";
import HomeView from "../../components/HomeView";

export const Route = createFileRoute("/$lang/")({
  component: HomeView,
  head: ({ params }) => {
    const lang = params.lang as Language;
    return {
      meta: [{ title: translations[lang].meta.titles.home }],
    };
  },
});
