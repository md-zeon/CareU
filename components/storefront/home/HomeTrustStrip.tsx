import { BadgeCheckIcon, HeadsetIcon, ShieldCheckIcon, StoreIcon, TruckIcon } from "lucide-react";
import { PageContainer } from "@/components/storefront/primitives";
import type { Locale } from "@/lib/i18n/routing";
import type { HomeTrustItem } from "@/lib/mock/home";
import { pickText } from "./home-utils";

const icons = {
  truck: TruckIcon,
  shield: ShieldCheckIcon,
  "badge-check": BadgeCheckIcon,
  headset: HeadsetIcon,
  store: StoreIcon,
} as const;

export function HomeTrustStrip({
  items,
  locale,
  title,
}: {
  items: HomeTrustItem[];
  locale: Locale;
  title: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="border-b bg-background">
      <PageContainer className="py-8 sm:py-10">
        <div className="space-y-5">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-muted-foreground uppercase">{title}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
              const Icon = icons[item.icon];
              return (
                <li key={item.id} className="flex gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground" aria-hidden="true">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium leading-6">{pickText(item.title, locale)}</p>
                    {item.description ? (
                      <p className="text-sm leading-6 text-muted-foreground">{pickText(item.description, locale)}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </PageContainer>
    </section>
  );
}
