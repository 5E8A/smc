import { useEffect, type ReactNode } from "react";
import { useParams, useLocation, useNavigate } from "@tanstack/react-router";
import { translations, type Language } from "../utils/translations";
import { LanguageContext, type LanguageContextType } from "./useLanguage";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { lang } = useParams({ strict: false }) as { lang?: string };
  const language: Language = lang === "pl" ? "pl" : "en";
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const meta = translations[language].meta;
    document.documentElement.lang = language;
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
  }, [language]);

  const setLanguage = (newLang: Language) => {
    const currentLangPrefix = `/${language}`;
    const newLangPrefix = `/${newLang}`;

    let newPath: string;
    if (
      location.pathname === currentLangPrefix ||
      location.pathname === `${currentLangPrefix}/`
    ) {
      newPath = newLangPrefix;
    } else if (location.pathname.startsWith(`${currentLangPrefix}/`)) {
      newPath = `${newLangPrefix}${location.pathname.slice(currentLangPrefix.length)}`;
    } else {
      newPath = newLangPrefix;
    }

    navigate({ to: newPath });
  };

  const t = translations[language];

  const value: LanguageContextType = { language, setLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
