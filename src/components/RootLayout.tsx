import { Outlet, ScrollRestoration, useRouterState } from "@tanstack/react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";

const RootLayout = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAbout = pathname === "/about";

  return (
    <div
      className={`flex flex-col min-h-screen bg-transparent text-mc-text font-sans ${
        isAbout ? "relative about-scroll-bg" : ""
      }`}
    >
      <ScrollRestoration />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
