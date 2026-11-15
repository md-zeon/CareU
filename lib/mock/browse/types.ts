import type { LocalizedText } from "../types";
import type { MockBrand, MockCategory } from "../catalog/types";
import type { MockShop } from "../shops/types";

export type MockCollection = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  eyebrow?: LocalizedText;
  badge?: LocalizedText;
  image?: string;
  imageAlt?: LocalizedText;
  productIds: string[];
  highlightCategoryIds?: string[];
  highlightBrandIds?: string[];
  visible: boolean;
  sortOrder: number;
};

export type CardAvailability = "in_stock" | "low_stock" | "out_of_stock";

export type ResolvedProductCard = {
  productId: string;
  slug: string;
  href: string;
  image: string;
  imageAlt?: LocalizedText;
  title: LocalizedText;
  brandId?: string;
  brandLabel?: LocalizedText;
  priceBdt: number;
  compareAtPriceBdt?: number;
  availability: CardAvailability;
  availabilityLabel?: LocalizedText;
  rating?: number;
  reviewCount?: number;
  shopId: string;
  shopLabel: LocalizedText;
  shopType: MockShop["type"];
  badges: LocalizedText[];
  variantId?: string;
  listingId?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  featuredRank?: number;
  categoryId: string;
  createdAtRank?: number;
  hasOffer?: boolean;
};

export type SearchSuggestionKind = "product" | "category" | "brand" | "collection";

export type SearchSuggestion = {
  kind: SearchSuggestionKind;
  id: string;
  label: LocalizedText;
  secondaryLabel?: LocalizedText;
  image?: string;
  href: string;
};

export type BrowseSortKey =
  | "relevance"
  | "featured"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "rating"
  | "best-selling";

export type BrowseSurface = "category" | "collection" | "brand" | "search";

export type BrowseQueryState = {
  q?: string;
  page: number;
  sort: BrowseSortKey;
  category: string[];
  brand: string[];
  shop: string[];
  availability: CardAvailability[];
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  badges: string[];
  attributes: Record<string, string[]>;
};

export type FacetKind = "single" | "multi" | "range" | "toggle";

export type FacetOption = {
  value: string;
  label: LocalizedText;
  count?: number;
};

export type FacetDefinition = {
  key: string;
  label: LocalizedText;
  kind: FacetKind;
  options?: FacetOption[];
  visible: boolean;
  range?: {
    min?: number;
    max?: number;
    step?: number;
  };
};

export type SortOption = {
  key: BrowseSortKey;
  label: LocalizedText;
  appliesTo: BrowseSurface | "both";
  isDefault?: boolean;
};

export type BreadcrumbItem = {
  label: LocalizedText;
  href?: string;
};

export type BrowsePageResult = {
  items: ResolvedProductCard[];
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
  facets: FacetDefinition[];
  activeSort: BrowseSortKey;
  appliedFilters: BrowseQueryState;
  breadcrumbs: BreadcrumbItem[];
  title: LocalizedText;
  description?: LocalizedText;
  heroImage?: string;
  heroImageAlt?: LocalizedText;
  surface: BrowseSurface;
};

export type BrowseContextKind = "category" | "collection" | "brand" | "search";

export type BrowseResolution =
  | { status: "ok"; result: BrowsePageResult }
  | { status: "not_found" }
  | { status: "empty_query" }
  | { status: "error" };