import StorefrontHeader from "@/components/storefront/header/StorefrontHeader";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <StorefrontHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <StorefrontFooter />
    </div>
  );
}
