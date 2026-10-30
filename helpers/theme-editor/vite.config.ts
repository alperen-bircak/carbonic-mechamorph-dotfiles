import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { schemeApi } from "./server/api";

export default defineConfig({
  plugins: [react(), schemeApi()],
  // Relative asset paths so dist/ works from any folder
  base: "./",
  server: { port: 5197, host: "127.0.0.1" },
  preview: { port: 5197, host: "127.0.0.1" },
});
