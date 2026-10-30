import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const ayu = JSON.parse(readFileSync("node_modules/ayu/package.json", "utf8"));

export default defineConfig({
  // Relative asset paths so dist/ works from any folder or file://
  base: "./",
  define: { __AYU_VERSION__: JSON.stringify(ayu.version) },
  server: { port: 5198 },
  preview: { port: 5198 },
});
