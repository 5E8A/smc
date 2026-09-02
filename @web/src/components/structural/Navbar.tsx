import { useCallback, useState } from "react";
import { ListIcon, XIcon, DownloadIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import McButton from "@/components/mc/McButton";
import { useLanguage } from "@/context/useLanguage";
import SmartImage from "@/components/media/SmartImage";
import LangSwitcher from "@/components/ui/LangSwitcher";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  const langParams = { lang: language };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-(--nav-height) items-center justify-between">
          {/* Logo */}
          <Link to="/$lang" params={langParams} className="group flex items-center space-x-3">
            <SmartImage
              src="/smc/assets/static/smc.webp"
              alt="SMC Logo"
              className="size-10 rounded-squircle"
              lazy={false}
            />
          </Link>

          {/* Desktop ListIcon */}
          <div className="hidden items-center md:flex">
            <div className="mr-6 flex items-center space-x-1 rounded-lg border border-white/5 bg-mc-surface/50 p-1">
              <Link
                to="/$lang"
                params={langParams}
                preload="intent"
                className="flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium text-mc-text transition-all hover:bg-white/5 hover:text-white"
              >
                <span>{t.nav.home}</span>
              </Link>
              <Link
                to="/$lang/archive"
                params={langParams}
                preload="intent"
                className="flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium text-mc-text transition-all hover:bg-white/5 hover:text-white"
              >
                <span>{t.nav.archive}</span>
              </Link>
              <Link
                to="/$lang/wiki"
                params={langParams}
                preload="intent"
                className="flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium text-mc-text transition-all hover:bg-white/5 hover:text-white"
              >
                <span>{t.nav.wiki}</span>
              </Link>
              <Link
                to="/$lang/about"
                params={langParams}
                preload="intent"
                className="rounded-md px-4 py-2 text-sm font-medium text-mc-text transition-all hover:bg-white/5 hover:text-white"
              >
                {t.nav.about}
              </Link>
            </div>

            {/* Modern Action Button */}
            <McButton
              as="link"
              to="/$lang/modrinth"
              params={langParams}
              search={{ type: "modpack", slug: "fabric-boosted" }}
              preload="intent"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 rounded px-6 py-2"
            >
              <DownloadIcon className="size-4" />
              <span>{t.nav.download}</span>
            </McButton>

            <Link
              to="/$lang"
              params={{ lang: language === "en" ? "pl" : "en" }}
              className="hidden"
              aria-hidden="true"
              tabIndex={-1}
            >
              {language === "en" ? "Polski" : "English"}
            </Link>
            <LangSwitcher language={language} setLanguage={setLanguage} t={t} className="ml-6" />
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
              className="inline-flex items-center justify-center rounded-md p-2 text-mc-text-muted hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span className="sr-only">{isOpen ? t.common.close_menu : t.common.open_menu}</span>
              {isOpen ? <XIcon className="block size-6" /> : <ListIcon className="block size-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile ListIcon */}
      {isOpen && (
        <div id="mobile-menu" className="border-b border-white/10 backdrop-blur-md md:hidden">
          <div className="space-y-2 px-4 pt-2 pb-6">
            <Link
              to="/$lang"
              params={langParams}
              preload="intent"
              onClick={closeMenu}
              className="block rounded-md p-3 text-lg font-medium text-white hover:bg-white/5"
            >
              {t.nav.home}
            </Link>
            <Link
              to="/$lang/archive"
              params={langParams}
              preload="intent"
              onClick={closeMenu}
              className="block rounded-md p-3 text-lg font-medium text-white hover:bg-white/5"
            >
              {t.nav.archive}
            </Link>
            <Link
              to="/$lang/wiki"
              params={langParams}
              preload="intent"
              onClick={closeMenu}
              className="block rounded-md p-3 text-lg font-medium text-white hover:bg-white/5"
            >
              {t.nav.wiki}
            </Link>
            <Link
              to="/$lang/about"
              params={langParams}
              preload="intent"
              onClick={closeMenu}
              className="block rounded-md p-3 text-lg font-medium text-white hover:bg-white/5"
            >
              {t.nav.about}
            </Link>
            <McButton
              as="link"
              to="/$lang/modrinth"
              params={langParams}
              search={{ type: "modpack", slug: "fabric-boosted" }}
              preload="intent"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full rounded p-3 text-center"
            >
              {t.nav.download}
            </McButton>
            <div className="mt-4 px-3">
              <div className="flex items-center text-mc-text-muted">
                <LangSwitcher language={language} setLanguage={setLanguage} t={t} />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
