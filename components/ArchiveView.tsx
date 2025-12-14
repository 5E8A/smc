import React, { useState, useEffect } from 'react';
import { fetchPosts } from '../data/posts';
import { BlogPost } from '../types';
import PostCard from './PostCard';
import { useLanguage } from '../context/LanguageContext';
import { Search, Loader2 } from 'lucide-react';

const ArchiveView: React.FC = () => {
  const { t, language } = useLanguage();
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchPosts(language).then(data => {
      setAllPosts(data);
      setLoading(false);
    });
  }, [language]);

  const filteredPosts = allPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-mc-bg bg-deepslate pt-10 pb-20">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 w-full">
        <div className="bg-mc-surface border border-white/10 rounded-xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-mc-accent/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          
          <h1 className="text-4xl md:text-5xl font-mc text-white mb-4 font-pixel-shadow relative z-10">
            {t.archive.title}
          </h1>
          <p className="text-mc-textMuted text-lg relative z-10 mb-8 max-w-2xl">
            {t.archive.subtitle}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md z-10">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-mc-textMuted" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg leading-5 bg-black/40 text-white placeholder-mc-textMuted focus:outline-none focus:ring-1 focus:ring-mc-accent focus:border-mc-accent sm:text-sm transition-colors"
              placeholder={t.archive.search_placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
          {loading ? (
             <div className="col-span-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-mc-accent animate-spin" />
              </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-mc-textMuted">
              No results found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArchiveView;
