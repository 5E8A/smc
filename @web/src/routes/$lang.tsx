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
    return {
      meta: [{ title: meta.title }, { name: "description", content: meta.description }],
      scripts: [{ tag: "script" as const, children: `document.documentElement.lang="${lang}"` }],
    };
  },
});
