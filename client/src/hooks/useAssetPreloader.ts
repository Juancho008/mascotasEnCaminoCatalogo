import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectCatalog, setAssetsReady, setLoadProgress } from "../store/slices/catalogSlice";
import { collectCatalogImageUrls, preloadImages } from "../services/catalogService";

/** Composable: precarga imágenes del catálogo antes de mostrar la tienda. */
export function useAssetPreloader() {
  const dispatch = useAppDispatch();
  const { data: catalog, assetsReady } = useAppSelector(selectCatalog);

  useEffect(() => {
    if (!catalog || assetsReady) return;

    const sources = collectCatalogImageUrls(catalog);
    const cancel = preloadImages(sources, (percent) => {
      dispatch(setLoadProgress(percent));
      if (percent >= 100) dispatch(setAssetsReady(true));
    });

    return cancel;
  }, [catalog, assetsReady, dispatch]);
}
