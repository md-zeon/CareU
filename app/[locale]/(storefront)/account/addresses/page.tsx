import { Suspense } from "react";
import type { Metadata } from "next";
import { LoaderCircleIcon } from "lucide-react";
import { getAccountScenario } from "@/lib/mock/account";
import { AddressesView } from "@/components/storefront/account/AddressesView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const instant = false;

type AddressSearchParams = Promise<{ scenario?: string | string[] | undefined }>;

export default function AddressesPage({ searchParams }: { searchParams: AddressSearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center" aria-busy="true">
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      }
    >
      <AddressesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AddressesContent({ searchParams }: { searchParams: AddressSearchParams }) {
  const scenario = getAccountScenario((await searchParams).scenario);
  return <AddressesView key={scenario.id} scenario={scenario} />;
}
