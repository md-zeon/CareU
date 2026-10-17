"use client";

import type { ReactNode } from "react";
import { XIcon } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type DrawerPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
};

/**
 * The Base UI drawer itself, loaded on demand (see MobileNav).
 * Kept in its own module so the heavy drawer chunk is not part of the
 * initial page load.
 */
export default function DrawerPanel({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
}: DrawerPanelProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="left">
      <DrawerContent className="w-full rounded-none!">
        <DrawerHeader className="flex-row items-center justify-between gap-2 border-b pb-4">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerClose
            aria-label={closeLabel}
            className="inline-flex size-9 items-center justify-center rounded-md transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <XIcon aria-hidden="true" className="size-5" />
          </DrawerClose>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
