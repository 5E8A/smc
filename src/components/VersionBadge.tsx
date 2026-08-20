import { ReactNode } from "react";
import { useLanguage } from "../context/useLanguage";

interface VersionBadgeProps {
  version: ReactNode;
  gameVersion: ReactNode;
  variant?: "chip" | "text" | "achievement";
}

const VersionBadge = ({ version, gameVersion, variant = "chip" }: VersionBadgeProps) => {
  const { t } = useLanguage();

  if (variant === "achievement") {
    return (
      <div className="toast mb-8 w-80 max-w-full select-none">
        <div className="flex min-h-12 items-center gap-4 px-2.5 py-2">
          <img
            src="/smc/assets/static/grass-block.webp"
            alt=""
            className="size-8 shrink-0"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="flex flex-col justify-center">
            {/* <span className="font-mc text-2xl leading-none" style={{ color: "#FFFF73", textShadow: "1px 1px 0 #000" }}>
              {t.hero.achievement_title}
            </span> */}
            <span className="font-mc text-xl leading-tight text-white" style={{ textShadow: "1px 1px 0 #000" }}>
              {t.hero.tag_prefix} {version} {t.hero.tag_suffix} {gameVersion}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "text") {
    return (
      <p className="mb-8 text-lg leading-relaxed text-mc-text-muted">
        {t.hero.tag_prefix} <span className="font-mc text-3xl text-mc-green">{version}</span> {t.hero.tag_suffix}{" "}
        <span className="font-mc text-2xl text-white">{gameVersion}</span>
      </p>
    );
  }

  return (
    <div
      className="mb-8 inline-flex flex-wrap items-baseline gap-x-2.5 rounded-md border-2 border-mc-green/50 bg-black/60 px-4 py-2.5"
      style={{ boxShadow: "4px 4px 0 rgba(0,0,0,0.5)" }}
    >
      <span className="text-sm font-semibold tracking-wider text-mc-text-muted uppercase">{t.hero.tag_prefix}</span>
      <span className="font-mc text-3xl leading-none text-mc-green">{version}</span>
      <span className="text-sm font-semibold tracking-wider text-mc-text-muted uppercase">{t.hero.tag_suffix}</span>
      <span className="font-mc text-2xl leading-none text-white">{gameVersion}</span>
    </div>
  );
};

export default VersionBadge;
