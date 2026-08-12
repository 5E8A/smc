import React, { useState, useEffect } from "react";
import { translations, Language } from "../utils/translations";
import { LanguageContext, LanguageContextType } from "./useLanguage";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("smc-language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "pl")) {
      setLanguageState(savedLang);
    } else {
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "pl") {
        setLanguageState("pl");
      } else {
        setLanguageState("en");
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("smc-language", lang);
  };

  useEffect(() => {
    const meta = translations[language].meta;
    document.documentElement.lang = language;
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
  }, [language]);

  const t = translations[language];

  const value: LanguageContextType = { language, setLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
