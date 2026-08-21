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
        <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Modern blur effect behind hero */}
          <div className="absolute top-0 left-1/2 size-full max-w-7xl -translate-x-1/2 rounded-full bg-mc-green/5 blur-[120px]"></div>

          <div className="@container relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-start justify-center px-4 py-10 sm:px-6 md:py-12 lg:px-8 lg:py-16">
            <VersionBadge variant="achievement" version={versionContent} gameVersion={gameVersion} />

            <h1
              className="font-banner text-[min(90px,26cqi)] leading-none tracking-tight text-white uppercase font-pixel-shadow @min-[640px]:text-[min(125px,11.2cqi)] @min-[640px]:whitespace-nowrap"
              aria-label="SMC - Seba Modding Community"
            >
              <span>
                FABRIC
                <br className="@min-[640px]:hidden" />
                <span className="hidden @min-[640px]:inline"> </span>BOOSTED
              </span>
            </h1>

            <p className="mb-6 max-w-xl font-sans text-lg leading-relaxed text-mc-text md:mb-10">
              {t.hero.description}
            </p>

            <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
              <a
                href="#latest"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="btn-mc-green flex items-center justify-center rounded px-8 py-3 text-center"
              >
                <span>{t.hero.read_updates}</span>
                <CaretRightIcon className="ml-2 size-5" />
              </a>
              <Link
                to="/$lang/wiki"
                params={langParams}
                preload="intent"
                className="btn-mc-stone rounded px-8 py-3 text-center"
              >
                <span>{t.hero.wiki}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Ad Banner */}
        <section className="mx-auto w-full max-w-7xl shrink-0 overflow-hidden py-6 pb-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <a
              href="https://billing.sparkedhost.com/aff.php?aff=3127"
              target="_blank"
              rel="noopener noreferrer"
              className="group hover:scale-1.01 relative isolate block w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-mc-surface/30 transition-all duration-300 hover:border-mc-green/40"
              style={{ aspectRatio: "1920 / 300" }}
            >
              {/* Banner Image */}
              <SmartImage
                src="/smc/assets/static/Artboard_3.webp"
                alt="Sponsored Content"
                lazy={false}
                priority="high"
                className="group-hover:scale-1.02 absolute inset-0 size-full transition-transform duration-500"
              />

              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

              {/* Ad Badge */}
              <div className="absolute top-0 right-0 p-2">
                <span className="rounded-bl border-b border-l border-white/5 bg-black/60 px-2 py-0.5 text-[8px] tracking-widest text-white/30 uppercase backdrop-blur-md md:text-[10px]">
                  PARTNERSHIP
                </span>
              </div>
            </a>
          </div>
        </section>

        {/* Scroll cue */}
        <a
          href="#mods-showcase"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("mods-showcase")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex h-20 shrink-0 items-center justify-center text-mc-text-muted transition-colors hover:text-mc-green-text"
          aria-label="Scroll down"
        >
          <svg viewBox="0 0 22 22" width={50} height={50} fill="currentColor" className="chevron-pulse">
            <path d="M16 10H17V9H18V7H16V8H15V9H14V10H13V11H12V12H10V11H9V10H8V9H7V8H6V7H4V9H5V10H6V11H7V12H8V13H9V14H10V15H12V14H13V13H14V12H15V11H16" />
          </svg>
        </a>
      </div>

      {/* Mods Showcase */}
      <section id="mods-showcase" className="relative pb-12 md:pb-24 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 pb-12 md:mb-12">
            <h2 className="mb-2 font-mc text-4xl text-white">{t.mods.title}</h2>
            <p className="text-mc-text">{t.mods.subtitle}</p>
          </div>

          <ModChest />
        </div>
      </section>

      {/* Latest Posts */}
      <section id="latest" className="pb-12 [content-visibility:auto] md:pb-24 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col items-start justify-between md:mb-12 md:flex-row md:items-end">
            <div>
              <h2 className="mb-2 font-mc text-4xl text-white">{t.latest.title}</h2>
              <p className="text-mc-text">{t.latest.subtitle}</p>
            </div>
            <Link
              to="/$lang/archive"
              params={langParams}
              preload="intent"
              className="btn-mc-stone mt-4 hidden items-center rounded px-6 py-2 md:mt-0 md:flex"
            >
              {t.latest.view_archive}
            </Link>
          </div>

          <div className="grid min-h-75 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="mt-6 text-center md:mt-12 md:hidden">
            <Link to="/$lang/archive" params={langParams} className="btn-mc-stone inline-block rounded px-8 py-3">
              {t.latest.view_archive}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomeView;
