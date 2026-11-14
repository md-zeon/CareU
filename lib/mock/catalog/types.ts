import type { LocalizedText } from "../types";

export type MockCategory = {
  id: string;
  slug: string;
  name: LocalizedText;
  parentId: string | null;
  image?: string;
  sortOrder: number;
  description?: LocalizedText;
};

export type MockBrand = {
  id: string;
  slug: string;
  name: LocalizedText;
  logo?: string;
};

export type MockProduct = {
  id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  categoryId: string;
  brandId?: string;
  primaryShopId?: string;
  images: string[];
  rating?: number;
  reviewCount?: number;
  status: "active" | "draft" | "archived";
};

export type MockProductVariant = {
  id: string;
  productId: string;
  sku: string;
  title: LocalizedText;
  options?: Record<string, LocalizedText | string>;
  priceBdt: number;
  compareAtPriceBdt?: number;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  stockStateLabel?: LocalizedText;
};

export type MockListing = {
  id: string;
  shopId: string;
  productId: string;
  variantId?: string;
  status: "active" | "pending" | "paused" | "rejected";
  moderationState: "approved" | "pending_review" | "rejected";
  priceBdt: number;
  compareAtPriceBdt?: number;
  visible: boolean;
};

export type MockMenuColumn = {
  title: LocalizedText;
  links: {
    label: LocalizedText;
    href: string;
    badge?: LocalizedText | null;
  }[];
};

export type MockMenuCategory = {
  id: string;
  slug: string;
  parentId: string | null;
  sortOrder: number;
  label: LocalizedText;
  href: string;
  columns?: MockMenuColumn[];
  products?: {
    id: string;
    slug: string;
    title: LocalizedText;
    image: string;
    price: number;
    compareAtPrice?: number;
    badge?: LocalizedText | null;
  }[];
};
