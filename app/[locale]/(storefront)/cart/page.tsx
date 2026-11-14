import { getTranslations } from "next-intl/server";
import { PageContainer, PageHeader } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";

/** Placeholder for the bag / cart page. */
export default async function CartPage() {
  const t = await getTranslations("Pages");
  const placeholder = await getTranslations("Placeholder");

  return (
    <PageContainer className="space-y-6 py-10 sm:py-14">
      <PageHeader title={t("cart")} description={placeholder("message")} />
      <EmptyState title={t("cart")} message={placeholder("message")} />
    </PageContainer>
  );
}
