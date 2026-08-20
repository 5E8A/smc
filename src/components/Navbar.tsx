import { useState } from "react";
import { ListIcon, XIcon, DownloadIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useLanguage } from "../context/useLanguage";
import SmartImage from "./SmartImage";
import LangSwitcher from "./LangSwitcher";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleMenu = () => setIsOpen(!isOpen);

  const langParams = { lang: language };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-(--nav-height)">
          {/* Logo */}
          <Link to="/$lang" params={langParams} className="flex items-center space-x-3 group">
            <SmartImage
              src="/smc/assets/avatars/smc.webp"
              alt="SMC Logo"
              className="h-10 w-10 rounded-squircle"
              lazy={false}
            />
          </Link>

          {/* Desktop ListIcon */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-1 bg-mc-surface/50 p-1 rounded-lg border border-white/5 mr-6">
              <Link
                to="/$lang"
                params={langParams}
                preload="intent"
                className="flex items-center space-x-2 text-mc-text hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-all font-medium text-sm"
              >
                <span>{t.nav.home}</span>
              </Link>
              <Link
                to="/$lang/archive"
                params={langParams}
                preload="intent"
                className="flex items-center space-x-2 text-mc-text hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-all font-medium text-sm"
              >
                <span>{t.nav.archive}</span>
              </Link>
              <Link
                to="/$lang/wiki"
                params={langParams}
                preload="intent"
                className="flex items-center space-x-2 text-mc-text hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-all font-medium text-sm"
              >
                <span>{t.nav.wiki}</span>
              </Link>
              <Link
                to="/$lang/about"
                params={langParams}
                preload="intent"
                className="text-mc-text hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-all font-medium text-sm"
              >
                {t.nav.about}
              </Link>
            </div>

            {/* Modern Action Button */}
            <a
              href="https://modrinth.com/modpack/fabric-boosted"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mc-green flex items-center space-x-2 px-6 py-2 rounded"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>{t.nav.download}</span>
            </a>

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
              className="inline-flex items-center justify-center p-2 rounded-md text-mc-text-muted hover:text-white hover:bg-white/10 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <XIcon className="block h-6 w-6" /> : <ListIcon className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile ListIcon */}
      {isOpen && (
        <div className="md:hidden backdrop-blur-md border-b border-white/10">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link
              to="/$lang"
              params={langParams}
              preload="intent"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/5 block px-3 py-3 rounded-md text-lg font-medium"
            >
              {t.nav.home}
            </Link>
            <Link
              to="/$lang/archive"
              params={langParams}
              preload="intent"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/5 block px-3 py-3 rounded-md text-lg font-medium"
            >
              {t.nav.archive}
            </Link>
            <Link
              to="/$lang/wiki"
              params={langParams}
              preload="intent"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/5 block px-3 py-3 rounded-md text-lg font-medium"
            >
              {t.nav.wiki}
            </Link>
            <Link
              to="/$lang/about"
              params={langParams}
              preload="intent"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/5 block px-3 py-3 rounded-md text-lg font-medium"
            >
              {t.nav.about}
            </Link>
            <a
              href="https://modrinth.com/modpack/fabric-boosted"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mc-green block w-full text-center px-3 py-3 mt-4 rounded"
            >
              {t.nav.download}
            </a>
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
