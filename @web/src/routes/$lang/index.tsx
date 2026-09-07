import { createFileRoute } from "@tanstack/react-router";
import { ASSETS_BASE_PATH } from "@smc/shared/constants";
import { translations } from "../../utils/translations";
import { type Language } from "@smc/shared/content";
import HomeView from "@/views/HomeView";

export const Route = createFileRoute("/$lang/")({
  component: HomeView,
  head: ({ params }) => {
    const lang = params.lang as Language;
    return {
      meta: [
        { title: translations[lang].meta.titles.home },
        { property: "og:title", content: translations[lang].meta.titles.home },
        { name: "twitter:title", content: translations[lang].meta.titles.home },
      ],
      links: [
        {
          rel: "preload",
          as: "image",
          href: `${ASSETS_BASE_PATH}/static/Artboard_3.webp`,
          fetchPriority: "high",
        },
        {
          rel: "preload",
          as: "image",
          href: `${ASSETS_BASE_PATH}/static/background.webp`,
          media: "(min-width: 1024px)",
          fetchPriority: "high",
        },
        {
          rel: "preload",
          as: "image",
          href: `${ASSETS_BASE_PATH}/static/background.mobile.webp`,
          media: "(max-width: 1023px)",
          fetchPriority: "high",
        },
      ],
    };
  },
});
