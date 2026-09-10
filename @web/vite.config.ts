import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { SITE_BASE_PATH } from "@smc/shared/constants";

export default defineConfig(() => {
  return {
    define: {
      "process.env.BASE_PATH": JSON.stringify(process.env.BASE_PATH ?? "/smc"),
    },
    server: {
      port: 3000,
      host: "127.0.0.1",
    },
    plugins: [
      tanstackStart({
        prerender: {
          enabled: true,
          crawlLinks: true,
          autoSubfolderIndex: true,
        },
        pages: [
          { path: "/" },
          {
            path: "/404",
            sitemap: { exclude: true },
            prerender: {
              enabled: true,
              outputPath: "/404",
              autoSubfolderIndex: false,
            },
          },
        ],
      }),
      nitro({ baseURL: SITE_BASE_PATH }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/scheduler")
            ) {
              return "react";
            }
            if (id.includes("@tanstack/react-router") || id.includes("@tanstack/history")) {
              return "router";
            }
            if (id.includes("@phosphor-icons/react")) {
              return "icons";
            }
          },
        },
      },
    },
    base: SITE_BASE_PATH,
  };
});
