import type { Locale } from "@/lib/i18n/routing";
import type { CrossSellGroup } from "@/lib/mock/pdp";
import { pickText } from "@/components/storefront/home/home-utils";
import { Section } from "@/components/storefront/primitives";
import { ProductCrossSellCard } from "./ProductCrossSellCard";

export function ProductCrossSellSection({
  locale,
  group,
  shopLabels,
  prototypeNote,
}: {
  locale: Locale;
  group: CrossSellGroup;
  shopLabels: { careu: string; seller: string };
  prototypeNote?: string;
}) {
  if (group.items.length === 0) return null;
  return (
    <Section
      title={pickText(group.title, locale)}
      description={group.isPrototypeMock && prototypeNote ? prototypeNote : undefined}
      contentClassName="space-y-0"
    >
      <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {group.items.map((item) => (
          <ProductCrossSellCard key={item.productId} item={item} locale={locale} shopLabels={shopLabels} />
        ))}
      </ul>
    </Section>
  );
}
