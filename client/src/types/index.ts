/** Barrel export — tipos e interfaces del catálogo. */

export interface SiteTheme {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
}

export interface SiteConfig {
  storeName: string;
  tagline?: string;
  whatsappNumber?: string;
  whatsappMessageHeader?: string;
  whatsappMessageFooter?: string;
  currency?: string;
  currencyPosition?: "before" | "after";
  locale?: string;
  logo?: string;
  theme?: SiteTheme;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image: string;
  category: string;
  code?: string;
  tags?: string[];
  available?: boolean;
}

export interface Category {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
  order?: number;
  group?: string;
  groupId?: string;
  enabled?: boolean;
  products: Product[];
}

export interface CatalogDocument {
  id: string;
  title: string;
  filename?: string;
  url?: string;
  uploadedAt?: string;
}

export interface Catalog {
  site: SiteConfig;
  categories: Category[];
  documents?: CatalogDocument[];
  generatedAt?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  qty: number;
}

export interface NavGroup {
  key: string;
  title: string | null;
  label: string;
  emoji: string;
  categories: Category[];
  hasMultiple: boolean;
}

export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export interface CatalogState {
  data: Catalog | null;
  status: AsyncStatus;
  error: string | null;
  assetsReady: boolean;
  loadProgress: number;
}

export interface UiState {
  cartOpen: boolean;
  query: string;
  activeGroupKey: string | null;
  activeSubId: string | null;
}

export interface CartState {
  items: CartItem[];
}

export interface RootState {
  catalog: CatalogState;
  ui: UiState;
  cart: CartState;
}

export interface ActiveGroupPayload {
  groupKey: string;
  subId: string | null;
}
