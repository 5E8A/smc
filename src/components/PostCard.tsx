import { Link } from "@tanstack/react-router";
import { CalendarIcon /*User*/ } from "@phosphor-icons/react";
import { BlogPost } from "../types";
import { useLanguage } from "../context/useLanguage";
import SmartImage from "./SmartImage";

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
        <div className="absolute inset-0 bg-gradient-to-t from-mc-surface via-transparent to-transparent opacity-90"></div>
        <div className="absolute top-4 left-4">
          <span className="rounded border border-white/10 bg-black/60 px-3 py-1 text-xs font-bold tracking-wider text-mc-green uppercase backdrop-blur-md">
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative -mt-12 flex flex-grow flex-col p-6">
        <div className="mb-3 flex items-center space-x-4 text-xs text-mc-text-muted">
          <div className="flex items-center rounded border border-white/5 bg-black/40 px-2 py-1">
            <CalendarIcon className="mr-2 size-3" />
            {post.date}
          </div>
        </div>

        <h3 className="mb-3 line-clamp-2 text-xl leading-tight font-bold text-white transition-colors group-hover:text-mc-green">
          {post.title}
        </h3>

        <p className="mb-6 line-clamp-3 flex-grow text-sm leading-relaxed text-gray-400">{post.summary}</p>

        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center text-xs text-mc-text-muted">
            {/* Avatar Section: Using the image and reducing its size */}
            <img src={post.author.avatar} alt={post.author.name} className="mr-2 size-6 rounded-full object-cover" />

            {/* Author Name */}
            {post.author.name}
          </div>

          <span className="text-sm font-semibold text-white transition-colors group-hover:text-mc-green">
            {t.latest.read_article} &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
