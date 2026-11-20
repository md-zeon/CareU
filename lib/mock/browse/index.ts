import { mockBrands, mockCategories, mockListings, mockProducts, mockVariants } from "../catalog";
import { mockShops } from "../shops";
import type { LocalizedText, ScenarioOptions, ScenarioResult } from "../types";
import { l, resolveScenario, scenarioError, withScenario } from "../types";
import type {
  BreadcrumbItem,
  BrowsePageResult,
  BrowseQueryState,
  BrowseSortKey,
  BrowseSurface,
  CardAvailability,
  FacetDefinition,
  FacetOption,
  MockCollection,
  ResolvedProductCard,
  SearchSuggestion,
  SortOption,
} from "./types";

export * from "./types";

export const BROWSE_PAGE_SIZE = 12;

const badgeNew = l("New", "নতুন");
const badgeBest = l("Best seller", "বেস্ট সেলার");
const badgeOffer = l("Offer", "অফার");
const badgeCareU = l("CareU", "কেয়ারইউ");

export const mockCollections: MockCollection[] = [
  {
    id: "col-everyday-tech",
    slug: "everyday-tech-picks",
    title: l("Everyday tech picks", "দৈনন্দিন টেক পছন্দ"),
    description: l(
      "Phones, chargers, and practical devices for daily use with clear prices in BDT.",
      "দৈনন্দিন ব্যবহারের জন্য ফোন, চার্জার এবং প্রয়োজনীয় ডিভাইস, পরিষ্কার বিডিটি মূল্যে।",
    ),
    eyebrow: l("Curated collection", "নির্বাচিত কালেকশন"),
    badge: l("Featured", "ফিচার্ড"),
    image: "/products/product-1.svg",
    imageAlt: l("Everyday tech products", "দৈনন্দিন টেক পণ্য"),
    productIds: ["prod-vivo-y28", "prod-fast-charger", "prod-laptop", "prod-cleanser"],
    highlightCategoryIds: ["cat-mobile", "cat-electronics"],
    highlightBrandIds: ["brand-vivo", "brand-caru"],
    visible: true,
    sortOrder: 1,
  },
  {
    id: "col-home-refresh",
    slug: "home-refresh",
    title: l("Home refresh", "ঘর সাজানোর নতুনত্ব"),
    description: l(
      "Kitchen and living essentials from trusted marketplace shops.",
      "বিশ্বস্ত মার্কেটপ্লেস দোকান থেকে রান্নাঘর ও জীবনযাপনের প্রয়োজনীয় সামগ্রী।",
    ),
    eyebrow: l("Curated collection", "নির্বাচিত কালেকশন"),
    badge: l("Home", "হোম"),
    image: "/products/product-2.svg",
    imageAlt: l("Home and living essentials", "ঘর ও জীবনযাপনের প্রয়োজনীয় সামগ্রী"),
    productIds: ["prod-cookware", "prod-cleanser", "prod-fast-charger"],
    highlightCategoryIds: ["cat-home", "cat-beauty"],
    highlightBrandIds: ["brand-home", "brand-caru"],
    visible: true,
    sortOrder: 2,
  },
  {
    id: "col-style-edit",
    slug: "style-edit",
    title: l("Style edit", "স্টাইল এডিট"),
    description: l(
      "Simple fashion finds for everyday wear from marketplace sellers.",
      "মার্কেটপ্লেস বিক্রেতাদের কাছ থেকে দৈনন্দিন পরার সহজ ফ্যাশন পছন্দ।",
    ),
    eyebrow: l("Curated collection", "নির্বাচিত কালেকশন"),
    badge: l("Fashion", "ফ্যাশন"),
    image: "/products/product-3.svg",
    imageAlt: l("Fashion highlights", "ফ্যাশন হাইলাইট"),
    productIds: ["prod-cotton-shirt", "prod-vivo-y28"],
    highlightCategoryIds: ["cat-fashion"],
    highlightBrandIds: ["brand-urban"],
    visible: true,
    sortOrder: 3,
  },
];

