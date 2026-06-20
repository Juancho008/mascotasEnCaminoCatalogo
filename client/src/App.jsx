import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import CategoryNav from "./components/CategoryNav.jsx";
import CatalogGroupedView from "./components/CatalogGroupedView.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Footer from "./components/Footer.jsx";
import Loader from "./components/Loader.jsx";
import AdminPanel from "./AdminPanel.jsx";
import DocumentsSection from "./components/DocumentsSection.jsx";
import { sanitizeCatalog } from "./utils/sanitizeCatalog.js";
import { isCategoryEnabled } from "./utils/catalogGroups.js";

const isAdminRoute =
  typeof window !== "undefined" &&
  (window.location.pathname === "/admin" ||
    window.location.pathname.startsWith("/admin/"));

function applyTheme(theme = {}) {
  const root = document.documentElement;
  const map = {
    "--color-primary": theme.primary,
    "--color-secondary": theme.secondary,
    "--color-accent": theme.accent,
    "--color-bg": theme.background,
    "--color-surface": theme.surface,
    "--color-text": theme.text,
    "--color-muted": theme.muted,
  };
  Object.entries(map).forEach(([key, val]) => {
    if (val) root.style.setProperty(key, val);
  });
}

function parseCatalogResponse(text) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith("<")) {
    throw new Error(
      "El servidor devolvió HTML en lugar de JSON. Verificá que /api/catalog esté desplegado en Vercel y que existan CATALOG_WORKER_URL y CATALOG_HMAC_SECRET."
    );
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error("Respuesta del catálogo no es JSON válido");
  }
}

async function fetchCatalog(url) {
  const r = await fetch(url);
  const text = await r.text();

  if (!r.ok) {
    let detail = "";
    try {
      detail = JSON.parse(text).error || "";
    } catch {
      detail = text.slice(0, 120);
    }

    if (r.status === 401) {
      throw new Error(
        detail ||
          "Firma HMAC rechazada. Verificá CATALOG_HMAC_SECRET (mismo valor en Vercel y Cloudflare) y CATALOG_WORKER_URL (solo dominio, sin /catalog.json)."
      );
    }

    throw new Error(detail || `No se pudo cargar el catálogo (HTTP ${r.status})`);
  }

  return parseCatalogResponse(text);
}

export default function App() {
  if (isAdminRoute) return <AdminPanel />;
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState("");

  const catalogUrl = import.meta.env.VITE_CATALOG_API || "/api/catalog";

  useEffect(() => {
    let cancelled = false;
    const fallbackUrl =
      catalogUrl !== "/catalog.json" ? "/catalog.json" : null;

    fetchCatalog(catalogUrl)
      .catch((err) => {
        if (!fallbackUrl) throw err;
        console.warn("[catalog] API falló, usando catalog.json estático:", err.message);
        return fetchCatalog(fallbackUrl);
      })
      .then((data) => {
        if (cancelled) return;
        const catalogData = sanitizeCatalog(data);
        setCatalog(catalogData);
        applyTheme(catalogData.site?.theme);
        if (catalogData.site?.storeName) document.title = catalogData.site.storeName;
        if (catalogData.categories?.length) {
          const firstVisible = catalogData.categories.find(isCategoryEnabled);
          setActiveCategory(firstVisible?.id ?? catalogData.categories[0].id);
        }
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [catalogUrl]);

  const visibleCategories = useMemo(() => {
    if (!catalog) return [];
    return catalog.categories.filter(isCategoryEnabled);
  }, [catalog]);

  const filteredCategories = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    const base = visibleCategories;
    if (!q) return base;
    return base
      .map((cat) => ({
        ...cat,
        products: cat.products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.products.length > 0);
  }, [catalog, query, visibleCategories]);

  if (error) {
    return (
      <div className="state-screen">
        <p className="state-emoji">😿</p>
        <h2>Ups, algo salió mal</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!catalog) return <Loader />;

  const { site } = catalog;

  return (
    <>
      <Header
        site={site}
        onOpenCart={() => setCartOpen(true)}
        query={query}
        onQueryChange={setQuery}
      />

      <main>
        <Hero site={site} />

        <DocumentsSection documents={catalog.documents} />

        <CategoryNav
          categories={visibleCategories}
          active={activeCategory}
          onSelect={setActiveCategory}
        />

        <div className="catalog-container">
          <AnimatePresence mode="wait">
            {filteredCategories.length === 0 ? (
              <motion.div
                key="empty"
                className="state-screen state-inline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="state-emoji">🔍</p>
                <h2>Sin resultados</h2>
                <p>No encontramos productos para “{query}”.</p>
              </motion.div>
            ) : (
              <CatalogGroupedView
                categories={filteredCategories}
                site={site}
              />
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer site={site} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        site={site}
      />
    </>
  );
}
