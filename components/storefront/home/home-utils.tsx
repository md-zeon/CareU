import type { LocalizedText } from "@/lib/mock/types";
import type { Locale } from "@/lib/i18n/routing";

export function pickText(text: LocalizedText | undefined, locale: Locale): string {
  if (!text) return "";
  return locale === "bn" ? text.bn : text.en;
}

export function withLocale(locale: Locale, href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith(`/${locale}/`) || href === `/${locale}`) return href;
  if (href.startsWith("/")) return `/${locale}${href}`;
  return `/${locale}/${href}`;
}
