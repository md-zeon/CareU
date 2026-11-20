"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ShoppingBagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";
import { useWishlistActionGate } from "@/lib/prototype/useWishlistActionGate";
import { groupCartLines, resolveLines, summarizeCart } from "@/lib/store/shared/resolve";
import { useSharedStore, useSharedStoreActions, useSharedStoreHydrated } from "@/lib/store/shared/hooks";
import { CardContent, CardHeader, CardShell, DetailShell, PageHeader } from "@/components/storefront/primitives";
import { EmptyState, ErrorState, LoadingState } from "@/components/storefront/states";
import { pickText, withLocale } from "@/components/storefront/home/home-utils";
import { PrototypeStateSwitcher, type PrototypePreviewState } from "@/components/storefront/shared/PrototypeStateSwitcher";
import { CartLineRow, type CartLineLabels } from "./CartLineRow";

export function CartView({ locale }: { locale: Locale }) {
  const t = useTranslations("Cart");
  const router = useRouter();
  const [previewState, setPreviewState] = useState<PrototypePreviewState>("content");
  const hydrated = useSharedStoreHydrated();
  const activeLines = useSharedStore((state) => state.activeCartLines);
  const savedLines = useSharedStore((state) => state.savedForLaterLines);
  const actions = useSharedStoreActions();
  const { run, gate } = useWishlistActionGate();

  const resolvedActive = useMemo(() => resolveLines(activeLines), [activeLines]);
  const resolvedSaved = useMemo(() => resolveLines(savedLines), [savedLines]);
  const groups = useMemo(() => groupCartLines(resolvedActive), [resolvedActive]);
  const summary = useMemo(() => summarizeCart(resolvedActive), [resolvedActive]);

  const lineLabels: CartLineLabels = {
    quantityLabel: t("quantityLabel"),
    decrease: t("decrease"),
    increase: t("increase"),
    remove: t("remove"),
    saveForLater: t("saveForLater"),
    moveToWishlist: t("moveToWishlist"),
    unavailable: t("unavailable"),
    unavailableHint: t("unavailableHint"),
    maxQuantity: t.raw("maxQuantity"),
    shopLabel: t("shopLabel"),
    careuShop: t("careuShop"),
    marketplaceSeller: t("marketplaceSeller"),
  };

  const browseHref = withLocale(locale, "/search");
  const browseLink = (
    <Link
      href={browseHref}
      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      {t("browseAction")}
    </Link>
  );

  const loading = !hydrated || previewState === "loading";
  const failed = previewState === "error";

  function proceedToCheckout() {
    run(() => {
      actions.proceedToCheckout(resolvedActive.filter((line) => line.selected && line.isAvailable).map((line) => line.lineId));
      router.push(withLocale(locale, "/checkout"));
    });
  }

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
        <Button type="button" variant="ghost" size="sm" onClick={actions.resetAll}>
          {t("resetDemo")}
        </Button>
      </div>

      {loading ? (
        <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} rows={5} />
      ) : failed ? (
        <ErrorState
          title={t("errorTitle")}
          message={t("errorMessage")}
          retryLabel={t("retry")}
          onRetry={() => setPreviewState("content")}
        />
      ) : (
        <DetailShell>
          <div className="space-y-6">
            {groups.length === 0 ? (
              <EmptyState title={t("emptyTitle")} message={t("emptyMessage")} action={browseLink} icon={<ShoppingBagIcon className="size-5" />} />
            ) : (
              groups.map((group) => (
                <CardShell key={group.shopId} className="overflow-hidden">
                  <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{pickText(group.shopName, locale)}</span>
                        <Badge variant={group.shopType === "careu" ? "default" : "secondary"}>
                          {group.shopType === "careu" ? t("careuShop") : t("marketplaceSeller")}
                        </Badge>
                      </div>
                      <Link href={withLocale(locale, group.shopHref)} className="text-xs text-muted-foreground hover:underline">
                        {t("shopLabel")}: {pickText(group.shopName, locale)}
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button type="button" variant="outline" size="sm" onClick={() => actions.selectAll(group.shopId)}>
                        {t("selectShop")}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => actions.clearSelection(group.shopId)}>
                        {t("clearShop")}
                      </Button>
                    </div>
                  </CardHeader>
                  <div className="divide-y">
                    {group.lines.map((line) => (
                      <CartLineRow
                        key={line.lineId}
                        line={line}
                        locale={locale}
                        labels={lineLabels}
                        onToggleSelected={() => actions.toggleSelected(line.lineId)}
                        onQuantity={(quantity) => actions.setQuantity(line.lineId, quantity)}
                        onRemove={() => actions.removeFromCart(line.lineId)}
                        onSaveForLater={() => actions.saveForLater(line.lineId)}
                        onMoveToWishlist={() => run(() => actions.moveCartToWishlist(line.lineId))}
                      />
                    ))}
                  </div>
                </CardShell>
              ))
            )}

            <CardShell className="overflow-hidden">
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold">{t("savedTitle")}</h2>
                  <p className="text-xs text-muted-foreground">{t("savedDescription")}</p>
                </div>
                <Badge variant="outline">{resolvedSaved.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {resolvedSaved.length === 0 ? (
                  <EmptyState title={t("savedEmptyTitle")} message={t("savedEmptyMessage")} />
                ) : (
                  resolvedSaved.map((line) => (
                    <div key={line.lineId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <Link href={withLocale(locale, line.href)} className="block truncate text-sm font-medium hover:underline">
                          {pickText(line.title, locale)}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {pickText(line.shopName, locale)} · {line.quantity} × {formatPrice(BigInt(line.unitPriceBdt), locale)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button type="button" size="sm" onClick={() => actions.moveSavedToCart(line.lineId)}>
                          {t("moveToCart")}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => run(() => actions.moveSavedToWishlist(line.lineId))}>
                          {t("savedMoveToWishlist")}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => actions.removeSavedForLater(line.lineId)}>
                          {t("remove")}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </CardShell>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <CardShell>
              <CardHeader>
                <h2 className="text-base font-semibold">{t("summaryTitle")}</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{t("selectAll")}</span>
                  <div className="flex gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => actions.selectAll()}>
                      {t("selectAll")}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => actions.clearSelection()}>
                      {t("clearSelection")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 border-t pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">{t.raw("selectedItems").replace("{count}", String(summary.count))}</span>
                    <span className="font-semibold">{formatPrice(summary.subtotalBdt, locale)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("deliveryNote")}</p>
                </div>
                {summary.count === 0 ? <p className="text-xs text-destructive">{t("noSelection")}</p> : null}
                <Button type="button" size="lg" className="w-full" disabled={summary.count === 0} onClick={proceedToCheckout}>
                  {t("checkout")}
                </Button>
                <Link
                  href={browseHref}
                  className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {t("continueBrowsing")}
                </Link>
                <p className="text-xs text-muted-foreground">{t("prototypeNote")}</p>
              </CardContent>
            </CardShell>
          </div>
        </DetailShell>
      )}
      {gate}
    </div>
  );
}
