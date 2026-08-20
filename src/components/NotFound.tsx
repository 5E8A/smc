import { Link } from "@tanstack/react-router";
import { useLanguage } from "../context/useLanguage";

const screenshotMode = import.meta.env.VITE_SCREENSHOT === "true";

const NotFound = () => {
  const { t, language } = useLanguage();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-transparent px-4">
      {/* tiled bedrock, dimmed like other pages */}
      <div
        aria-hidden
        className={`-z-10 ${screenshotMode ? "absolute" : "fixed"} inset-0 opacity-45 mc-bg-tiled bg-bedrock`}
      />
      <h1 className="text-8xl md:text-9xl font-mc text-mc-green mb-4 font-pixel-shadow">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">{t.not_found.title}</h2>
      <p className="text-mc-text text-lg mb-10 text-center max-w-md">{t.not_found.description}</p>
      <Link to="/$lang" params={{ lang: language }} className="btn-mc-green px-8 py-3 rounded text-center">
        {t.not_found.back_home}
      </Link>
    </div>
  );
};

export default NotFound;
