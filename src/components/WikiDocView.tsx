import { useEffect, useState } from "react";
import { useParams, Navigate } from "@tanstack/react-router";
import { fetchWikiDocBySlug } from "../data/wiki";
import { WikiDoc } from "../types";
import BackButton from "./BackButton";
import { Calendar, Book, Loader2 } from "lucide-react";
import { useLanguage } from "../context/useLanguage";
import { parseRichText } from "../utils/richText";
import SmartImage from "./SmartImage";

const WikiDocView = () => {
  const { slug } = useParams({ strict: false });
  const { language } = useLanguage();
  const [doc, setDoc] = useState<WikiDoc | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetchWikiDocBySlug(slug, language).then((data) => {
        setDoc(data);
        setLoading(false);
      });
    }
  }, [slug, language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mc-bg bg-deepslate flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-mc-green animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return <Navigate to="/wiki" replace />;
  }

  return (
    <div className="min-h-screen bg-mc-bg bg-deepslate pb-20">
      {/* Header Image Background */}
      <div className="relative h-64 w-full overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-black/60 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-mc-bg to-transparent z-10"></div>
        <SmartImage src={doc.coverImage} alt="Cover" className="w-full h-full opacity-50 blur-sm" lazy={false} priority="high" />

        <div className="absolute inset-0 flex flex-col justify-center items-center z-20 px-4">
          <span className="px-3 py-1 mb-4 rounded bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            {doc.category}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 text-center max-w-4xl font-mc text-shadow-lg">
            {doc.title}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30">
        {/* Back Button */}
        <div className="absolute -top-16 left-4 md:left-0">
          <BackButton fallbackTo="/wiki" />
        </div>

        {/* Content Container */}
        <div className="bg-mc-surface border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-6 mb-8">
            <div className="flex items-center text-mc-text-muted text-sm">
              <Book className="w-4 h-4 mr-2" /> Wiki Documentation
            </div>
            <div className="flex items-center text-mc-text-muted text-sm">
              <Calendar className="w-4 h-4 mr-2" /> Last Updated: {doc.date}
            </div>
          </div>

          {/* Main Content Render */}
          <article className="prose prose-invert prose-lg max-w-none">
            {doc.content.map((block, index) => (
              <div key={index} className="mb-8">
                {block.header && (
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center border-l-4 border-green-500 pl-4">
                    {block.header}
                  </h2>
                )}
                {block.paragraph && (
                  <p className="text-gray-300 leading-7 text-base bg-black/20 p-4 rounded-lg border border-white/5">
                    {parseRichText(block.paragraph)}
                  </p>
                )}
                {block.image && (
                  <figure className="my-6 rounded-xl overflow-hidden border border-white/10">
                    <img
                      src={block.image}
                      alt={block.imageCaption || "Wiki Image"}
                      className="w-full h-auto object-cover"
                    />
                    {block.imageCaption && (
                      <figcaption className="bg-black/40 p-2 text-center text-mc-text-muted text-xs">
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
