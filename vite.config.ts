import fs from "fs";
import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { visualizer } from "rollup-plugin-visualizer";

const spaFallback404 = (): Plugin => ({
  name: "spa-fallback-404",
  closeBundle() {
    const dist = path.resolve(import.meta.dirname, "dist");
    fs.copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
  },
});

export default defineConfig(({ mode }) => {
  const analyze = mode === "analyze";
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      tanstackRouter(),
      react(),
      tailwindcss(),
      spaFallback404(),
      ...(analyze
        ? [visualizer({ filename: "dist/stats.html", open: true, gzipSize: true })]
        : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/scheduler")) {
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
