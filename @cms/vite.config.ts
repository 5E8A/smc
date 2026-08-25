import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { CMS_PORT, cmsApi } from "./server/api.ts";

export default defineConfig({
  plugins: [cmsApi(), react(), tailwindcss()],
  server: {
    port: CMS_PORT,
    host: "127.0.0.1",
    strictPort: true,
  },
});
