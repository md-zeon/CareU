import { mockBrands, mockCategories, mockProducts, mockVariants } from "../catalog";
import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, resolveScenario, scenarioError, withScenario } from "../types";
import { mockShops } from "../shops";
import type {
  HomeCampaign,
  HomeClosingBlock,
  HomeClosingLink,
  HomeDiscoveryPayload,
  HomeEditorial,
  HomeFeaturedBrand,
  HomeFeaturedCategory,
  HomeFeaturedProduct,
  HomeHero,
  HomeTrustItem,
} from "./types";

export * from "./types";

const heroFixture: HomeHero = {
  id: "home-hero-1",
  eyebrow: l("CareU marketplace", "কেয়ারইউ মার্কেটপ্লেস"),
  title: l(
    "Everyday essentials from CareU and trusted shops",
    "কেয়ারইউ এবং বিশ্বস্ত দোকান থেকে দৈনন্দিন প্রয়োজনীয় পণ্য",
  ),
  description: l(
    "Discover electronics, fashion, home, and beauty in one place. Browse featured picks, promotions, and brands across Bangladesh with clear prices in BDT.",
    "ইলেকট্রনিক্স, ফ্যাশন, ঘর ও সৌন্দর্য পণ্য এক জায়গায় খুঁজুন। বাংলাদেশজুড়ে ফিচার্ড পছন্দ, প্রোমোশন এবং ব্র্যান্ড ব্রাউজ করুন, পরিষ্কার বিডিটি মূল্যে।",
  ),
  primaryCta: { label: l("Shop featured products", "ফিচার্ড পণ্য দেখুন"), href: "/search" },
  secondaryCta: { label: l("Browse categories", "ক্যাটাগরি ব্রাউজ করুন"), href: "/search" },
  image: "/products/product-1.svg",
  imageAlt: l("Featured CareU marketplace products", "ফিচার্ড কেয়ারইউ মার্কেটপ্লেস পণ্য"),
  badge: l("Prototype preview", "প্রোটোটাইপ প্রিভিউ"),
  align: "left",
  theme: "light",
  campaignId: "campaign-winter-picks",
};

const trustItemsFixture: HomeTrustItem[] = [
  {
    id: "trust-delivery",
    icon: "truck",
    title: l("Delivery across Bangladesh", "সারা বাংলাদেশে ডেলিভারি"),
    description: l("Delivery options shown clearly at checkout.", "চেকআউটে ডেলিভারি অপশন পরিষ্কারভাবে দেখানো হবে।"),
  },
  {
    id: "trust-payment",
    icon: "shield",
    title: l("Cash on delivery and online payment", "ক্যাশ অন ডেলিভারি ও অনলাইন পেমেন্ট"),
    description: l("Choose the payment method that fits you.", "আপনার জন্য সুবিধাজনক পেমেন্ট পদ্ধতি বেছে নিন।"),
  },
  {
    id: "trust-sellers",
    icon: "store",
    title: l("CareU and third party shops", "কেয়ারইউ ও থার্ড পার্টি দোকান"),
    description: l("Shop from CareU first party items and marketplace sellers.", "কেয়ারইউর নিজের পণ্য এবং মার্কেটপ্লেস বিক্রেতাদের কাছ থেকে কিনুন।"),
  },
  {
    id: "trust-support",
    icon: "headset",
    title: l("Help when you need it", "প্রয়োজনে সহায়তা"),
    description: l("Support and order information in one place.", "সাপোর্ট ও অর্ডার তথ্য এক জায়গায়।"),
  },
];

const campaignsFixture: HomeCampaign[] = [
  {
    id: "campaign-winter-picks",
    title: l("Everyday tech picks", "দৈনন্দিন টেক পছন্দ"),
    description: l("Phones, chargers, and useful gadgets with clear BDT pricing.", "ফোন, চার্জার এবং দরকারি গ্যাজেট, পরিষ্কার বিডিটি মূল্যে।"),
    image: "/products/product-1.svg",
    imageAlt: l("Everyday tech products", "দৈনন্দিন টেক পণ্য"),
    ctaLabel: l("Explore picks", "পছন্দগুলো দেখুন"),
    href: "/campaign/everyday-tech-picks",
    badge: l("Campaign", "ক্যাম্পেইন"),
    tag: l("Featured", "ফিচার্ড"),
    tone: "cool",
    startsAtLabel: l("Live now", "এখন চলছে"),
  },
  {
    id: "campaign-home-refresh",
    title: l("Home refresh", "ঘর সাজানোর নতুনত্ব"),
    description: l("Kitchen and living essentials from trusted shops.", "বিশ্বস্ত দোকান থেকে রান্নাঘর ও জীবনযাপনের প্রয়োজনীয় সামগ্রী।"),
    image: "/products/product-2.svg",
    imageAlt: l("Home and living essentials", "ঘর ও জীবনযাপনের প্রয়োজনীয় সামগ্রী"),
    ctaLabel: l("View collection", "কালেকশন দেখুন"),
    href: "/campaign/home-refresh",
    badge: l("Promotion", "প্রোমোশন"),
    tone: "warm",
  },
  {
    id: "campaign-style-edit",
    title: l("Style edit", "স্টাইল এডিট"),
    description: l("Simple fashion finds for everyday wear.", "দৈনন্দিন পরার জন্য সহজ ফ্যাশন পছন্দ।"),
    image: "/products/product-3.svg",
    imageAlt: l("Fashion highlights", "ফ্যাশন হাইলাইট"),
    ctaLabel: l("Shop fashion", "ফ্যাশন দেখুন"),
    href: "/campaign/style-edit",
    tone: "accent",
  },
];

