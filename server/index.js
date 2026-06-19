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

function checkAdmin(req, res) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) {
    res.status(500).json({ error: "Falta ADMIN_PASSWORD en .env" });
    return false;
  }
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (token !== expected) {
    res.status(401).json({ error: "Contraseña incorrecta" });
    return false;
  }
  return true;
}

function workerBaseUrl() {
  return process.env.CATALOG_WORKER_URL?.trim().replace(/\/$/, "").replace(/\/catalog\.json$/i, "");
}

app.get("/api/pdfs", async (req, res) => {
  const base = workerBaseUrl();
  if (!base) return res.json([]);
  const id = req.query.id;
  const path = id ? `/api/documents/${id}` : "/api/documents";
  try {
    const response = await fetch(`${base}${path}`);
    const type = response.headers.get("content-type") || "application/json";
    const body = Buffer.from(await response.arrayBuffer());
    res.status(response.status).type(type).send(body);
  } catch (err) {
    console.error("[api/documents]", err);
    res.status(502).json({ error: "No se pudo obtener el documento" });
  }
});

app.get("/api/admin/catalog", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const base = workerBaseUrl();
  const secret = process.env.CATALOG_HMAC_SECRET?.trim();
  if (!base || !secret) return sendCatalog(req, res);
  const headers = createHmacHeaders(secret, "GET", "/catalog.json");
  const response = await fetch(`${base}/catalog.json`, { headers });
  const body = await response.text();
  res.status(response.status).type("json").send(body);
});

app.put("/api/admin/catalog", express.json({ limit: "12mb" }), async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const base = workerBaseUrl();
  const adminToken = process.env.ADMIN_TOKEN?.trim();
  if (!base || !adminToken) {
    return res.status(500).json({ error: "Faltan CATALOG_WORKER_URL o ADMIN_TOKEN" });
  }
  const response = await fetch(`${base}/api/catalog`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });
  const body = await response.text();
  res.status(response.status).type("json").send(body);
});

app.post("/api/admin/upload-pdf", express.json({ limit: "15mb" }), async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const base = workerBaseUrl();
  const adminToken = process.env.ADMIN_TOKEN?.trim();
  if (!base || !adminToken) {
    return res.status(500).json({ error: "Faltan CATALOG_WORKER_URL o ADMIN_TOKEN" });
  }
  const response = await fetch(`${base}/api/admin/documents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req.body),
  });
  const body = await response.text();
  res.status(response.status).type("json").send(body);
});

app.delete("/api/admin/upload-pdf", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const base = workerBaseUrl();
  const adminToken = process.env.ADMIN_TOKEN?.trim();
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Falta id" });
  const response = await fetch(`${base}/api/admin/documents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const body = await response.text();
  res.status(response.status).type("json").send(body);
});

app.post("/api/admin/import-pdf", express.json({ limit: "15mb" }), async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { createRequire } = await import("node:module");
    const require = createRequire(import.meta.url);
    const pdfParse = require("pdf-parse");
    const { parsePriceListText, mergeImportedCatalog } = await import(
      "../lib/pdf-price-parser.mjs"
    );

    const { data, action = "preview", replace = true } = req.body || {};
    if (!data) return res.status(400).json({ error: "Falta el PDF en base64" });

    const buffer = Buffer.from(data, "base64");
    const pdf = await pdfParse(buffer);
    const parsed = parsePriceListText(pdf.text);

    if (!parsed.totalProducts) {
      return res.status(422).json({
        error: "No se detectaron productos en el PDF",
        textSample: pdf.text.slice(0, 800),
      });
    }

    if (action === "preview") {
      return res.json({
        ok: true,
        preview: true,
        brand: parsed.brand,
        totalProducts: parsed.totalProducts,
        categories: parsed.categories.map((c) => ({
          id: c.id,
          label: c.label,
          productCount: c.products.length,
          products: c.products.slice(0, 5),
        })),
      });
    }

    const base = workerBaseUrl();
    const secret = process.env.CATALOG_HMAC_SECRET?.trim();
    const adminToken = process.env.ADMIN_TOKEN?.trim();
    if (!base || !secret || !adminToken) {
      return res.status(500).json({ error: "Faltan variables de Cloudflare en .env" });
    }

    const headers = createHmacHeaders(secret, "GET", "/catalog.json");
    const catalogRes = await fetch(`${base}/catalog.json`, { headers });
    const catalogText = await catalogRes.text();
    if (!catalogRes.ok) {
      return res.status(catalogRes.status).json({ error: "No se pudo leer el catálogo" });
    }

    const merged = mergeImportedCatalog(JSON.parse(catalogText), parsed, { replace });
    const saveRes = await fetch(`${base}/api/catalog`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(merged),
    });
    const saveBody = await saveRes.text();
    res.status(saveRes.status).type("json").send(saveBody);
  } catch (err) {
    console.error("[api/admin/import-pdf]", err);
    res.status(500).json({ error: err.message || "Error al importar PDF" });
  }
});

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
