import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import CategoryNav from "./components/CategoryNav.jsx";
import CategorySection from "./components/CategorySection.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Footer from "./components/Footer.jsx";
import Loader from "./components/Loader.jsx";

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

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState("");

  const catalogUrl = import.meta.env.VITE_CATALOG_API || "/api/catalog";

  useEffect(() => {
    let cancelled = false;
    fetch(catalogUrl)
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar el catálogo");
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setCatalog(data);
        applyTheme(data.site?.theme);
        if (data.site?.storeName) document.title = data.site.storeName;
        if (data.categories?.length) setActiveCategory(data.categories[0].id);
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [catalogUrl]);

  const filteredCategories = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    if (!q) return catalog.categories;
    return catalog.categories
      .map((cat) => ({
        ...cat,
        products: cat.products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.products.length > 0);
  }, [catalog, query]);

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

        <CategoryNav
          categories={catalog.categories}
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
              filteredCategories.map((category) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  site={site}
                />
              ))
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
