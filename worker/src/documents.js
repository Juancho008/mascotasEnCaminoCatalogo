const DOCUMENTS_INDEX_KEY = "documents:index";

export async function listDocuments(env) {
  const raw = await env.KV_BINDING.get(DOCUMENTS_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function syncCatalogDocuments(env, docs) {
  const raw = await env.KV_BINDING.get("catalog");
  if (!raw) return;
  const catalog = JSON.parse(raw);
  catalog.documents = docs.map((d) => ({
    id: d.id,
    title: d.title,
    filename: d.filename,
    url: `/api/documents?id=${d.id}`,
    uploadedAt: d.uploadedAt,
  }));
  catalog.generatedAt = new Date().toISOString();
  await env.KV_BINDING.put("catalog", JSON.stringify(catalog));
}

function pdfResponse(buffer, filename) {
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename || "catalogo.pdf"}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** GET /api/documents — lista pública */
export async function handleDocumentsList(env, corsHeaders) {
  const docs = await listDocuments(env);
  return new Response(
    JSON.stringify(
      docs.map((d) => ({
        id: d.id,
        title: d.title,
        filename: d.filename,
        uploadedAt: d.uploadedAt,
        url: `/api/documents?id=${d.id}`,
      }))
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...corsHeaders,
      },
    }
  );
}

/** GET /api/documents/:id — descarga pública */
export async function handleDocumentDownload(env, id, corsHeaders) {
  const pdf = await env.KV_BINDING.get(`documents:file:${id}`, "arrayBuffer");
  if (!pdf) {
    return new Response(JSON.stringify({ error: "PDF no encontrado" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
  const docs = await listDocuments(env);
  const meta = docs.find((d) => d.id === id);
  const res = pdfResponse(pdf, meta?.filename);
  Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

function isAdmin(request, env) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(env.ADMIN_TOKEN && token === env.ADMIN_TOKEN);
}

/** POST /api/admin/documents — subir PDF */
export async function handleDocumentUpload(request, env, json, corsHeaders) {
  if (!isAdmin(request, env)) {
    return json({ error: "No autorizado" }, 401);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: "Formato inválido" }, 400);
  }

  const file = formData.get("file");
  const title = (formData.get("title") || file?.name || "Catálogo PDF").toString();

  if (!file || typeof file === "string") {
    return json({ error: "Seleccioná un archivo PDF" }, 400);
  }

  const mime = file.type || "application/octet-stream";
  if (mime !== "application/pdf") {
    return json({ error: "Solo se permiten archivos PDF" }, 400);
  }

  const buffer = await file.arrayBuffer();
  const maxBytes = 10 * 1024 * 1024;
  if (buffer.byteLength > maxBytes) {
    return json({ error: "El PDF no puede superar 10 MB" }, 400);
  }

  const id = crypto.randomUUID();
  const docs = await listDocuments(env);
  const entry = {
    id,
    title,
    filename: file.name || "catalogo.pdf",
    size: buffer.byteLength,
    uploadedAt: new Date().toISOString(),
  };

  docs.push(entry);
  await env.KV_BINDING.put(`documents:file:${id}`, buffer);
  await env.KV_BINDING.put(DOCUMENTS_INDEX_KEY, JSON.stringify(docs));
  await syncCatalogDocuments(env, docs);

  return json({ ok: true, document: entry });
}

/** DELETE /api/admin/documents/:id */
export async function handleDocumentDelete(request, env, id, json) {
  if (!isAdmin(request, env)) {
    return json({ error: "No autorizado" }, 401);
  }

  const docs = await listDocuments(env);
  const next = docs.filter((d) => d.id !== id);
  if (next.length === docs.length) {
    return json({ error: "PDF no encontrado" }, 404);
  }

  await env.KV_BINDING.delete(`documents:file:${id}`);
  await env.KV_BINDING.put(DOCUMENTS_INDEX_KEY, JSON.stringify(next));
  await syncCatalogDocuments(env, next);

  return json({ ok: true });
}
