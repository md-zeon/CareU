"use client";

import Link from "next/link";
import { HeartIcon } from "lucide-react";
import { useWishlistCount } from "@/lib/store/counts";

type WishlistButtonProps = {
  href: string;
  label: string;
};

/** Wishlist icon with a count pill; the pill is hidden while the count is 0. */
export default function WishlistButton({ href, label }: WishlistButtonProps) {
  const count = useWishlistCount();

  return (
    <Link
      href={href}
      aria-label={label}
      className="relative inline-flex size-11 items-center justify-center rounded-md transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 sm:size-10"
    >
      <HeartIcon aria-hidden="true" className="size-5" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 font-semibold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
