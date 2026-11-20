import type { LocalizedText, MockScenario } from "../types";
import type { CardAvailability } from "../browse/types";

export type ProductDetailScenario = MockScenario;

export type ResolvedProductDetail = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  brand?: { id: string; slug?: string; label: LocalizedText };
  category?: { id: string; slug?: string; label: LocalizedText };
  rating?: number;
  reviewCount?: number;
  badges?: LocalizedText[];
  highlights?: LocalizedText[];
  specifications?: { label: LocalizedText; value: LocalizedText }[];
};

export type ProductGalleryItem = {
  id: string;
  src: string;
  alt: LocalizedText;
  order: number;
  isPrimary?: boolean;
  variantId?: string;
};

export type ResolvedVariant = {
  id: string;
  productId: string;
  title: LocalizedText;
  sku?: string;
  options?: Record<string, LocalizedText | string>;
  priceBdt: number;
  compareAtPriceBdt?: number;
  availability: CardAvailability;
  stockStateLabel?: LocalizedText;
  isSelectable: boolean;
};

export type ResolvedShopContext = {
  shopId: string;
  label: LocalizedText;
  slug?: string;
  href?: string;
  badges?: LocalizedText[];
  trustCues?: LocalizedText[];
  isCareU?: boolean;
  typeLabel?: LocalizedText;
};

export type ReviewSummary = {
  averageRating: number;
  reviewCount: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ResolvedReview = {
  id: string;
  rating: number;
  title?: LocalizedText;
  body: LocalizedText;
  createdAtLabel: string;
  authorLabel: LocalizedText;
  status: "published";
};

export type CrossSellGroupKey =
  | "frequently_bought_together"
  | "more_from_shop"
  | "recently_viewed"
  | "related";

export type CrossSellItem = {
  productId: string;
  slug: string;
  href: string;
  title: LocalizedText;
  image: string;
  imageAlt: LocalizedText;
  priceBdt: number;
  compareAtPriceBdt?: number;
  availability: CardAvailability;
  availabilityLabel?: LocalizedText;
  shopLabel: LocalizedText;
  isCareU: boolean;
  badge?: LocalizedText;
};

export type CrossSellGroup = {
  key: CrossSellGroupKey;
  title: LocalizedText;
  items: CrossSellItem[];
  isPrototypeMock?: boolean;
};

export type CrossSellGroups = {
  frequentlyBoughtTogether: CrossSellGroup;
  moreFromShop: CrossSellGroup;
  recentlyViewed: CrossSellGroup;
  related: CrossSellGroup;
};

export type FutureExperiencePlaceholder = {
  id: string;
  label: LocalizedText;
  description: LocalizedText;
  placement?: string;
};

export type PdpBreadcrumbItem = {
  label: LocalizedText;
  href?: string;
};

export type ProductDetailPageResult = {
  slug: string;
  scenario: ProductDetailScenario;
  breadcrumbs: PdpBreadcrumbItem[];
  product: ResolvedProductDetail | null;
  gallery: ProductGalleryItem[];
  variants: ResolvedVariant[];
  selectedVariantId: string | null;
  shop: ResolvedShopContext | null;
  details: {
    description: LocalizedText | null;
    highlights: LocalizedText[];
    specifications: { label: LocalizedText; value: LocalizedText }[];
  };
  reviewSummary: ReviewSummary | null;
  reviews: ResolvedReview[];
  crossSell: CrossSellGroups;
  futureExperience: FutureExperiencePlaceholder;
  notFound: boolean;
};

export type ProductDetailQuery = {
  variant?: string;
  scenario?: string;
};
