"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { MapPinIcon, PackageIcon, TruckIcon, UserRoundIcon } from "lucide-react";
import { getProfile } from "@/lib/mock/account";
import type { Locale } from "@/lib/i18n/routing";
import {
  useAccountCustomerId,
  useAccountStore,
  useAccountStoreHydrated,
} from "@/lib/store/account/hooks";
import { CardContent, CardHeader, CardShell, PageContainer, PageHeader } from "@/components/storefront/primitives";
import { LoadingState } from "@/components/storefront/states";
import { withLocale } from "@/components/storefront/home/home-utils";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/account", key: "navProfile", Icon: UserRoundIcon },
  { href: "/account/addresses", key: "navAddresses", Icon: MapPinIcon },
  { href: "/account/orders", key: "navOrders", Icon: PackageIcon },
  { href: "/order/track", key: "navTrack", Icon: TruckIcon },
] as const;

/** Shared account chrome: customer summary on top, side navigation on larger screens. */
export function AccountShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Account");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const customerId = useAccountCustomerId();
  const storedProfile = useAccountStore((state) => state.profile);
  const hydrated = useAccountStoreHydrated();

  const profile =
    hydrated && customerId ? getProfile(customerId, undefined, storedProfile) : null;

  return (
    <PageContainer className="space-y-6 py-8 sm:py-10">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <CardShell>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("summaryTitle")}</p>
            {profile?.ok ? (
              <>
                <p className="text-lg font-semibold">{profile.data.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t("memberSince")}: {profile.data.memberSinceLabel[locale]}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("signedInAs")}</p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{t("signedInAs")}: {customerId ?? "-"}</p>
        </CardHeader>
      </CardShell>

      {!hydrated ? <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} rows={2} /> : null}

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label={t("navTitle")} className="lg:sticky lg:top-6 lg:self-start">
          <CardShell>
            <CardContent className="p-2">
              <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("navTitle")}
              </p>
              <ul className="space-y-1">
                {NAV_ITEMS.map(({ href, key, Icon }) => {
                  const target = withLocale(locale, href);
                  const active = pathname === target || (href !== "/account" && pathname.startsWith(`${target}/`));
                  return (
                    <li key={href}>
                      <Link
                        href={target}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                          active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        {t(key)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </CardShell>
        </nav>
        <div className="min-w-0 space-y-4">{children}</div>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">{t("prototypeNote")}</p>
    </PageContainer>
  );
}
