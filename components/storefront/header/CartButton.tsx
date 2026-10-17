"use client";

import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";
import { useCartCount } from "@/lib/store/counts";

type CartButtonProps = {
  href: string;
  label: string;
};

/** Bag icon with a count pill; the pill is hidden while the count is 0. */
export default function CartButton({ href, label }: CartButtonProps) {
  const count = useCartCount();

  return (
    <Link
      href={href}
      aria-label={label}
      className="relative inline-flex size-11 items-center justify-center rounded-md transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:size-10"
    >
      <ShoppingBagIcon aria-hidden="true" className="size-5" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
