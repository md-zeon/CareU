"use client";

import { useState } from "react";
import { HeartIcon, ShoppingBagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BrowseQuickActions({
  wishlistLabel,
  cartLabel,
  wishlistAddedLabel,
  cartAddedLabel,
}: {
  wishlistLabel: string;
  cartLabel: string;
  wishlistAddedLabel: string;
  cartAddedLabel: string;
}) {
  const [wish, setWish] = useState(false);
  const [cart, setCart] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function flash(text: string) {
    setMsg(text);
    window.setTimeout(() => setMsg((m) => (m === text ? null : m)), 1500);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={wish ? "secondary" : "outline"}
          size="icon-sm"
          aria-label={wish ? wishlistAddedLabel : wishlistLabel}
          aria-pressed={wish}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setWish((v) => !v);
            if (!wish) flash(wishlistAddedLabel);
          }}
        >
          <HeartIcon className={cn("size-4", wish && "fill-current")} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant={cart ? "secondary" : "outline"}
          size="icon-sm"
          aria-label={cart ? cartAddedLabel : cartLabel}
          aria-pressed={cart}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCart((v) => !v);
            if (!cart) flash(cartAddedLabel);
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
    </div>
  );
}
