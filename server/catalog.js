import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, "..");
export const CONFIG_DIR = path.join(ROOT_DIR, "config");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function readJson(filePath, fallback = {}) {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(`[catalog] No se pudo leer ${filePath}:`, err.message);
    }
    return fallback;
  }
}

export function loadSiteConfig() {
  return readJson(path.join(CONFIG_DIR, "site.config.json"), {});
}

export function loadProductsConfig() {
  return readJson(path.join(CONFIG_DIR, "products.json"), {});
}

/** Convierte "Collar-1" en "Collar 1" para un nombre legible por defecto. */
function prettifyName(fileBaseName) {
  return fileBaseName
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isImage(fileName) {
  return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

/**
 * Escanea el directorio de inventario buscando subcarpetas (categorías)
 * y combina cada imagen con la configuración de products.json y site.config.json.
 */
export function buildCatalog() {
  const site = loadSiteConfig();
  const products = loadProductsConfig();

  const inventoryDirName = site.inventoryDir || "src";
  const inventoryDir = path.join(ROOT_DIR, inventoryDirName);
  const categoryDefaults = site.categoryDefaults || {};
  const categoriesConfig = site.categories || {};

  const categories = [];

  let categoryFolders = [];
  try {
    categoryFolders = fs
      .readdirSync(inventoryDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (err) {
    console.warn(`[catalog] No se pudo leer el inventario en ${inventoryDir}:`, err.message);
  }

  for (const folder of categoryFolders) {
    const catConfig = categoriesConfig[folder] || {};
    const folderPath = path.join(inventoryDir, folder);

    let files = [];
    try {
      files = fs
        .readdirSync(folderPath)
        .filter(isImage)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } catch {
      files = [];
    }

    if (files.length === 0) continue;

    const defaultPrice =
      catConfig.defaultPrice ?? categoryDefaults.defaultPrice ?? 0;

    const items = files.map((file) => {
      const id = `${folder}/${file}`;
      const override = products[id] || {};
      const baseName = path.basename(file, path.extname(file));
      return {
        id,
        name: override.name || prettifyName(baseName),
        price: override.price ?? defaultPrice,
        description: override.description || "",
        tags: override.tags || [],
        available: override.available !== false,
        image: `/inventory/${encodeURI(folder)}/${encodeURIComponent(file)}`,
        category: folder,
      };
    });

    categories.push({
      id: folder,
      label: catConfig.label || prettifyName(folder),
      emoji: catConfig.emoji || categoryDefaults.emoji || "🐾",
      description: catConfig.description || "",
      order: catConfig.order ?? 999,
      products: items,
    });
  }

  categories.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  return {
    site: {
      storeName: site.storeName || "Catálogo",
      tagline: site.tagline || "",
      whatsappNumber: site.whatsappNumber || "",
      whatsappMessageHeader: site.whatsappMessageHeader || "",
      whatsappMessageFooter: site.whatsappMessageFooter || "",
      currency: site.currency || "$",
      currencyPosition: site.currencyPosition || "before",
      locale: site.locale || "es-AR",
      logo: site.logo || "/images/Logo/LogoMascotaEnCamino.png",
      theme: site.theme || {},
    },
    categories,
    documents: [],
    generatedAt: new Date().toISOString(),
  };
}

export function inventoryAbsoluteDir() {
  const site = loadSiteConfig();
  return path.join(ROOT_DIR, site.inventoryDir || "src");
}
