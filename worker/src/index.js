/**
 * API del catálogo en Cloudflare Workers + KV.
 */

import { verifyHmac } from "./hmac.js";
import {
  handleDocumentDelete,
  handleDocumentDownload,
  handleDocumentUpload,
  handleDocumentsList,
} from "./documents.js";
import {
  handleProductImageDownload,
  handleProductImageUpload,
} from "./images.js";

const CATALOG_KEY = "catalog";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Timestamp, X-Signature",
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

async function handleCatalogGet(request, env) {
  const authorized = await verifyHmac(request, env.CATALOG_HMAC_SECRET);
  if (!authorized) return json({ error: "No autorizado" }, 401);

  const raw = await env.KV_BINDING.get(CATALOG_KEY);
  if (!raw) {
    return json(
      { error: "Catálogo no encontrado en KV. Ejecutá: npm run kv:sync" },
      404
    );
  }

  return new Response(raw, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, must-revalidate",
      ...corsHeaders,
    },
  });
}

async function handleCatalogPut(request, env) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/health") {
      const hasCatalog = Boolean(await env.KV_BINDING.get(CATALOG_KEY));
      const hmacEnabled = Boolean(env.CATALOG_HMAC_SECRET);
      return json({ ok: true, kv: true, hasCatalog, hmacEnabled });
    }

    if (request.method === "GET" && url.pathname === "/api/documents") {
      return handleDocumentsList(env, corsHeaders);
    }

    const docMatch = url.pathname.match(/^\/api\/documents\/([^/]+)$/);
    if (request.method === "GET" && docMatch) {
      return handleDocumentDownload(env, docMatch[1], corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/documents") {
      return handleDocumentUpload(request, env, json, corsHeaders);
    }

    const adminDocMatch = url.pathname.match(/^\/api\/admin\/documents\/([^/]+)$/);
    if (request.method === "DELETE" && adminDocMatch) {
      return handleDocumentDelete(request, env, adminDocMatch[1], json);
    }

    if (request.method === "GET" && url.pathname === "/api/product-image") {
      const id = url.searchParams.get("id");
      if (!id) return json({ error: "Falta id" }, 400);
      return handleProductImageDownload(env, id, corsHeaders);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/images") {
      return handleProductImageUpload(request, env, json);
    }

    if (!isCatalogPath(url.pathname)) {
      return json({ error: "Ruta no encontrada" }, 404);
    }

    if (request.method === "GET") {
      return handleCatalogGet(request, env);
    }

    if (request.method === "PUT") {
      return handleCatalogPut(request, env);
    }

    return json({ error: "Método no permitido" }, 405);
  },
};
