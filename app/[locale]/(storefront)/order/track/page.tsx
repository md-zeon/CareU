import { getTranslations } from "next-intl/server";
import { PageContainer, PageHeader } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";

/** Order tracking prototype placeholder. Sign-in required in production policy. */
export default async function TrackOrderPage() {
  const t = await getTranslations("Pages");
  const placeholder = await getTranslations("Placeholder");

  return (
    <PageContainer className="space-y-6 py-10 sm:py-14">
      <PageHeader title={t("trackOrder")} description={placeholder("message")} />
      <EmptyState title={t("trackOrder")} message={placeholder("message")} />
    </PageContainer>
  );
}
