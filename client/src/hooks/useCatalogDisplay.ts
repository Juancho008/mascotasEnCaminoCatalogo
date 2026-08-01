import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectCatalog } from "../store/slices/catalogSlice";
import { selectUi, setActiveGroup, setActiveSubId } from "../store/slices/uiSlice";
import { isCategoryEnabled, getCatalogNavGroups } from "../utils/catalogGroups.js";
import type { Category, NavGroup } from "../types";

function scrollToCatalog(): void {
  requestAnimationFrame(() => {
    document.querySelector(".catalog-container")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

/** Composable: categorías visibles, búsqueda y navegación del catálogo. */
export function useCatalogDisplay() {
  const dispatch = useAppDispatch();
  const { data: catalog } = useAppSelector(selectCatalog);
  const { query, activeGroupKey, activeSubId } = useAppSelector(selectUi);

  const visibleCategories = useMemo(() => {
    if (!catalog) return [];
    return catalog.categories.filter(isCategoryEnabled);
  }, [catalog]);

  const navGroups = useMemo(
    () => getCatalogNavGroups(visibleCategories) as NavGroup[],
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
            (p.description ?? "").toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.products.length > 0);
  }, [catalog, query, visibleCategories]);

  const displayCategories = useMemo((): Category[] => {
    if (searchActive) return filteredCategories;

    const group = navGroups.find((g) => g.key === activeGroupKey) || navGroups[0];
    if (!group) return [];
    if (!group.hasMultiple) return group.categories;
    if (activeSubId) return group.categories.filter((c) => c.id === activeSubId);

    return [group.categories[0]].filter(Boolean);
  }, [searchActive, filteredCategories, navGroups, activeGroupKey, activeSubId]);

  const handleSelectGroup = (key: string) => {
    const group = navGroups.find((g) => g.key === key);
    if (!group) return;

    dispatch(
      setActiveGroup({
        groupKey: key,
        subId: group.hasMultiple ? group.categories[0]?.id ?? null : null,
      })
    );
    scrollToCatalog();
  };

  const handleSelectSub = (id: string) => {
    dispatch(setActiveSubId(id));
    scrollToCatalog();
  };

  return {
    catalog,
    navGroups,
    displayCategories,
    searchActive,
    query,
    activeGroupKey,
    activeSubId,
    handleSelectGroup,
    handleSelectSub,
  };
}
