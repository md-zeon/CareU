import type { ScenarioOptions, ScenarioResult } from "../types";
import { l, scenarioError, withScenario } from "../types";
import type {
  MockBrand,
  MockCategory,
  MockListing,
  MockMenuCategory,
  MockProduct,
  MockProductVariant,
} from "./types";

export * from "./types";

export const mockCategories: MockCategory[] = [
  { id: "cat-mobile", slug: "mobile-phones-accessories", name: l("Mobile & Accessories", "মোবাইল ও আনুষাঙ্গিক"), parentId: null, image: "/products/product-1.svg", sortOrder: 1, description: l("Phones, chargers, and everyday accessories.", "ফোন, চার্জার এবং দৈনন্দিন আনুষাঙ্গিক।") },
  { id: "cat-electronics", slug: "electronics", name: l("Electronics", "ইলেকট্রনিক্স"), parentId: null, image: "/products/product-2.svg", sortOrder: 2, description: l("Computers, audio, and smart devices.", "কম্পিউটার, অডিও এবং স্মার্ট ডিভাইস।") },
  { id: "cat-fashion", slug: "fashion", name: l("Fashion", "ফ্যাশন"), parentId: null, image: "/products/product-3.svg", sortOrder: 3, description: l("Clothing for everyday style.", "দৈনন্দিন স্টাইলের পোশাক।") },
  { id: "cat-home", slug: "home-living", name: l("Home & Living", "ঘর ও জীবনযাপন"), parentId: null, image: "/products/product-1.svg", sortOrder: 4, description: l("Kitchen and decor essentials.", "রান্নাঘর ও সাজসজ্জার প্রয়োজনীয় সামগ্রী।") },
  { id: "cat-beauty", slug: "beauty-health", name: l("Beauty & Health", "সৌন্দর্য ও স্বাস্থ্য"), parentId: null, image: "/products/product-2.svg", sortOrder: 5, description: l("Skincare and wellness picks.", "ত্বকের যত্ন ও সুস্থতার পণ্য।") },
];

export const mockBrands: MockBrand[] = [
  { id: "brand-vivo", slug: "vivo", name: l("Vivo", "ভিভো") },
  { id: "brand-caru", slug: "careu-select", name: l("CareU Select", "কেয়ারইউ সিলেক্ট") },
  { id: "brand-urban", slug: "urban-thread", name: l("Urban Thread", "আরবান থ্রেড") },
  { id: "brand-home", slug: "homecraft", name: l("HomeCraft", "হোমক্রাফট") },
];

export const mockProducts: MockProduct[] = [
  { id: "prod-vivo-y28", slug: "vivo-y28-5g", title: l("Vivo Y28 5G", "ভিভো ওয়াই২৮ ৫জি"), description: l("A reliable 5G phone for everyday use.", "দৈনন্দিন ব্যবহারের জন্য নির্ভরযোগ্য ৫জি ফোন।"), categoryId: "cat-mobile", brandId: "brand-vivo", primaryShopId: "shop-caru", images: ["/products/product-1.svg"], rating: 4.6, reviewCount: 128, status: "active" },
  { id: "prod-fast-charger", slug: "65w-fast-charger", title: l("65W Fast Charger", "৬৫ ওয়াট ফাস্ট চার্জার"), description: l("Compact charger for phones and tablets.", "ফোন ও ট্যাবলেটের জন্য কমপ্যাক্ট চার্জার।"), categoryId: "cat-mobile", brandId: "brand-caru", primaryShopId: "shop-caru", images: ["/products/product-2.svg"], rating: 4.4, reviewCount: 54, status: "active" },
  { id: "prod-laptop", slug: "core-i5-laptop", title: l("Core i5 14\" Laptop", "কোর i5 ১৪\" ল্যাপটপ"), description: l("Light laptop for work and study.", "কাজ ও পড়াশোনার জন্য হালকা ল্যাপটপ।"), categoryId: "cat-electronics", brandId: "brand-caru", primaryShopId: "shop-caru", images: ["/products/product-1.svg"], rating: 4.7, reviewCount: 42, status: "active" },
  { id: "prod-cotton-shirt", slug: "mens-cotton-shirt", title: l("Men's Cotton Shirt", "পুরুষদের কটন শার্ট"), description: l("Breathable cotton shirt for daily wear.", "দৈনন্দিন পরার জন্য আরামদায়ক কটন শার্ট।"), categoryId: "cat-fashion", brandId: "brand-urban", primaryShopId: "shop-urban", images: ["/products/product-3.svg"], rating: 4.3, reviewCount: 31, status: "active" },
  { id: "prod-cookware", slug: "nonstick-cookware-set", title: l("Non-stick Cookware Set", "নন-স্টিক কুকওয়্যার সেট"), description: l("Durable cookware for home kitchens.", "বাসার রান্নাঘরের জন্য টেকসই কুকওয়্যার।"), categoryId: "cat-home", brandId: "brand-home", primaryShopId: "shop-homecraft", images: ["/products/product-1.svg"], rating: 4.5, reviewCount: 67, status: "active" },
  { id: "prod-cleanser", slug: "foaming-cleanser", title: l("Gentle Foaming Cleanser", "জেন্টল ফোমিং ক্লিনজার"), description: l("Daily cleanser for fresh skin.", "সতেজ ত্বকের জন্য দৈনিক ক্লিনজার।"), categoryId: "cat-beauty", brandId: "brand-caru", primaryShopId: "shop-caru", images: ["/products/product-2.svg"], rating: 4.2, reviewCount: 23, status: "active" },
];

