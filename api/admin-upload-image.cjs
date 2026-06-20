const { checkAdminPassword, getWorkerConfig } = require("./_worker-proxy.cjs");

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  return raw ? JSON.parse(raw) : {};
}

function sendOptions(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  return res.status(204).end();
}

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") return sendOptions(res);

  const auth = checkAdminPassword(req);
  if (!auth.ok) {
    return res.status(auth.error.includes("Falta") ? 500 : 401).json({ error: auth.error });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { workerBase, adminToken } = getWorkerConfig();
  if (!workerBase || !adminToken) {
    return res.status(500).json({
      error: "Faltan CATALOG_WORKER_URL o ADMIN_TOKEN en Vercel",
    });
  }

  try {
    const payload = await readJsonBody(req);
    const response = await fetch(`${workerBase}/api/admin/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const body = await response.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    if (response.status === 404) {
      return res.status(502).json({
        error:
          "El Worker de Cloudflare no tiene la ruta de imágenes. Ejecutá: npm run worker:deploy",
      });
    }
    return res.status(response.status).send(body);
  } catch (err) {
    console.error("[admin/upload-image]", err);
    return res.status(502).json({ error: "No se pudo subir la imagen" });
  }
};
