import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/storefront/primitives";
import type { Locale } from "@/lib/i18n/routing";
import type { HomeHero as HomeHeroData } from "@/lib/mock/home";
import { pickText, withLocale } from "./home-utils";

export function HomeHero({ hero, locale }: { hero: HomeHeroData; locale: Locale }) {
  const primaryHref = withLocale(locale, hero.primaryCta.href);
  const secondaryHref = hero.secondaryCta ? withLocale(locale, hero.secondaryCta.href) : null;

  return (
    <section className="border-b bg-linear-to-b from-muted/40 to-background">
      <PageContainer className="py-10 sm:py-14 lg:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-12">
          <div className="space-y-6">
            <div className="space-y-3">
              {hero.badge ? <Badge variant="secondary">{pickText(hero.badge, locale)}</Badge> : null}
              {hero.eyebrow ? (
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  {pickText(hero.eyebrow, locale)}
                </p>
              ) : null}
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                {pickText(hero.title, locale)}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {pickText(hero.description, locale)}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button render={<Link href={primaryHref} />} size="lg" nativeButton={false}>
                {pickText(hero.primaryCta.label, locale)}
                <ArrowRightIcon aria-hidden="true" data-icon="inline-end" />
              </Button>
              {hero.secondaryCta && secondaryHref ? (
                <Button render={<Link href={secondaryHref} />} variant="outline" size="lg" nativeButton={false}>
                  {pickText(hero.secondaryCta.label, locale)}
                </Button>
              ) : null}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl border bg-card shadow-sm">
              <Image
                src={hero.image}
                alt={pickText(hero.imageAlt ?? hero.title, locale)}
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 640px) 80vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
