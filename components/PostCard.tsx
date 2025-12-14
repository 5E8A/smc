import React from "react";
import { Link } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { BlogPost } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface PostCardProps {
  post: BlogPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col bg-mc-surface rounded-xl border border-white/10 overflow-hidden hover:border-mc-accent/50 hover:shadow-2xl hover:shadow-mc-accent/10 transition-all duration-300 group h-full">
      {/* Image Container */}
      <div className="relative h-56 overflow-hidden">
        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-mc-surface via-transparent to-transparent opacity-90"></div>
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-mc-accent rounded border border-white/10">{post.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow relative -mt-12">
        <div className="flex items-center text-xs text-mc-textMuted mb-3 space-x-4">
          <div className="flex items-center bg-black/40 px-2 py-1 rounded border border-white/5">
            <Calendar className="w-3 h-3 mr-2" />
            {post.date}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-mc-accent transition-colors leading-tight line-clamp-2">{post.title}</h3>

        <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed flex-grow">{post.summary}</p>

        <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center text-xs text-mc-textMuted">
            {/* Avatar Section: Using the image and reducing its size */}
            <img src={post.author.avatar} alt={post.author.name} className="w-6 h-6 rounded-full object-cover mr-2" />

            {/* Author Name */}
            {post.author.name}
          </div>

          <Link to={`/post/${post.slug}`} className="text-sm font-semibold text-white hover:text-mc-accent transition-colors">
            {t.latest.read_article} &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
