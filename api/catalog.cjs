const crypto = require("crypto");

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

function parseWorkerError(body, status) {
  let detail = body;
  try {
    detail = JSON.parse(body).error || body;
  } catch {
    /* respuesta no JSON */
  }

  if (status === 401) {
    return "Firma HMAC rechazada por Cloudflare. Verificá que CATALOG_HMAC_SECRET sea idéntico en Vercel y Cloudflare, y que CATALOG_WORKER_URL sea solo el dominio del Worker (sin /catalog.json).";
  }

  return detail || "El Worker rechazó la solicitud";
}

function isValidJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const workerBase = normalizeWorkerBase(process.env.CATALOG_WORKER_URL);
  const secret = process.env.CATALOG_HMAC_SECRET?.trim();

  if (!workerBase || !secret) {
    return res.status(500).json({
      error: "Faltan CATALOG_WORKER_URL o CATALOG_HMAC_SECRET en Vercel",
    });
  }

  try {
    const headers = createHmacHeaders(secret, "GET", WORKER_PATH);
    const response = await fetch(`${workerBase}${WORKER_PATH}`, { headers });
    const body = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: parseWorkerError(body, response.status),
      });
    }

    if (!isValidJson(body)) {
      console.error("[api/catalog] Respuesta no JSON del Worker:", body.slice(0, 120));
      return res.status(502).json({
        error: "El Worker devolvió una respuesta inválida",
      });
    }

    res.setHeader("Cache-Control", "no-store, must-revalidate");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).send(body);
  } catch (err) {
    console.error("[api/catalog]", err);
    return res.status(502).json({ error: "No se pudo obtener el catálogo" });
  }
};
