import { Suspense } from "react";
import type { Metadata } from "next";
import { LoaderCircleIcon } from "lucide-react";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { getAccountScenario } from "@/lib/mock/account";
import { ProfileView } from "@/components/storefront/account/ProfileView";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const instant = false;

type AccountSearchParams = Promise<{ scenario?: string | string[] | undefined }>;

export default function AccountPage({ searchParams }: { searchParams: AccountSearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-64 items-center justify-center" aria-busy="true">
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      }
    >
      <AccountProfileContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AccountProfileContent({ searchParams }: { searchParams: AccountSearchParams }) {
  const locale = (await getLocale()) as Locale;
  const scenario = getAccountScenario((await searchParams).scenario);
  return <ProfileView key={scenario.id} locale={locale} scenario={scenario} />;
}
