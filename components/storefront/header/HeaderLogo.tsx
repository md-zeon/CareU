import Link from "next/link";
import type { Locale } from "@/lib/i18n/routing";

type HeaderLogoProps = {
  locale: Locale;
  brand: string;
};

/** Brand wordmark. Stands in until a real logo asset is added to /public. */
export default function HeaderLogo({ locale, brand }: HeaderLogoProps) {
  return (
    <Link
      href={`/${locale}`}
      className="flex shrink-0 items-center gap-2 rounded-md px-1 py-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label={brand}
    >
      <span className="text-lg font-bold tracking-tight sm:text-xl">
        {brand}
      </span>
    </Link>
  );
}
