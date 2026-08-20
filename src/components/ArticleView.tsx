import { useParams, Navigate } from "@tanstack/react-router";
import { getPostBySlug } from "../data/posts";
import { BlogPost } from "../types";
import Carousel from "./Carousel";
import BackButton from "./BackButton";
import { CalendarIcon, UserIcon, ClockIcon } from "@phosphor-icons/react";
import { useLanguage } from "../context/useLanguage";
import { parseRichText } from "../utils/richText";
import SmartImage from "./SmartImage";

const ArticleView = () => {
  const { slug } = useParams({ strict: false });
  const { language } = useLanguage();
  const post: BlogPost | undefined = slug ? getPostBySlug(slug, language) : undefined;

  if (!post) {
    return <Navigate to="/$lang" params={{ lang: language }} replace />;
  }

  return (
    <div className="min-h-screen bg-mc-bg bg-deepslate pb-20">
      {/* Header Image Background */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-mc-bg/50 to-mc-bg"></div>
        <SmartImage src={post.coverImage} alt="Cover" className="size-full opacity-60" lazy={false} priority="high" />

        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end px-4 pb-20">
          <span className="mb-6 rounded-full border border-mc-green/20 bg-mc-green/10 px-4 py-1 text-sm font-bold tracking-wider text-mc-green uppercase backdrop-blur-md">
            {post.category}
          </span>
          <h1 className="mb-6 max-w-4xl text-center text-4xl leading-tight font-bold text-white md:text-6xl">
            {post.title}
          </h1>
          <div className="flex items-center space-x-6 text-sm font-medium text-mc-text-muted">
            <div className="flex items-center">
              <UserIcon className="mr-2 size-4" /> {post.author.name}
            </div>
            <div className="flex items-center">
              <CalendarIcon className="mr-2 size-4" /> {post.date}
            </div>
            <div className="flex items-center">
              <ClockIcon className="mr-2 size-4" /> 5 min read
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-30 mx-auto -mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <BackButton fallbackTo="/$lang/archive" fallbackParams={{ lang: language }} />
        </div>

        {/* Content Container */}
        <div className="rounded-2xl border border-white/5 bg-mc-surface p-8 shadow-2xl md:p-12">
          {/* Carousel */}
          {post.carouselImages && post.carouselImages.length > 0 && (
            <div className="mb-16 overflow-hidden rounded-xl border border-white/10 shadow-lg">
              <Carousel images={post.carouselImages} />
              <div className="border-t border-white/5 bg-black/40 p-3 text-center">
                <p className="text-xs tracking-widest text-mc-text-muted uppercase">Gallery</p>
              </div>
            </div>
          )}

          {/* Main Content Render */}
          <article className="prose prose-invert prose-lg max-w-none">
            {post.content.map((block, index) => (
              <div key={index} className="mb-12">
                {block.header && (
                  <h2 className="mb-6 flex items-center text-3xl font-bold text-white">
                    <span className="mr-4 h-8 w-1 rounded-full bg-mc-green"></span>
                    {block.header}
                  </h2>
                )}

                {block.paragraph && (
                  <p className="mb-6 text-lg leading-8 font-light text-gray-300">{parseRichText(block.paragraph)}</p>
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

          {/* Author Box */}
          <div className="mt-16 flex items-center space-x-6 border-t border-white/10 pt-10">
            <img src={post.author.avatar} alt={post.author.name} className="size-16 rounded-full object-cover" />
            <div>
              <h3 className="mb-1 text-lg font-bold text-white">{post.author.name}</h3>
              <p className="text-sm text-mc-text-muted">{post.author.bio}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
