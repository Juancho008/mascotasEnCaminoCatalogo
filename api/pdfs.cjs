const { getWorkerConfig } = require("./_worker-proxy.cjs");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { workerBase } = getWorkerConfig();
  if (!workerBase) {
    return res.status(500).json({ error: "Falta CATALOG_WORKER_URL en Vercel" });
  }

  const id = req.query?.id;

  try {
    const path = id ? `/api/documents/${id}` : "/api/documents";
    const response = await fetch(`${workerBase}${path}`);
    const contentType = response.headers.get("content-type") || "application/json";
    const body = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    if (contentType.includes("pdf")) {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
    return res.status(response.status).send(Buffer.from(body));
  } catch (err) {
    console.error("[pdfs]", err);
    return res.status(502).json({ error: "No se pudo obtener el documento" });
  }
};