const editorialFixture: HomeEditorial = {
  id: "editorial-careu",
  eyebrow: l("CareU story", "কেয়ারইউ গল্প"),
  title: l("A marketplace built for everyday buying in Bangladesh", "বাংলাদেশের দৈনন্দিন কেনাকাটার জন্য তৈরি একটি মার্কেটপ্লেস"),
  body: l(
    "CareU brings first party products and third party sellers into one shopping experience. This prototype shows how discovery, shop context, and clear pricing can come together before the full system is connected.",
    "কেয়ারইউ প্রথম পক্ষের পণ্য এবং থার্ড পার্টি বিক্রেতাদের এক কেনাকাটার অভিজ্ঞতায় নিয়ে আসে। পূর্ণ সিস্টেম যুক্ত করার আগে ডিসকভারি, দোকানের প্রেক্ষাপট এবং পরিষ্কার মূল্য কীভাবে একসাথে কাজ করতে পারে এই প্রোটোটাইপ তা দেখায়।",
  ),
  image: "/products/product-2.svg",
  imageAlt: l("CareU marketplace story", "কেয়ারইউ মার্কেটপ্লেস গল্প"),
  ctaLabel: l("Learn more in search", "সার্চে আরও জানুন"),
  href: "/search",
  author: l("CareU prototype", "কেয়ারইউ প্রোটোটাইপ"),
  sourceLabel: l("Editorial highlight", "এডিটোরিয়াল হাইলাইট"),
};

const closingLinksFixture: HomeClosingLink[] = [
  {
    id: "closing-search",
    label: l("Search the marketplace", "মার্কেটপ্লেসে খুঁজুন"),
    description: l("Find products, brands, and categories.", "পণ্য, ব্র্যান্ড এবং ক্যাটাগরি খুঁজুন।"),
    href: "/search",
    icon: "search",
  },
  {
    id: "closing-brands",
    label: l("Shop by brand", "ব্র্যান্ড অনুযায়ী কিনুন"),
    description: l("Explore featured brand pages.", "ফিচার্ড ব্র্যান্ড পেজ দেখুন।"),
    href: "/brand/careu-select",
    icon: "store",
  },
  {
    id: "closing-promotions",
    label: l("See promotions", "প্রোমোশন দেখুন"),
    description: l("Browse campaign highlights.", "ক্যাম্পেইন হাইলাইট ব্রাউজ করুন।"),
    href: "/campaign/everyday-tech-picks",
    icon: "tag",
  },
  {
    id: "closing-account",
    label: l("Your account", "আপনার অ্যাকাউন্ট"),
    description: l("Sign in to view saved areas when available.", "উপলব্ধ হলে সংরক্ষিত এলাকা দেখতে সাইন ইন করুন।"),
    href: "/account",
    icon: "user",
  },
];

const closingBlockFixture: HomeClosingBlock = {
  title: l("Keep exploring", "আরও দেখুন"),
  description: l("Continue your CareU discovery journey from these starting points.", "এই শুরুগুলো থেকে আপনার কেয়ারইউ ডিসকভারি জার্নি চালিয়ে যান।"),
  links: closingLinksFixture,
};

const featuredCategorySlugs = [
  "mobile-phones-accessories",
  "electronics",
  "fashion",
  "home-living",
  "beauty-health",
];

const featuredBrandSlugs = ["careu-select", "vivo", "urban-thread", "homecraft"];
const featuredProductSlugs = [
  "vivo-y28-5g",
  "65w-fast-charger",
  "core-i5-laptop",
  "mens-cotton-shirt",
  "nonstick-cookware-set",
  "foaming-cleanser",
];

function resolveFeaturedCategories(): HomeFeaturedCategory[] {
  const result: HomeFeaturedCategory[] = [];
  for (const slug of featuredCategorySlugs) {
    const category = mockCategories.find((c) => c.slug === slug);
    if (!category) continue;
    result.push({
      ...category,
      href: `/category/${category.slug}`,
    });
  }
  return result;
}

function resolveFeaturedBrands(): HomeFeaturedBrand[] {
  const counts = new Map<string, number>();
  for (const product of mockProducts) {
    if (!product.brandId) continue;
    counts.set(product.brandId, (counts.get(product.brandId) ?? 0) + 1);
  }
  const result: HomeFeaturedBrand[] = [];
  for (const slug of featuredBrandSlugs) {
    const brand = mockBrands.find((b) => b.slug === slug);
    if (!brand) continue;
    const count = counts.get(brand.id) ?? 0;
    result.push({
      ...brand,
      href: `/brand/${brand.slug}`,
      productCountLabel: l(
        `${count} featured item${count === 1 ? "" : "s"}`,
        `${count}টি ফিচার্ড পণ্য`,
      ),
    });
  }
  return result;
}