export const mockVariants: MockProductVariant[] = [
  { id: "var-vivo-y28-128", productId: "prod-vivo-y28", sku: "VIVO-Y28-128", title: l("128 GB · Blue", "১২৮ জিবি · নীল"), options: { storage: "128 GB", color: l("Blue", "নীল") }, priceBdt: 2699900, compareAtPriceBdt: 2999900, availability: "in_stock" },
  { id: "var-vivo-y28-256", productId: "prod-vivo-y28", sku: "VIVO-Y28-256", title: l("256 GB · Black", "২৫৬ জিবি · কালো"), options: { storage: "256 GB", color: l("Black", "কালো") }, priceBdt: 2999900, availability: "low_stock", stockStateLabel: l("Low stock", "স্টক কম") },
  { id: "var-charger-white", productId: "prod-fast-charger", sku: "CU-CHG-65W", title: l("White", "সাদা"), priceBdt: 149900, availability: "in_stock" },
  { id: "var-laptop-8", productId: "prod-laptop", sku: "CU-LAP-I5-8", title: l("8 GB RAM · 512 GB SSD", "৮ জিবি র‍্যাম · ৫১২ জিবি এসএসডি"), priceBdt: 7299900, compareAtPriceBdt: 7999900, availability: "in_stock" },
  { id: "var-shirt-m", productId: "prod-cotton-shirt", sku: "UT-SHIRT-M", title: l("Size M", "সাইজ M"), options: { size: "M" }, priceBdt: 129000, compareAtPriceBdt: 159000, availability: "in_stock" },
  { id: "var-shirt-l", productId: "prod-cotton-shirt", sku: "UT-SHIRT-L", title: l("Size L", "সাইজ L"), options: { size: "L" }, priceBdt: 129000, availability: "out_of_stock", stockStateLabel: l("Out of stock", "স্টক নেই") },
  { id: "var-cookware-6", productId: "prod-cookware", sku: "HC-COOK-6", title: l("6 piece set", "৬ পিস সেট"), priceBdt: 349900, compareAtPriceBdt: 429900, availability: "in_stock" },
  { id: "var-cleanser-150", productId: "prod-cleanser", sku: "CU-CLN-150", title: l("150 ml", "১৫০ মিলি"), priceBdt: 59000, availability: "in_stock" },
];

export const mockListings: MockListing[] = [
  { id: "list-vivo-y28-caru", shopId: "shop-caru", productId: "prod-vivo-y28", variantId: "var-vivo-y28-128", status: "active", moderationState: "approved", priceBdt: 2699900, compareAtPriceBdt: 2999900, visible: true },
  { id: "list-charger-caru", shopId: "shop-caru", productId: "prod-fast-charger", variantId: "var-charger-white", status: "active", moderationState: "approved", priceBdt: 149900, visible: true },
  { id: "list-laptop-caru", shopId: "shop-caru", productId: "prod-laptop", variantId: "var-laptop-8", status: "active", moderationState: "approved", priceBdt: 7299900, compareAtPriceBdt: 7999900, visible: true },
  { id: "list-shirt-urban", shopId: "shop-urban", productId: "prod-cotton-shirt", variantId: "var-shirt-m", status: "pending", moderationState: "pending_review", priceBdt: 129000, compareAtPriceBdt: 159000, visible: false },
  { id: "list-cookware-home", shopId: "shop-homecraft", productId: "prod-cookware", variantId: "var-cookware-6", status: "active", moderationState: "approved", priceBdt: 349900, compareAtPriceBdt: 429900, visible: true },
  { id: "list-cleanser-caru", shopId: "shop-caru", productId: "prod-cleanser", variantId: "var-cleanser-150", status: "active", moderationState: "approved", priceBdt: 59000, visible: true },
];

