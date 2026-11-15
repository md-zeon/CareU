import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/storefront/primitives";
import type { Locale } from "@/lib/i18n/routing";
import type { HomeEditorial as HomeEditorialData } from "@/lib/mock/home";
import { pickText, withLocale } from "./home-utils";

export function HomeEditorial({ editorial, locale }: { editorial: HomeEditorialData; locale: Locale }) {
  return (
    <PageContainer className="py-10 sm:py-14">
      <section className="overflow-hidden rounded-3xl border bg-muted/20 shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <div className="flex flex-col justify-center gap-5 p-6 sm:p-8 lg:p-10">
            <div className="space-y-3">
              {editorial.eyebrow ? (
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  {pickText(editorial.eyebrow, locale)}
                </p>
              ) : null}
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{pickText(editorial.title, locale)}</h2>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">{pickText(editorial.body, locale)}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {editorial.ctaLabel && editorial.href ? (
                <Button render={<Link href={withLocale(locale, editorial.href)} />} variant="outline" nativeButton={false}>
                  {pickText(editorial.ctaLabel, locale)}
                </Button>
              ) : <span />}
              <div className="text-sm text-muted-foreground">
                {editorial.author ? <p>{pickText(editorial.author, locale)}</p> : null}
                {editorial.sourceLabel ? <p>{pickText(editorial.sourceLabel, locale)}</p> : null}
              </div>
            </div>
          </div>
          <div className="relative min-h-64 bg-muted lg:min-h-full">
            <Image
              src={editorial.image}
              alt={pickText(editorial.imageAlt ?? editorial.title, locale)}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
