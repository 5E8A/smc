import { useParams, Navigate } from "@tanstack/react-router";
import { getWikiDocBySlug } from "../data/wiki";
import { WikiDoc } from "../types";
import BackButton from "./BackButton";
import { CalendarIcon, BookIcon, ListIcon } from "@phosphor-icons/react";
import { useLanguage } from "../context/useLanguage";
import SmartImage from "./SmartImage";
import WikiMarkdownRenderer from "./WikiMarkdownRenderer";
import WikiTOC from "./WikiTOC";
import { useState } from "react";

const screenshotMode = import.meta.env.VITE_SCREENSHOT === "true";

const WikiDocView = () => {
  const { slug } = useParams({ strict: false });
  const { language } = useLanguage();
  const doc: WikiDoc | undefined = slug ? getWikiDocBySlug(slug, language) : undefined;
  const [tocOpen, setTocOpen] = useState(false);

  if (!doc) {
    return <Navigate to="/$lang/wiki" params={{ lang: language }} replace />;
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div
        aria-hidden
        className={`-z-10 ${screenshotMode ? "absolute" : "fixed"} mc-bg-tiled inset-0 bg-deepslate opacity-45`}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Mobile-only row: back button + TOC toggle */}
        <div className="mb-6 flex items-center justify-between md:hidden">
          <BackButton fallbackTo="/$lang/wiki" fallbackParams={{ lang: language }} />
          <button
            type="button"
            onClick={() => setTocOpen(!tocOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:text-white"
          >
            <ListIcon className="size-4" />
            {tocOpen ? "Hide" : "Contents"}
          </button>
        </div>

        {/* Mobile TOC drawer */}
        {tocOpen && (
          <div className="mb-6 rounded-xl border border-white/5 bg-mc-surface/95 p-4 backdrop-blur-md md:hidden">
            <WikiTOC content={doc.content} />
          </div>
        )}

        <div className="flex gap-8">
          {/* Main card */}
          <div className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-mc-surface shadow-2xl">
              <div className="relative h-64 w-full overflow-hidden">
                <SmartImage
                  src={doc.coverImage}
                  alt={doc.title}
                  className="absolute inset-0 size-full"
                  lazy={false}
                  priority="high"
                />
                <div className="absolute top-4 left-4 z-10 hidden md:block">
                  <BackButton fallbackTo="/$lang/wiki" fallbackParams={{ lang: language }} />
                </div>
              </div>

              <div className="border-b border-white/5 px-8 pt-8 pb-6 md:px-12">
                <h1 className="mb-2 max-w-4xl text-4xl font-bold text-white md:text-5xl">
                  {doc.title}
                </h1>
                <p className="mb-4 max-w-3xl text-base text-mc-text-muted">
                  {doc.summary}
                </p>
                <div className="flex items-center justify-between text-sm text-mc-text-muted">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-4" /> {doc.date}
                  </span>
                  <span className="flex items-center gap-1 text-green-400">
                    <BookIcon className="size-4" /> {doc.category}
                  </span>
                </div>
              </div>

              <div className="p-8 md:p-12">
                <article className="max-w-none">
                  <WikiMarkdownRenderer content={doc.content} />
                </article>
              </div>
            </div>
          </div>

          {/* Desktop sidebar TOC — right side */}
          <aside className="hidden w-64 shrink-0 md:block">
            <WikiTOC content={doc.content} />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default WikiDocView;
