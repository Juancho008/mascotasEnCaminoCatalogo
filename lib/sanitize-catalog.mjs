/** Quita referencias a marcas del proveedor que no deben mostrarse en la tienda. */

const LEGACY_BRAND = /\bMOLINO\s+SEDA\b/gi;

export function slugifyCatalog(text) {
  return (
    String(text || "")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "item"
  );
}

export function cleanLegacyBrandText(text) {
  return String(text || "")
    .replace(/\s*·\s*MOLINO\s+SEDA\s*/gi, "")
    .replace(LEGACY_BRAND, "")
    .replace(/\s*·\s*$/g, "")
    .trim();
}

export function catalogHasLegacyBrand(catalog) {
  const json = JSON.stringify(catalog?.categories || []);
  return LEGACY_BRAND.test(json);
}

/** Limpia descripciones y normaliza groupId de categorías agrupadas. */
export function sanitizeCatalog(catalog) {
  if (!catalog || typeof catalog !== "object") return catalog;

  return {
    ...catalog,
    categories: (catalog.categories || []).map((cat) => ({
      ...cat,
      description: cleanLegacyBrandText(cat.description),
      groupId: cat.group ? slugifyCatalog(cat.group) : cat.groupId,
      products: (cat.products || []).map((p) => ({
        ...p,
        description: cleanLegacyBrandText(p.description),
      })),
    })),
    generatedAt: new Date().toISOString(),
  };
}
