const { workerFetch, checkAdminPassword } = require("../_worker-proxy.cjs");

async function readRawBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? req.body : JSON.stringify(req.body);
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString();
}

module.exports = async (req, res) => {
  const auth = checkAdminPassword(req);
  if (!auth.ok) {
    return res.status(auth.error.includes("Falta") ? 500 : 401).json({ error: auth.error });
  }

  if (req.method === "GET") {
    try {
      const response = await workerFetch("/catalog.json", { method: "GET", useHmac: true });
      const body = await response.text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(response.status).send(body);
    } catch (err) {
      console.error("[admin/catalog GET]", err);
      return res.status(502).json({ error: "No se pudo leer el catálogo" });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await readRawBody(req);
      const response = await workerFetch("/api/catalog", {
        method: "PUT",
        body,
        adminToken: process.env.ADMIN_TOKEN?.trim(),
      });
      const text = await response.text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(response.status).send(text);
    } catch (err) {
      console.error("[admin/catalog PUT]", err);
      return res.status(502).json({ error: "No se pudo guardar el catálogo" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
};
