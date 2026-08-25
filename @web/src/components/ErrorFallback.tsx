import { Link } from "@tanstack/react-router";
import { ArrowCounterClockwiseIcon, HouseIcon } from "@phosphor-icons/react";

// Bilingual on purpose: this renders outside the normal language flow when
// something unexpected breaks, so we cannot rely on the language context.
const ErrorFallback = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
    <h1 className="mb-3 font-mc text-6xl font-pixel-shadow text-red-500 md:text-7xl">Oops!</h1>
    <p className="mb-2 max-w-md text-lg font-bold text-white">Coś poszło nie tak / Something went wrong</p>
    <p className="mb-8 max-w-md text-sm text-zinc-400">
      Wystąpił nieoczekiwany błąd. / An unexpected error occurred while rendering this page.
    </p>
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="btn-mc-green inline-flex items-center gap-2 rounded px-6 py-3"
      >
        <ArrowCounterClockwiseIcon size={16} weight="bold" />
        Odśwież / Reload
      </button>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded border border-white/15 px-6 py-3 text-zinc-300 transition-colors hover:text-white"
      >
        <HouseIcon size={16} />
        Strona główna / Home
      </Link>
    </div>
  </div>
);

export default ErrorFallback;
