import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { isCategoryEnabled, getCatalogNavGroups } from "../../utils/catalogGroups.js";
import { sanitizeCatalog } from "../../utils/sanitizeCatalog.js";
import { applyStorePricing } from "../../utils/storePricing.js";
import { applyStoreSeo } from "../../utils/seo.js";
import { mockCatalog } from "../../mock";
import { applyTheme, loadCatalog } from "../../services/catalogService";
import type { Catalog, CatalogState, RootState } from "../../types";
import { setActiveGroup } from "./uiSlice";

type AppDispatch = ThunkDispatch<RootState, unknown, UnknownAction>;

const useMock = import.meta.env.VITE_USE_MOCK === "true";

export const fetchCatalog = createAsyncThunk<
  Catalog,
  string,
  { rejectValue: string }
>("catalog/fetch", async (catalogUrl, { rejectWithValue }) => {
  try {
    const raw = useMock ? mockCatalog : await loadCatalog(catalogUrl);
    return applyStorePricing(sanitizeCatalog(raw)) as Catalog;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar catálogo";
    return rejectWithValue(message);
  }
});

function applyCatalogSideEffects(catalog: Catalog, dispatch: AppDispatch): void {
  applyTheme(catalog.site?.theme);
  applyStoreSeo(catalog);

  const groups = getCatalogNavGroups(
    catalog.categories.filter(isCategoryEnabled)
  );
  if (!groups.length) return;

  const first = groups[0];
  dispatch(
    setActiveGroup({
      groupKey: first.key,
      subId: first.hasMultiple ? first.categories[0]?.id ?? null : null,
    })
  );
}

const initialState: CatalogState = {
  data: null,
  status: "idle",
  error: null,
  assetsReady: false,
  loadProgress: 0,
};

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    setLoadProgress(state, action: { payload: number }) {
      state.loadProgress = action.payload;
    },
    setAssetsReady(state, action: { payload: boolean }) {
      state.assetsReady = action.payload;
    },
    resetAssetLoading(state) {
      state.assetsReady = false;
      state.loadProgress = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCatalog.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCatalog.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
        state.error = null;
        state.assetsReady = false;
        state.loadProgress = 0;
      })
      .addCase(fetchCatalog.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "No se pudo cargar el catálogo";
      });
  },
});

export const { setLoadProgress, setAssetsReady, resetAssetLoading } =
  catalogSlice.actions;

export default catalogSlice.reducer;

export const selectCatalog = (state: { catalog: CatalogState }) => state.catalog;

export { applyCatalogSideEffects };
