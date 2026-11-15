import { getLocale, getTranslations } from "next-intl/server";
import { PageContainer, PageHeader, Section } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import { l } from "@/lib/mock/types";
import type { Locale } from "@/lib/i18n/routing";

export const instant = false;

const campaigns = [
  {
    slug: "everyday-tech-picks",
    title: l("Everyday tech picks", "দৈনন্দিন টেক পছন্দ"),
    description: l("Phones, chargers, and useful gadgets in this prototype campaign.", "এই প্রোটোটাইপ ক্যাম্পেইনে ফোন, চার্জার এবং দরকারি গ্যাজেট।"),
  },
  {
    slug: "home-refresh",
    title: l("Home refresh", "ঘর সাজানোর নতুনত্ব"),
    description: l("Kitchen and living essentials in this prototype campaign.", "এই প্রোটোটাইপ ক্যাম্পেইনে রান্নাঘর ও জীবনযাপনের প্রয়োজনীয় সামগ্রী।"),
  },
  {
    slug: "style-edit",
    title: l("Style edit", "স্টাইল এডিট"),
    description: l("Simple fashion finds in this prototype campaign.", "এই প্রোটোটাইপ ক্যাম্পেইনে সহজ ফ্যাশন পছন্দ।"),
  },
];

function pick(text: { en: string; bn: string }, locale: Locale) {
  return locale === "bn" ? text.bn : text.en;
}

export function generateStaticParams() {
  return campaigns.map((campaign) => ({ slug: campaign.slug }));
}

export default async function CampaignPlaceholderPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const placeholder = await getTranslations("Placeholder");
  const campaign = campaigns.find((c) => c.slug === slug);

  if (!campaign) {
    return (
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <PageHeader
          title={pick(l("Campaign not found in prototype", "প্রোটোটাইপে ক্যাম্পেইন পাওয়া যায়নি"), locale)}
          description={placeholder("message")}
        />
        <EmptyState
          title={pick(l("Unknown campaign", "অজানা ক্যাম্পেইন"), locale)}
          message={pick(l("This prototype link points to a campaign that is not available in this preview yet.", "এই প্রোটোটাইপ লিংকটি এমন একটি ক্যাম্পেইনের দিকে যায় যা এই প্রিভিউতে এখনো নেই।"), locale)}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow={pick(l("Prototype campaign", "প্রোটোটাইপ ক্যাম্পেইন"), locale)}
        title={pick(campaign.title, locale)}
        description={pick(campaign.description, locale)}
      />
      <Section title={pick(l("Campaign landing coming soon", "ক্যাম্পেইন ল্যান্ডিং শীঘ্রই আসছে"), locale)}>
        <EmptyState
          title={pick(campaign.title, locale)}
          message={pick(
            l("Campaign landing pages and curated results will be added in later prototype journeys.", "ক্যাম্পেইন ল্যান্ডিং পেজ এবং কিউরেটেড ফলাফল পরবর্তী প্রোটোটাইপ জার্নিতে যোগ করা হবে।"),
            locale,
          )}
        />
      </Section>
      <p className="text-xs text-muted-foreground">
        {pick(l("Prototype placeholder: mock data only, no real campaign or pricing rules.", "প্রোটোটাইপ প্লেসহোল্ডার: শুধু মক ডাটা, কোনো প্রকৃত ক্যাম্পেইন বা মূল্য নির্ধারণ নিয়ম নেই।"), locale)}
      </p>
    </PageContainer>
  );
}
