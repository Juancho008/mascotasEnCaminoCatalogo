const { checkAdminPassword, getWorkerConfig } = require("../_worker-proxy.cjs");

async function readRawBuffer(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  const auth = checkAdminPassword(req);
  if (!auth.ok) {
    return res.status(auth.error.includes("Falta") ? 500 : 401).json({ error: auth.error });
  }

  const { workerBase, adminToken } = getWorkerConfig();
  if (!workerBase || !adminToken) {
    return res.status(500).json({
      error: "Faltan CATALOG_WORKER_URL o ADMIN_TOKEN en Vercel",
    });
  }

  if (req.method === "POST") {
    try {
      const buffer = await readRawBuffer(req);
      const response = await fetch(`${workerBase}/api/admin/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": req.headers["content-type"] || "multipart/form-data",
        },
        body: buffer,
      });
      const body = await response.text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(response.status).send(body);
    } catch (err) {
      console.error("[admin/documents POST]", err);
      return res.status(502).json({ error: "No se pudo subir el PDF" });
    }
  }

  if (req.method === "DELETE") {
    const id = req.query?.id;
    if (!id) return res.status(400).json({ error: "Falta id" });
    try {
      const response = await fetch(`${workerBase}/api/admin/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await response.text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(response.status).send(body);
    } catch (err) {
      console.error("[admin/documents DELETE]", err);
      return res.status(502).json({ error: "No se pudo eliminar el PDF" });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
};
