import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LoaderCircleIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import { getAccountScenario } from "@/lib/mock/account";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";
import { PageContainer, PageHeader } from "@/components/storefront/primitives";
import { TrackingView } from "@/components/storefront/account/TrackingView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type TrackSearchParams = Promise<{
  scenario?: string | string[] | undefined;
  shipment?: string | string[] | undefined;
}>;

/** Tracking is gated in UI; the real sign in rule is enforced in a later feature. */
export default function TrackOrderPage({ searchParams }: { searchParams: TrackSearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center" aria-busy="true">
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      }
    >
      <TrackContent searchParams={searchParams} />
    </Suspense>
  );
}

async function TrackContent({ searchParams }: { searchParams: TrackSearchParams }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Tracking");
  const params = await searchParams;
  const scenario = getAccountScenario(params.scenario);
  const rawShipment = Array.isArray(params.shipment) ? params.shipment[0] : params.shipment;

  return (
    <ProtectedPrototypePage allowedScopes={["customer"]} suggestedPersonaId="customer">
      <PageContainer className="space-y-6 py-8 sm:py-10">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
        <TrackingView locale={locale} shipmentId={rawShipment} scenario={scenario} />
      </PageContainer>
    </ProtectedPrototypePage>
  );
}
