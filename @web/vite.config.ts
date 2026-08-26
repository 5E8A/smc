import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(async ({ mode }) => {
  const analyze = mode === "analyze";
  const visualizer = analyze ? (await import("rollup-plugin-visualizer")).visualizer : null;
  return {
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
          // filter: ({ path }) => !path.includes("/modrinth"),
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
      nitro({ baseURL: "/smc" }),
      react(),
      tailwindcss(),
      ...(visualizer ? [visualizer({ filename: "dist/stats.html", open: true, gzipSize: true })] : []),
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
    base: "/smc",
  };
});
