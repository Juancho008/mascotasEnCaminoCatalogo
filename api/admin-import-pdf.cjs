const { checkAdminPassword, workerFetch } = require("./_worker-proxy.cjs");
const pdfParse = require("pdf-parse");

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

// CJS bridge to ESM parser
let parseModule;
async function getParser() {
  if (!parseModule) {
    parseModule = await import("../lib/pdf-price-parser.mjs");
  }
  return parseModule;
}

function buildPreviewResponse(parsed) {
  return {
    ok: true,
    preview: true,
    totalProducts: parsed.totalProducts,
    categories: parsed.categories.map((c) => ({
      id: c.id,
      label: c.label,
      productCount: c.products.length,
      products: c.products.slice(0, 5),
    })),
  };
}

function parseSaveResponse(saveBody, saveRes, parsed) {
  let payload;
  try {
    payload = JSON.parse(saveBody);
  } catch {
    payload = { ok: saveRes.ok };
  }

  if (!saveRes.ok) return payload;

  return {
    ...payload,
    imported: {
      totalProducts: parsed.totalProducts,
      categories: parsed.categories.length,
    },
  };
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

  try {
    const { parsePriceListText, mergeImportedCatalog } = await getParser();
    const payload = await readJsonBody(req);
    const { data, action = "preview", replace = true } = payload;

    if (!data) {
      return res.status(400).json({ error: "Falta el PDF en base64 (campo data)" });
    }

    const buffer = Buffer.from(data, "base64");
    const pdf = await pdfParse(buffer);
    const parsed = parsePriceListText(pdf.text, {
      defaultImage: "/images/Logo/LogoMascotaEnCamino.png",
    });

    if (!parsed.totalProducts) {
      return res.status(422).json({
        error:
          "No se detectaron productos en el PDF. Verificá que sea una lista con código, descripción y precio.",
        textSample: pdf.text.slice(0, 800),
      });
    }

    if (action === "preview") {
      return res.status(200).json(buildPreviewResponse(parsed));
    }

    if (action !== "import") {
      return res.status(400).json({ error: "action debe ser preview o import" });
    }

    const catalogRes = await workerFetch("/catalog.json", {
      method: "GET",
      useHmac: true,
    });
    const catalogText = await catalogRes.text();
    if (!catalogRes.ok) {
      return res.status(catalogRes.status).json({
        error: "No se pudo leer el catálogo actual",
      });
    }

    const existing = JSON.parse(catalogText);
    const merged = mergeImportedCatalog(existing, parsed, { replace });

    const saveRes = await workerFetch("/api/catalog", {
      method: "PUT",
      body: JSON.stringify(merged),
      adminToken: process.env.ADMIN_TOKEN?.trim(),
    });
    const saveBody = await saveRes.text();
    const payload = parseSaveResponse(saveBody, saveRes, parsed);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(saveRes.status).send(JSON.stringify(payload));
  } catch (err) {
    console.error("[admin/import-pdf]", err);
    return res.status(500).json({
      error: err.message || "No se pudo procesar el PDF",
    });
  }
};