const deterministicMeta: Record<string, { featuredRank: number; isNew?: boolean; isBestSeller?: boolean; createdAtRank: number }> = {
  "prod-vivo-y28": { featuredRank: 1, isNew: true, isBestSeller: true, createdAtRank: 6 },
  "prod-fast-charger": { featuredRank: 2, isNew: true, createdAtRank: 5 },
  "prod-laptop": { featuredRank: 3, isBestSeller: true, createdAtRank: 4 },
  "prod-cotton-shirt": { featuredRank: 4, createdAtRank: 3 },
  "prod-cookware": { featuredRank: 5, isBestSeller: true, createdAtRank: 2 },
  "prod-cleanser": { featuredRank: 6, isNew: true, createdAtRank: 1 },
};

function textIncludes(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function matchesLocalizedQuery(text: LocalizedText | undefined, q: string) {
  if (!text) return false;
  return textIncludes(text.en, q) || textIncludes(text.bn, q);
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function parseIntSafe(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : value.split(",");
  return unique(arr.map((v) => v.trim()).filter(Boolean));
}

function parseAttributes(params: URLSearchParams): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, value] of params.entries()) {
    if (!key.startsWith("attr_")) continue;
    const attr = key.slice(5).trim();
    if (!attr) continue;
    const values = value.split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) continue;
    out[attr] = unique([...(out[attr] ?? []), ...values]);
  }
  return out;
}

export function getSearchParamsObject(searchParams: { [key: string]: string | string[] | undefined } | URLSearchParams): URLSearchParams {
  if (searchParams instanceof URLSearchParams) return searchParams;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (Array.isArray(v)) {
      for (const item of v) sp.append(k, item);
    } else if (v != null) {
      sp.set(k, v);
    }
  }
  return sp;
}

const sortKeys: BrowseSortKey[] = ["relevance", "featured", "price-asc", "price-desc", "newest", "rating", "best-selling"];

export function normalizeSort(raw: string | undefined, surface: BrowseSurface): BrowseSortKey {
  const key = (raw ?? "").trim() as BrowseSortKey;
  const allowed = sortKeys.includes(key) ? key : undefined;
  if (allowed) {
    if (surface === "search") return allowed;
    if (allowed === "relevance") return "featured";
    return allowed;
  }
  return surface === "search" ? "relevance" : "featured";
}

export function parseBrowseQueryState(
  searchParams: { [key: string]: string | string[] | undefined } | URLSearchParams,
  surface: BrowseSurface,
): BrowseQueryState {
  const sp = getSearchParamsObject(searchParams);
  const q = (sp.get("q") ?? "").trim() || undefined;
  const pageRaw = parseIntSafe(sp.get("page") ?? undefined);
  const page = pageRaw && pageRaw > 0 ? pageRaw : 1;
  const minPriceRaw = parseIntSafe(sp.get("minPrice") ?? undefined);
  const maxPriceRaw = parseIntSafe(sp.get("maxPrice") ?? undefined);
  const minPrice = minPriceRaw != null && minPriceRaw >= 0 ? minPriceRaw : undefined;
  const maxPrice = maxPriceRaw != null && maxPriceRaw >= 0 ? maxPriceRaw : undefined;
  const ratingRaw = parseIntSafe(sp.get("rating") ?? undefined);
  const rating = ratingRaw != null && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : undefined;
  const availability = parseList(sp.get("availability") ?? undefined).filter(
    (v): v is CardAvailability => v === "in_stock" || v === "low_stock" || v === "out_of_stock",
  );

  return {
    q,
    page,
    sort: normalizeSort(sp.get("sort") ?? undefined, surface),
    category: parseList(sp.get("category") ?? undefined),
    brand: parseList(sp.get("brand") ?? undefined),
    shop: parseList(sp.get("shop") ?? undefined),
    availability: unique(availability),
    minPrice,
    maxPrice,
    rating,
    badges: parseList(sp.get("badges") ?? undefined),
    attributes: parseAttributes(sp),
  };
}

