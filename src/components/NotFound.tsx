import React from "react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "../context/LanguageContext";

const NotFound: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-mc-bg bg-deepslate px-4">
      <h1 className="text-8xl md:text-9xl font-mc text-mc-green mb-4 font-pixel-shadow">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">{t.not_found.title}</h2>
      <p className="text-mc-text-muted text-lg mb-10 text-center max-w-md">{t.not_found.description}</p>
      <Link to="/" className="btn-mc-green px-8 py-3 rounded text-center">
        {t.not_found.back_home}
      </Link>
    </div>
  );
};

export default NotFound;
