import type { LocalizedText } from "../types";
import type { MockBrand, MockCategory } from "../catalog/types";
import type { MockShop } from "../shops/types";

export type HomeHeroCta = {
  label: LocalizedText;
  href: string;
};

export type HomeHero = {
  id: string;
  eyebrow?: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  primaryCta: HomeHeroCta;
  secondaryCta?: HomeHeroCta;
  image: string;
  imageAlt?: LocalizedText;
  badge?: LocalizedText;
  align?: "left" | "center";
  theme?: "light" | "dark";
  campaignId?: string;
};

export type HomeTrustItem = {
  id: string;
  icon: "truck" | "shield" | "badge-check" | "headset" | "store";
  title: LocalizedText;
  description?: LocalizedText;
};

export type HomeCampaign = {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
  image: string;
  imageAlt?: LocalizedText;
  ctaLabel: LocalizedText;
  href: string;
  badge?: LocalizedText;
  tag?: LocalizedText;
  tone?: "neutral" | "warm" | "cool" | "accent";
  startsAtLabel?: LocalizedText;
  endsAtLabel?: LocalizedText;
};

export type HomeEditorial = {
  id: string;
  eyebrow?: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
  image: string;
  imageAlt?: LocalizedText;
  ctaLabel?: LocalizedText;
  href?: string;
  author?: LocalizedText;
  sourceLabel?: LocalizedText;
};

export type HomeClosingLink = {
  id: string;
  label: LocalizedText;
  description?: LocalizedText;
  href: string;
  icon?: "search" | "sparkles" | "store" | "heart" | "user" | "tag";
};

export type HomeClosingBlock = {
  title?: LocalizedText;
  description?: LocalizedText;
  links: HomeClosingLink[];
};

export type HomeFeaturedCategory = MockCategory & {
  href: string;
};

export type HomeFeaturedProduct = {
  id: string;
  slug: string;
  href: string;
  title: LocalizedText;
  description: LocalizedText;
  image: string;
  imageAlt: LocalizedText;
  priceBdt: number;
  compareAtPriceBdt?: number;
  rating?: number;
  reviewCount?: number;
  availability: "in_stock" | "low_stock" | "out_of_stock";
  stockStateLabel?: LocalizedText;
  shop: {
    id: string;
    slug: string;
    name: LocalizedText;
    type: MockShop["type"];
  };
  brand?: {
    id: string;
    slug: string;
    name: LocalizedText;
  };
  variantTitle?: LocalizedText;
};

export type HomeFeaturedBrand = MockBrand & {
  href: string;
  productCountLabel?: LocalizedText;
};

export type HomeDiscoveryPayload = {
  hero: HomeHero | null;
  trustItems: HomeTrustItem[];
  featuredCategories: HomeFeaturedCategory[];
  campaigns: HomeCampaign[];
  featuredProducts: HomeFeaturedProduct[];
  featuredBrands: HomeFeaturedBrand[];
  editorial: HomeEditorial | null;
  closingLinks: HomeClosingBlock;
};
