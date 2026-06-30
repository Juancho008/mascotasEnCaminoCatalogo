// Genera una versión 100% estática del catálogo para hostings sin servidor
// (Vercel, Netlify, GitHub Pages, etc.).
//
// 1. Construye el catálogo escaneando las carpetas de imágenes + los JSON.
// 2. Escribe el resultado en client/public/catalog.json
// 3. Copia el inventario de imágenes a client/public/inventory
// 4. Copia los recursos (logo) a client/public/images
//
// Luego `vite build` mete todo lo que está en client/public dentro de client/dist,
// quedando un sitio estático que sirve /catalog.json, /inventory/... e /images/...
import fs from "node:fs";
import path from "node:path";
import { buildCatalog, ROOT_DIR, inventoryAbsoluteDir } from "../server/catalog.js";

const publicDir = path.join(ROOT_DIR, "client", "public");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[build-static] No existe el origen: ${src}`);
    return;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

fs.mkdirSync(publicDir, { recursive: true });

const catalog = buildCatalog();
fs.writeFileSync(
  path.join(publicDir, "catalog.json"),
  JSON.stringify(catalog, null, 2),
  "utf-8"
);

copyDir(inventoryAbsoluteDir(), path.join(publicDir, "inventory"));
copyDir(path.join(ROOT_DIR, "images"), path.join(publicDir, "images"));

const siteUrl = (
  process.env.SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://mascotas-en-camino-catalogo-eight.vercel.app"
).replace(/\/$/, "");

fs.writeFileSync(
  path.join(publicDir, "robots.txt"),
  `User-agent: *
Allow: /

Disallow: /admin
Disallow: /admin/

Sitemap: ${siteUrl}/sitemap.xml
`,
  "utf-8"
);

const lastmod = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(publicDir, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
  "utf-8"
);

const totalProducts = catalog.categories.reduce(
  (n, c) => n + c.products.length,
  0
);
console.log(
  `[build-static] OK · ${catalog.categories.length} categoría(s), ${totalProducts} producto(s), SEO → ${siteUrl}.`
);
