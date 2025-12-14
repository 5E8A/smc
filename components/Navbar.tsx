import React, { useState } from "react";
import { Menu, X, Box, Download, Home, Globe, Archive, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="sticky top-0 z-50 bg-mc-bg/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative p-2 bg-gradient-to-br from-mc-surfaceLight to-mc-surface rounded-lg border border-white/10 shadow-lg group-hover:border-mc-accent/50 transition-colors">
              <Box className="h-6 w-6 text-mc-accent" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-mc text-white tracking-wide leading-none group-hover:text-mc-accent transition-colors">
                SMC<span className="text-mc-textMuted"></span>
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-1 bg-mc-surface/50 p-1 rounded-lg border border-white/5 mr-6">
              <Link to="/" className="flex items-center space-x-2 text-mc-textMuted hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-all font-medium text-sm">
                <span>{t.nav.home}</span>
              </Link>
              <Link to="/archive" className="flex items-center space-x-2 text-mc-textMuted hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-all font-medium text-sm">
                <span>{t.nav.archive}</span>
              </Link>
              <Link to="/wiki" className="flex items-center space-x-2 text-mc-textMuted hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-all font-medium text-sm">
                <span>{t.nav.wiki}</span>
              </Link>
              <Link to="/about" className="text-mc-textMuted hover:text-white hover:bg-white/5 px-4 py-2 rounded-md transition-all font-medium text-sm">
                {t.nav.about}
              </Link>
            </div>

            {/* Modern Action Button */}
            <a href="https://modrinth.com/modpack/fabric-boosted" target="_blank" rel="noopener noreferrer" className="btn-mc-green flex items-center space-x-2 px-6 py-2 rounded">
              <Download className="w-4 h-4" />
              <span>{t.nav.download}</span>
            </a>

            {/* Language Switcher */}
            <div className="flex items-center ml-6 pl-6 border-l border-white/10">
              <Globe className="w-4 h-4 text-mc-textMuted mr-2" />
              <select value={language} onChange={(e) => setLanguage(e.target.value as "en" | "pl")} className="bg-transparent text-sm font-medium text-mc-textMuted focus:outline-none hover:text-white cursor-pointer uppercase">
                <option value="en" className="bg-mc-surface">
                  EN
                </option>
                <option value="pl" className="bg-mc-surface">
                  PL
                </option>
              </select>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex md:hidden">
            <button onClick={toggleMenu} type="button" className="inline-flex items-center justify-center p-2 rounded-md text-mc-textMuted hover:text-white hover:bg-white/10 focus:outline-none">
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-mc-surface border-b border-white/10">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/5 block px-3 py-3 rounded-md text-lg font-medium">
              {t.nav.home}
            </Link>
            <Link to="/archive" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/5 block px-3 py-3 rounded-md text-lg font-medium">
              {t.nav.archive}
            </Link>
            <Link to="/wiki" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/5 block px-3 py-3 rounded-md text-lg font-medium">
              {t.nav.wiki}
            </Link>
            <Link to="/about" onClick={() => setIsOpen(false)} className="text-mc-textMuted hover:bg-white/5 block px-3 py-3 rounded-md text-lg font-medium">
              {t.nav.about}
            </Link>
            <a href="#" className="btn-mc-green block w-full text-center px-3 py-3 mt-4 rounded">
              {t.nav.download}
            </a>
            <div className="border-t border-white/10 mt-4 pt-4 px-3">
              <div className="flex items-center text-mc-textMuted">
                <Globe className="w-5 h-5 mr-2" />
                <select value={language} onChange={(e) => setLanguage(e.target.value as "en" | "pl")} className="bg-transparent text-white focus:outline-none w-full uppercase">
                  <option value="en" className="bg-mc-surface">
                    English
                  </option>
                  <option value="pl" className="bg-mc-surface">
                    Polski
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
