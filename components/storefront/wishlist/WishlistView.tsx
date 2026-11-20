"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { HeartIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import { useWishlistActionGate } from "@/lib/prototype/useWishlistActionGate";
import { resolveLines } from "@/lib/store/shared/resolve";
import { useSharedStore, useSharedStoreActions, useSharedStoreHydrated } from "@/lib/store/shared/hooks";
import { CardContent, CardHeader, CardShell, PageHeader } from "@/components/storefront/primitives";
import { EmptyState, ErrorState, LoadingState } from "@/components/storefront/states";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";
import { PrototypeStateSwitcher, type PrototypePreviewState } from "@/components/storefront/shared/PrototypeStateSwitcher";

export function WishlistView({ locale }: { locale: Locale }) {
  const t = useTranslations("Wishlist");
  const [previewState, setPreviewState] = useState<PrototypePreviewState>("content");
  const hydrated = useSharedStoreHydrated();
  const lines = useSharedStore((state) => state.wishlistLines);
  const actions = useSharedStoreActions();
  const { run, gate } = useWishlistActionGate();
  const resolved = useMemo(() => resolveLines(lines), [lines]);

  const browseLink = () => (
    <Link
      href={withLocale(locale, "/search")}
      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      {t("browseAction")}
    </Link>
  );
  const cartLink = () => (
    <Link
      href={withLocale(locale, "/cart")}
      className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
    >
      {t("goToCart")}
    </Link>
  );

  const loading = !hydrated || previewState === "loading";
  const failed = previewState === "error";

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PrototypeStateSwitcher
          value={previewState}
          onChange={setPreviewState}
          label={t("stateLabel")}
          labels={{ content: t("stateContent"), loading: t("stateLoading"), error: t("stateError") }}
        />
        {!loading && !failed && resolved.length > 0 ? <Badge variant="outline">{t.raw("itemCount").replace("{count}", String(resolved.length))}</Badge> : null}
      </div>

      {loading ? (
        <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} rows={4} />
      ) : failed ? (
        <ErrorState
          title={t("errorTitle")}
          message={t("errorMessage")}
          retryLabel={t("retry")}
          onRetry={() => setPreviewState("content")}
        />
      ) : resolved.length === 0 ? (
        <EmptyState title={t("emptyTitle")} message={t("emptyMessage")} action={browseLink()} icon={<HeartIcon className="size-5" />} />
      ) : (
        <CardShell className="overflow-hidden">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">{t.raw("itemCount").replace("{count}", String(resolved.length))}</h2>
            <div className="flex flex-wrap gap-2">{cartLink()}{browseLink()}</div>
          </CardHeader>
          <div className="divide-y">
            {resolved.map((line) => (
              <div key={line.lineId} className="flex flex-wrap gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                <Link
                  href={withLocale(locale, line.href)}
                  className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Image src={line.image} alt={pickText(line.title, locale)} fill sizes="80px" className="object-cover" />
                </Link>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Link href={withLocale(locale, line.href)} className="block text-sm font-semibold hover:underline">
                    {pickText(line.title, locale)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {line.variantTitle ? `${pickText(line.variantTitle, locale)} · ` : ""}
                    {t("shopLabel")}: {pickText(line.shopName, locale)} (
                    {line.shopType === "careu" ? t("careuShop") : t("marketplaceSeller")})
                  </p>
                  <p className="text-sm font-semibold">{formatPrice(BigInt(line.unitPriceBdt), locale)}</p>
                  {!line.isAvailable ? (
                    <div className="space-y-1">
                      <Badge variant="destructive">{t("unavailable")}</Badge>
                      <p className="text-xs text-muted-foreground">{t("unavailableHint")}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      disabled={!line.isAvailable}
                      onClick={() => run(() => actions.moveWishlistToCart(line.lineId))}
                    >
                      {t("moveToCart")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => run(() => actions.removeFromWishlist(line.lineId))}
                    >
                      <Trash2Icon className="size-3.5" aria-hidden="true" />
                      {t("remove")}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <CardContent className="flex flex-wrap gap-2 border-t">
            {cartLink()}
            {browseLink()}
          </CardContent>
        </CardShell>
      )}
      <p className="text-xs text-muted-foreground">{t("prototypeNote")}</p>
      {gate}
    </div>
  );
}
