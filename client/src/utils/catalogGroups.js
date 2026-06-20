import {
  cleanLegacyBrandText,
  slugifyCatalog,
} from "./sanitizeCatalog.js";

export function slugify(text) {
  return slugifyCatalog(text);
}

function cleanLegacyText(text) {
  return cleanLegacyBrandText(text);
}

/** Catálogo plano (KV) → grupos con subcategorías para el editor. */
export function catalogToGroups(catalog) {
  const groupsMap = new Map();

  for (const cat of catalog?.categories || []) {
    const clone = structuredClone(cat);
    clone.description = cleanLegacyText(clone.description);
    clone.products = (clone.products || []).map((p) => ({
      ...p,
      description: cleanLegacyText(p.description),
    }));

    if (cat.group) {
      const parentId = cat.groupId || slugify(cat.group);
      if (!groupsMap.has(parentId)) {
        groupsMap.set(parentId, {
          id: parentId,
          label: cat.group,
          subcategories: [],
        });
      }
      groupsMap.get(parentId).subcategories.push(clone);
    } else {
      const id = cat.groupId || slugify(cat.label);
      groupsMap.set(id, {
        id,
        label: cat.label,
        subcategories: [clone],
      });
    }
  }

  return {
    site: structuredClone(catalog?.site || {}),
    documents: structuredClone(catalog?.documents || []),
    groups: [...groupsMap.values()],
  };
}

/** Grupos del editor → catálogo plano para guardar en KV. */
export function groupsToCatalog(editorState) {
  const categories = [];
  let order = 1;

  for (const group of editorState.groups || []) {
    const multiSub = group.subcategories.length > 1;

    for (const sub of group.subcategories || []) {
      const subId = sub.id || slugify(sub.label);
      categories.push({
        ...sub,
        id: subId,
        label: sub.label || "Sin nombre",
        description: cleanLegacyText(sub.description),
        group: multiSub ? group.label : undefined,
        groupId: multiSub ? group.id : undefined,
        enabled: sub.enabled !== false,
        order: order++,
        products: (sub.products || []).map((p) => ({
          ...p,
          id: p.id || `${subId}/${p.code || slugify(p.name)}`,
          category: subId,
          description: cleanLegacyText(p.description),
        })),
      });
    }
  }

  return {
    site: editorState.site || {},
    documents: editorState.documents || [],
    categories,
    generatedAt: new Date().toISOString(),
  };
}

export function emptyProduct(subId) {
  const code = String(Date.now()).slice(-4);
  return {
    id: `${subId}/nuevo-${code}`,
    name: "",
    price: 0,
    description: "",
    code: "",
    tags: [],
    available: true,
    image: "/images/Logo/LogoMascotaEnCamino.png",
    category: subId,
  };
}

export function emptySubcategory(groupId) {
  const id = `${groupId}-${slugify(`sub-${Date.now()}`)}`;
  return {
    id,
    label: "Nueva subcategoría",
    emoji: "🐾",
    description: "",
    enabled: true,
    products: [],
  };
}

export function isCategoryEnabled(category) {
  return category?.enabled !== false;
}

export function emptyGroup() {
  const id = slugify(`grupo-${Date.now()}`);
  return {
    id,
    label: "Nueva categoría",
    subcategories: [emptySubcategory(id)],
  };
}

/** Agrupa categorías planas para mostrar en la tienda. */
export function groupCategoriesForDisplay(categories) {
  const map = new Map();

  for (const cat of categories || []) {
    const key = cat.groupId || cat.group || cat.id;
    const title = cat.group || null;

    if (!map.has(key)) {
      map.set(key, { key, title, categories: [] });
    }
    map.get(key).categories.push(cat);
  }

  return [...map.values()];
}
