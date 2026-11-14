import { getTranslations } from "next-intl/server";
import { PageContainer, PageHeader } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";

/** Placeholder for the account overview page. */
export default async function AccountPage() {
  const t = await getTranslations("Pages");
  const placeholder = await getTranslations("Placeholder");

  return (
    <PageContainer className="space-y-6 py-10 sm:py-14">
      <PageHeader title={t("account")} description={placeholder("message")} />
      <EmptyState title={t("account")} message={placeholder("message")} />
    </PageContainer>
  );
}
