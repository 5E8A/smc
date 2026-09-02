import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { useLanguage } from "@/context/useLanguage";
import McButton from "@/components/mc/McButton";

interface LanguageMissingCardProps {
  kind: "post" | "wiki";
  slug: string;
  availableLang: "en" | "pl";
  title: string;
}

const LanguageMissingCard = ({ kind, slug, availableLang, title }: LanguageMissingCardProps) => {
  const { t, language } = useLanguage();
  const u = t.unavailable;

  return (
    <div className="relative flex min-h-[70vh] flex-1 flex-col items-center justify-center px-4">
      <div
        aria-hidden
        className="-z-10 fixed mc-bg-tiled inset-0 bg-bedrock opacity-45"
      />
      <h1 className="mb-3 text-center text-3xl font-bold text-white md:text-4xl">{u.title}</h1>
      <p className="mb-2 max-w-md text-center text-lg text-mc-text">{u.description}</p>
      <p className="mb-8 max-w-md text-center font-semibold text-white">&ldquo;{title}&rdquo;</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {kind === "post" ? (
          <McButton
            as="link"
            to="/$lang/post/$slug"
            params={{ lang: availableLang, slug }}
            preload="intent"
            className="inline-flex items-center gap-2 rounded px-6 py-3"
          >
            {u.read_in}
            <ArrowRightIcon size={16} weight="bold" />
          </McButton>
        ) : (
          <McButton
            as="link"
            to="/$lang/wiki/$slug"
            params={{ lang: availableLang, slug }}
            preload="intent"
            className="inline-flex items-center gap-2 rounded px-6 py-3"
          >
            {u.read_in}
            <ArrowRightIcon size={16} weight="bold" />
          </McButton>
        )}
        <Link
          to={kind === "post" ? "/$lang/archive" : "/$lang/wiki"}
          params={{ lang: language }}
          preload="intent"
          className="rounded border border-white/15 px-6 py-3 text-mc-text transition-colors hover:text-white"
        >
          {u.back_to_archive}
        </Link>
      </div>
    </div>
  );
};

export default LanguageMissingCard;
