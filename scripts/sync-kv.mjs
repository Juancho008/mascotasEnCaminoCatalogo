// Sube client/public/catalog.json a Cloudflare KV (clave "catalog").
// Requiere wrangler.toml configurado y estar logueado: npx wrangler login
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(ROOT, "client", "public", "catalog.json");

if (!fs.existsSync(catalogPath)) {
  console.error("[sync-kv] No existe catalog.json. Corré primero: npm run build:static");
  process.exit(1);
}

console.log("[sync-kv] Subiendo catálogo a Cloudflare KV...");

const result = spawnSync(
  "npx",
  [
    "wrangler",
    "kv",
    "key",
    "put",
    "catalog",
    `--path=${catalogPath}`,
    "--binding=KV_BINDING",
    "--preview",
    "false",
    "--remote",
  ],
  { cwd: ROOT, stdio: "inherit", shell: true }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("[sync-kv] OK · clave 'catalog' actualizada en KV.");
