import type { Catalog, SiteTheme } from "../types";

export function parseCatalogResponse(text: string): Catalog {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("<")) {
    throw new Error(
      "El servidor devolvió HTML en lugar de JSON. Verificá que /api/catalog esté desplegado en Vercel y que existan CATALOG_WORKER_URL y CATALOG_HMAC_SECRET."
    );
  }
  try {
    return JSON.parse(trimmed) as Catalog;
  } catch {
    throw new Error("Respuesta del catálogo no es JSON válido");
  }
}

export async function fetchCatalogFromUrl(url: string): Promise<Catalog> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  const text = await response.text();

  if (response.ok) return parseCatalogResponse(text);

  let detail = "";
  try {
    detail = (JSON.parse(text) as { error?: string }).error || "";
  } catch {
    detail = text.slice(0, 120);
  }

  if (response.status === 401) {
    throw new Error(
      detail ||
        "Firma HMAC rechazada. Verificá CATALOG_HMAC_SECRET (mismo valor en Vercel y Cloudflare) y CATALOG_WORKER_URL (solo dominio, sin /catalog.json)."
    );
  }

  throw new Error(detail || `No se pudo cargar el catálogo (HTTP ${response.status})`);
}

export async function loadCatalog(catalogUrl: string): Promise<Catalog> {
  const fallbackUrl = catalogUrl !== "/catalog.json" ? "/catalog.json" : null;

  try {
    return await fetchCatalogFromUrl(catalogUrl);
  } catch (error) {
    if (!fallbackUrl) throw error;
    console.warn(
      "[catalog] API falló, usando catalog.json estático:",
      error instanceof Error ? error.message : error
    );
    return fetchCatalogFromUrl(fallbackUrl);
  }
}

export function applyTheme(theme: SiteTheme = {}): void {
  const root = document.documentElement;
  const map: Record<string, string | undefined> = {
    "--color-primary": theme.primary,
    "--color-secondary": theme.secondary,
    "--color-accent": theme.accent,
    "--color-bg": theme.background,
    "--color-surface": theme.surface,
    "--color-text": theme.text,
    "--color-muted": theme.muted,
  };

  Object.entries(map).forEach(([key, value]) => {
    if (value) root.style.setProperty(key, value);
  });
}

export function collectCatalogImageUrls(catalog: Catalog): string[] {
  const urls = new Set<string>();
  if (catalog.site?.logo) urls.add(catalog.site.logo);

  for (const category of catalog.categories || []) {
    for (const product of category.products || []) {
      if (product.image) urls.add(product.image);
    }
  }

  return [...urls];
}

export function preloadImages(
  sources: string[],
  onProgress: (percent: number) => void
): () => void {
  let cancelled = false;
  const total = sources.length;

  if (total === 0) {
    onProgress(100);
    return () => {
      cancelled = true;
    };
  }

  let loaded = 0;
  const bump = () => {
    if (cancelled) return;
    loaded += 1;
    onProgress(Math.round((loaded / total) * 100));
  };

  sources.forEach((src) => {
    const img = new Image();
    img.onload = bump;
    img.onerror = bump;
    img.src = src;
  });

  const timeout = setTimeout(() => {
    if (!cancelled) onProgress(100);
  }, 8000);

  return () => {
    cancelled = true;
    clearTimeout(timeout);
  };
}
