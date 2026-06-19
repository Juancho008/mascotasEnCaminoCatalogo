const crypto = require("crypto");

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

function getWorkerConfig() {
  const workerBase = normalizeWorkerBase(process.env.CATALOG_WORKER_URL);
  const hmacSecret = process.env.CATALOG_HMAC_SECRET?.trim();
  const adminToken = process.env.ADMIN_TOKEN?.trim();
  return { workerBase, hmacSecret, adminToken };
}

async function workerFetch(pathname, { method = "GET", body, useHmac = false, adminToken } = {}) {
  const { workerBase, hmacSecret, adminToken: envAdmin } = getWorkerConfig();
  if (!workerBase) throw new Error("Falta CATALOG_WORKER_URL");

  const headers = {};
  if (useHmac && hmacSecret) {
    Object.assign(headers, createHmacHeaders(hmacSecret, method, pathname));
  }
  const token = adminToken || envAdmin;
  if (token) headers.Authorization = `Bearer ${token}`;

  const init = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = typeof body === "string" ? "application/json" : "application/json";
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  return fetch(`${workerBase}${pathname}`, init);
}

function checkAdminPassword(req) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return { ok: false, error: "Falta ADMIN_PASSWORD en Vercel" };
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (token !== expected) return { ok: false, error: "Contraseña incorrecta" };
  return { ok: true };
}

module.exports = {
  workerFetch,
  checkAdminPassword,
  getWorkerConfig,
};
