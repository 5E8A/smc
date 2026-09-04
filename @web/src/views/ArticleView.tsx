import { useParams } from "@tanstack/react-router";
import { getPostAvailability, getPostBySlug } from "@/data/posts";
import { BlogPost } from "@/types";
import BackButton from "@/components/structural/BackButton";
import AuthorCard from "@/components/ui/AuthorCard";
import { CalendarIcon, BookIcon } from "@phosphor-icons/react";
import { formatDate } from "@smc/shared/months";
import { useLanguage } from "@/context/useLanguage";
import ContentMarkdown from "@/components/content/ContentMarkdown";
import LanguageMissingCard from "@/components/ui/LanguageMissingCard";
import SmartImage from "@/components/media/SmartImage";

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
      <div aria-hidden className="-z-10 fixed mc-bg-tiled inset-0 bg-dark-prismarine opacity-45" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-2xl border border-white/5 bg-mc-surface shadow-2xl">
            {/* Cover image */}
            <div className="relative w-full overflow-hidden aspect-2/1">
              <SmartImage
                src={post.coverImage}
                alt={post.title}
                className="absolute inset-0 size-full"
                lazy={false}
                priority="high"
              />
              <div className="absolute top-4 left-4 z-10">
                <BackButton fallbackTo="/$lang/archive" fallbackParams={{ lang: language }} />
              </div>
            </div>

            {/* Title + metadata */}
            <div className="border-b border-white/5 px-5 pt-8 pb-6 sm:px-8 md:px-12">
              <h1 className="mb-2 max-w-4xl text-3xl font-bold text-white md:text-4xl">{post.title}</h1>
              <p className="mb-4 max-w-3xl text-base text-mc-text">{post.summary}</p>
              <div className="flex flex-wrap items-center justify-between gap-x-4 text-sm text-mc-text-muted">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="size-4" /> {formatDate(post.date, language) ?? post.date}
                </span>
                <span className="flex items-center gap-1 text-green-400">
                  <BookIcon className="size-4" /> {post.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-8 md:p-12">
              <article className="max-w-none [overflow-wrap:anywhere]">
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
