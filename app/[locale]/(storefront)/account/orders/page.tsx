import { Suspense } from "react";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LoaderCircleIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import { getAccountScenario } from "@/lib/mock/account";
import { OrdersView } from "@/components/storefront/account/OrdersView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const instant = false;

type OrdersSearchParams = Promise<{ scenario?: string | string[] | undefined }>;

export default function OrdersPage({ searchParams }: { searchParams: OrdersSearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center" aria-busy="true">
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      }
    >
      <OrdersContent searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersContent({ searchParams }: { searchParams: OrdersSearchParams }) {
  const locale = (await getLocale()) as Locale;
  const scenario = getAccountScenario((await searchParams).scenario);
  return <OrdersView locale={locale} scenario={scenario} />;
}
