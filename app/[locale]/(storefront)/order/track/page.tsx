import { getTranslations } from "next-intl/server";
import { PageContainer, PageHeader } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";

/** Order tracking prototype placeholder. Sign-in required by policy. */
export default async function TrackOrderPage() {
  const t = await getTranslations("Pages");
  const placeholder = await getTranslations("Placeholder");

  return (
    <ProtectedPrototypePage allowedScopes={["customer"]} suggestedPersonaId="customer">
      <PageContainer className="space-y-6 py-10 sm:py-14">
        <PageHeader title={t("trackOrder")} description={placeholder("message")} />
        <EmptyState title={t("trackOrder")} message={placeholder("message")} />
      </PageContainer>
    </ProtectedPrototypePage>
  );
}
