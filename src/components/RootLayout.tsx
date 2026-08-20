import { Outlet } from "@tanstack/react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";

const RootLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-transparent text-mc-text font-sans">
      <Navbar />
      <main className="flex-grow flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
