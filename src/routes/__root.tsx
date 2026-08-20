import {
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import RootLayout from "../components/RootLayout";
import NotFound from "../components/NotFound";
import { LanguageProvider } from "../context/LanguageContext";
import "../index.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      {
        rel: "icon",
        type: "image/png",
        href: "/smc/assets/avatars/smc2.png",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: "/smc/assets/fonts/modern-age-latin.woff2",
        crossOrigin: "",
      },
      {
        rel: "preload",
        as: "image",
        href: "/smc/assets/static/Artboard_3.webp",
        fetchPriority: "high",
      },
      {
        rel: "preload",
        as: "image",
        href: "/smc/assets/static/background.webp",
        fetchPriority: "high",
      },
      { rel: "preconnect", href: "https://api.modrinth.com" },
      { rel: "preconnect", href: "https://discord.com" },
    ],
  }),
  component: RootLayout,
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
        <Scripts />
      </body>
    </html>
  );
}
