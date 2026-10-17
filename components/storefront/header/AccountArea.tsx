import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/routing";

type AccountAreaProps = {
  locale: Locale;
};

/**
 * Session-aware account area.
 *
 * Reads the session behind a <Suspense> boundary (see HeaderBar) so the
 * header never blocks on auth — the cacheComponents pattern that Better Auth
 * will drop into later without restructuring this component.
 * Visibility (desktop row vs. mobile drawer) is controlled by the call site.
 */
export default async function AccountArea({ locale }: AccountAreaProps) {
  const t = await getTranslations("Header");
  const user = await getCurrentUser();

  if (user) {
    return (
      <Link
        href={`/${locale}/account`}
        className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <UserIcon aria-hidden="true" className="size-4 text-muted-foreground" />
        <span className="max-w-28 truncate">{user.name}</span>
      </Link>
    );
  }

  const linkClass =
    "rounded-md px-2 py-1.5 text-sm font-medium outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Link href={`/${locale}/login`} className={linkClass}>
        {t("signIn")}
      </Link>
      <span aria-hidden="true">/</span>
      <Link href={`/${locale}/register`} className={linkClass}>
        {t("register")}
      </Link>
    </div>
  );
}

/** Matches the size of the sign-in / register cluster so the header never shifts. */
export function AccountAreaSkeleton() {
  return <Skeleton className="h-8 w-36" />;
}
