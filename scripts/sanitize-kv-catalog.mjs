/**
 * Descarga el catálogo de Cloudflare KV, quita "MOLINO SEDA" y lo vuelve a subir.
 * Requiere .env con CATALOG_WORKER_URL, CATALOG_HMAC_SECRET y ADMIN_TOKEN.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHmacHeaders } from "../lib/hmac.mjs";
import {
  catalogHasLegacyBrand,
  sanitizeCatalog,
} from "../lib/sanitize-catalog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

loadEnv();

const workerBase = process.env.CATALOG_WORKER_URL?.trim()
  .replace(/\/$/, "")
  .replace(/\/catalog\.json$/i, "");
const secret = process.env.CATALOG_HMAC_SECRET?.trim();
const adminToken = process.env.ADMIN_TOKEN?.trim();

if (!workerBase || !secret || !adminToken) {
  console.error(
    "[sanitize-kv] Faltan CATALOG_WORKER_URL, CATALOG_HMAC_SECRET o ADMIN_TOKEN en .env"
  );
  process.exit(1);
}

const headers = createHmacHeaders(secret, "GET", "/catalog.json");
const getRes = await fetch(`${workerBase}/catalog.json`, { headers });
const text = await getRes.text();

if (!getRes.ok) {
  console.error("[sanitize-kv] No se pudo leer el catálogo:", text.slice(0, 200));
  process.exit(1);
}

const catalog = JSON.parse(text);
const hadBrand = catalogHasLegacyBrand(catalog);
const cleaned = sanitizeCatalog(catalog);

if (!hadBrand) {
  console.log("[sanitize-kv] El catálogo ya estaba limpio. Nada que hacer.");
  process.exit(0);
}

const saveRes = await fetch(`${workerBase}/api/catalog`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(cleaned),
});

const saveBody = await saveRes.text();
if (!saveRes.ok) {
  console.error("[sanitize-kv] Error al guardar:", saveBody);
  process.exit(1);
}

const backupPath = path.join(ROOT, "client", "public", "catalog-sanitized.json");
fs.mkdirSync(path.dirname(backupPath), { recursive: true });
fs.writeFileSync(backupPath, JSON.stringify(cleaned, null, 2), "utf-8");

console.log("[sanitize-kv] OK · MOLINO SEDA eliminado del catálogo en KV.");
console.log(`[sanitize-kv] Copia local: ${backupPath}`);
