import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageContainer, PageHeader, Section, CardShell, CardContent, CardHeader, ListShell, ListItem, DetailShell, Stack, ResponsiveGrid } from "@/components/storefront/primitives";
import { LoadingState, EmptyState, SuccessState, FormField } from "@/components/storefront/states";
import { RetryDemo } from "@/components/prototype/RetryDemo";
import {
  getMockAnalyticsCards,
  getMockCategories,
  getMockOrders,
  getMockPersonas,
  getMockProducts,
  getMockShops,
  type MockScenario,
} from "@/lib/mock";
import { formatPrice } from "@/lib/catalog/price";

export const metadata: Metadata = {
  title: "Prototype Foundation",
  robots: { index: false, follow: false },
};

const scenarios: MockScenario[] = ["default", "empty", "loading", "error", "success"];

export default async function PrototypeShowcasePage() {
  const t = await getTranslations("Prototype");
  const tp = await getTranslations("Pages");
  const categories = getMockCategories({ scenario: "default" }).data ?? [];
  const products = getMockProducts({ scenario: "default" }).data ?? [];
  const orders = getMockOrders({ scenario: "default" }).data ?? [];
  const shops = getMockShops({ scenario: "default" }).data ?? [];
  const personas = getMockPersonas({ scenario: "default" }).data ?? [];
  const analytics = getMockAnalyticsCards({ scenario: "default" }).data ?? [];
  const emptyResult = getMockProducts({ scenario: "empty" });
  const loadingResult = getMockProducts({ scenario: "loading" });
  const errorResult = getMockProducts({ scenario: "error" });

  return (
    <PageContainer className="space-y-10 py-10 sm:py-14">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={<Badge variant="secondary">Facade · Prototype</Badge>}
      />

      <Section id="layout" title={t("layoutTitle")} description={t("layoutDescription")}>
        <DetailShell>
          <CardShell>
            <CardHeader>
              <h3 className="font-semibold">{t("sampleDetailTitle")}</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <ResponsiveGrid className="xl:grid-cols-2">
                {products.slice(0, 2).map((p) => (
                  <CardShell key={p.id} className="rounded-xl">
                    <CardContent className="space-y-2">
                      <p className="font-medium">{p.title.en}</p>
                      <p className="text-sm text-muted-foreground">{p.description.en}</p>
                      <p className="text-sm font-semibold">
                        {t("statusLabel")}: <span className="font-normal text-muted-foreground">{p.status}</span>
                      </p>
                    </CardContent>
                  </CardShell>
                ))}
              </ResponsiveGrid>
            </CardContent>
          </CardShell>

          <Stack>
            <CardShell>
              <CardHeader>
                <h3 className="font-semibold">{t("sampleCardTitle")}</h3>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">{t("shopLabel")}:</span> {shops[0]?.name.en} ({t("careuShop")})</p>
                <p><span className="font-medium">{t("orderLabel")}:</span> {orders[0]?.orderNumber}</p>
                <p><span className="font-medium">{t("totalLabel")}:</span> {formatPrice(BigInt(orders[0]?.grandTotalBdt ?? 0), "en")}</p>
              </CardContent>
            </CardShell>
            <ListShell>
              <div className="px-4 py-3 sm:px-5"><h3 className="font-semibold">{t("sampleListTitle")}</h3></div>
              {categories.slice(0, 4).map((c) => (
                <ListItem key={c.id}>
                  <div>
                    <p className="font-medium">{c.name.en}</p>
                    <p className="text-sm text-muted-foreground">{c.slug}</p>
                  </div>
                  <Badge variant="outline">{c.name.bn}</Badge>
                </ListItem>
              ))}
            </ListShell>
          </Stack>
        </DetailShell>
      </Section>

      <Section id="states" title={t("statesTitle")} description={t("statesDescription")}>
        <ResponsiveGrid className="xl:grid-cols-2">
          <LoadingState title={t("loadingTitle")} message={t("loadingMessage")} />
          <EmptyState
            title={t("emptyTitle")}
            message={t("emptyMessage")}
            action={<Button variant="outline" size="sm">{t("emptyAction")}</Button>}
          />
          <RetryDemo
            errorTitle={t("errorTitle")}
            errorMessage={t("errorMessage")}
            retryLabel={t("retry")}
            successTitle={t("successTitle")}
            successMessage={t("successMessage")}
          />
          <SuccessState title={t("successTitle")} message={t("successMessage")} />
        </ResponsiveGrid>
      </Section>

      <Section id="form-feedback" title={t("formTitle")} description={t("statesDescription")}>
        <ResponsiveGrid className="xl:grid-cols-3">
          <CardShell><CardContent>
            <FormField label={t("formFieldLabel")} htmlFor="demo-help" help={t("formHelp")}> 
              <Input id="demo-help" placeholder={t("formFieldPlaceholder")} aria-describedby="demo-help-help" />
            </FormField>
          </CardContent></CardShell>
          <CardShell><CardContent>
            <FormField label={t("formFieldLabel")} htmlFor="demo-error" error={t("formError")}> 
              <Input id="demo-error" placeholder={t("formFieldPlaceholder")} aria-invalid="true" aria-describedby="demo-error-error" />
            </FormField>
          </CardContent></CardShell>
          <CardShell><CardContent>
            <FormField label={t("formFieldLabel")} htmlFor="demo-success" success={t("formSuccess")}> 
              <Input id="demo-success" defaultValue="nadia@example.com" aria-describedby="demo-success-success" />
            </FormField>
          </CardContent></CardShell>
        </ResponsiveGrid>
      </Section>

      <Section id="mock-coverage" title={t("mockTitle")} description={t("mockDescription")}>
        <div className="grid gap-4 lg:grid-cols-2">
          <CardShell>
            <CardHeader><h3 className="font-semibold">{t("scenariosLabel")}</h3></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">{scenarios.map((s) => <Badge key={s} variant={s === "default" ? "default" : "secondary"}>{s}</Badge>)}</div>
              <p><span className="font-medium">empty:</span> {Array.isArray(emptyResult.data) ? emptyResult.data.length : "n/a"} items</p>
              <p><span className="font-medium">loading:</span> {loadingResult.scenario === "loading" ? "null data" : "n/a"}</p>
              <p><span className="font-medium">error:</span> {errorResult.scenario === "error" ? errorResult.message.en : "n/a"}</p>
            </CardContent>
          </CardShell>
          <CardShell>
            <CardHeader><h3 className="font-semibold">{t("groupsLabel")}</h3></CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                <li>Catalog: {categories.length} categories, {products.length} products</li>
                <li>Shops & sellers: {shops.length} shops</li>
                <li>Personas: {personas.length} views</li>
                <li>Orders: {orders.length} orders</li>
                <li>Analytics: {analytics.length} cards</li>
                <li>Coverage: cart, wishlist, addresses, payments, COD, reviews, support, disputes, returns, inventory, payouts, settlements, commissions, moderation, delivery, notifications, content</li>
              </ul>
            </CardContent>
          </CardShell>
        </div>
        <p className="text-xs text-muted-foreground">Prototype only: mock data, no real database reads or writes, no real auth enforcement. Placeholder routes remain navigable: {tp("search")}, {tp("cart")}, {tp("wishlist")}, {tp("account")}, {tp("trackOrder")}.</p>
      </Section>
    </PageContainer>
  );
}
