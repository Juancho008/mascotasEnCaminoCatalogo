import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGET = process.env.API_TARGET || "http://localhost:4000";
const CATALOG_PROXY_TARGET =
  process.env.CATALOG_PROXY_TARGET || process.env.VITE_CATALOG_API || API_TARGET;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/catalog.json": CATALOG_PROXY_TARGET,
      "/api": API_TARGET,
      "/inventory": API_TARGET,
      "/images": API_TARGET,
    },
  },
  build: {
    outDir: "dist",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
