import { useParams, Navigate } from "@tanstack/react-router";
import { getPostBySlug } from "../data/posts";
import { BlogPost } from "../types";
import Carousel from "./Carousel";
import BackButton from "./BackButton";
import { CalendarIcon, BookIcon } from "@phosphor-icons/react";
import { useLanguage } from "../context/useLanguage";
import { parseRichText } from "../utils/richText";
import SmartImage from "./SmartImage";

const screenshotMode = import.meta.env.VITE_SCREENSHOT === "true";

const ArticleView = () => {
  const { slug } = useParams({ strict: false });
  const { language } = useLanguage();
  const post: BlogPost | undefined = slug ? getPostBySlug(slug, language) : undefined;

  if (!post) {
    return <Navigate to="/$lang" params={{ lang: language }} replace />;
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
                  <CalendarIcon className="size-4" /> {post.date}
                </span>
                <span className="flex items-center gap-1 text-green-400">
                  <BookIcon className="size-4" /> {post.category}
                </span>
              </div>
            </div>

            {/* Carousel */}
            {post.carouselImages && post.carouselImages.length > 0 && (
              <div className="border-b border-white/5 p-8 md:p-12">
                <div className="overflow-hidden rounded-xl border border-white/10 shadow-lg">
                  <Carousel images={post.carouselImages} />
                  <div className="border-t border-white/5 bg-black/40 p-3 text-center">
                    <p className="text-xs tracking-widest text-mc-text-muted uppercase">Gallery</p>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-8 md:p-12">
              <article className="max-w-none">
                {post.content.map((block, index) => (
                  <div key={index} className="mb-12">
                    {block.header && (
                      <h2 className="mb-6 flex items-center text-2xl font-bold text-white">
                        <span className="mr-4 h-8 w-1 rounded-full bg-mc-green"></span>
                        {block.header}
                      </h2>
                    )}

                    {block.paragraph && (
                      <p className="mb-6 text-lg leading-8 font-light text-gray-300">
                        {parseRichText(block.paragraph)}
                      </p>
                    )}

                    {block.image && (
                      <figure className="my-8 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                        <img
                          src={block.image}
                          alt={block.imageCaption || block.header || "Article Image"}
                          className="h-auto w-full object-cover"
                        />
                        {block.imageCaption && (
                          <figcaption className="border-t border-white/5 bg-black/40 p-3 text-center text-sm text-mc-text-muted italic">
                            {block.imageCaption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </div>
                ))}
              </article>
            </div>

            {/* Author box */}
            <div className="mx-8 mb-8 flex items-center space-x-6 rounded-xl border border-white/5 bg-black/20 p-6 md:mx-12 md:mb-12">
              <img src={post.author.avatar} alt={post.author.name} className="size-16 rounded-full object-cover" />
              <div>
                <h3 className="mb-1 text-lg font-bold text-white">{post.author.name}</h3>
                <p className="text-sm text-mc-text-muted">{post.author.bio}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
