import type { Locale } from "@/lib/i18n/routing";
import type { FutureExperiencePlaceholder } from "@/lib/mock/pdp";
import { pickText } from "@/components/storefront/home/home-utils";
import { CardContent, CardShell } from "@/components/storefront/primitives";

export function ProductFutureExperience({
  locale,
  item,
}: {
  locale: Locale;
  item: FutureExperiencePlaceholder;
}) {
  return (
    <CardShell className="border-dashed bg-muted/20">
      <CardContent className="space-y-2 py-6">
        <p className="text-sm font-semibold">{pickText(item.label, locale)}</p>
        <p className="max-w-3xl text-sm text-muted-foreground">{pickText(item.description, locale)}</p>
      </CardContent>
    </CardShell>
  );
}
