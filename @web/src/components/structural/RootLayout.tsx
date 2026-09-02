import { useEffect } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useLanguage } from "@/context/useLanguage";

const RootLayout = () => {
  const { t } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    document.getElementById("main-content")?.focus({ preventScroll: true });
  }, [location.pathname]);
  return (
    <div className="flex min-h-screen flex-col bg-transparent font-sans text-mc-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-mc-surface focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-mc-green"
      >
        {t.common.skip_to_content}
      </a>
      <Navbar />
        <main id="main-content" tabIndex={-1} className="flex flex-grow flex-col focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
