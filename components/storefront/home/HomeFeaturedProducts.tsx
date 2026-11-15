import Image from "next/image";
import Link from "next/link";
import { StarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageContainer, Section } from "@/components/storefront/primitives";
import { EmptyState } from "@/components/storefront/states";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import type { HomeFeaturedProduct } from "@/lib/mock/home";
import { pickText, withLocale } from "./home-utils";

export function HomeFeaturedProducts({
  products,
  locale,
  title,
  description,
  viewLabel,
  emptyTitle,
  emptyMessage,
  fromCareuLabel,
  fromSellerLabel,
  ratingLabel,
  reviewsLabel,
}: {
  products: HomeFeaturedProduct[];
  locale: Locale;
  title: string;
  description: string;
  viewLabel: string;
  emptyTitle: string;
  emptyMessage: string;
  fromCareuLabel: string;
  fromSellerLabel: string;
  ratingLabel: string;
  reviewsLabel: string;
}) {
  return (
    <PageContainer className="py-10 sm:py-14">
      <Section title={title} description={description}>
        {products.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const hasCompare =
                typeof product.compareAtPriceBdt === "number" && product.compareAtPriceBdt > product.priceBdt;
              return (
                <li key={product.id}>
                  <Link
                    href={withLocale(locale, product.href)}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm outline-none transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <div className="relative aspect-square bg-muted">
                      <Image
                        src={product.image}
                        alt={pickText(product.imageAlt, locale)}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                      {product.stockStateLabel ? (
                        <div className="absolute left-3 top-3">
                          <Badge variant={product.availability === "out_of_stock" ? "destructive" : "secondary"}>
                            {pickText(product.stockStateLabel, locale)}
                          </Badge>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                            {product.shop.type === "careu" ? fromCareuLabel : fromSellerLabel}
                          </span>
                          <span>{pickText(product.shop.name, locale)}</span>
                        </div>
                        <h3 className="line-clamp-2 text-base font-semibold leading-6">{pickText(product.title, locale)}</h3>
                        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{pickText(product.description, locale)}</p>
                      </div>
                      <div className="mt-auto space-y-2">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <p className="text-lg font-semibold">{formatPrice(BigInt(product.priceBdt), locale)}</p>
                          {hasCompare ? (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatPrice(BigInt(product.compareAtPriceBdt as number), locale)}
                            </p>
                          ) : null}
                        </div>
                        {typeof product.rating === "number" ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1 text-foreground">
                              <StarIcon className="size-4 fill-current" aria-hidden="true" />
                              <span className="font-medium">{product.rating.toLocaleString(locale === "bn" ? "bn-BD" : "en-US", { maximumFractionDigits: 1 })}</span>
                            </span>
                            <span className="sr-only">{ratingLabel}</span>
                            {typeof product.reviewCount === "number" ? (
                              <span>
                                ({product.reviewCount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")} {reviewsLabel})
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        <p className="text-sm font-medium text-foreground">{viewLabel}</p>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </PageContainer>
  );
}
