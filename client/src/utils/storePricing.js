import { getCatalogNavGroups } from "./catalogGroups.js";

/** Recargo aplicado a alimentos balanceados en la tienda (no visible para el cliente). */
export const BALANCED_FOOD_MARKUP = 1.3;

/** Redondeo al millar más cercano; desde $500 de resto redondea hacia arriba (a favor). */
export function roundToNearestThousand(price) {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return value;

  return Math.round(value / 1000) * 1000;
}

function isBalancedFoodNavGroup(group) {
  const key = String(group?.key || "").toLowerCase();
  if (key === "alimento-balanceado") return true;

  const label = String(group?.title || group?.label || "")
    .trim()
    .toLowerCase();
  return label === "alimento balanceado";
}

/** IDs de categorías que pertenecen al grupo Alimento balanceado. */
export function getBalancedFoodCategoryIds(categories) {
  const ids = new Set();

  for (const group of getCatalogNavGroups(categories || [])) {
    if (!isBalancedFoodNavGroup(group)) continue;
    for (const cat of group.categories ?? []) ids.add(cat.id);
  }

  return ids;
}

export function applyBalancedFoodMarkup(basePrice) {
  const price = Number(basePrice);
  if (!Number.isFinite(price) || price <= 0) return price;

  const withMarkup = Math.round(price * BALANCED_FOOD_MARKUP);
  return roundToNearestThousand(withMarkup);
}

function withBalancedFoodPrices(category, balancedIds) {
  if (!balancedIds.has(category.id)) return category;

  return {
    ...category,
    products: (category.products ?? []).map((product) => ({
      ...product,
      price: applyBalancedFoodMarkup(product.price),
    })),
  };
}

/** Precios de venta para la tienda: base + 30% en alimentos balanceados. */
export function applyStorePricing(catalog) {
  if (!catalog?.categories?.length) return catalog;

  const balancedIds = getBalancedFoodCategoryIds(catalog.categories);

  return {
    ...catalog,
    categories: catalog.categories.map((cat) => withBalancedFoodPrices(cat, balancedIds)),
  };
}
