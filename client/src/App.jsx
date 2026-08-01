import { useEffect } from "react";
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
import WeekendDeliveryBanner from "./components/WeekendDeliveryBanner.jsx";
import RescuedAnimalsFlyer from "./components/RescuedAnimalsFlyer.jsx";
import MobileCartFab from "./components/MobileCartFab.jsx";
import { useCatalogLoader, useAssetPreloader, useCatalogDisplay } from "./hooks";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { selectCatalog } from "./store/slices/catalogSlice";
import { closeCart, openCart, selectUi, setQuery } from "./store/slices/uiSlice";

const isAdminRoute =
  typeof window !== "undefined" &&
  (window.location.pathname === "/admin" ||
    window.location.pathname.startsWith("/admin/"));

export default function App() {
  if (isAdminRoute) return <AdminPanel />;

  useCatalogLoader();
  useAssetPreloader();

  const dispatch = useAppDispatch();
  const { data: catalog, error, assetsReady, loadProgress } =
    useAppSelector(selectCatalog);
  const { cartOpen, query } = useAppSelector(selectUi);

  const {
    navGroups,
    displayCategories,
    searchActive,
    activeGroupKey,
    activeSubId,
    handleSelectGroup,
    handleSelectSub,
  } = useCatalogDisplay();

  if (error) {
    return (
      <div className="state-screen">
        <p className="state-emoji">😿</p>
        <h2>Ups, algo salió mal</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!catalog || !assetsReady) {
    return (
      <Loader
        logo={catalog?.site?.logo}
        storeName={catalog?.site?.storeName}
        progress={catalog ? loadProgress : null}
      />
    );
  }

  const { site } = catalog;

  return (
    <>
      <Header
        site={site}
        onOpenCart={() => dispatch(openCart())}
        query={query}
        onQueryChange={(value) => dispatch(setQuery(value))}
      />

      <main>
        <Hero site={site} />

        <RescuedAnimalsFlyer />

        <DocumentsSection documents={catalog.documents} />

        <CatalogNav
          groups={navGroups}
          activeGroupKey={activeGroupKey}
          activeSubId={activeSubId}
          onSelectGroup={handleSelectGroup}
          onSelectSub={handleSelectSub}
          searchActive={searchActive}
        />

        <WeekendDeliveryBanner
          visible={/alimento/i.test(
            navGroups.find((g) => g.key === activeGroupKey)?.label || ""
          )}
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
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
        onClose={() => dispatch(closeCart())}
        site={site}
      />

      <MobileCartFab onOpenCart={() => dispatch(openCart())} site={site} />
    </>
  );
}
