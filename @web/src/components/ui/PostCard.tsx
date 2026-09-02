import { Link } from "@tanstack/react-router";
import { CalendarIcon, ArrowRightIcon, BookIcon } from "@phosphor-icons/react";
import { formatDate } from "@smc/shared/months";
import { BlogPost } from "@/types";
import { useLanguage } from "@/context/useLanguage";
import SmartImage from "@/components/media/SmartImage";

interface PostCardProps {
  post: BlogPost;
}

const PostCard = ({ post }: PostCardProps) => {
  const { t, language } = useLanguage();

  return (
    <Link
      to="/$lang/post/$slug"
      params={{ lang: language, slug: post.slug }}
      preload="intent"
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-mc-surface transition-all duration-300 select-none hover:border-mc-green/50 hover:shadow-2xl hover:shadow-mc-green/10"
    >
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        <SmartImage
          src={post.coverImage}
          alt={post.title}
          className="size-full transition-transform duration-700 will-change-transform group-hover:cover-zoom"
          priority="low"
        />
        <div className="absolute inset-0 bg-linear-to-t from-mc-surface via-transparent to-transparent opacity-90"></div>
      </div>

      {/* Content */}
      <div className="relative -mt-12 flex grow flex-col p-6 justify-between">
        <div className="mb-3 flex items-center gap-2 text-xs">
          <div className="mb-3 flex items-center space-x-2 bg-black/30 p-2 rounded border border-white/10">
            <CalendarIcon className="size-[1em] mr-2" />
            {formatDate(post.date, language) ?? post.date}
          </div>

          <div className="mb-3 flex items-center space-x-2 bg-black/30 p-2 rounded border border-white/10">
            <BookIcon className="size-4 text-green-400" />
            <span className="text-xs font-bold tracking-wider text-green-400 uppercase">{post.category}</span>
          </div>
        </div>

        <h3 className="mb-3 line-clamp-2 text-xl leading-tight font-bold text-white transition-colors group-hover:text-green-400">
          {post.title}
        </h3>

        <p className="mb-6 line-clamp-3 grow text-sm leading-relaxed text-mc-text">{post.summary}</p>

        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center text-xs text-mc-text-muted">
            {/* Avatar Section: Using the image and reducing its size */}
            <img src={post.author.avatar} alt={post.author.name} className="mr-2 size-6 rounded-full object-cover" />

            {/* Author Name */}
            {post.author.name}
          </div>

          <div className="mt-4 flex items-center text-sm font-semibold text-white transition-colors group-hover:text-green-400">
            {t.latest.read_article}
            <ArrowRightIcon className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
