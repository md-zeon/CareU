import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LoaderCircleIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import { getAccountScenario } from "@/lib/mock/account";
import { OrderDetailView } from "@/components/storefront/account/OrderDetailView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// The shared prototype chrome reads URL data; this dynamic route is allowed to block.
export const instant = false;

type OrderDetailParams = Promise<{ orderNumber: string }>;
type OrderDetailSearchParams = Promise<{ scenario?: string | string[] | undefined }>;

export default function OrderDetailPage({
  params,
  searchParams,
}: {
  params: OrderDetailParams;
  searchParams: OrderDetailSearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center" aria-busy="true">
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      }
    >
      <OrderDetailContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderDetailContent({
  params,
  searchParams,
}: {
  params: OrderDetailParams;
  searchParams: OrderDetailSearchParams;
}) {
  const locale = (await getLocale()) as Locale;
  const { orderNumber } = await params;
  const scenario = getAccountScenario((await searchParams).scenario);
  return <OrderDetailView locale={locale} orderNumber={orderNumber} scenario={scenario} />;
}