function resolveFeaturedProducts(): HomeFeaturedProduct[] {
  const result: HomeFeaturedProduct[] = [];
  for (const slug of featuredProductSlugs) {
    const product = mockProducts.find((p) => p.slug === slug);
    if (!product) continue;
    const variants = mockVariants.filter((v) => v.productId === product.id);
    const preferredVariant =
      variants.find((v) => v.availability === "in_stock") ??
      variants.find((v) => v.availability === "low_stock") ??
      variants[0];
    if (!preferredVariant) continue;
    const shop = mockShops.find((s) => s.id === product.primaryShopId);
    if (!shop) continue;
    const brand = product.brandId ? mockBrands.find((b) => b.id === product.brandId) : undefined;
    result.push({
      id: product.id,
      slug: product.slug,
      href: `/product/${product.slug}`,
      title: product.title,
      description: product.description,
      image: product.images[0] ?? "/products/product-1.svg",
      imageAlt: product.title,
      priceBdt: preferredVariant.priceBdt,
      compareAtPriceBdt: preferredVariant.compareAtPriceBdt,
      rating: product.rating,
      reviewCount: product.reviewCount,
      availability: preferredVariant.availability,
      stockStateLabel: preferredVariant.stockStateLabel,
      shop: {
        id: shop.id,
        slug: shop.slug,
        name: shop.name,
        type: shop.type,
      },
      brand: brand ? { id: brand.id, slug: brand.slug, name: brand.name } : undefined,
      variantTitle: preferredVariant.title,
    });
  }
  return result;
}

function buildPayload(): HomeDiscoveryPayload {
  return {
    hero: heroFixture,
    trustItems: trustItemsFixture,
    featuredCategories: resolveFeaturedCategories(),
    campaigns: campaignsFixture,
    featuredProducts: resolveFeaturedProducts(),
    featuredBrands: resolveFeaturedBrands(),
    editorial: editorialFixture,
    closingLinks: closingBlockFixture,
  };
}

const emptyPayload: HomeDiscoveryPayload = {
  hero: null,
  trustItems: [],
  featuredCategories: [],
  campaigns: [],
  featuredProducts: [],
  featuredBrands: [],
  editorial: null,
  closingLinks: { title: l("Keep exploring", "আরও দেখুন"), description: undefined, links: [] },
};

export function getHomeDiscovery(options?: ScenarioOptions): ScenarioResult<HomeDiscoveryPayload> {
  return withScenario(buildPayload(), {
    ...options,
    emptyData: emptyPayload,
    errorMessage: scenarioError(
      "Could not load the home page right now.",
      "এখন হোম পেজ লোড করা যাচ্ছে না।",
    ),
  });
}

export function getHomeHero(options?: ScenarioOptions): ScenarioResult<HomeHero | null> {
  const scenario = resolveScenario(options);
  if (scenario === "loading") return { scenario, data: null };
  if (scenario === "error") {
    return {
      scenario,
      data: null,
      message: scenarioError(
        "Could not load the home highlight.",
        "হোম হাইলাইট লোড করা যায়নি।",
      ),
    };
  }
  if (scenario === "empty") return { scenario, data: null };
  return { scenario, data: heroFixture };
}

export function getHomeTrustItems(options?: ScenarioOptions): ScenarioResult<HomeTrustItem[]> {
  return withScenario(trustItemsFixture, { ...options, emptyData: [] });
}

export function getHomeFeaturedCategories(options?: ScenarioOptions): ScenarioResult<HomeFeaturedCategory[]> {
  return withScenario(resolveFeaturedCategories(), { ...options, emptyData: [] });
}

export function getHomeCampaigns(options?: ScenarioOptions): ScenarioResult<HomeCampaign[]> {
  return withScenario(campaignsFixture, { ...options, emptyData: [] });
}

export function getHomeFeaturedProducts(options?: ScenarioOptions): ScenarioResult<HomeFeaturedProduct[]> {
  return withScenario(resolveFeaturedProducts(), { ...options, emptyData: [] });
}

export function getHomeFeaturedBrands(options?: ScenarioOptions): ScenarioResult<HomeFeaturedBrand[]> {
  return withScenario(resolveFeaturedBrands(), { ...options, emptyData: [] });
}

export function getHomeEditorial(options?: ScenarioOptions): ScenarioResult<HomeEditorial | null> {
  const scenario = resolveScenario(options);
  if (scenario === "loading") return { scenario, data: null };
  if (scenario === "error") {
    return {
      scenario,
      data: null,
      message: scenarioError(
        "Could not load the home story.",
        "হোম স্টোরি লোড করা যায়নি।",
      ),
    };
  }
  if (scenario === "empty") return { scenario, data: null };
  return { scenario, data: editorialFixture };
}

export function getHomeClosingLinks(options?: ScenarioOptions): ScenarioResult<HomeClosingBlock> {
  return withScenario(closingBlockFixture, {
    ...options,
    emptyData: { title: closingBlockFixture.title, description: undefined, links: [] },
  });
}
