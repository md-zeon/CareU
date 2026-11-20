import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LoaderCircleIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import { getCheckoutScenario } from "@/lib/mock/checkout";
import { ProtectedPrototypePage } from "@/components/prototype/ProtectedPrototypePage";
import { CheckoutView } from "@/components/storefront/checkout/CheckoutView";

type CheckoutSearchParams = Promise<{ scenario?: string | string[] | undefined }>;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Navigable prototype checkout for signed in mock customers. */
export default function CheckoutPage({ searchParams }: { searchParams: CheckoutSearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-72 items-center justify-center" aria-busy="true">
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      }
    >
      <CheckoutScenarioContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckoutScenarioContent({ searchParams }: { searchParams: CheckoutSearchParams }) {
  const locale = (await getLocale()) as Locale;
  const rawScenario = (await searchParams).scenario;
  const scenario = getCheckoutScenario(Array.isArray(rawScenario) ? rawScenario[0] : rawScenario);

  return (
    <ProtectedPrototypePage allowedScopes={["customer"]} suggestedPersonaId="customer">
      <CheckoutView locale={locale} scenario={scenario} />
    </ProtectedPrototypePage>
  );
}
