import { Outlet, ScrollRestoration } from "@tanstack/react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";

const RootLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-mc-bg text-mc-text font-sans">
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
