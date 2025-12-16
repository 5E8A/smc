import React, { useState, useEffect } from 'react';
import { fetchWikiDocs } from '../data/wiki';
import { WikiDoc } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Search, Book, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const WikiView: React.FC = () => {
  const { t, language } = useLanguage();
  const [docs, setDocs] = useState<WikiDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchWikiDocs(language).then(data => {
      setDocs(data);
      setLoading(false);
    });
  }, [language]);

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-mc-bg bg-deepslate pt-10 pb-20">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 w-full">
        <div className="bg-mc-surface border border-white/10 rounded-xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          
          <h1 className="text-4xl md:text-5xl font-mc text-white mb-4 font-pixel-shadow relative z-10">
            {t.wiki.title}
          </h1>
          <p className="text-mc-textMuted text-lg relative z-10 mb-8 max-w-2xl">
            {t.wiki.subtitle}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md z-10">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-mc-textMuted" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg leading-5 bg-black/40 text-white placeholder-mc-textMuted focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
              placeholder={t.wiki.search_placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
          {loading ? (
             <div className="col-span-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-mc-accent animate-spin" />
              </div>
          ) : filteredDocs.length > 0 ? (
            filteredDocs.map(doc => (
              <Link 
                key={doc.id} 
                to={`/wiki/${doc.slug}`}
                className="group flex flex-col bg-mc-surface border border-white/10 rounded-xl overflow-hidden hover:border-green-500/50 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                     <div className="absolute inset-0 bg-indigo-900/20 z-10 group-hover:bg-transparent transition-colors"></div>
                     <img src={doc.coverImage} alt={doc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                  </div>
                  <div className="p-6 md:w-2/3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                         <Book className="w-4 h-4 text-green-400" />
                         <span className="text-xs text-green-400 font-bold uppercase tracking-wider">{doc.category}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors">{doc.title}</h3>
                      <p className="text-mc-textMuted text-sm line-clamp-2">{doc.summary}</p>
                    </div>
                    <div className="mt-4 flex items-center text-sm font-semibold text-white group-hover:text-green-400 transition-colors">
                      {t.wiki.read_doc} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
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

export default WikiView;
