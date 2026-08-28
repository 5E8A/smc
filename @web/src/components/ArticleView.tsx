import { useParams } from "@tanstack/react-router";
import { getPostAvailability, getPostBySlug } from "../data/posts";
import { BlogPost } from "../types";
import BackButton from "./BackButton";
import AuthorCard from "./AuthorCard";
import { CalendarIcon, BookIcon } from "@phosphor-icons/react";
import { formatDate } from "@smc/shared/months";
import { useLanguage } from "../context/useLanguage";
import ContentMarkdown from "./ContentMarkdown";
import LanguageMissingCard from "./LanguageMissingCard";
import SmartImage from "./SmartImage";

const screenshotMode = import.meta.env.VITE_SCREENSHOT === "true";

interface ArticleViewProps {
  body?: string | null;
}

const ArticleView = ({ body }: ArticleViewProps) => {
  const { slug } = useParams({ strict: false });
  const { language } = useLanguage();
  const post: BlogPost | undefined = slug ? getPostBySlug(slug, language) : undefined;
  const content = body ?? null;

  if (!post) {
    if (!slug) return null;
    const availability = getPostAvailability(slug);
    const availableLang = availability.en ? "en" : "pl";
    const other = availability[availableLang];
    if (!other) return null;
    return <LanguageMissingCard kind="post" slug={slug} availableLang={availableLang} title={other.title} />;
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div
        aria-hidden
        className={`-z-10 ${screenshotMode ? "absolute" : "fixed"} mc-bg-tiled inset-0 bg-dark-prismarine opacity-45`}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Mobile-only back button */}
        <div className="mb-6 md:hidden">
          <BackButton fallbackTo="/$lang/archive" fallbackParams={{ lang: language }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-mc-surface shadow-2xl">
            {/* Cover image */}
            <div className="relative w-full overflow-hidden aspect-3/1">
              <SmartImage
                src={post.coverImage}
                alt={post.title}
                className="absolute left-1/2 -translate-x-1/2 size-full"
                lazy={false}
                priority="high"
              />
              <div className="absolute top-4 left-4 z-10 hidden md:block">
                <BackButton fallbackTo="/$lang/archive" fallbackParams={{ lang: language }} />
              </div>
            </div>

            {/* Title + metadata */}
            <div className="border-b border-white/5 px-8 pt-8 pb-6 md:px-12">
              <h1 className="mb-2 max-w-4xl text-3xl font-bold text-white md:text-4xl">{post.title}</h1>
              <p className="mb-4 max-w-3xl text-base text-mc-text">{post.summary}</p>
              <div className="flex items-center justify-between text-sm text-mc-text-muted">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-4" /> {formatDate(post.date, language) ?? post.date}
                </span>
                <span className="flex items-center gap-1 text-green-400">
                  <BookIcon className="size-4" /> {post.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 md:px-12">
              <article className="max-w-none">
                {content ? (
                  <ContentMarkdown content={content} />
                ) : (
                  <div className="h-32 animate-pulse bg-white/5 rounded" />
                )}
              </article>
            </div>

            {/* Author box */}
            <AuthorCard author={post.author} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
