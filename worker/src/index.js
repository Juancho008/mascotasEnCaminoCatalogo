/**
 * API del catálogo en Cloudflare Workers + KV.
 *
 * GET  /catalog.json  → lee el catálogo desde KV (clave "catalog")
 * GET  /api/catalog   → mismo contenido (alias)
 * PUT  /api/catalog   → actualiza el catálogo (requiere ADMIN_TOKEN)
 * GET  /api/health    → estado del servicio
 */

const CATALOG_KEY = "catalog";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
      ...extra,
    },
  });
}

function isCatalogPath(pathname) {
  return pathname === "/catalog.json" || pathname === "/api/catalog";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/health") {
      const hasCatalog = Boolean(await env.KV_BINDING.get(CATALOG_KEY));
      return json({ ok: true, kv: true, hasCatalog });
    }

    if (!isCatalogPath(url.pathname)) {
      return json({ error: "Ruta no encontrada" }, 404);
    }

    if (request.method === "GET") {
      const raw = await env.KV_BINDING.get(CATALOG_KEY);
      if (!raw) {
        return json(
          {
            error:
              "Catálogo no encontrado en KV. Ejecutá: npm run kv:sync",
          },
          404
        );
      }

      return new Response(raw, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=60",
          ...corsHeaders,
        },
      });
    }

    if (request.method === "PUT") {
      const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
      if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
        return json({ error: "No autorizado" }, 401);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "JSON inválido" }, 400);
      }

      await env.KV_BINDING.put(CATALOG_KEY, JSON.stringify(body));
      return json({ ok: true, key: CATALOG_KEY });
    }

    return json({ error: "Método no permitido" }, 405);
  },
};
