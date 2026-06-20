import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import CatalogNav from "./components/CatalogNav.jsx";
import CatalogGroupedView from "./components/CatalogGroupedView.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Footer from "./components/Footer.jsx";
import Loader from "./components/Loader.jsx";
import AdminPanel from "./AdminPanel.jsx";
import DocumentsSection from "./components/DocumentsSection.jsx";
import { sanitizeCatalog } from "./utils/sanitizeCatalog.js";
import { isCategoryEnabled, getCatalogNavGroups } from "./utils/catalogGroups.js";

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
  const [activeGroupKey, setActiveGroupKey] = useState(null);
  const [activeSubId, setActiveSubId] = useState(null);
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
        const groups = getCatalogNavGroups(
          catalogData.categories.filter(isCategoryEnabled)
        );
        if (groups.length) {
          const first = groups[0];
          setActiveGroupKey(first.key);
          setActiveSubId(first.hasMultiple ? first.categories[0]?.id : null);
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

  const navGroups = useMemo(
    () => getCatalogNavGroups(visibleCategories),
    [visibleCategories]
  );

  const searchActive = Boolean(query.trim());

  const filteredCategories = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    if (!q) return visibleCategories;
    return visibleCategories
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

  const displayCategories = useMemo(() => {
    if (searchActive) return filteredCategories;

    const group =
      navGroups.find((g) => g.key === activeGroupKey) || navGroups[0];
    if (!group) return [];

    if (!group.hasMultiple) return group.categories;

    if (activeSubId) {
      return group.categories.filter((c) => c.id === activeSubId);
    }
    return [group.categories[0]].filter(Boolean);
  }, [searchActive, filteredCategories, navGroups, activeGroupKey, activeSubId]);

  function handleSelectGroup(key) {
    const group = navGroups.find((g) => g.key === key);
    if (!group) return;
    setActiveGroupKey(key);
    setActiveSubId(group.hasMultiple ? group.categories[0]?.id : null);
    scrollToCatalog();
  }

  function handleSelectSub(id) {
    setActiveSubId(id);
    scrollToCatalog();
  }

  function scrollToCatalog() {
    requestAnimationFrame(() => {
      document.querySelector(".catalog-container")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

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

        <CatalogNav
          groups={navGroups}
          activeGroupKey={activeGroupKey}
          activeSubId={activeSubId}
          onSelectGroup={handleSelectGroup}
          onSelectSub={handleSelectSub}
          searchActive={searchActive}
        />

        <div className="catalog-container">
          <AnimatePresence mode="wait">
            {displayCategories.length === 0 ? (
              <motion.div
                key="empty"
                className="state-screen state-inline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="state-emoji">{searchActive ? "🔍" : "📦"}</p>
                <h2>{searchActive ? "Sin resultados" : "Sin productos"}</h2>
                <p>
                  {searchActive
                    ? `No encontramos productos para “${query}”.`
                    : "No hay productos en esta categoría por ahora."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`${activeGroupKey}-${activeSubId}-${searchActive ? query : ""}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <CatalogGroupedView
                  categories={displayCategories}
                  site={site}
                  showGroupTitles={searchActive}
                />
              </motion.div>
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
