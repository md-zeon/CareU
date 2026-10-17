"use client";

import { lazy, Suspense, useState, type ReactNode } from "react";
import { MenuIcon } from "lucide-react";

// Loaded on first tap/click only — keeps the Base UI drawer chunk (~54 KB gz)
// out of the initial payload. On desktop this chunk is never fetched at all.
const DrawerPanel = lazy(() => import("./DrawerPanel"));

type MobileNavProps = {
  /** Accessible labels supplied by the server via next-intl. */
  menuLabel: string;
  closeLabel: string;
  title: string;
  /** Server-rendered drawer body (categories, account, locale switcher). */
  children: ReactNode;
};

/**
 * Mobile navigation trigger + on-demand drawer shell.
 *
 * The trigger button is always rendered (part of the static shell); the
 * drawer primitives hydrate lazily on first interaction. Everything inside
 * the panel is server-rendered and passed through `children`.
 */
export default function MobileNav({
  menuLabel,
  closeLabel,
  title,
  children,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [panelLoaded, setPanelLoaded] = useState(false);

  const handleOpen = () => {
    setPanelLoaded(true);
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={menuLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex size-11 items-center justify-center rounded-md transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
      >
        <MenuIcon aria-hidden="true" className="size-5" />
      </button>

      {panelLoaded && (
        <Suspense fallback={null}>
          <DrawerPanel
            open={open}
            onOpenChange={setOpen}
            title={title}
            closeLabel={closeLabel}
          >
            {children}
          </DrawerPanel>
        </Suspense>
      )}
    </>
  );
}
