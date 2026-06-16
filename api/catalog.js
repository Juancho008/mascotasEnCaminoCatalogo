import { createHmacHeaders } from "../lib/hmac.mjs";

const WORKER_PATH = "/catalog.json";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const workerBase = process.env.CATALOG_WORKER_URL?.replace(/\/$/, "");
  const secret = process.env.CATALOG_HMAC_SECRET;

  if (!workerBase || !secret) {
    return res.status(500).json({
      error: "Faltan CATALOG_WORKER_URL o CATALOG_HMAC_SECRET en Vercel",
    });
  }

  try {
    const headers = createHmacHeaders(secret, "GET", WORKER_PATH);
    const response = await fetch(`${workerBase}${WORKER_PATH}`, { headers });

    res.setHeader("Cache-Control", "public, max-age=60");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    const body = await response.text();
    return res.status(response.status).send(body);
  } catch (err) {
    console.error("[api/catalog]", err);
    return res.status(502).json({ error: "No se pudo obtener el catálogo" });
  }
}
