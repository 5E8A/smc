import { useEffect, useState } from "react";
import { getRecentPosts } from "../data/posts";
import { BlogPost } from "../types";
import PostCard from "./PostCard";
import { LightningIcon, CpuIcon, MemoryIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useLanguage } from "../context/useLanguage";
import { Link } from "@tanstack/react-router";
import { getLatestVersionData } from "@/services/api";
import { LoadingVersionText } from "@/components/LoadingVersionText";
import { VersionData } from "@/types";
import SmartImage from "./SmartImage";
import VersionBadge from "./VersionBadge";
import ParallaxBackground from "./ParallaxBackground";

const HomeView = () => {
  const { t, language } = useLanguage();
  const [version, setVersion] = useState<VersionData | null>(null);
  const posts: BlogPost[] = getRecentPosts(language, 3);

  useEffect(() => {
    let done = false;
    const fetchVersion = async () => {
      if (done) return;
      done = true;
      const latestVersion = await getLatestVersionData("dOLVvHgi");
      setVersion(latestVersion);
    };

    const observer =
      typeof PerformanceObserver !== "undefined"
        ? new PerformanceObserver(() => fetchVersion())
        : null;
    observer?.observe({ type: "largest-contentful-paint" });

    const fallback = setTimeout(fetchVersion, 1500);
    return () => {
      observer?.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  const versionContent =
    version !== null ? version.version_number : <LoadingVersionText key="loading-version" format={"0.0.0"} />;
  const gameVersion =
    version !== null ? version.game_version : <LoadingVersionText key="loading-game-version" format={"0.00.0"} />;

  return (
    <div className="flex flex-col">
      <ParallaxBackground className="parallax-bg" />

      {/* Hero Section - Launcher Style */}
      <section className="relative overflow-hidden border-b border-white/5">
        {/* Modern blur effect behind hero */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl bg-mc-green/5 blur-[120px] rounded-full"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-start justify-center min-h-[60vh] z-10">
          <VersionBadge variant="achievement" version={versionContent} gameVersion={gameVersion} />

          <h1 className="leading-none tracking-tight scale-75 origin-left font-banner text-white text-[90px] md:text-[167px] font-pixel-shadow uppercase" aria-label="SMC - Seba Modding Community">
            FABRIC<br className="md:hidden" />BOOSTED
          </h1>

          <p className="max-w-xl text-lg text-mc-text mb-10 leading-relaxed font-sans">{t.hero.description}</p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a href="#latest" className="btn-mc-green px-8 py-3 rounded text-center flex items-center justify-center">
              <span>{t.hero.read_updates}</span>
              <CaretRightIcon className="w-5 h-5 ml-2" />
            </a>
            <Link to="/wiki" preload="intent" className="btn-mc-stone px-8 py-3 rounded text-center">
              <span>{t.hero.wiki}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <section className="w-full max-w-7xl mx-auto py-6 overflow-hidden border-y border-white/5">
        <div className="px-4 sm:px-6 lg:px-8">
          <a
            href="https://billing.sparkedhost.com/aff.php?aff=3127"
            target="_blank"
            rel="noopener noreferrer"
            className="relative block w-full rounded-xl overflow-hidden bg-mc-surface/30 border border-white/10 group transition-all duration-300 hover:border-mc-green/40 hover:scale-[1.01] cursor-pointer isolate transform-gpu"
            style={{ aspectRatio: "1920 / 300" }}
          >
            {/* Banner Image */}
            <SmartImage
              src="/smc/assets/static/Artboard_3.webp"
              alt="Sponsored Content"
              lazy={false}
              priority="high"
              className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-[1.02]"
            />

            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

            {/* Ad Badge */}
            <div className="absolute top-0 right-0 p-2">
              <span className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/30 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-bl border-l border-b border-white/5">
                PARTNERSHIP
              </span>
            </div>
          </a>
        </div>
      </section>

      {/* Features Grid - Modern Clean Cards */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="mc-card p-8 rounded-xl bg-mc-surface/50 border-white/5 hover:border-mc-green/30 transition-colors group">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-indigo-500/10 mb-6 group-hover:scale-110 transition-transform">
                <CpuIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-mc text-white mb-3">{t.features.fabric_title}</h2>
              <p className="text-mc-text leading-relaxed text-sm">{t.features.fabric_desc}</p>
            </div>

            {/* Feature 2 */}
            <div className="mc-card p-8 rounded-xl bg-mc-surface/50 border-white/5 hover:border-mc-green/30 transition-colors group">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-yellow-500/10 mb-6 group-hover:scale-110 transition-transform">
                <LightningIcon className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-mc text-white mb-3">{t.features.sodium_title}</h2>
              <p className="text-mc-text leading-relaxed text-sm">{t.features.sodium_desc}</p>
            </div>

            {/* Feature 3 */}
            <div className="mc-card p-8 rounded-xl bg-mc-surface/50 border-white/5 hover:border-mc-green/30 transition-colors group">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-emerald-500/10 mb-6 group-hover:scale-110 transition-transform">
                <MemoryIcon className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-mc text-white mb-3">{t.features.memory_title}</h2>
              <p className="text-mc-text leading-relaxed text-sm">{t.features.memory_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      <section id="latest" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-mc text-white mb-2">{t.latest.title}</h2>
              <p className="text-mc-text">{t.latest.subtitle}</p>
            </div>
            <Link
              to="/archive"
              preload="intent"
              className="hidden md:flex items-center font-medium text-mc-green-text hover:text-white transition-colors mt-4 md:mt-0"
            >
              {t.latest.view_archive} <CaretRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-75">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
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
