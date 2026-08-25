import { useEffect, useRef, useState } from "react";
import { getWikiDocs } from "../data/wiki";
import { WikiDoc } from "../types";
import { useLanguage } from "../context/useLanguage";
import { BookIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import SmartImage from "./SmartImage";
import SearchHeader from "./SearchHeader";

const screenshotMode = import.meta.env.VITE_SCREENSHOT === "true";

const WikiView = () => {
  const { t, language } = useLanguage();
  const docs: WikiDoc[] = getWikiDocs(language);
  const [searchTerm, setSearchTerm] = useState("");
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (screenshotMode && bgRef.current) bgRef.current.style.height = `${document.documentElement.scrollHeight}px`;
  }, []);

  const filteredDocs = docs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-transparent pt-10 pb-20">
      <div ref={bgRef} aria-hidden className={`-z-10 ${screenshotMode ? "absolute" : "fixed"} mc-bg-tiled inset-0 bg-deepslate opacity-45`} />
      <SearchHeader
        title={t.wiki.title}
        subtitle={t.wiki.subtitle}
        searchPlaceholder={t.wiki.search_placeholder}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Grid */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-75 grid-cols-1 gap-6 md:grid-cols-2">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((doc) => (
              <Link
                key={doc.id}
                to="/$lang/wiki/$slug"
                params={{ lang: language, slug: doc.slug }}
                preload="intent"
                className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-mc-surface transition-all duration-300 hover:border-green-500/50 hover:shadow-xl"
              >
                <div className="flex h-full flex-col md:flex-row">
                  <div className="relative h-48 overflow-hidden md:h-auto md:w-1/3">
                    <div className="absolute inset-0 z-10 bg-black/2 transition-colors group-hover:bg-transparent"></div>
                    <SmartImage
                      src={doc.coverImage}
                      alt={doc.title}
                      className="size-full transition-transform duration-300 will-change-transform group-hover:cover-zoom"
                      priority="low"
                    />
                  </div>
                  <div className="flex flex-col justify-between p-6 md:w-2/3">
                    <div>
                      <div className="mb-3 flex items-center space-x-2">
                        <BookIcon className="size-4 text-green-400" />
                        <span className="text-xs font-bold tracking-wider text-green-400 uppercase">
                          {doc.category}
                        </span>
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-white transition-colors group-hover:text-green-400">
                        {doc.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-mc-text">{doc.summary}</p>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-semibold text-white transition-colors group-hover:text-green-400">
                      {t.wiki.read_doc}{" "}
                      <ArrowRightIcon className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-mc-text-muted">No results found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WikiView;
