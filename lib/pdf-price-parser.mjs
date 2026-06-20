/** Parser de listas de precios tipo Molino Seda (código + descripción + precio). */

const JUNK_LINE =
  /^(fecha|p[áa]gina|lista de precios|c[oó]digo|descripci[oó]n|publico)\b/i;

/** Ej: 330 ESTAMPA ADULTOS CRIADORES X 15KG 34900.000 */
const PRODUCT_LINE = /^(\d{2,5})\s+(.+)\s+([\d.,]+)$/;

export function slugifyCategory(text) {
  return (
    text
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "general"
  );
}

export function parsePrice(value) {
  const n = parseFloat(String(value).replace(/,/g, "."));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function parseCompactProductLine(line) {
  const priceMatch = line.match(/(\d+)\.000$/);
  if (!priceMatch) return null;

  const price = parsePrice(priceMatch[1]);
  const rest = line.slice(0, -priceMatch[0].length);
  const codeMatch = rest.match(/^(\d{2,5})/);
  if (!codeMatch) return null;

  const code = codeMatch[1];
  const description = rest.slice(code.length).trim();
  if (!description) return null;

  return { code, description, price };
}

function parseProductLine(line) {
  const spaced = line.match(PRODUCT_LINE);
  if (spaced) {
    return {
      code: spaced[1],
      description: spaced[2].trim(),
      price: parsePrice(spaced[3]),
    };
  }
  return parseCompactProductLine(line);
}

function isCategoryLine(line) {
  if (parseProductLine(line)) return false;
  if (JUNK_LINE.test(line)) return false;
  if (/^c[oó]digodescripci[oó]npublico$/i.test(line.replace(/\s/g, ""))) return false;
  if (line.length < 4) return false;
  return /[A-Za-zÁÉÍÓÚÑáéíóúñ]{3,}/.test(line);
}

function normalizeCategoryLine(line) {
  if (/^molino\s+selda$/i.test(line) || /^molino\s+sela$/i.test(line)) return null;
  if (line.toUpperCase() === "MOLINO SEDA") return null;
  if (/^linea\s+/i.test(line)) return line.replace(/^linea\s+/i, "").trim();
  return line.trim();
}

/**
 * @param {string} text Texto extraído del PDF
 * @param {{ defaultImage?: string, brandHint?: string }} [options]
 */
export function parsePriceListText(text, options = {}) {
  const defaultImage =
    options.defaultImage || "/images/Logo/LogoMascotaEnCamino.png";

  let parentGroup = options.parentGroup || "";
  let categoryLabel = "General";
  const categoryMap = new Map();

  function ensureCategory(label) {
    const id = slugifyCategory(label);
    if (!categoryMap.has(id)) {
      categoryMap.set(id, {
        id,
        label,
        emoji: "🥫",
        description: "",
        order: categoryMap.size + 1,
        group: parentGroup || undefined,
        groupId: parentGroup ? slugifyCategory(parentGroup) : undefined,
        products: [],
      });
    }
    return categoryMap.get(id);
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  for (const line of lines) {
    if (JUNK_LINE.test(line)) continue;

    const product = parseProductLine(line);
    if (product) {
      const cat = ensureCategory(categoryLabel);
      cat.products.push({
        id: `${cat.id}/${product.code}`,
        name: product.description.trim(),
        price: product.price,
        description: product.code ? `Código ${product.code}` : "",
        tags: [],
        available: true,
        image: defaultImage,
        category: cat.id,
        code: product.code,
      });
      continue;
    }

    if (!isCategoryLine(line)) continue;

    if (/^alimentos balanceados$/i.test(line.replace(/\s+/g, " "))) {
      parentGroup = "Alimento balanceado";
      continue;
    }

    if (line.toUpperCase() === "MOLINO SEDA") continue;

    const normalized = normalizeCategoryLine(line);
    if (!normalized) continue;

    categoryLabel = normalized;
    ensureCategory(categoryLabel);
  }

  const categories = [...categoryMap.values()].filter((c) => c.products.length > 0);

  return {
    parentGroup,
    categories,
    totalProducts: categories.reduce((n, c) => n + c.products.length, 0),
  };
}

/** Mezcla categorías importadas en un catálogo existente. */
export function mergeImportedCatalog(existing, imported, { replace = true } = {}) {
  const catalog = {
    ...existing,
    site: existing.site || {},
    categories: [...(existing.categories || [])],
    documents: existing.documents || [],
  };

  for (const impCat of imported.categories || []) {
    const idx = catalog.categories.findIndex((c) => c.id === impCat.id);
    if (idx >= 0 && replace) {
      catalog.categories[idx] = impCat;
    } else if (idx >= 0) {
      const existingCodes = new Set(impCat.products.map((p) => p.id));
      const merged = [
        ...catalog.categories[idx].products.filter((p) => !existingCodes.has(p.id)),
        ...impCat.products,
      ];
      catalog.categories[idx] = { ...impCat, products: merged };
    } else {
      catalog.categories.push(impCat);
    }
  }

  catalog.categories.sort((a, b) => (a.order || 999) - (b.order || 999));
  catalog.generatedAt = new Date().toISOString();
  return catalog;
}