function getShopById(shopId: string) {
  return mockShops.find((s) => s.id === shopId);
}

function getBrandById(brandId: string | undefined) {
  return brandId ? mockBrands.find((b) => b.id === brandId) : undefined;
}

function getCategoryById(categoryId: string) {
  return mockCategories.find((c) => c.id === categoryId);
}

export function getCollectionBySlug(slug: string): MockCollection | null {
  return mockCollections.find((c) => c.slug === slug && c.visible) ?? null;
}

export function resolveAllProductCards(): ResolvedProductCard[] {
  const cards: ResolvedProductCard[] = [];
  for (const product of mockProducts) {
    if (product.status !== "active") continue;
    const candidates = mockListings.filter(
      (listing) =>
        listing.productId === product.id &&
        listing.visible &&
        listing.status === "active" &&
        listing.moderationState === "approved",
    );
    const resolvedCandidates = candidates
      .map((listing) => {
        const shop = getShopById(listing.shopId);
        if (!shop || shop.status === "suspended") return null;
        const variant =
          (listing.variantId ? mockVariants.find((v) => v.id === listing.variantId && v.productId === product.id) : null) ??
          mockVariants.find((v) => v.productId === product.id);
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
    const chosen = resolvedCandidates[0];
    if (!chosen) continue;

    const brand = getBrandById(product.brandId);
    const meta = deterministicMeta[product.id];
    const hasOffer =
      typeof chosen.listing.compareAtPriceBdt === "number" && chosen.listing.compareAtPriceBdt > chosen.listing.priceBdt;
    const badges: LocalizedText[] = [];
    if (meta?.isNew) badges.push(badgeNew);
    if (meta?.isBestSeller) badges.push(badgeBest);
    if (hasOffer) badges.push(badgeOffer);
    if (chosen.shop.type === "careu") badges.push(badgeCareU);

    cards.push({
      productId: product.id,
      slug: product.slug,
      href: `/product/${product.slug}`,
      image: product.images[0] ?? "/products/product-1.svg",
      imageAlt: product.title,
      title: product.title,
      brandId: brand?.id,
      brandLabel: brand?.name,
      priceBdt: chosen.listing.priceBdt,
      compareAtPriceBdt: chosen.listing.compareAtPriceBdt,
      availability: chosen.variant.availability,
      availabilityLabel: chosen.variant.stockStateLabel,
      rating: product.rating,
      reviewCount: product.reviewCount,
      shopId: chosen.shop.id,
      shopLabel: chosen.shop.name,
      shopType: chosen.shop.type,
      badges,
      variantId: chosen.variant.id,
      listingId: chosen.listing.id,
      isNew: meta?.isNew,
      isBestSeller: meta?.isBestSeller,
      featuredRank: meta?.featuredRank,
      categoryId: product.categoryId,
      createdAtRank: meta?.createdAtRank,
      hasOffer,
    });
  }
  return cards;
}

function getAttributePairs(card: ResolvedProductCard): { key: string; value: string }[] {
  const variant = card.variantId ? mockVariants.find((v) => v.id === card.variantId) : undefined;
  if (!variant?.options) return [];
  const pairs: { key: string; value: string }[] = [];
  for (const [key, raw] of Object.entries(variant.options)) {
    const value = typeof raw === "string" ? raw : raw.en;
    pairs.push({ key, value });
  }
  return pairs;
}

function applyFilters(cards: ResolvedProductCard[], state: BrowseQueryState): ResolvedProductCard[] {
  return cards.filter((card) => {
    if (state.category.length > 0 && !state.category.includes(card.categoryId)) return false;
    if (state.brand.length > 0 && (!card.brandId || !state.brand.includes(card.brandId))) return false;
    if (state.shop.length > 0 && !state.shop.includes(card.shopId)) return false;
    if (state.availability.length > 0 && !state.availability.includes(card.availability)) return false;
    if (state.minPrice != null && card.priceBdt < state.minPrice) return false;
    if (state.maxPrice != null && card.priceBdt > state.maxPrice) return false;
    if (state.rating != null && (card.rating ?? 0) < state.rating) return false;
    if (state.badges.length > 0) {
      const hasOffer = state.badges.includes("offer") ? card.hasOffer : true;
      const hasNew = state.badges.includes("new") ? card.isNew : true;
      const hasBest = state.badges.includes("best_seller") ? card.isBestSeller : true;
      const hasCareu = state.badges.includes("careu") ? card.shopType === "careu" : true;
      if (!(hasOffer && hasNew && hasBest && hasCareu)) return false;
    }
    for (const [attrKey, attrValues] of Object.entries(state.attributes)) {
      if (attrValues.length === 0) continue;
      const pairs = getAttributePairs(card).filter((p) => p.key === attrKey);
      if (pairs.length === 0) return false;
      if (!pairs.some((p) => attrValues.includes(p.value))) return false;
    }
    return true;
  });
}

function relevanceScore(card: ResolvedProductCard, q: string): number {
  const query = q.toLowerCase();
  let score = 0;
  if (textIncludes(card.title.en, query)) score += 5;
  if (textIncludes(card.title.bn, query)) score += 5;
  if (card.brandLabel && (textIncludes(card.brandLabel.en, query) || textIncludes(card.brandLabel.bn, query))) score += 3;
  const cat = getCategoryById(card.categoryId);
  if (cat && (textIncludes(cat.name.en, query) || textIncludes(cat.name.bn, query))) score += 2;
  if (textIncludes(card.shopLabel.en, query) || textIncludes(card.shopLabel.bn, query)) score += 1;
  return score;
}

function sortCards(cards: ResolvedProductCard[], state: BrowseQueryState, surface: BrowseSurface, collection?: MockCollection): ResolvedProductCard[] {
  const out = [...cards];
  const sort = state.sort;
  if (sort === "relevance" && surface === "search" && state.q) {
    const q = state.q;
    out.sort((a, b) => {
      const sa = relevanceScore(a, q);
      const sb = relevanceScore(b, q);
      if (sb !== sa) return sb - sa;
      return (a.featuredRank ?? 999) - (b.featuredRank ?? 999);
    });
    return out;
  }
  if (sort === "price-asc") {
    out.sort((a, b) => a.priceBdt - b.priceBdt || (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
    return out;
  }
  if (sort === "price-desc") {
    out.sort((a, b) => b.priceBdt - a.priceBdt || (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
    return out;
  }
  if (sort === "newest") {
    out.sort((a, b) => (b.createdAtRank ?? 0) - (a.createdAtRank ?? 0) || (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
    return out;
  }
  if (sort === "rating") {
    out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0) || (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
    return out;
  }
  if (sort === "best-selling") {
    out.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
    return out;
  }
  // featured default
  if (collection) {
    const order = new Map(collection.productIds.map((id, i) => [id, i]));
    out.sort((a, b) => (order.get(a.productId) ?? 999) - (order.get(b.productId) ?? 999) || (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
    return out;
  }
  out.sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999));
  return out;
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalCount = items.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalCount,
    page: totalCount === 0 ? 1 : safePage,
    pageCount: totalCount === 0 ? 1 : pageCount,
  };
}

function buildAttributeFacets(cards: ResolvedProductCard[], _state: BrowseQueryState): FacetDefinition[] {
  void _state;
  const valueSets = new Map<string, Map<string, number>>();
  for (const card of cards) {
    for (const pair of getAttributePairs(card)) {
      if (!valueSets.has(pair.key)) valueSets.set(pair.key, new Map());
      const map = valueSets.get(pair.key)!;
      map.set(pair.value, (map.get(pair.value) ?? 0) + 1);
    }
  }
  const defs: FacetDefinition[] = [];
  for (const [key, values] of valueSets.entries()) {
    if (values.size === 0) continue;
    const options: FacetOption[] = Array.from(values.entries()).map(([value, count]) => ({
      value,
      label: l(value, value),
      count,
    }));
    defs.push({
      key: `attr_${key}`,
      label: l(key.charAt(0).toUpperCase() + key.slice(1), key),
      kind: "multi",
      options,
      visible: true,
    });
  }
  // keep deterministic order
  defs.sort((a, b) => a.key.localeCompare(b.key));
  // hide if no supported attributes in current resolved set
  return defs;
}

function buildFacets(
  baseCards: ResolvedProductCard[],
  filteredCards: ResolvedProductCard[],
  surface: BrowseSurface,
  state: BrowseQueryState,
): FacetDefinition[] {
  const brandCounts = new Map<string, number>();
  const shopCounts = new Map<string, number>();
  const availabilityCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  for (const card of filteredCards) {
    if (card.brandId) brandCounts.set(card.brandId, (brandCounts.get(card.brandId) ?? 0) + 1);
    shopCounts.set(card.shopId, (shopCounts.get(card.shopId) ?? 0) + 1);
    availabilityCounts.set(card.availability, (availabilityCounts.get(card.availability) ?? 0) + 1);
    categoryCounts.set(card.categoryId, (categoryCounts.get(card.categoryId) ?? 0) + 1);
  }

  const facets: FacetDefinition[] = [];

  if (surface === "search" || surface === "brand") {
    const catOptions: FacetOption[] = Array.from(categoryCounts.entries())
      .map(([id, count]) => {
        const cat = getCategoryById(id);
        return cat ? { value: id, label: cat.name, count } : null;
      })
      .filter((v): v is NonNullable<typeof v> => v != null);
    if (catOptions.length > 0) {
      facets.push({ key: "category", label: l("Category", "ক্যাটাগরি"), kind: "multi", options: catOptions, visible: true });
    }
  }

  const brandOptions: FacetOption[] = Array.from(brandCounts.entries())
    .map(([id, count]) => {
      const brand = mockBrands.find((b) => b.id === id);
      return brand ? { value: id, label: brand.name, count } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v != null);
  if (brandOptions.length > 0 && surface !== "brand") {
    facets.push({ key: "brand", label: l("Brand", "ব্র্যান্ড"), kind: "multi", options: brandOptions, visible: true });
  }

  const shopOptions: FacetOption[] = Array.from(shopCounts.entries())
    .map(([id, count]) => {
      const shop = getShopById(id);
      return shop ? { value: id, label: shop.name, count } : null;
    })
    .filter((v): v is NonNullable<typeof v> => v != null);
  if (shopOptions.length > 0) {
    facets.push({ key: "shop", label: l("Shop", "দোকান"), kind: "multi", options: shopOptions, visible: true });
  }

  const availabilityOptions: FacetOption[] = (["in_stock", "low_stock", "out_of_stock"] as const)
    .map((v) => {
      const count = availabilityCounts.get(v) ?? 0;
      if (count === 0) return null;
      const label =
        v === "in_stock" ? l("In stock", "স্টক আছে") : v === "low_stock" ? l("Low stock", "স্টক কম") : l("Out of stock", "স্টক নেই");
      return { value: v, label, count };
    })
    .filter((v): v is NonNullable<typeof v> => v != null);
  if (availabilityOptions.length > 0) {
    facets.push({ key: "availability", label: l("Availability", "প্রাপ্যতা"), kind: "multi", options: availabilityOptions, visible: true });
  }

  facets.push({
    key: "price",
    label: l("Price range (BDT)", "মূল্য পরিসর (BDT)"),
    kind: "range",
    visible: true,
    range: { min: 0, step: 100 },
  });

  const ratingOptions: FacetOption[] = [4, 3, 2, 1]
    .map((r) => ({ value: String(r), label: l(`${r}+ stars`, `${r}+ তারা`), count: filteredCards.filter((c) => (c.rating ?? 0) >= r).length }))
    .filter((o) => o.count > 0);
  if (ratingOptions.length > 0) {
    facets.push({ key: "rating", label: l("Rating", "রেটিং"), kind: "single", options: ratingOptions, visible: true });
  }

  const badgeOptions: FacetOption[] = [
    { value: "offer", label: l("Offers", "অফার"), count: filteredCards.filter((c) => c.hasOffer).length },
    { value: "new", label: l("New", "নতুন"), count: filteredCards.filter((c) => c.isNew).length },
    { value: "best_seller", label: l("Best seller", "বেস্ট সেলার"), count: filteredCards.filter((c) => c.isBestSeller).length },
    { value: "careu", label: l("CareU shop", "কেয়ারইউ দোকান"), count: filteredCards.filter((c) => c.shopType === "careu").length },
  ].filter((o) => o.count > 0);
  if (badgeOptions.length > 0) {
    facets.push({ key: "badges", label: l("Badges & offers", "ব্যাজ ও অফার"), kind: "multi", options: badgeOptions, visible: true });
  }

  const attrFacets = buildAttributeFacets(filteredCards, state);
  facets.push(...attrFacets);

  return facets;
}

export function getSortOptions(surface: BrowseSurface): SortOption[] {
  const all: SortOption[] = [
    { key: "relevance", label: l("Relevance", "প্রাসঙ্গিকতা"), appliesTo: "search", isDefault: surface === "search" },
    { key: "featured", label: l("Featured", "ফিচার্ড"), appliesTo: "both", isDefault: surface !== "search" },
    { key: "price-asc", label: l("Price: low to high", "মূল্য: কম থেকে বেশি"), appliesTo: "both" },
    { key: "price-desc", label: l("Price: high to low", "মূল্য: বেশি থেকে কম"), appliesTo: "both" },
    { key: "newest", label: l("Newest", "নতুন"), appliesTo: "both" },
    { key: "rating", label: l("Rating", "রেটিং"), appliesTo: "both" },
    { key: "best-selling", label: l("Best selling", "বেস্ট সেলিং"), appliesTo: "both" },
  ];
  return all.filter((o) => {
    if (surface === "search") return o.key !== "featured" || true; // allow featured on search too? spec says featured for browse default, relevance for search default
    return o.key !== "relevance";
  });
}

function homeCrumb(): BreadcrumbItem {
  return { label: l("Home", "হোম"), href: "/" };
}

function categoryBreadcrumbs(categorySlug: string): { items: BreadcrumbItem[]; categoryId?: string } | null {
  const cat = mockCategories.find((c) => c.slug === categorySlug);
  if (!cat) return null;
  const items: BreadcrumbItem[] = [homeCrumb(), { label: l("Categories", "ক্যাটাগরি"), href: "/search" }];
  if (cat.parentId) {
    const parent = mockCategories.find((c) => c.id === cat.parentId);
    if (parent) items.push({ label: parent.name, href: `/category/${parent.slug}` });
  }
  items.push({ label: cat.name, href: `/category/${cat.slug}` });
  return { items, categoryId: cat.id };
}

function composeResult(
  surface: BrowseSurface,
  baseCards: ResolvedProductCard[],
  state: BrowseQueryState,
  meta: { breadcrumbs: BreadcrumbItem[]; title: LocalizedText; description?: LocalizedText; heroImage?: string; heroImageAlt?: LocalizedText },
  collection?: MockCollection,
): BrowsePageResult {
  const filtered = applyFilters(baseCards, state);
  const sorted = sortCards(filtered, state, surface, collection);
  const paged = paginate(sorted, state.page, BROWSE_PAGE_SIZE);
  const facets = buildFacets(baseCards, filtered, surface, state);
  return {
    items: paged.items,
    totalCount: paged.totalCount,
    page: paged.page,
    pageCount: paged.pageCount,
    pageSize: BROWSE_PAGE_SIZE,
    facets,
    activeSort: state.sort,
    appliedFilters: { ...state, page: paged.page },
    breadcrumbs: meta.breadcrumbs,
    title: meta.title,
    description: meta.description,
    heroImage: meta.heroImage,
    heroImageAlt: meta.heroImageAlt,
    surface,
  };
}

export function getCategoryBrowseResult(
  slug: string,
  searchParams: { [key: string]: string | string[] | undefined } | URLSearchParams,
  options?: ScenarioOptions,
): ScenarioResult<BrowsePageResult | null> {
  const scenario = resolveScenario(options);
  if (scenario === "loading") return { scenario, data: null };
  if (scenario === "error") return { scenario, data: null, message: scenarioError(l("Could not load this category.", "এই ক্যাটাগরি লোড করা যায়নি।").en, l("Could not load this category.", "এই ক্যাটাগরি লোড করা যায়নি।").bn) };
  const bc = categoryBreadcrumbs(slug);
  if (!bc) return { scenario: "empty", data: null };
  const state = parseBrowseQueryState(searchParams, "category");
  const base = resolveAllProductCards().filter((c) => c.categoryId === bc.categoryId);
  const result = composeResult("category", base, state, {
    breadcrumbs: bc.items,
    title: mockCategories.find((c) => c.slug === slug)!.name,
    description: mockCategories.find((c) => c.slug === slug)?.description,
    heroImage: mockCategories.find((c) => c.slug === slug)?.image,
  });
  if (scenario === "empty") return { scenario, data: { ...result, items: [], totalCount: 0, page: 1, pageCount: 1 } };
  return { scenario, data: result };
}

export function getCollectionBrowseResult(
  slug: string,
  searchParams: { [key: string]: string | string[] | undefined } | URLSearchParams,
  options?: ScenarioOptions,
): ScenarioResult<BrowsePageResult | null> {
  const scenario = resolveScenario(options);
  if (scenario === "loading") return { scenario, data: null };
  if (scenario === "error") return { scenario, data: null, message: scenarioError(l("Could not load this collection.", "এই কালেকশন লোড করা যায়নি।").en, l("Could not load this collection.", "এই কালেকশন লোড করা যায়নি।").bn) };
  const collection = getCollectionBySlug(slug);
  if (!collection) return { scenario: "empty", data: null };
  const state = parseBrowseQueryState(searchParams, "collection");
  const idSet = new Set(collection.productIds);
  const base = resolveAllProductCards().filter((c) => idSet.has(c.productId));
  const result = composeResult(
    "collection",
    base,
    state,
    {
      breadcrumbs: [homeCrumb(), { label: l("Collections", "কালেকশন"), href: "/search" }, { label: collection.title, href: `/collection/${collection.slug}` }],
      title: collection.title,
      description: collection.description,
      heroImage: collection.image,
      heroImageAlt: collection.imageAlt,
    },
    collection,
  );
  if (scenario === "empty") return { scenario, data: { ...result, items: [], totalCount: 0, page: 1, pageCount: 1 } };
  return { scenario, data: result };
}

export function getBrandBrowseResult(
  slug: string,
  searchParams: { [key: string]: string | string[] | undefined } | URLSearchParams,
  options?: ScenarioOptions,
): ScenarioResult<BrowsePageResult | null> {
  const scenario = resolveScenario(options);
  if (scenario === "loading") return { scenario, data: null };
  if (scenario === "error") return { scenario, data: null, message: scenarioError(l("Could not load this brand.", "এই ব্র্যান্ড লোড করা যায়নি।").en, l("Could not load this brand.", "এই ব্র্যান্ড লোড করা যায়নি।").bn) };
  const brand = mockBrands.find((b) => b.slug === slug);
  if (!brand) return { scenario: "empty", data: null };
  const state = parseBrowseQueryState(searchParams, "brand");
  const base = resolveAllProductCards().filter((c) => c.brandId === brand.id);
  const result = composeResult("brand", base, state, {
    breadcrumbs: [homeCrumb(), { label: l("Brands", "ব্র্যান্ড"), href: "/search" }, { label: brand.name, href: `/brand/${brand.slug}` }],
    title: brand.name,
    description: l(`Products from ${brand.name.en} available in this prototype marketplace.`, `এই প্রোটোটাইপ মার্কেটপ্লেসে ${brand.name.bn} এর পণ্য।`),
  });
  if (scenario === "empty") return { scenario, data: { ...result, items: [], totalCount: 0, page: 1, pageCount: 1 } };
  return { scenario, data: result };
}

export function getSearchBrowseResult(
  searchParams: { [key: string]: string | string[] | undefined } | URLSearchParams,
  options?: ScenarioOptions,
): ScenarioResult<BrowsePageResult | "empty_query" | null> {
  const scenario = resolveScenario(options);
  if (scenario === "loading") return { scenario, data: null };
  if (scenario === "error") return { scenario, data: null, message: scenarioError(l("Could not load search results.", "সার্চ ফলাফল লোড করা যায়নি।").en, l("Could not load search results.", "সার্চ ফলাফল লোড করা যায়নি।").bn) };
  const state = parseBrowseQueryState(searchParams, "search");
  const q = state.q?.trim();
  if (!q) return { scenario: "empty", data: "empty_query" };
  const all = resolveAllProductCards();
  const matched = all.filter((card) => {
    const cat = getCategoryById(card.categoryId);
    const collectionMatch = mockCollections.some(
      (col) =>
        col.visible &&
        col.productIds.includes(card.productId) &&
        (matchesLocalizedQuery(col.title, q) || matchesLocalizedQuery(col.description, q)),
    );
    return (
      matchesLocalizedQuery(card.title, q) ||
      (card.brandLabel && matchesLocalizedQuery(card.brandLabel, q)) ||
      (cat && matchesLocalizedQuery(cat.name, q)) ||
      collectionMatch
    );
  });
  const result = composeResult("search", matched, state, {
    breadcrumbs: [homeCrumb(), { label: l(`Search results for "${q}"`, `"${q}" এর সার্চ ফলাফল`) }],
    title: l(`Search results for "${q}"`, `"${q}" এর সার্চ ফলাফল`),
    description: l("Results from mock catalog and listings.", "মক ক্যাটালগ ও লিস্টিং থেকে ফলাফল।"),
  });
  if (scenario === "empty") return { scenario, data: { ...result, items: [], totalCount: 0, page: 1, pageCount: 1 } };
  return { scenario, data: result };
}

export function getSearchSuggestions(query: string, limit = 8): SearchSuggestion[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const suggestions: SearchSuggestion[] = [];

  for (const product of resolveAllProductCards()) {
    if (matchesLocalizedQuery(product.title, q)) {
      suggestions.push({
        kind: "product",
        id: product.productId,
        label: product.title,
        secondaryLabel: product.brandLabel ?? product.shopLabel,
        image: product.image,
        href: `/product/${product.slug}`,
      });
    }
  }
  for (const cat of mockCategories) {
    if (matchesLocalizedQuery(cat.name, q) || matchesLocalizedQuery(cat.description, q)) {
      suggestions.push({ kind: "category", id: cat.id, label: cat.name, secondaryLabel: l("Category", "ক্যাটাগরি"), image: cat.image, href: `/category/${cat.slug}` });
    }
  }
  for (const brand of mockBrands) {
    if (matchesLocalizedQuery(brand.name, q)) {
      suggestions.push({ kind: "brand", id: brand.id, label: brand.name, secondaryLabel: l("Brand", "ব্র্যান্ড"), href: `/brand/${brand.slug}` });
    }
  }
  for (const col of mockCollections) {
    if (!col.visible) continue;
    if (matchesLocalizedQuery(col.title, q) || matchesLocalizedQuery(col.description, q)) {
      suggestions.push({ kind: "collection", id: col.id, label: col.title, secondaryLabel: l("Collection", "কালেকশন"), image: col.image, href: `/collection/${col.slug}` });
    }
  }

  // mixed list, stable ordering by kind priority then label
  const kindOrder: Record<SearchSuggestion["kind"], number> = { product: 0, category: 1, brand: 2, collection: 3 };
  suggestions.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind] || a.label.en.localeCompare(b.label.en));
  return suggestions.slice(0, limit);
}

export function getMockCollections(options?: ScenarioOptions): ScenarioResult<MockCollection[]> {
  return withScenario(mockCollections.filter((c) => c.visible), { ...options, emptyData: [] });
}