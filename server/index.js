import express from "express";
import compression from "compression";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { buildCatalog, inventoryAbsoluteDir, ROOT_DIR } from "./catalog.js";
import { createHmacHeaders } from "../lib/hmac.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();
app.use(compression());
app.use(cors());

// Catálogo generado a partir de las carpetas de imágenes + JSON de config.
// Se expone en /catalog.json (misma ruta que usa el build estático de Vercel)
// y también en /api/catalog por compatibilidad.
function sendCatalog(req, res) {
  try {
    res.json(buildCatalog());
  } catch (err) {
    console.error("[api] Error al construir el catálogo:", err);
    res.status(500).json({ error: "No se pudo construir el catálogo." });
  }
}

app.get("/catalog.json", sendCatalog);

// Proxy firmado hacia Cloudflare (misma lógica que api/catalog.js en Vercel).
// Si no hay secret configurado, sirve el catálogo local para desarrollo.
app.get("/api/catalog", async (req, res) => {
  const workerBase = process.env.CATALOG_WORKER_URL?.replace(/\/$/, "");
  const secret = process.env.CATALOG_HMAC_SECRET;

  if (workerBase && secret) {
    try {
      const headers = createHmacHeaders(secret, "GET", "/catalog.json");
      const response = await fetch(`${workerBase}/catalog.json`, { headers });
      const body = await response.text();
      res
        .status(response.status)
        .set("Cache-Control", "public, max-age=60")
        .type("json")
        .send(body);
      return;
    } catch (err) {
      console.error("[api/catalog proxy]", err);
      res.status(502).json({ error: "No se pudo obtener el catálogo remoto" });
      return;
    }
  }

  sendCatalog(req, res);
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Imágenes del inventario (las que se usan como productos).
app.use(
  "/inventory",
  express.static(inventoryAbsoluteDir(), { maxAge: "1h", fallthrough: true })
);

// Recursos estáticos (logo, etc.).
app.use("/images", express.static(path.join(ROOT_DIR, "images"), { maxAge: "1d" }));

// Cliente compilado (producción).
const clientDist = path.join(ROOT_DIR, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/inventory/") || req.path.startsWith("/images/")) {
      return next();
    }
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send(
      "<h1>Servidor activo 🐾</h1><p>El cliente no está compilado todavía. Ejecutá <code>npm run dev</code> para desarrollo o <code>npm run build</code> para producción.</p>"
    );
  });
}

app.listen(PORT, () => {
  console.log(`\n🐾 Catálogo Mascotas en Camino`);
  console.log(`   API:        http://localhost:${PORT}/api/catalog`);
  console.log(`   Inventario: http://localhost:${PORT}/inventory`);
  if (fs.existsSync(clientDist)) {
    console.log(`   Sitio:      http://localhost:${PORT}\n`);
  } else {
    console.log(`   (Modo desarrollo: abrí el cliente de Vite)\n`);
  }
});
