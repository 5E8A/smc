import { createFileRoute } from "@tanstack/react-router";
import { translations, type Language } from "../../utils/translations";
import HomeView from "@/views/HomeView";

export const Route = createFileRoute("/$lang/")({
  component: HomeView,
  head: ({ params }) => {
    const lang = params.lang as Language;
    return {
      meta: [{ title: translations[lang].meta.titles.home }],
      links: [
        {
          rel: "preload",
          as: "image",
          href: "/smc/assets/static/Artboard_3.webp",
          fetchPriority: "high",
        },
        {
          rel: "preload",
          as: "image",
          href: "/smc/assets/static/background.webp",
          fetchPriority: "high",
        },
      ],
    };
  },
});