export const mockMenuCategories: MockMenuCategory[] = [
  {
    id: "cat-mobile", slug: "mobile-phones-accessories", parentId: null, sortOrder: 1,
    label: l("Mobile & Accessories", "মোবাইল ও আনুষাঙ্গিক"), href: "/category/mobile-phones-accessories",
    columns: [
      { title: l("Mobile Phones", "মোবাইল ফোন"), links: [{ label: l("Smartphones", "স্মার্টফোন"), href: "/category/smartphones" }, { label: l("Feature Phones", "ফিচার ফোন"), href: "/category/feature-phones" }] },
      { title: l("Accessories", "আনুষাঙ্গিক"), links: [{ label: l("Chargers & Cables", "চার্জার ও কেবল"), href: "/category/chargers-cables" }, { label: l("Cases & Covers", "কেস ও কভার"), href: "/category/cases-covers" }, { label: l("Screen Protectors", "স্ক্রিন প্রটেক্টর"), href: "/category/screen-protectors" }] },
    ],
    products: [
      { id: "prod-vivo-y28", slug: "vivo-y28-5g", title: l("Vivo Y28 5G", "ভিভো ওয়াই২৮ ৫জি"), image: "/products/product-1.svg", price: 26999, compareAtPrice: 29999, badge: l("New", "নতুন") },
      { id: "prod-fast-charger", slug: "65w-fast-charger", title: l("65W Fast Charger", "৬৫ ওয়াট ফাস্ট চার্জার"), image: "/products/product-2.svg", price: 1499 },
      { id: "prod-clear-cover", slug: "clear-silicone-cover", title: l("Clear Silicone Cover", "ক্লিয়ার সিলিকন কভার"), image: "/products/product-3.svg", price: 349 },
    ],
  },
  {
    id: "cat-electronics", slug: "electronics", parentId: null, sortOrder: 2,
    label: l("Electronics", "ইলেকট্রনিক্স"), href: "/category/electronics",
    columns: [
      { title: l("Computers", "কম্পিউটার"), links: [{ label: l("Laptops", "ল্যাপটপ"), href: "/category/laptops" }, { label: l("Desktops", "ডেস্কটপ"), href: "/category/desktops" }, { label: l("Accessories", "আনুষাঙ্গিক"), href: "/category/computer-accessories" }] },
      { title: l("Audio", "অডিও"), links: [{ label: l("Headphones", "হেডফোন"), href: "/category/headphones" }, { label: l("Earbuds", "ইয়ারবাড"), href: "/category/earbuds" }, { label: l("Speakers", "স্পিকার"), href: "/category/speakers" }] },
    ],
    products: [
      { id: "prod-laptop", slug: "core-i5-laptop", title: l("Core i5 14\" Laptop", "কোর i5 ১৪\" ল্যাপটপ"), image: "/products/product-1.svg", price: 72999, compareAtPrice: 79999, badge: l("New", "নতুন") },
      { id: "p-wireless-headphones", slug: "wireless-headphones", title: l("Wireless Headphones", "ওয়্যারলেস হেডফোন"), image: "/products/product-2.svg", price: 3499 },
      { id: "p-bt-speaker", slug: "bluetooth-speaker", title: l("Bluetooth Speaker", "ব্লুটুথ স্পিকার"), image: "/products/product-3.svg", price: 2299 },
    ],
  },
  {
    id: "cat-fashion", slug: "fashion", parentId: null, sortOrder: 3,
    label: l("Fashion", "ফ্যাশন"), href: "/category/fashion",
    columns: [
      { title: l("Men's Wear", "পুরুষদের পোশাক"), links: [{ label: l("Shirts", "শার্ট"), href: "/category/mens-shirts" }, { label: l("Jeans", "জিন্স"), href: "/category/mens-jeans" }] },
      { title: l("Women's Wear", "নারীদের পোশাক"), links: [{ label: l("Dresses", "ড্রেস"), href: "/category/womens-dresses" }, { label: l("Tops", "টপস"), href: "/category/womens-tops" }] },
    ],
    products: [
      { id: "prod-cotton-shirt", slug: "mens-cotton-shirt", title: l("Men's Cotton Shirt", "পুরুষদের কটন শার্ট"), image: "/products/product-1.svg", price: 1290, compareAtPrice: 1590 },
      { id: "p-summer-dress", slug: "womens-summer-dress", title: l("Women's Summer Dress", "নারীদের সামার ড্রেস"), image: "/products/product-2.svg", price: 1890 },
      { id: "p-slim-jeans", slug: "slim-fit-jeans", title: l("Slim Fit Jeans", "স্লিম ফিট জিন্স"), image: "/products/product-3.svg", price: 1990 },
    ],
  },
  {
    id: "cat-home", slug: "home-living", parentId: null, sortOrder: 4,
    label: l("Home & Living", "ঘর ও জীবনযাপন"), href: "/category/home-living",
    columns: [
      { title: l("Kitchen", "রান্নাঘর"), links: [{ label: l("Cookware", "রান্নার সামগ্রী"), href: "/category/cookware" }, { label: l("Utensils", "বাসনপত্র"), href: "/category/kitchen-utensils" }] },
      { title: l("Decor", "সজ্জা"), links: [{ label: l("Lighting", "আলো"), href: "/category/lighting" }, { label: l("Wall Decor", "দেয়াল সজ্জা"), href: "/category/wall-decor" }] },
    ],
    products: [
      { id: "prod-cookware", slug: "nonstick-cookware-set", title: l("Non-stick Cookware Set", "নন-স্টিক কুকওয়্যার সেট"), image: "/products/product-1.svg", price: 3499, compareAtPrice: 4299 },
      { id: "p-pendant-light", slug: "led-pendant-light", title: l("LED Pendant Light", "এলইডি পেন্ডেন্ট লাইট"), image: "/products/product-2.svg", price: 1290 },
      { id: "p-wall-art", slug: "wall-art-panel", title: l("Wall Art Panel", "ওয়াল আর্ট প্যানেল"), image: "/products/product-3.svg", price: 890 },
    ],
  },
  {
    id: "cat-beauty", slug: "beauty-health", parentId: null, sortOrder: 5,
    label: l("Beauty & Health", "সৌন্দর্য ও স্বাস্থ্য"), href: "/category/beauty-health",
    columns: [
      { title: l("Skincare", "ত্বকের যত্ন"), links: [{ label: l("Cleansers", "ক্লিনজার"), href: "/category/skincare-cleansers" }, { label: l("Moisturizers", "ময়েশ্চারাইজার"), href: "/category/skincare-moisturizers" }] },
    ],
    products: [
      { id: "prod-cleanser", slug: "foaming-cleanser", title: l("Gentle Foaming Cleanser", "জেন্টল ফোমিং ক্লিনজার"), image: "/products/product-1.svg", price: 590 },
      { id: "p-daily-moisturizer", slug: "daily-moisturizer-spf-30", title: l("Daily Moisturizer SPF 30", "ডেইলি ময়েশ্চারাইজার SPF ৩০"), image: "/products/product-2.svg", price: 750, compareAtPrice: 890 },
    ],
  },
];

export function getMockMenuCategories(options?: ScenarioOptions): ScenarioResult<MockMenuCategory[]> {
  return withScenario(mockMenuCategories, { ...options, emptyData: [], errorMessage: scenarioError(l("Could not load categories.", "ক্যাটাগরি লোড করা যায়নি।").en, l("Could not load categories.", "ক্যাটাগরি লোড করা যায়নি।").bn) });
}

export function getMockCategories(options?: ScenarioOptions): ScenarioResult<MockCategory[]> {
  return withScenario(mockCategories, { ...options, emptyData: [] });
}
export function getMockBrands(options?: ScenarioOptions): ScenarioResult<MockBrand[]> {
  return withScenario(mockBrands, { ...options, emptyData: [] });
}
export function getMockProducts(options?: ScenarioOptions): ScenarioResult<MockProduct[]> {
  return withScenario(mockProducts, { ...options, emptyData: [] });
}
export function getMockVariants(options?: ScenarioOptions): ScenarioResult<MockProductVariant[]> {
  return withScenario(mockVariants, { ...options, emptyData: [] });
}
export function getMockListings(options?: ScenarioOptions): ScenarioResult<MockListing[]> {
  return withScenario(mockListings, { ...options, emptyData: [] });
}
