import { getLocale, getTranslations } from "next-intl/server";
import { PageContainer, PageHeader, Section, CardShell, CardContent } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import { formatPrice } from "@/lib/catalog/price";
import { mockProducts, mockVariants } from "@/lib/mock/catalog";
import { findBySlug, l } from "@/lib/mock/types";
import { mockShops } from "@/lib/mock/shops";
import type { Locale } from "@/lib/i18n/routing";

export const instant = false;

function pick(text: { en: string; bn: string }, locale: Locale) {
  return locale === "bn" ? text.bn : text.en;
}

export function generateStaticParams() {
  return mockProducts.map((product) => ({ slug: product.slug }));
}

export default async function ProductPlaceholderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const placeholder = await getTranslations("Placeholder");
  const product = findBySlug(mockProducts, slug);

  if (!product) {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <PageHeader
          title={pick(l("Product not found in prototype", "প্রোটোটাইপে পণ্য পাওয়া যায়নি"), locale)}
          description={placeholder("message")}
        />
        <EmptyState
          title={pick(l("Unknown product", "অজানা পণ্য"), locale)}
          message={pick(l("This prototype link points to a product that is not in the mock data yet.", "এই প্রোটোটাইপ লিংকটি এমন একটি পণ্যের দিকে যায় যা এখনো মক ডাটায় নেই।"), locale)}
        />
      </PageContainer>
    );
  }

  const variant = mockVariants.find((v) => v.productId === product.id);
  const shop = product.primaryShopId ? mockShops.find((s) => s.id === product.primaryShopId) : undefined;

  return (
    <PageContainer className="space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow={pick(l("Prototype product", "প্রোটোটাইপ পণ্য"), locale)}
        title={pick(product.title, locale)}
        description={pick(product.description, locale)}
      />
      <Section title={pick(l("Product preview", "পণ্যের প্রিভিউ"), locale)}>
        <CardShell>
          <CardContent className="space-y-3 text-sm sm:text-base">
            {variant ? (
              <p>
                <span className="font-medium">{pick(l("Price", "মূল্য"), locale)}:</span>{" "}
                {formatPrice(BigInt(variant.priceBdt), locale)}
              </p>
            ) : null}
            {shop ? (
              <p>
                <span className="font-medium">{pick(l("Shop", "দোকান"), locale)}:</span> {pick(shop.name, locale)} (
                {shop.type === "careu"
                  ? pick(l("CareU shop", "কেয়ারইউ দোকান"), locale)
                  : pick(l("Marketplace seller", "মার্কেটপ্লেস বিক্রেতা"), locale)}
                )
              </p>
            ) : null}
            <p className="text-muted-foreground">
              {pick(
                l("Full product details, gallery, variants, reviews, and related items will be added in the customer product journey.", "সম্পূর্ণ পণ্যের বিবরণ, গ্যালারি, ভ্যারিয়েন্ট, রিভিউ এবং সম্পর্কিত পণ্য কাস্টমার প্রোডাক্ট জার্নিতে যোগ করা হবে।"),
                locale,
              )}
            </p>
          </CardContent>
        </CardShell>
      </Section>
      <p className="text-xs text-muted-foreground">
        {pick(l("Prototype placeholder: mock data only, no real product, cart, or stock behavior.", "প্রোটোটাইপ প্লেসহোল্ডার: শুধু মক ডাটা, কোনো প্রকৃত পণ্য, কার্ট বা স্টক আচরণ নেই।"), locale)}
      </p>
    </PageContainer>
  );
}
