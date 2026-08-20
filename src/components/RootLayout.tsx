import { Outlet } from "@tanstack/react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";

const RootLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-transparent font-sans text-mc-text">
      <Navbar />
      <main className="flex flex-grow flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default RootLayout;
