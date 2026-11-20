"use client";

import { useState } from "react";
import { HeartIcon, ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlistActionGate } from "@/lib/prototype/useWishlistActionGate";
import { useSharedStore, useSharedStoreActions } from "@/lib/store/shared/hooks";
import { cn } from "@/lib/utils";

export function BrowseQuickActions({
  productId,
  variantId,
  shopId,
  disabled,
  wishlistLabel,
  cartLabel,
  wishlistAddedLabel,
  cartAddedLabel,
}: {
  productId: string;
  variantId: string | null;
  shopId: string;
  disabled?: boolean;
  wishlistLabel: string;
  cartLabel: string;
  wishlistAddedLabel: string;
  cartAddedLabel: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const actions = useSharedStoreActions();
  const { run, gate } = useWishlistActionGate();
  const inCart = useSharedStore((state) =>
    state.activeCartLines.some(
      (line) => line.productId === productId && line.variantId === variantId,
    ),
  );
  const inWishlist = useSharedStore((state) =>
    state.wishlistLines.some(
      (line) => line.productId === productId && line.variantId === variantId,
    ),
  );

  function flash(text: string) {
    setMsg(text);
    window.setTimeout(() => setMsg((current) => (current === text ? null : current)), 1500);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={inWishlist ? "secondary" : "outline"}
          size="icon-sm"
          aria-label={inWishlist ? wishlistAddedLabel : wishlistLabel}
          aria-pressed={inWishlist}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            run(() => {
              if (!inWishlist) {
                actions.addToWishlist({ productId, variantId, shopId });
                flash(wishlistAddedLabel);
              }
            });
          }}
        >
          <HeartIcon className={cn("size-4", inWishlist && "fill-current")} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant={inCart ? "secondary" : "outline"}
          size="icon-sm"
          disabled={disabled}
          aria-label={inCart ? cartAddedLabel : cartLabel}
          aria-pressed={inCart}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            actions.addToCart({ productId, variantId, shopId, quantity: 1 });
            flash(cartAddedLabel);
          }}
        >
          <ShoppingBagIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {msg ? (
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {msg}
        </p>
      ) : null}
      {gate}
    </div>
  );
}
