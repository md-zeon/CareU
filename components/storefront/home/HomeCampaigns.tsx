import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer, Section } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/routing";
import type { HomeCampaign } from "@/lib/mock/home";
import { pickText, withLocale } from "./home-utils";

const toneClass: Record<NonNullable<HomeCampaign["tone"]>, string> = {
  neutral: "bg-card",
  warm: "bg-amber-500/5 dark:bg-amber-400/10",
  cool: "bg-sky-500/5 dark:bg-sky-400/10",
  accent: "bg-primary/5",
};

export function HomeCampaigns({
  campaigns,
  locale,
  title,
  description,
  emptyTitle,
  emptyMessage,
}: {
  campaigns: HomeCampaign[];
  locale: Locale;
  title: string;
  description: string;
  emptyTitle: string;
  emptyMessage: string;
}) {
  return (
    <PageContainer className="py-10 sm:py-14">
      <Section title={title} description={description}>
        {campaigns.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <li key={campaign.id} className={cn("overflow-hidden rounded-2xl border shadow-sm", toneClass[campaign.tone ?? "neutral"])}>
                <div className="flex h-full flex-col">
                  <div className="relative aspect-video bg-muted">
                    <Image
                      src={campaign.image}
                      alt={pickText(campaign.imageAlt ?? campaign.title, locale)}
                      fill
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {campaign.badge ? <Badge variant="secondary">{pickText(campaign.badge, locale)}</Badge> : null}
                        {campaign.tag ? <Badge variant="outline">{pickText(campaign.tag, locale)}</Badge> : null}
                        {campaign.startsAtLabel ? <span className="text-xs text-muted-foreground">{pickText(campaign.startsAtLabel, locale)}</span> : null}
                      </div>
                      <h3 className="text-lg font-semibold tracking-tight">{pickText(campaign.title, locale)}</h3>
                      {campaign.description ? (
                        <p className="text-sm leading-6 text-muted-foreground">{pickText(campaign.description, locale)}</p>
                      ) : null}
                    </div>
                    <div className="mt-auto">
                      <Button render={<Link href={withLocale(locale, campaign.href)} />} variant="outline" nativeButton={false}>
                        {pickText(campaign.ctaLabel, locale)}
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageContainer>
  );
}
