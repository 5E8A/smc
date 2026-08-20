import { useParams, Navigate } from "@tanstack/react-router";
import { getWikiDocBySlug } from "../data/wiki";
import { WikiDoc } from "../types";
import BackButton from "./BackButton";
import { CalendarIcon, BookIcon } from "@phosphor-icons/react";
import { useLanguage } from "../context/useLanguage";
import { parseRichText } from "../utils/richText";
import SmartImage from "./SmartImage";

const WikiDocView = () => {
  const { slug } = useParams({ strict: false });
  const { language } = useLanguage();
  const doc: WikiDoc | undefined = slug ? getWikiDocBySlug(slug, language) : undefined;

  if (!doc) {
    return <Navigate to="/$lang/wiki" params={{ lang: language }} replace />;
  }

  return (
    <div className="min-h-screen bg-mc-bg bg-deepslate pb-20">
      {/* Header Image Background */}
      <div className="relative h-64 w-full overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-10 bg-black/60"></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-mc-bg to-transparent"></div>
        <SmartImage src={doc.coverImage} alt="Cover" className="size-full opacity-50 blur-sm" lazy={false} priority="high" />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4">
          <span className="mb-4 rounded border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-bold tracking-wider text-green-300 uppercase backdrop-blur-md">
            {doc.category}
          </span>
          <h1 className="mb-4 max-w-4xl text-center font-mc text-3xl font-bold text-white text-shadow-lg md:text-5xl">
            {doc.title}
          </h1>
        </div>
      </div>

      <div className="relative z-30 mx-auto -mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-5">
          <BackButton fallbackTo="/$lang/wiki" fallbackParams={{ lang: language }} />
        </div>

        {/* Content Container */}
        <div className="rounded-2xl border border-white/5 bg-mc-surface p-8 shadow-2xl md:p-12">
          <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center text-sm text-mc-text-muted">
              <BookIcon className="mr-2 size-4" /> Wiki Documentation
            </div>
            <div className="flex items-center text-sm text-mc-text-muted">
              <CalendarIcon className="mr-2 size-4" /> Last Updated: {doc.date}
            </div>
          </div>

          {/* Main Content Render */}
          <article className="max-w-none">
            {doc.content.map((block, index) => (
              <div key={index} className="mb-8">
                {block.header && (
                  <h2 className="mb-4 flex items-center border-l-4 border-green-500 pl-4 text-2xl font-bold text-white">
                    {block.header}
                  </h2>
                )}
                {block.paragraph && (
                  <p className="rounded-lg border border-white/5 bg-black/20 p-4 text-base leading-7 text-gray-300">
                    {parseRichText(block.paragraph)}
                  </p>
                )}
                {block.image && (
                  <figure className="my-6 overflow-hidden rounded-xl border border-white/10">
                    <img
                      src={block.image}
                      alt={block.imageCaption || "Wiki Image"}
                      className="h-auto w-full object-cover"
                    />
                    {block.imageCaption && (
                      <figcaption className="bg-black/40 p-2 text-center text-xs text-mc-text-muted">
                        {block.imageCaption}
                      </figcaption>
                    )}
                  </figure>
                )}
              </div>
            ))}
          </article>
        </div>
      </div>
    </div>
  );
};

export default WikiDocView;
