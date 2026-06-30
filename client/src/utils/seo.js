const DEFAULT_SITE_URL = "https://mascotas-en-camino-catalogo-eight.vercel.app";

export function getSiteUrl() {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim();
  if (!fromEnv) return DEFAULT_SITE_URL;
  return fromEnv.replace(/\/$/, "");
}

function absoluteUrl(path, siteUrl) {
  if (!path) return siteUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href, extra = {}) {
  if (!href) return;
  const selector = extra.hreflang
    ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  if (extra.hreflang) el.setAttribute("hreflang", extra.hreflang);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function buildStoreDescription(site = {}) {
  const storeName = site.storeName || "Mascotas en Camino";
  const tagline = site.tagline || "Productos con amor para tu mejor amigo";
  return `${storeName} — ${tagline}. Catálogo online de collares, alimento balanceado y productos para mascotas. Pedí fácil por WhatsApp con entrega en Argentina.`;
}

export function buildPageTitle(site = {}) {
  const storeName = site.storeName || "Mascotas en Camino";
  return `${storeName} | Catálogo online · Pedí por WhatsApp`;
}

/** Actualiza título, meta sociales, canonical y datos estructurados del catálogo. */
export function applyStoreSeo(catalog) {
  const site = catalog?.site || {};
  const siteUrl = getSiteUrl();
  const storeName = site.storeName || "Mascotas en Camino";
  const title = buildPageTitle(site);
  const description = buildStoreDescription(site);
  const logo = absoluteUrl(site.logo || "/images/Logo/LogoMascotaEnCamino.png", siteUrl);
  const whatsapp = site.whatsappNumber?.replace(/\D/g, "");

  document.documentElement.lang = site.locale?.startsWith("es") ? "es-AR" : "es";

  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta(
    "name",
    "keywords",
    "mascotas, perros, gatos, collares, alimento balanceado, pet shop, Argentina, WhatsApp, Mascotas en Camino, alimento para perros"
  );
  upsertMeta("name", "robots", "index, follow, max-image-preview:large");
  upsertMeta("name", "author", storeName);
  upsertMeta("name", "application-name", storeName);

  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:locale", "es_AR");
  upsertMeta("property", "og:site_name", storeName);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", siteUrl);
  upsertMeta("property", "og:image", logo);
  upsertMeta("property", "og:image:alt", `${storeName} — logo`);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", logo);

  upsertMeta("name", "theme-color", site.theme?.primary || "#E23B3B");
  upsertLink("canonical", siteUrl);
  upsertLink("alternate", siteUrl, { hreflang: "es-AR" });

  upsertJsonLd("seo-jsonld-website", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: siteUrl,
    description,
    inLanguage: "es-AR",
    publisher: {
      "@type": "Organization",
      name: storeName,
      logo: { "@type": "ImageObject", url: logo },
    },
  });

  const store = {
    "@context": "https://schema.org",
    "@type": "PetStore",
    name: storeName,
    description: site.tagline || description,
    url: siteUrl,
    image: logo,
    areaServed: { "@type": "Country", name: "Argentina" },
  };

  if (whatsapp) {
    store.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: `+${whatsapp}`,
      availableLanguage: ["es"],
    };
  }

  upsertJsonLd("seo-jsonld-store", store);

  const products = (catalog.categories || [])
    .flatMap((cat) =>
      (cat.products || []).map((p) => ({ ...p, categoryLabel: cat.label }))
    )
    .slice(0, 30);

  if (!products.length) return;

  upsertJsonLd("seo-jsonld-products", {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Productos de ${storeName}`,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        image: absoluteUrl(product.image, siteUrl),
        category: product.categoryLabel,
        ...(product.price > 0
          ? {
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: "ARS",
                availability:
                  product.available !== false
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                url: siteUrl,
              },
            }
          : {}),
      },
    })),
  });
}

export function applyAdminNoIndex() {
  document.title = "Administración · Mascotas en Camino";
  upsertMeta("name", "robots", "noindex, nofollow");
}
