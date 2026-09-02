import { createFileRoute, redirect } from "@tanstack/react-router";
import { translations, type Language } from "../utils/translations";

const validLanguages: Language[] = ["en", "pl"];

export const Route = createFileRoute("/$lang")({
  beforeLoad: ({ params }) => {
    if (!validLanguages.includes(params.lang as Language)) {
      throw redirect({ to: "/" });
    }
  },
  head: ({ params }) => {
    const lang = params.lang as Language;
    const meta = translations[lang].meta;
    const baseUrl = "https://5e8a.github.io/smc";
    const imageUrl = `${baseUrl}/assets/static/og-default${lang === "pl" ? "-pl" : ""}.png`;
    const pageUrl = `${baseUrl}/${lang}`;
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.description },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: imageUrl },
        { property: "og:url", content: pageUrl },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: meta.title },
        { name: "twitter:description", content: meta.description },
        { name: "twitter:image", content: imageUrl },
      ],
      scripts: [{ tag: "script" as const, children: `document.documentElement.lang="${lang}"` }],
    };
  },
});
