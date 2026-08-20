import { startTransition, useEffect, useState } from "react";
import { getRecentPosts } from "../data/posts";
import { BlogPost } from "../types";
import PostCard from "./PostCard";
import { CaretRightIcon } from "@phosphor-icons/react";
import { useLanguage } from "../context/useLanguage";
import { Link } from "@tanstack/react-router";
import { getLatestVersionData } from "@/services/api";
import { LoadingVersionText } from "@/components/LoadingVersionText";
import { VersionData } from "@/types";
import SmartImage from "./SmartImage";
import VersionBadge from "./VersionBadge";
import ParallaxBackground from "./ParallaxBackground";
import ModChest from "./ModChest";

const HomeView = () => {
  const { t, language } = useLanguage();
  const [version, setVersion] = useState<VersionData | null>(null);
  const posts: BlogPost[] = getRecentPosts(language, 3);

  const langParams = { lang: language };

  useEffect(() => {
    let done = false;
    const fetchVersion = async () => {
      if (done) return;
      done = true;
      const latestVersion = await getLatestVersionData("dOLVvHgi");
      startTransition(() => setVersion(latestVersion));
    };

    const observer = typeof PerformanceObserver !== "undefined" ? new PerformanceObserver(() => fetchVersion()) : null;
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
    version !== null ? version.game_version : <LoadingVersionText key="loading-game-version" format={"00.00.0"} />;

  return (
    <div className="flex flex-col">
      <ParallaxBackground className="parallax-bg" />

      <div className="flex h-[calc(100svh-var(--nav-height))] flex-col">
        {/* Hero Section - Launcher Style */}
        <section className="relative overflow-hidden flex-1 min-h-0 flex flex-col">
          {/* Modern blur effect behind hero */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl bg-mc-green/5 blur-[120px] rounded-full"></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 lg:py-16 flex-1 w-full flex flex-col items-start justify-center z-10 @container">
            <VersionBadge variant="achievement" version={versionContent} gameVersion={gameVersion} />

            <h1
              className="leading-none tracking-tight font-banner text-white uppercase font-pixel-shadow text-[min(90px,26cqi)] @min-[640px]:text-[min(125px,11.2cqi)] @min-[640px]:whitespace-nowrap"
              aria-label="SMC - Seba Modding Community"
            >
              <span>
                FABRIC
                <br className="@min-[640px]:hidden" />
                <span className="hidden @min-[640px]:inline"> </span>BOOSTED
              </span>
            </h1>

            <p className="max-w-xl text-lg text-mc-text mb-6 md:mb-10 leading-relaxed font-sans">
              {t.hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a href="#latest" className="btn-mc-green px-8 py-3 rounded text-center flex items-center justify-center">
                <span>{t.hero.read_updates}</span>
                <CaretRightIcon className="w-5 h-5 ml-2" />
              </a>
              <Link to="/$lang/wiki" params={langParams} preload="intent" className="btn-mc-stone px-8 py-3 rounded text-center">
                <span>{t.hero.wiki}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Ad Banner */}
        <section className="w-full max-w-7xl mx-auto py-6 overflow-hidden shrink-0">
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

        {/* Scroll cue */}
        <button
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
          className="flex h-12 shrink-0 items-center justify-center text-mc-text-muted hover:text-mc-green-text transition-colors"
          aria-label="Scroll down"
        >
          <svg viewBox="0 0 22 22" width={28} height={28} fill="currentColor" className="chevron-pulse">
            <path d="M16 10H17V9H18V7H16V8H15V9H14V10H13V11H12V12H10V11H9V10H8V9H7V8H6V7H4V9H5V10H6V11H7V12H8V13H9V14H10V15H12V14H13V13H14V12H15V11H16" />
          </svg>
        </button>
      </div>

      {/* Mods Showcase */}
      <section className="pb-12 md:pb-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 md:mb-12 pb-12">
            <h2 className="text-4xl font-mc text-white mb-2">{t.mods.title}</h2>
            <p className="text-mc-text">{t.mods.subtitle}</p>
          </div>

          <ModChest />
        </div>
      </section>

      {/* Latest Posts */}
      <section id="latest" className="pb-12 md:pb-24 [content-visibility:auto]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-12">
            <div>
              <h2 className="text-4xl font-mc text-white mb-2">{t.latest.title}</h2>
              <p className="text-mc-text">{t.latest.subtitle}</p>
            </div>
            <Link
              to="/$lang/archive"
              params={langParams}
              preload="intent"
              className="hidden md:flex btn-mc-stone px-6 py-2 rounded items-center mt-4 md:mt-0"
            >
              {t.latest.view_archive}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-75">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="mt-6 md:mt-12 text-center md:hidden">
            <Link to="/$lang/archive" params={langParams} className="btn-mc-stone px-8 py-3 rounded inline-block">
              {t.latest.view_archive}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
