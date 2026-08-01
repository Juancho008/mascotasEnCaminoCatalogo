import { useCallback, useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import {
  applyCatalogSideEffects,
  fetchCatalog,
} from "../store/slices/catalogSlice";

const CATALOG_URL = import.meta.env.VITE_CATALOG_API || "/api/catalog";

/** Composable: carga el catálogo y re-sincroniza al volver a la pestaña. */
export function useCatalogLoader() {
  const dispatch = useAppDispatch();

  const loadCatalog = useCallback(() => {
    return dispatch(fetchCatalog(CATALOG_URL))
      .unwrap()
      .then((catalog) => {
        applyCatalogSideEffects(catalog, dispatch);
      })
      .catch(() => {
        /* error en slice */
      });
  }, [dispatch]);

  useEffect(() => {
    loadCatalog();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      loadCatalog();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [loadCatalog]);

  return { loadCatalog, catalogUrl: CATALOG_URL };
}
