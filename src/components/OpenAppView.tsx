import { useEffect } from "react";
import { Route } from "../routes/$lang/modrinth";
import { ArrowSquareOutIcon, CircleNotchIcon, DownloadIcon } from "@phosphor-icons/react";
import { useLanguage } from "../context/useLanguage";

const VALID_TYPES = ["modpack", "mod", "server"] as const;
const SLUG_RE = /^[a-z0-9-]+$/;

const OpenAppView = () => {
  const { t } = useLanguage();
  const { type, slug } = Route.useSearch();

  const validType = VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])
    ? type
    : null;
  const validSlug = slug && SLUG_RE.test(slug) ? slug : null;

  const valid = validType && validSlug;
  const appUrl = valid ? `modrinth://${validType}/${validSlug}` : null;
  const webUrl = valid ? `https://modrinth.com/${validType}/${validSlug}` : null;

  useEffect(() => {
    if (!valid || !appUrl) return;
    window.open(appUrl, "_self");
  }, [valid, appUrl]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div aria-hidden className="-z-10 fixed inset-0 mc-bg-tiled bg-polished-deepslate opacity-45" />
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="relative">
          <CircleNotchIcon className="size-12 animate-spin text-green-400" />
          <div className="absolute inset-0 flex items-center justify-center">
            <DownloadIcon className="size-5 text-green-300" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="font-display text-2xl font-bold text-white">{t.open_app.title}</h1>
          <p className="max-w-md text-mc-text-muted">
            {t.open_app.description_before}
            <a
              href="https://modrinth.com/app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 underline transition-colors hover:text-green-300"
            >
              {t.open_app.description_link}
            </a>
            {t.open_app.description_after}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={webUrl ?? "#"}
            aria-disabled={!valid}
            className={`inline-flex items-center gap-2 rounded px-6 py-3 font-medium transition-opacity ${
              valid
                ? "btn-mc-green"
                : "pointer-events-none cursor-default bg-mc-surface text-mc-text-muted opacity-50"
            }`}
          >
            <ArrowSquareOutIcon className="size-4" />
            {t.open_app.fallback_link}
          </a>
        </div>
      </div>
    </div>
  );
};

export default OpenAppView;
