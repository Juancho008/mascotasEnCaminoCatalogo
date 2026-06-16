// Prueba la firma HMAC contra tu Worker de Cloudflare.
// Uso: CATALOG_WORKER_URL=... CATALOG_HMAC_SECRET=... node scripts/test-hmac.mjs
import crypto from "node:crypto";

const WORKER_PATH = "/catalog.json";

function normalizeWorkerBase(url) {
  return url
    ?.trim()
    .replace(/\/$/, "")
    .replace(/\/catalog\.json$/i, "");
}

function createHmacHeaders(secret, method, pathname) {
  const timestamp = Date.now().toString();
  const payload = `${method.toUpperCase()}\n${pathname}\n${timestamp}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return {
    "X-Timestamp": timestamp,
    "X-Signature": signature,
  };
}

const workerBase = normalizeWorkerBase(process.env.CATALOG_WORKER_URL);
const secret = process.env.CATALOG_HMAC_SECRET?.trim();

if (!workerBase || !secret) {
  console.error("Definí CATALOG_WORKER_URL y CATALOG_HMAC_SECRET");
  process.exit(1);
}

const headers = createHmacHeaders(secret, "GET", WORKER_PATH);
const url = `${workerBase}${WORKER_PATH}`;

console.log("[test-hmac] GET", url);

const response = await fetch(url, { headers });
const body = await response.text();

console.log("[test-hmac] Status:", response.status);
if (response.ok) {
  const data = JSON.parse(body);
  const products = data.categories?.reduce((n, c) => n + c.products.length, 0) ?? 0;
  console.log(`[test-hmac] OK · ${products} producto(s)`);
} else {
  console.error("[test-hmac] Error:", body);
  process.exit(1);
}
