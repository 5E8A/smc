import { useEffect, useRef, useState } from "react";
import { getPosts } from "../data/posts";
import { BlogPost } from "../types";
import PostCard from "./PostCard";
import { useLanguage } from "../context/useLanguage";
import SearchHeader from "./SearchHeader";

const screenshotMode = import.meta.env.VITE_SCREENSHOT === "true";

const ArchiveView = () => {
  const { t, language } = useLanguage();
  const allPosts: BlogPost[] = getPosts(language);
  const [searchTerm, setSearchTerm] = useState("");
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (screenshotMode && bgRef.current) bgRef.current.style.height = `${document.documentElement.scrollHeight}px`;
  }, []);

  const filteredPosts = allPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-transparent pt-10 pb-20">
      <div ref={bgRef} aria-hidden className={`-z-10 ${screenshotMode ? "absolute" : "fixed"} inset-0 opacity-45 mc-bg-tiled bg-dark-prismarine`} />
      <SearchHeader
        title={t.archive.title}
        subtitle={t.archive.subtitle}
        searchPlaceholder={t.archive.search_placeholder}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="col-span-full text-center py-20 text-mc-text-muted">No results found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveView;
