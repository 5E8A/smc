import React, { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { fetchPostBySlug } from "../data/posts";
import { BlogPost } from "../types";
import Carousel from "./Carousel";
import { ArrowLeft, Calendar, User, Clock, Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { parseRichText } from "../utils/richText";

const ArticleView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      fetchPostBySlug(slug, language).then((data) => {
        setPost(data);
        setLoading(false);
      });
    }
  }, [slug, language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mc-bg bg-deepslate flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-mc-accent animate-spin" />
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-mc-bg bg-deepslate pb-20">
      {/* Header Image Background */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mc-bg/50 to-mc-bg z-10"></div>
        <img src={post.coverImage} className="w-full h-full object-cover opacity-60" alt="Cover" />

        <div className="absolute inset-0 flex flex-col justify-end items-center pb-20 z-20 px-4">
          <span className="px-4 py-1 mb-6 rounded-full bg-mc-accent/10 border border-mc-accent/20 text-mc-accent text-sm font-bold uppercase tracking-wider backdrop-blur-md">{post.category}</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 text-center max-w-4xl leading-tight">{post.title}</h1>
          <div className="flex items-center space-x-6 text-mc-textMuted text-sm font-medium">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" /> {post.author.name}
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" /> {post.date}
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" /> 5 min read
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-30">
        {/* Back Button */}
        <div className="absolute -top-24 left-4 md:left-0">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>

        {/* Content Container */}
        <div className="bg-mc-surface border border-white/5 rounded-2xl p-8 md:p-12 shadow-2xl">
          {/* Carousel */}
          {post.carouselImages && post.carouselImages.length > 0 && (
            <div className="mb-16 rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <Carousel images={post.carouselImages} />
              <div className="bg-black/40 p-3 text-center border-t border-white/5">
                <p className="text-xs text-mc-textMuted uppercase tracking-widest">Gallery</p>
              </div>
            </div>
          )}

          {/* Main Content Render */}
          <article className="prose prose-invert prose-lg max-w-none">
            {post.content.map((block, index) => (
              <div key={index} className="mb-12">
                {block.header && (
                  <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                    <span className="w-1 h-8 bg-mc-accent rounded-full mr-4"></span>
                    {block.header}
                  </h2>
                )}

                {block.paragraph && <p className="text-gray-300 leading-8 text-lg font-light mb-6">{parseRichText(block.paragraph)}</p>}

                {block.image && (
                  <figure className="my-8 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                    <img src={block.image} alt={block.imageCaption || block.header || "Article Image"} className="w-full h-auto object-cover" />
                    {block.imageCaption && <figcaption className="bg-black/40 p-3 text-center text-mc-textMuted text-sm italic border-t border-white/5">{block.imageCaption}</figcaption>}
                  </figure>
                )}
              </div>
            ))}
          </article>

          {/* Author Box */}
          <div className="flex items-center mt-16 border-t border-white/10 pt-10 space-x-6">
            <img src={post.author.avatar} alt={post.author.name} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <h3 className="text-white font-bold text-lg mb-1">{post.author.name}</h3>
              <p className="text-mc-textMuted text-sm">{post.author.bio}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleView;
