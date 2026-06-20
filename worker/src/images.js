const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 2 * 1024 * 1024;

function isAdmin(request, env) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(env.ADMIN_TOKEN && token === env.ADMIN_TOKEN);
}

/** GET /api/product-image?id= — imagen pública de producto */
export async function handleProductImageDownload(env, id, corsHeaders) {
  const metaRaw = await env.KV_BINDING.get(`images:meta:${id}`);
  if (!metaRaw) {
    return new Response(JSON.stringify({ error: "Imagen no encontrada" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const meta = JSON.parse(metaRaw);
  const buffer = await env.KV_BINDING.get(`images:file:${id}`, "arrayBuffer");
  if (!buffer) {
    return new Response(JSON.stringify({ error: "Imagen no encontrada" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(buffer, {
    headers: {
      "Content-Type": meta.mime || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
      ...corsHeaders,
    },
  });
}

/** POST /api/admin/images — subir imagen de producto */
export async function handleProductImageUpload(request, env, json) {
  if (!isAdmin(request, env)) {
    return json({ error: "No autorizado" }, 401);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const mime = (payload.mime || "image/jpeg").toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return json({ error: "Solo JPG, PNG, WebP o GIF" }, 400);
  }

  if (!payload.data) {
    return json({ error: "Falta el campo data (imagen en base64)" }, 400);
  }

  let buffer;
  try {
    const binary = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
    buffer = binary.buffer;
  } catch {
    return json({ error: "Base64 inválido" }, 400);
  }

  if (buffer.byteLength > MAX_BYTES) {
    return json({ error: "La imagen no puede superar 2 MB" }, 400);
  }

  const id = crypto.randomUUID();
  const meta = {
    id,
    mime,
    size: buffer.byteLength,
    filename: (payload.filename || "producto.jpg").toString(),
    uploadedAt: new Date().toISOString(),
  };

  await env.KV_BINDING.put(`images:file:${id}`, buffer);
  await env.KV_BINDING.put(`images:meta:${id}`, JSON.stringify(meta));

  return json({
    ok: true,
    id,
    url: `/api/product-image?id=${id}`,
    image: `/api/product-image?id=${id}`,
  });
}
