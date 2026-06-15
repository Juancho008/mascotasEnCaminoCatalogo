import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGET = process.env.API_TARGET || "http://localhost:4000";

// En desarrollo, Vite sirve el frontend y hace proxy de la API y las imágenes
// al servidor Express, así no hay problemas de CORS y todo corre junto.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/catalog.json": API_TARGET,
      "/api": API_TARGET,
      "/inventory": API_TARGET,
      "/images": API_TARGET,
    },
  },
  build: {
    outDir: "dist",
  },
});
