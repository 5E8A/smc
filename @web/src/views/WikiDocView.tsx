import { useParams } from "@tanstack/react-router";
import { getWikiDocAvailability, getWikiDocBySlug } from "@/data/wiki";
import { WikiDoc } from "@/types";
import BackButton from "@/components/structural/BackButton";
import AuthorCard from "@/components/ui/AuthorCard";
import { CalendarIcon, BookIcon, ListIcon } from "@phosphor-icons/react";
import { formatDate } from "@smc/shared/months";
import { useLanguage } from "@/context/useLanguage";
import SmartImage from "@/components/media/SmartImage";
import ContentMarkdown from "@/components/content/ContentMarkdown";
import LanguageMissingCard from "@/components/ui/LanguageMissingCard";
import WikiTOC from "@/components/content/WikiTOC";
import { useState } from "react";

interface WikiDocViewProps {
  body?: string | null;
}

const WikiDocView = ({ body }: WikiDocViewProps) => {
  const { slug } = useParams({ strict: false });
  const { language, t } = useLanguage();
  const doc: WikiDoc | undefined = slug ? getWikiDocBySlug(slug, language) : undefined;
  const content = body ?? null;
  const [tocOpen, setTocOpen] = useState(false);

  if (!doc) {
    if (!slug) return null;
    const availability = getWikiDocAvailability(slug);
    const availableLang = availability.en ? "en" : "pl";
    const other = availability[availableLang];
    if (!other) return null;
    return <LanguageMissingCard kind="wiki" slug={slug} availableLang={availableLang} title={other.title} />;
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div aria-hidden className="-z-10 fixed mc-bg-tiled inset-0 bg-deepslate opacity-45" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Mobile TOC drawer */}
        {tocOpen && content && (
          <div
            id="wiki-toc-drawer"
            className="mb-6 rounded-xl border border-white/5 bg-mc-surface/95 p-4 backdrop-blur-md xl:hidden"
          >
            <WikiTOC content={content} />
          </div>
        )}

        <div className="flex gap-8">
          {/* Main card */}
          <div className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-mc-surface shadow-2xl">
              <div className="relative w-full overflow-hidden aspect-2/1">
                <SmartImage
                  src={doc.coverImage}
                  alt={doc.title}
                  className="absolute inset-0 size-full"
                  lazy={false}
                  priority="high"
                />
                <div className="absolute top-4 left-4 z-10">
                  <BackButton fallbackTo="/$lang/wiki" fallbackParams={{ lang: language }} />
                </div>
                <button
                  type="button"
                  onClick={() => setTocOpen(!tocOpen)}
                  aria-expanded={tocOpen || undefined}
                  aria-controls="wiki-toc-drawer"
                  className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:text-white xl:hidden max-sm:px-2.5"
                >
                  <ListIcon className="size-4" />
                  <span className="max-sm:hidden">{tocOpen ? t.wiki.toc_hide : t.wiki.toc_contents}</span>
                </button>
              </div>

              <div className="border-b border-white/5 px-5 pt-8 pb-6 sm:px-8 md:px-12">
                <h1 className="mb-2 max-w-4xl text-3xl font-bold text-white md:text-4xl">{doc.title}</h1>
                <p className="mb-4 max-w-3xl text-base text-mc-text">{doc.summary}</p>
                <div className="flex flex-wrap items-center justify-between gap-x-4 text-sm text-mc-text-muted">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-4" /> {formatDate(doc.date, language) ?? doc.date}
                  </span>
                  <span className="flex items-center gap-1 text-green-400">
                    <BookIcon className="size-4" /> {doc.category}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-8 md:p-12">
                <article className="max-w-none [overflow-wrap:anywhere]">
                  {content ? (
                    <ContentMarkdown content={content} />
                  ) : (
                    <div className="h-32 animate-pulse bg-white/5 rounded" />
                  )}
                </article>
              </div>

              <AuthorCard author={doc.author} />
            </div>
          </div>

          {/* Desktop sidebar TOC - right side */}
          <aside className="hidden w-64 shrink-0 xl:block">{content && <WikiTOC content={content} />}</aside>
        </div>
      </div>
    </div>
  );
};

export default WikiDocView;
