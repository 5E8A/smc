import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomeView from "./components/HomeView";
import ArticleView from "./components/ArticleView";
import ArchiveView from "./components/ArchiveView";
import WikiView from "./components/WikiView";
import WikiDocView from "./components/WikiDocView";
import AboutView from "./components/AboutView";
import { LanguageProvider } from "./context/LanguageContext";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <Router>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-mc-bg text-mc-text font-sans">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/archive" element={<ArchiveView />} />
              <Route path="/post/:slug" element={<ArticleView />} />
              <Route path="/wiki" element={<WikiView />} />
              <Route path="/wiki/:slug" element={<WikiDocView />} />
              <Route path="/about" element={<AboutView />} />
              <Route path="*" element={<HomeView />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </LanguageProvider>
  );
};

export default App;
