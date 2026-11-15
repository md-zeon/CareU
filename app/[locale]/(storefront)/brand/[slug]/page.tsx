import { getLocale, getTranslations } from "next-intl/server";
import { PageContainer, PageHeader, Section } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import { mockBrands } from "@/lib/mock/catalog";
import { findBySlug, l } from "@/lib/mock/types";
import type { Locale } from "@/lib/i18n/routing";

export const instant = false;

function pick(text: { en: string; bn: string }, locale: Locale) {
  return locale === "bn" ? text.bn : text.en;
}

export function generateStaticParams() {
  return mockBrands.map((brand) => ({ slug: brand.slug }));
}

export default async function BrandPlaceholderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const placeholder = await getTranslations("Placeholder");
  const brand = findBySlug(mockBrands, slug);

  if (!brand) {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <PageHeader
          title={pick(l("Brand not found in prototype", "প্রোটোটাইপে ব্র্যান্ড পাওয়া যায়নি"), locale)}
          description={placeholder("message")}
        />
        <EmptyState
          title={pick(l("Unknown brand", "অজানা ব্র্যান্ড"), locale)}
          message={pick(l("This prototype link points to a brand that is not in the mock data yet.", "এই প্রোটোটাইপ লিংকটি এমন একটি ব্র্যান্ডের দিকে যায় যা এখনো মক ডাটায় নেই।"), locale)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow={pick(l("Prototype brand", "প্রোটোটাইপ ব্র্যান্ড"), locale)}
        title={pick(brand.name, locale)}
        description={placeholder("message")}
      />
      <Section title={pick(l("Brand journey coming soon", "ব্র্যান্ড জার্নি শীঘ্রই আসছে"), locale)}>
        <EmptyState
          title={pick(brand.name, locale)}
          message={pick(
            l("Brand browsing and product discovery for this brand will be added in later customer journeys.", "এই ব্র্যান্ডের ব্রাউজিং এবং পণ্য ডিসকভারি পরবর্তী কাস্টমার জার্নিতে যোগ করা হবে।"),
            locale,
          )}
        />
      </Section>
      <p className="text-xs text-muted-foreground">
        {pick(l("Prototype placeholder: mock data only, no real brand catalog.", "প্রোটোটাইপ প্লেসহোল্ডার: শুধু মক ডাটা, কোনো প্রকৃত ব্র্যান্ড ক্যাটালগ নেই।"), locale)}
      </p>
    </PageContainer>
  );
}
