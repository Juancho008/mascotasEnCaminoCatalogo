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

  const id = req.query?.id;
  if (!id) {
    return res.status(400).json({ error: "Falta id" });
  }

  const { workerBase } = getWorkerConfig();
  if (!workerBase) {
    return res.status(500).json({ error: "Falta CATALOG_WORKER_URL" });
  }

  try {
    const response = await fetch(
      `${workerBase}/api/product-image?id=${encodeURIComponent(id)}`
    );
    const contentType = response.headers.get("Content-Type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.status(response.status);
    const buffer = Buffer.from(await response.arrayBuffer());
    return res.send(buffer);
  } catch (err) {
    console.error("[product-image]", err);
    return res.status(502).json({ error: "No se pudo cargar la imagen" });
  }
};
