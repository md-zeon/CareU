import { mockBrands, mockCategories, mockListings, mockProducts, mockVariants } from "../catalog";
import { mockPersonas } from "../identity";
import { mockShops } from "../shops";
import { mockReviews } from "../trust";
import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, resolveScenario, scenarioError } from "../types";
import type {
  CrossSellGroup,
  CrossSellGroups,
  CrossSellItem,
  FutureExperiencePlaceholder,
  PdpBreadcrumbItem,
  ProductDetailPageResult,
  ProductDetailScenario,
  ProductGalleryItem,
  ResolvedProductDetail,
  ResolvedReview,
  ResolvedShopContext,
  ResolvedVariant,
  ReviewSummary,
} from "./types";

export * from "./types";

const FALLBACK_IMAGE = "/products/product-1.svg";

function isScenario(value: string | undefined): value is ProductDetailScenario {
  return value === "default" || value === "empty" || value === "loading" || value === "error" || value === "success";
}

export function parsePdpScenario(
  searchParams: { [key: string]: string | string[] | undefined } | URLSearchParams,
): ProductDetailScenario | undefined {
  const sp = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams();
  if (!(searchParams instanceof URLSearchParams)) {
    for (const [k, v] of Object.entries(searchParams)) {
      if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
      else if (v != null) sp.set(k, v);
    }
  }
  const raw = sp.get("scenario") ?? undefined;
  return isScenario(raw) ? raw : undefined;
}

