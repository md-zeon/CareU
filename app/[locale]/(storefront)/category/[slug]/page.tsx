import { getLocale, getTranslations } from "next-intl/server";
import { PageContainer, PageHeader, Section } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import { mockCategories } from "@/lib/mock/catalog";
import { findBySlug, l } from "@/lib/mock/types";
import type { Locale } from "@/lib/i18n/routing";

export const instant = false;

function pick(text: { en: string; bn: string }, locale: Locale) {
  return locale === "bn" ? text.bn : text.en;
}

export function generateStaticParams() {
  return mockCategories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPlaceholderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Pages");
  const placeholder = await getTranslations("Placeholder");
  const category = findBySlug(mockCategories, slug);

  if (!category) {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <PageHeader
          title={pick(l("Category not found in prototype", "প্রোটোটাইপে ক্যাটাগরি পাওয়া যায়নি"), locale)}
          description={placeholder("message")}
        />
        <EmptyState
          title={pick(l("Unknown category", "অজানা ক্যাটাগরি"), locale)}
          message={pick(l("This prototype link points to a category that is not in the mock data yet.", "এই প্রোটোটাইপ লিংকটি এমন একটি ক্যাটাগরির দিকে যায় যা এখনো মক ডাটায় নেই।"), locale)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow={pick(l("Prototype category", "প্রোটোটাইপ ক্যাটাগরি"), locale)}
        title={pick(category.name, locale)}
        description={category.description ? pick(category.description, locale) : placeholder("message")}
      />
      <Section title={pick(l("Browse journey coming soon", "ব্রাউজ জার্নি শীঘ্রই আসছে"), locale)}>
        <EmptyState
          title={t("search")}
          message={pick(
            l("Category browsing, filters, and product lists will be added in the customer browse journey.", "ক্যাটাগরি ব্রাউজিং, ফিল্টার এবং পণ্যের তালিকা কাস্টমার ব্রাউজ জার্নিতে যোগ করা হবে।"),
            locale,
          )}
        />
      </Section>
      <p className="text-xs text-muted-foreground">
        {pick(l("Prototype placeholder: mock data only, no real catalog queries.", "প্রোটোটাইপ প্লেসহোল্ডার: শুধু মক ডাটা, কোনো প্রকৃত ক্যাটালগ কুয়েরি নেই।"), locale)}
      </p>
    </PageContainer>
  );
}
