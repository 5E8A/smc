import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Code, Cpu } from "lucide-react";
import { getActiveDiscordMembers, getTotalDownloads, getLatestVersion } from "@/services/api";

const AboutView: React.FC = () => {
  const { t } = useLanguage();

  const [downloads, setDownloads] = React.useState<string | null>(null);
  const [activeMembers, setActiveMembers] = React.useState<number | null>(null);
  const [latestVersion, setLatestVersion] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const downloads = await getTotalDownloads("dOLVvHgi");
      setDownloads(downloads.toLocaleString());
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    const fetchActiveMembers = async () => {
      const count = await getActiveDiscordMembers();
      setActiveMembers(count);
    };
    fetchActiveMembers();
  }, []);

  React.useEffect(() => {
    const fetchLatestVersion = async () => {
      const version = await getLatestVersion("dOLVvHgi");
      if (version) {
        setLatestVersion(version);
      } else {
        setLatestVersion("N/A");
      }
    };
    fetchLatestVersion();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-mc-bg bg-deepslate pt-10 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 w-full">
        <div className="bg-mc-surface border border-white/10 rounded-xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>

          <h1 className="text-4xl md:text-5xl font-mc text-white mb-4 font-pixel-shadow relative z-10">{t.about_page.title}</h1>
          <p className="text-mc-textMuted text-lg relative z-10 mb-0 max-w-2xl">{t.about_page.subtitle}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-mc-surface/50 border border-white/5 rounded-xl p-6 text-center">
            <div className="text-mc-accent text-4xl font-bold font-mc mb-2">{downloads !== null ? downloads : "Loading..."}</div>
            <div className="text-mc-textMuted text-sm uppercase tracking-wider">{t.about_page.stats_downloads}</div>
          </div>
          <div className="bg-mc-surface/50 border border-white/5 rounded-xl p-6 text-center">
            <div className="text-white text-4xl font-bold font-mc mb-2">{activeMembers !== null ? activeMembers : "Loading..."}</div>
            <div className="text-mc-textMuted text-sm uppercase tracking-wider">{t.about_page.stats_users}</div>
          </div>
          <div className="bg-mc-surface/50 border border-white/5 rounded-xl p-6 text-center">
            <div className="text-mc-green text-4xl font-bold font-mc mb-2">{latestVersion !== null ? latestVersion : "Loading..."}</div>
            <div className="text-mc-textMuted text-sm uppercase tracking-wider">{t.about_page.stats_version}</div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mission */}
          <div className="bg-mc-surface border border-white/10 rounded-xl p-8">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">{t.about_page.mission_title}</h2>
            <p className="text-mc-textMuted leading-relaxed">{t.about_page.mission_text}</p>
          </div>

          {/* Creator */}
          <div className="bg-mc-surface border border-white/10 rounded-xl p-8">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-6">
              <Code className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">{t.about_page.creator_title}</h2>
            <p className="text-mc-textMuted leading-relaxed mb-6">{t.about_page.creator_text}</p>

            <div className="flex items-center space-x-4 pt-6 border-t border-white/5">
              <div className="w-10 h-10 rounded bg-mc-surfaceLight flex items-center justify-center font-mc text-xl text-white">S</div>
              <div>
                <div className="text-white font-bold text-sm">Seba</div>
                <div className="text-mc-textMuted text-xs">Lead Developer</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutView;
