import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../context/useLanguage";
import { CodeIcon, CpuIcon } from "@phosphor-icons/react";
import { getActiveDiscordMembers, getTotalDownloads, getLatestVersionData } from "@/services/api";

const screenshotMode = import.meta.env.VITE_SCREENSHOT === "true";

const AboutView = () => {
  const { t } = useLanguage();

  const [downloads, setDownloads] = useState<string | null>(null);
  const [activeMembers, setActiveMembers] = useState<number | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (screenshotMode && bgRef.current) bgRef.current.style.height = `${document.documentElement.scrollHeight}px`;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const downloads = await getTotalDownloads("dOLVvHgi");
      setDownloads(downloads.toLocaleString());
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchActiveMembers = async () => {
      const count = await getActiveDiscordMembers();
      setActiveMembers(count);
    };
    fetchActiveMembers();
  }, []);

  useEffect(() => {
    const fetchLatestVersion = async () => {
      const version = await getLatestVersionData("dOLVvHgi");
      if (version) {
        setLatestVersion(version.version_number);
      } else {
        setLatestVersion("N/A");
      }
    };
    fetchLatestVersion();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-transparent pt-10 pb-20">
      <div
        ref={bgRef}
        aria-hidden
        className={`-z-10 ${screenshotMode ? "absolute" : "fixed"} mc-bg-tiled inset-0 bg-warped-wart-block opacity-45`}
      />
      {/* Header */}
      <div className="mx-auto mb-12 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-mc-surface p-8 shadow-xl">
          <div className="absolute top-0 right-0 size-64 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-emerald-500/10 blur-3xl"></div>

          <h1 className="relative z-10 mb-4 font-mc text-4xl text-white font-pixel-shadow md:text-5xl">
            {t.about_page.title}
          </h1>
          <p className="relative z-10 mb-0 max-w-2xl text-lg text-mc-text">{t.about_page.subtitle}</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Stats Row */}
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-mc-surface/50 p-6 text-center">
            <div className="mb-2 font-mc text-4xl font-bold text-mc-green-text">
              {downloads !== null ? downloads : "Loading..."}
            </div>
            <div className="text-sm tracking-wider text-mc-text-muted uppercase">{t.about_page.stats_downloads}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-mc-surface/50 p-6 text-center">
            <div className="mb-2 font-mc text-4xl font-bold text-white">
              {activeMembers !== null ? activeMembers : "Loading..."}
            </div>
            <div className="text-sm tracking-wider text-mc-text-muted uppercase">{t.about_page.stats_users}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-mc-surface/50 p-6 text-center">
            <div className="mb-2 font-mc text-4xl font-bold text-mc-green">
              {latestVersion !== null ? latestVersion : "Loading..."}
            </div>
            <div className="text-sm tracking-wider text-mc-text-muted uppercase">{t.about_page.stats_version}</div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Mission */}
          <div className="rounded-xl border border-white/10 bg-mc-surface p-8">
            <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-emerald-500/10">
              <CpuIcon className="size-6 text-emerald-400" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-white">{t.about_page.mission_title}</h2>
            <p className="leading-relaxed text-mc-text">{t.about_page.mission_text}</p>
          </div>

          {/* Creator */}
          <div className="rounded-xl border border-white/10 bg-mc-surface p-8">
            <div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-indigo-500/10">
              <CodeIcon className="size-6 text-indigo-400" />
            </div>
            <h2 className="mb-4 text-2xl font-bold text-white">{t.about_page.creator_title}</h2>
            <p className="mb-6 leading-relaxed text-mc-text">{t.about_page.creator_text}</p>

            <div className="flex items-center space-x-4 border-t border-white/5 pt-6">
              <div className="flex size-10 items-center justify-center rounded bg-mc-surface-light font-mc text-xl text-white">
                S
              </div>
              <div>
                <div className="text-sm font-bold text-white">5E8A</div>
                <div className="text-xs text-mc-text-muted">Lead Developer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
