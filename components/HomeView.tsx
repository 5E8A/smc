import React, { useEffect, useState } from "react";
import { fetchRecentPosts } from "../data/posts";
import { BlogPost } from "../types";
import PostCard from "./PostCard";
import { Zap, Cpu, MemoryStick, ChevronRight, Loader2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { Link } from "react-router-dom";
import { getLatestVersion } from "@/services/api";
import { LoadingVersionText } from "@/components/LoadingVersionText";

const splitVersionHeroTag = (text: string): string[] => {
  return text.split("[version]");
};

const HomeView: React.FC = () => {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchRecentPosts(language, 3).then((data) => {
      setPosts(data);
      setLoading(false);
    });
  }, [language]);

  useEffect(() => {
    const fetchVersion = async () => {
      const latestVersion = await getLatestVersion("dOLVvHgi");
      setVersion(latestVersion);
    };
    fetchVersion();
  }, []);

  const heroTagParts = splitVersionHeroTag(t.hero.tag);

  const renderHeroTag = () => {
    // 1. Determine the dynamic content (version string or loading component)
    const versionContent =
      version !== null ? (
        version // Render the plain string if loaded
      ) : (
        // Render the component if loading
        <LoadingVersionText key="loading-version" format={"0.0.0"} />
      ); // 2. Combine all parts into a single array (React automatically renders arrays of elements)

    return [heroTagParts[0], versionContent, heroTagParts[1]];
  };

  return (
    <div className="flex flex-col bg-mc-bg bg-deepslate">
      {/* Hero Section - Launcher Style */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        {/* Modern blur effect behind hero */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl bg-mc-accent/5 blur-[120px] rounded-full"></div>

        <div className="absolute inset-0 bg-[url('/smc/assets/static/background.webp')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 flex flex-col items-start justify-center min-h-[60vh] z-10">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-mc-accent/10 border border-mc-accent/20 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-mc-accent mr-2 animate-pulse"></span>
            <span className="text-mc-accent text-sm font-semibold tracking-wide uppercase">{renderHeroTag()}</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-mc text-white mb-6 font-pixel-shadow leading-none tracking-tight">
            {t.hero.title_prefix}
            <span> </span>
            {t.hero.title_accent}
          </h1>

          <p className="max-w-xl text-lg text-mc-textMuted mb-10 leading-relaxed font-sans">{t.hero.description}</p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a href="#latest" className="btn-mc-green px-8 py-3 rounded text-center flex items-center justify-center">
              <span>{t.hero.read_updates}</span>
              <ChevronRight className="w-5 h-5 ml-2" />
            </a>
            <Link to="/wiki" className="btn-mc-stone px-8 py-3 rounded text-center">
              <span>{t.hero.wiki}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid - Modern Clean Cards */}
      <section className="py-24 bg-mc-bg relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="mc-card p-8 rounded-xl bg-mc-surface/50 border-white/5 hover:border-mc-accent/30 transition-colors group">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-indigo-500/10 mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-mc text-white mb-3">{t.features.fabric_title}</h3>
              <p className="text-mc-textMuted leading-relaxed text-sm">{t.features.fabric_desc}</p>
            </div>

            {/* Feature 2 */}
            <div className="mc-card p-8 rounded-xl bg-mc-surface/50 border-white/5 hover:border-mc-accent/30 transition-colors group">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-yellow-500/10 mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-2xl font-mc text-white mb-3">{t.features.sodium_title}</h3>
              <p className="text-mc-textMuted leading-relaxed text-sm">{t.features.sodium_desc}</p>
            </div>

            {/* Feature 3 */}
            <div className="mc-card p-8 rounded-xl bg-mc-surface/50 border-white/5 hover:border-mc-accent/30 transition-colors group">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-emerald-500/10 mb-6 group-hover:scale-110 transition-transform">
                <MemoryStick className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-mc text-white mb-3">{t.features.memory_title}</h3>
              <p className="text-mc-textMuted leading-relaxed text-sm">{t.features.memory_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section id="latest" className="py-24 bg-[#050505] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-mc text-white mb-2">{t.latest.title}</h2>
              <p className="text-mc-textMuted">{t.latest.subtitle}</p>
            </div>
            <Link to="/archive" className="hidden md:flex items-center font-medium text-mc-accent hover:text-white transition-colors mt-4 md:mt-0">
              {t.latest.view_archive} <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[300px]">
            {loading ? (
              <div className="col-span-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-mc-accent animate-spin" />
              </div>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>

          <div className="mt-12 text-center md:hidden">
            <Link to="/archive" className="btn-mc-stone px-8 py-3 rounded inline-block">
              {t.latest.view_archive}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
