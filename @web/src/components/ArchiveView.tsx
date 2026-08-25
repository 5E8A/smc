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
    <div className="flex min-h-screen flex-col bg-transparent pt-10 pb-20">
      <div ref={bgRef} aria-hidden className={`-z-10 ${screenshotMode ? "absolute" : "fixed"} mc-bg-tiled inset-0 bg-dark-prismarine opacity-45`} />
      <SearchHeader
        title={t.archive.title}
        subtitle={t.archive.subtitle}
        searchPlaceholder={t.archive.search_placeholder}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Grid */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-75 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="col-span-full py-20 text-center text-mc-text-muted">No results found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveView;
