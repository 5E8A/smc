import { Link } from "@tanstack/react-router";
import { ArrowCounterClockwiseIcon, HouseIcon } from "@phosphor-icons/react";
import { translations } from "../utils/translations";

// Must work without the language context (this replaces the whole tree on
// error), so the language is read straight from the URL, like the router's
// $lang segment does: /smc/pl/... is Polish, everything else is English.
const errorLanguage = () => (window.location.pathname.replace(/^\/smc/, "").startsWith("/pl") ? "pl" : "en");

const ErrorFallback = () => {
  const language = errorLanguage();
  const text = translations[language].error_fallback;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <h1 className="mb-3 font-mc text-6xl font-pixel-shadow text-red-500 md:text-7xl">Oops!</h1>
      <p className="mb-2 max-w-md text-lg font-bold text-white">{text.title}</p>
      <p className="mb-8 max-w-md text-sm text-zinc-400">{text.description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-mc-green inline-flex items-center gap-2 rounded px-6 py-3"
        >
          <ArrowCounterClockwiseIcon size={16} weight="bold" />
          {text.reload}
        </button>
        <Link
          to="/$lang"
          params={{ lang: language }}
          className="inline-flex items-center gap-2 rounded border border-white/15 px-6 py-3 text-zinc-300 transition-colors hover:text-white"
        >
          <HouseIcon size={16} />
          {text.home}
        </Link>
      </div>
    </div>
  );
};

export default ErrorFallback;