function getParam(
  searchParams: { [key: string]: string | string[] | undefined } | URLSearchParams,
  key: string,
): string | undefined {
  if (searchParams instanceof URLSearchParams) return searchParams.get(key) ?? undefined;
  const v = searchParams[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

function formatReviewDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function buildBreadcrumbs(product: {
  title: { en: string; bn: string };
  category?: { id: string; slug?: string; label: { en: string; bn: string } } | null;
}): PdpBreadcrumbItem[] {
  const items: PdpBreadcrumbItem[] = [{ label: l("Home", "হোম"), href: "/" }];
  if (product.category?.slug) {
    items.push({ label: product.category.label, href: `/category/${product.category.slug}` });
  } else {
    items.push({ label: l("Products", "পণ্য"), href: "/search" });
  }
  items.push({ label: product.title });
  return items;
}

function resolveRepresentativeListing(productId: string) {
  const candidates = mockListings
    .filter(
      (listing) =>
        listing.productId === productId &&
        listing.visible &&
        listing.status === "active" &&
        listing.moderationState === "approved",
    )
    .map((listing) => {
      const shop = mockShops.find((s) => s.id === listing.shopId);
      if (!shop || shop.status === "suspended") return null;
      const variant =
        (listing.variantId ? mockVariants.find((v) => v.id === listing.variantId && v.productId === productId) : null) ??
        mockVariants.find((v) => v.productId === productId);
      if (!variant) return null;
      return { listing, shop, variant };
    })
    .filter((v): v is NonNullable<typeof v> => v != null)
    .sort((a, b) => {
      const aCareu = a.shop.type === "careu" ? 0 : 1;
      const bCareu = b.shop.type === "careu" ? 0 : 1;
      if (aCareu !== bCareu) return aCareu - bCareu;
      return a.variant.priceBdt - b.variant.priceBdt;
    });
  return candidates[0] ?? null;
}

function resolveShopContext(productId: string): ResolvedShopContext | null {
  const rep = resolveRepresentativeListing(productId);
  if (!rep) return null;
  const isCareU = rep.shop.type === "careu";
  const badges = [
    isCareU ? l("CareU shop", "কেয়ারইউ দোকান") : l("Marketplace seller", "মার্কেটপ্লেস বিক্রেতা"),
  ];
  const trustCues = [
    isCareU
      ? l("Sold and fulfilled context shown for prototype review", "প্রোটোটাইপ রিভিউর জন্য বিক্রয় ও ফালফিলমেন্ট প্রেক্ষাপট দেখানো হয়েছে")
      : l("Independent seller shop in this prototype", "এই প্রোটোটাইপে স্বাধীন বিক্রেতা দোকান"),
  ];
  return {
    shopId: rep.shop.id,
    label: rep.shop.name,
    slug: rep.shop.slug,
    href: `/search?shop=${encodeURIComponent(rep.shop.id)}`,
    badges,
    trustCues,
    isCareU,
    typeLabel: isCareU ? l("CareU", "কেয়ারইউ") : l("Seller", "বিক্রেতা"),
  };
}

function resolveVariants(productId: string): ResolvedVariant[] {
  return mockVariants
    .filter((v) => v.productId === productId)
    .map((v) => ({
      id: v.id,
      productId: v.productId,
      title: v.title,
      sku: v.sku,
      options: v.options,
      priceBdt: v.priceBdt,
      compareAtPriceBdt: v.compareAtPriceBdt,
      availability: v.availability,
      stockStateLabel: v.stockStateLabel,
      isSelectable: true,
    }));
}

function resolveDefaultVariantId(productId: string, variants: ResolvedVariant[]): string | null {
  if (variants.length === 0) return null;
  const rep = resolveRepresentativeListing(productId);
  if (rep && variants.some((v) => v.id === rep.variant.id)) return rep.variant.id;
  const inStock = variants.find((v) => v.availability === "in_stock");
  return (inStock ?? variants[0]).id;
}

function resolveSelectedVariantId(
  requested: string | undefined,
  productId: string,
  variants: ResolvedVariant[],
): string | null {
  if (!requested) return resolveDefaultVariantId(productId, variants);
  return variants.some((v) => v.id === requested)
    ? requested
    : resolveDefaultVariantId(productId, variants);
}

function buildGallery(
  product: { title: { en: string; bn: string }; images: string[] },
  selectedVariantId: string | null,
): ProductGalleryItem[] {
  const imgs = product.images.length > 0 ? product.images : [FALLBACK_IMAGE];
  return imgs.map((src, i) => ({
    id: `img-${i}`,
    src,
    alt: l(
      `${product.title.en} image ${i + 1}`,
      `${product.title.bn} ছবি ${i + 1}`,
    ),
    order: i,
    isPrimary: i === 0,
    variantId: i === 0 ? selectedVariantId ?? undefined : undefined,
  }));
}

function buildReviewSummary(reviews: ResolvedReview[]): ReviewSummary | null {
  if (reviews.length === 0) return null;
  const breakdown: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[rating] += 1;
    sum += r.rating;
  }
  const averageRating = Math.round((sum / reviews.length) * 10) / 10;
  return { averageRating, reviewCount: reviews.length, breakdown };
}

function resolvePublishedReviews(productId: string): ResolvedReview[] {
  return mockReviews
    .filter((r) => r.productId === productId && r.status === "published")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((r) => {
      const persona = mockPersonas.find((p) => p.id === r.authorPersonaId);
      const authorLabel =
        persona?.kind === "customer"
          ? l("Verified customer", "যাচাইকৃত ক্রেতা")
          : l("Customer", "ক্রেতা");
      return {
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAtLabel: formatReviewDateLabel(r.createdAt),
        authorLabel,
        status: "published" as const,
      };
    });
}

function resolveCrossSellItem(productId: string): CrossSellItem | null {
  const product = mockProducts.find((p) => p.id === productId && p.status === "active");
  if (!product) return null;
  const rep = resolveRepresentativeListing(product.id);
  if (!rep) return null;
  return {
    productId: product.id,
    slug: product.slug,
    href: `/product/${product.slug}`,
    title: product.title,
    image: product.images[0] ?? FALLBACK_IMAGE,
    imageAlt: product.title,
    priceBdt: rep.variant.priceBdt,
    compareAtPriceBdt: rep.variant.compareAtPriceBdt,
    availability: rep.variant.availability,
    availabilityLabel: rep.variant.stockStateLabel,
    shopLabel: rep.shop.name,
    isCareU: rep.shop.type === "careu",
    badge: rep.variant.availability === "low_stock" ? l("Low stock", "স্টক কম") : undefined,
  };
}

function dedupeItems(items: (CrossSellItem | null)[], excludeId: string, max: number): CrossSellItem[] {
  const seen = new Set<string>([excludeId]);
  const out: CrossSellItem[] = [];
  for (const item of items) {
    if (!item) continue;
    if (seen.has(item.productId)) continue;
    seen.add(item.productId);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

function buildFrequentlyBoughtTogether(product: { id: string; frequentlyBoughtTogetherProductIds?: string[] }): CrossSellGroup {
  const explicit = (product.frequentlyBoughtTogetherProductIds ?? []).map(resolveCrossSellItem);
  const fallback = mockProducts
    .filter((p) => p.id !== product.id && p.status === "active")
    .map((p) => resolveCrossSellItem(p.id));
  const items = dedupeItems([...explicit, ...fallback], product.id, 4);
  return {
    key: "frequently_bought_together",
    title: l("Frequently bought together", "একসাথে প্রায়ই কেনা হয়"),
    items,
  };
}

function buildMoreFromShop(productId: string, shopId: string | null): CrossSellGroup {
  const items = dedupeItems(
    mockProducts
      .filter((p) => p.id !== productId && p.primaryShopId === shopId && p.status === "active")
      .map((p) => resolveCrossSellItem(p.id)),
    productId,
    4,
  );
  return {
    key: "more_from_shop",
    title: l("More from this shop", "এই দোকান থেকে আরও"),
    items,
  };
}

function buildRelatedProducts(product: { id: string; categoryId: string; brandId?: string }): CrossSellGroup {
  const sameCategory = mockProducts
    .filter((p) => p.id !== product.id && p.status === "active" && p.categoryId === product.categoryId)
    .map((p) => resolveCrossSellItem(p.id));
  const sameBrand = mockProducts
    .filter(
      (p) =>
        p.id !== product.id &&
        p.status === "active" &&
        !!product.brandId &&
        p.brandId === product.brandId,
    )
    .map((p) => resolveCrossSellItem(p.id));
  const items = dedupeItems([...sameCategory, ...sameBrand], product.id, 4);
  return {
    key: "related",
    title: l("Related products", "সম্পর্কিত পণ্য"),
    items,
  };
}

function buildRecentlyViewedFallback(productId: string): CrossSellGroup {
  const fallbackOrder = [
    "prod-vivo-y28",
    "prod-fast-charger",
    "prod-laptop",
    "prod-cotton-shirt",
    "prod-cookware",
    "prod-cleanser",
  ];
  const items = dedupeItems(
    fallbackOrder
      .filter((id) => id !== productId)
      .map((id) => resolveCrossSellItem(id)),
    productId,
    4,
  );
  return {
    key: "recently_viewed",
    title: l("Recently viewed", "সম্প্রতি দেখা"),
    items,
    isPrototypeMock: true,
  };
}

function buildCrossSellGroups(product: {
  id: string;
  categoryId: string;
  brandId?: string;
  primaryShopId?: string;
  frequentlyBoughtTogetherProductIds?: string[];
}): CrossSellGroups {
  return {
    frequentlyBoughtTogether: buildFrequentlyBoughtTogether(product),
    moreFromShop: buildMoreFromShop(product.id, product.primaryShopId ?? null),
    recentlyViewed: buildRecentlyViewedFallback(product.id),
    related: buildRelatedProducts(product),
  };
}

function buildFutureExperience(): FutureExperiencePlaceholder {
  return {
    id: "future-experience",
    label: l("Future experiences", "ভবিষ্যৎ অভিজ্ঞতা"),
    description: l(
      "This space is reserved for future supported experiences such as richer media or tryout features. It is a prototype placeholder only.",
      "সমৃদ্ধ মিডিয়া বা ট্রাইআউট ফিচারের মতো ভবিষ্যৎ সমর্থিত অভিজ্ঞতার জন্য এই জায়গা রাখা হয়েছে। এটি শুধু একটি প্রোটোটাইপ প্লেসহোল্ডার।",
    ),
    placement: "below-cross-sell",
  };
}

function notFoundResult(slug: string, scenario: ProductDetailScenario): ProductDetailPageResult {
  return {
    slug,
    scenario,
    breadcrumbs: [{ label: l("Home", "হোম"), href: "/" }, { label: l("Product", "পণ্য") }],
    product: null,
    gallery: [{ id: "fallback", src: FALLBACK_IMAGE, alt: l("Product image unavailable", "পণ্যের ছবি নেই"), order: 0, isPrimary: true }],
    variants: [],
    selectedVariantId: null,
    shop: null,
    details: { description: null, highlights: [], specifications: [] },
    reviewSummary: null,
    reviews: [],
    crossSell: {
      frequentlyBoughtTogether: { key: "frequently_bought_together", title: l("Frequently bought together", "একসাথে প্রায়ই কেনা হয়"), items: [] },
      moreFromShop: { key: "more_from_shop", title: l("More from this shop", "এই দোকান থেকে আরও"), items: [] },
      recentlyViewed: { key: "recently_viewed", title: l("Recently viewed", "সম্প্রতি দেখা"), items: [], isPrototypeMock: true },
      related: { key: "related", title: l("Related products", "সম্পর্কিত পণ্য"), items: [] },
    },
    futureExperience: buildFutureExperience(),
    notFound: true,
  };
}

export function getProductDetailPageResult(
  slug: string,
  searchParams: { [key: string]: string | string[] | undefined } | URLSearchParams = {},
  options?: ScenarioOptions,
): ScenarioResult<ProductDetailPageResult> {
  const scenarioFromParam = parsePdpScenario(searchParams);
  const resolved = scenarioFromParam ?? resolveScenario(options);
  const scenario: ProductDetailScenario = isScenario(resolved) ? resolved : "default";

  if (scenario === "loading") {
    return { scenario: "loading", data: null };
  }
  if (scenario === "error") {
    return {
      scenario: "error",
      data: null,
      message: scenarioError(
        "Could not load this product right now.",
        "এখন এই পণ্যটি লোড করা যাচ্ছে না।",
      ),
    };
  }

  const product = mockProducts.find((p) => p.slug === slug && p.status !== "archived");
  if (!product) {
    return {
      scenario: scenario === "empty" ? "empty" : "default",
      data: notFoundResult(slug, scenario === "success" ? "default" : "default"),
    };
  }

  const brand = product.brandId ? mockBrands.find((b) => b.id === product.brandId) : undefined;
  const category = mockCategories.find((c) => c.id === product.categoryId);
  const resolvedDetail: ResolvedProductDetail = {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    brand: brand ? { id: brand.id, slug: brand.slug, label: brand.name } : undefined,
    category: category ? { id: category.id, slug: category.slug, label: category.name } : undefined,
    rating: product.rating,
    reviewCount: product.reviewCount,
    badges: [],
    highlights: product.highlights ?? [],
    specifications: product.specifications ?? [],
  };

  const variants = resolveVariants(product.id);
  const requestedVariant = getParam(searchParams, "variant");
  const selectedVariantId = resolveSelectedVariantId(requestedVariant, product.id, variants);
  const gallery = buildGallery(product, selectedVariantId);
  const shop = resolveShopContext(product.id);
  const publishedReviews = resolvePublishedReviews(product.id);
  const reviewSummary = buildReviewSummary(publishedReviews);
  const crossSell = buildCrossSellGroups(product);

  if (scenario === "empty") {
    const emptyData: ProductDetailPageResult = {
      slug,
      scenario: "empty",
      breadcrumbs: buildBreadcrumbs({ title: product.title, category: resolvedDetail.category }),
      product: resolvedDetail,
      gallery,
      variants,
      selectedVariantId,
      shop,
      details: { description: product.description, highlights: [], specifications: [] },
      reviewSummary: null,
      reviews: [],
      crossSell: {
        frequentlyBoughtTogether: { ...crossSell.frequentlyBoughtTogether, items: [] },
        moreFromShop: { ...crossSell.moreFromShop, items: [] },
        recentlyViewed: { ...crossSell.recentlyViewed, items: [] },
        related: { ...crossSell.related, items: [] },
      },
      futureExperience: buildFutureExperience(),
      notFound: false,
    };
    return { scenario: "empty", data: emptyData };
  }

  const data: ProductDetailPageResult = {
    slug,
    scenario: "default",
    breadcrumbs: buildBreadcrumbs({ title: product.title, category: resolvedDetail.category }),
    product: resolvedDetail,
    gallery,
    variants,
    selectedVariantId,
    shop,
    details: {
      description: product.description,
      highlights: product.highlights ?? [],
      specifications: product.specifications ?? [],
    },
    reviewSummary,
    reviews: publishedReviews,
    crossSell,
    futureExperience: buildFutureExperience(),
    notFound: false,
  };

  if (scenario === "success") {
    return { scenario: "success", data };
  }
  return { scenario: "default", data };
}

export function getRecentlyViewedItems(ids: string[], excludeId?: string, max = 4): CrossSellItem[] {
  return dedupeItems(
    ids.map((id) => resolveCrossSellItem(id)),
    excludeId ?? "",
    max,
  );
}
