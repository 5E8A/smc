import { ReactNode } from "react";
import { useLanguage } from "@/context/useLanguage";

interface VersionBadgeProps {
  version: ReactNode;
  gameVersion: ReactNode;
}

const VersionBadge = ({ version, gameVersion }: VersionBadgeProps) => {
  const { t } = useLanguage();

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
};

export default VersionBadge;
