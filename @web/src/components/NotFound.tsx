import { Link } from "@tanstack/react-router";
import { useLanguage } from "../context/useLanguage";

const screenshotMode = import.meta.env.VITE_SCREENSHOT === "true";

const NotFound = () => {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-transparent px-4">
      {/* tiled bedrock, dimmed like other pages */}
      <div
        aria-hidden
        className={`-z-10 ${screenshotMode ? "absolute" : "fixed"} mc-bg-tiled inset-0 bg-bedrock opacity-45`}
      />
      <h1 className="mb-4 font-mc text-8xl text-mc-green font-pixel-shadow md:text-9xl">404</h1>
      <h2 className="mb-4 text-center text-2xl font-bold text-white md:text-3xl">{t.not_found.title}</h2>
      <p className="mb-10 max-w-md text-center text-lg text-mc-text">{t.not_found.description}</p>
      <Link to="/$lang" params={{ lang: language }} className="btn-mc-green rounded px-8 py-3 text-center">
        {t.not_found.back_home}
      </Link>
    </div>
  );
};

export default NotFound;
