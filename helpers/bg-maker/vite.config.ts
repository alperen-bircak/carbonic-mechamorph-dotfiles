import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so dist/ works from any folder or file://
  base: "./",
  server: { port: 5199 },
  preview: { port: 5199 },
});
