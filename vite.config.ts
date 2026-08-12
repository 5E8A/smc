import fs from "fs";
import path from "path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const spaFallback404 = (): Plugin => ({
  name: "spa-fallback-404",
  closeBundle() {
    const dist = path.resolve(import.meta.dirname, "dist");
    fs.copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
  },
});

export default defineConfig({
  server: {
    port: 3000,
    host: "0.0.0.0",
  },
  plugins: [tanstackRouter(), react(), tailwindcss(), spaFallback404()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  base: "/smc",
});
