import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageContainer,
  PageHeader,
  Section,
  CardShell,
  CardContent,
  CardHeader,
  ListShell,
  ListItem,
  DetailShell,
  Stack,
  ResponsiveGrid,
} from "@/components/storefront/primitives";
import { LoadingState, EmptyState, SuccessState, FormField } from "@/components/storefront/states";
import { RetryDemo } from "@/components/prototype/RetryDemo";
import { HomeDiscoveryContent, type HomeMessages } from "@/components/storefront/home/HomeDiscoveryContent";
import { HomeDiscoveryRetryPreview } from "@/components/prototype/HomeDiscoveryRetryPreview";
import {
  getBrandBrowseResult,
  getCategoryBrowseResult,
  getCollectionBrowseResult,
  getHomeDiscovery,
  getMockAnalyticsCards,
  getMockCategories,
  getMockCollections,
  getMockOrders,
  getMockPersonas,
  getMockProducts,
  getMockShops,
  getSearchBrowseResult,
  type MockScenario,
} from "@/lib/mock";
import { formatPrice } from "@/lib/catalog/price";
import type { Locale } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Prototype Foundation",
  robots: { index: false, follow: false },
};

const scenarios: MockScenario[] = ["default", "empty", "loading", "error", "success"];

export default async function PrototypeShowcasePage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("Prototype");
  const tp = await getTranslations("Pages");
  const th = await getTranslations("Home");

  const categories = getMockCategories({ scenario: "default" }).data ?? [];
  const products = getMockProducts({ scenario: "default" }).data ?? [];
  const orders = getMockOrders({ scenario: "default" }).data ?? [];
  const shops = getMockShops({ scenario: "default" }).data ?? [];
  const personas = getMockPersonas({ scenario: "default" }).data ?? [];
  const analytics = getMockAnalyticsCards({ scenario: "default" }).data ?? [];
  const emptyResult = getMockProducts({ scenario: "empty" });
  const loadingResult = getMockProducts({ scenario: "loading" });
  const errorResult = getMockProducts({ scenario: "error" });

  const homeMessages: HomeMessages = {
    trustTitle: th("trustTitle"),
    featuredCategoriesTitle: th("featuredCategoriesTitle"),
    featuredCategoriesDescription: th("featuredCategoriesDescription"),
    promotionsTitle: th("promotionsTitle"),
    promotionsDescription: th("promotionsDescription"),
    featuredProductsTitle: th("featuredProductsTitle"),
    featuredProductsDescription: th("featuredProductsDescription"),
    brandsTitle: th("brandsTitle"),
    brandsDescription: th("brandsDescription"),
    closingTitle: th("closingTitle"),
    closingDescription: th("closingDescription"),
    viewCategory: th("viewCategory"),
    viewProduct: th("viewProduct"),
    viewBrand: th("viewBrand"),
    fromCareu: th("fromCareu"),
    fromSeller: th("fromSeller"),
    ratingLabel: th("ratingLabel"),
    reviewsLabel: th("reviewsLabel"),
    sectionEmptyTitle: th("sectionEmptyTitle"),
    sectionEmptyMessage: th("sectionEmptyMessage"),
    pageErrorTitle: th("pageErrorTitle"),
    pageErrorMessage: th("pageErrorMessage"),
    loadingTitle: th("loadingTitle"),
    loadingMessage: th("loadingMessage"),
    prototypeNote: th("prototypeNote"),
  };

  const homeDefault = getHomeDiscovery({ scenario: "default" });
  const homeLoading = getHomeDiscovery({ scenario: "loading" });
  const homeEmpty = getHomeDiscovery({ scenario: "empty" });

  const browseCategory = getCategoryBrowseResult("electronics", new URLSearchParams(), { scenario: "default" });
  const browseCollection = getCollectionBrowseResult("everyday-tech-picks", new URLSearchParams(), { scenario: "default" });
  const browseBrand = getBrandBrowseResult("careu-select", new URLSearchParams(), { scenario: "default" });
  const browseSearch = getSearchBrowseResult(new URLSearchParams("q=phone"), { scenario: "default" });
  const browseSearchEmpty = getSearchBrowseResult(new URLSearchParams("q=zzzz-not-found"), { scenario: "default" });
  const browseCollections = getMockCollections({ scenario: "default" }).data ?? [];

  return (
    <PageContainer className="space-y-10 py-10 sm:py-14">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={<Badge variant="secondary">Facade · Prototype</Badge>}
      />

      <Section id="home-discovery" title="Home and discovery journey" description="Feature 6 preview: hero, trust, categories, campaigns, featured products, brands, editorial, and closing links in default, loading, empty, and error scenarios.">
        <div className="space-y-8">
          <CardShell className="overflow-hidden">
            <CardHeader>
              <h3 className="font-semibold">Default state</h3>
              <p className="text-sm text-muted-foreground">Believable mock content, BDT pricing, and navigable prototype links.</p>
            </CardHeader>
            <div className="border-t">
              <HomeDiscoveryContent result={homeDefault} locale={locale} messages={homeMessages} />
            </div>
          </CardShell>

          <div className="grid gap-6 xl:grid-cols-2">
            <CardShell className="overflow-hidden">
              <CardHeader>
                <h3 className="font-semibold">Loading state</h3>
              </CardHeader>
              <div className="border-t">
                <HomeDiscoveryContent result={homeLoading} locale={locale} messages={homeMessages} />
              </div>
            </CardShell>
            <CardShell className="overflow-hidden">
              <CardHeader>
                <h3 className="font-semibold">Empty state</h3>
              </CardHeader>
              <div className="border-t">
                <HomeDiscoveryContent result={homeEmpty} locale={locale} messages={homeMessages} />
              </div>
            </CardShell>
          </div>

          <CardShell className="overflow-hidden">
            <CardHeader>
              <h3 className="font-semibold">Error state with retry (showcase)</h3>
              <p className="text-sm text-muted-foreground">Clear error and recovery affordance in prototype preview context.</p>
            </CardHeader>
            <div className="border-t">
              <HomeDiscoveryRetryPreview locale={locale} messages={homeMessages} retryLabel={th("retry")} />
            </div>
          </CardShell>
        </div>
      </Section>

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
                <p><span className="font-medium">{t("totalLabel")}:</span> {formatPrice(BigInt(orders[0]?.grandTotalBdt ?? 0), locale)}</p>
              </CardContent>
            </CardShell>
            <ListShell>
              <div className="px-4 py-3 sm:px-5"><h3 className="font-semibold">{t("sampleListTitle")}</h3></div>
              {categories.slice(0, 4).map((c) => (
                <ListItem key={c.id}>
                  <div>
                    <p className="font-medium">{locale === "bn" ? c.name.bn : c.name.en}</p>
                    <p className="text-sm text-muted-foreground">{c.slug}</p>
                  </div>
                  <Badge variant="outline">{locale === "bn" ? c.name.en : c.name.bn}</Badge>
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

      <Section id="browse-search-brand" title="Customer browse, search, and brand journey" description="Feature 7 preview: category, collection, brand, and search surfaces on mock data with filters, sort, pagination, breadcrumbs, and states.">
        <div className="grid gap-4 lg:grid-cols-2">
          <CardShell>
            <CardHeader><h3 className="font-semibold">Default browse results</h3></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Category (electronics):</span> {browseCategory.scenario === "default" && browseCategory.data ? `${browseCategory.data.totalCount} items` : "n/a"}</p>
              <p><span className="font-medium">Collection (everyday tech):</span> {browseCollection.scenario === "default" && browseCollection.data ? `${browseCollection.data.totalCount} items` : "n/a"}</p>
              <p><span className="font-medium">Brand (CareU Select):</span> {browseBrand.scenario === "default" && browseBrand.data ? `${browseBrand.data.totalCount} items` : "n/a"}</p>
              <p><span className="font-medium">Search (phone):</span> {browseSearch.scenario === "default" && browseSearch.data && browseSearch.data !== "empty_query" ? `${browseSearch.data.totalCount} items` : "n/a"}</p>
              <p><span className="font-medium">Search (no results):</span> {browseSearchEmpty.scenario === "default" && browseSearchEmpty.data && browseSearchEmpty.data !== "empty_query" ? `${browseSearchEmpty.data.totalCount} items` : "n/a"}</p>
              <p><span className="font-medium">Collections:</span> {browseCollections.length}</p>
            </CardContent>
          </CardShell>
          <CardShell>
            <CardHeader><h3 className="font-semibold">Try prototype routes</h3></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li><a className="text-foreground underline underline-offset-4" href={`/${locale}/category/electronics`}>/category/electronics</a></li>
                <li><a className="text-foreground underline underline-offset-4" href={`/${locale}/collection/everyday-tech-picks`}>/collection/everyday-tech-picks</a></li>
                <li><a className="text-foreground underline underline-offset-4" href={`/${locale}/brand/careu-select`}>/brand/careu-select</a></li>
                <li><a className="text-foreground underline underline-offset-4" href={`/${locale}/search?q=phone`}>/search?q=phone</a></li>
                <li><a className="text-foreground underline underline-offset-4" href={`/${locale}/search`}>/search (empty query state)</a></li>
                <li><a className="text-foreground underline underline-offset-4" href={`/${locale}/search?q=zzzz`}>/search?q=zzzz (no results)</a></li>
              </ul>
            </CardContent>
          </CardShell>
        </div>
        <p className="text-xs text-muted-foreground">Browse journey uses mock data only: URL based filters/sort/pagination, UI only wishlist/cart quick actions, and no real backend, auth, payment, or stock writes.</p>
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
              <p><span className="font-medium">home default:</span> {homeDefault.scenario === "default" && homeDefault.data.featuredProducts.length} featured products</p>
            </CardContent>
          </CardShell>
          <CardShell>
            <CardHeader><h3 className="font-semibold">{t("groupsLabel")}</h3></CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                <li>Catalog: {categories.length} categories, {products.length} products</li>
                <li>Home: hero, trust, categories, campaigns, products, brands, editorial, closing links</li>
                <li>Shops & sellers: {shops.length} shops</li>
                <li>Personas: {personas.length} views</li>
                <li>Orders: {orders.length} orders</li>
                <li>Analytics: {analytics.length} cards</li>
                <li>Coverage: cart, wishlist, addresses, payments, COD, reviews, support, disputes, returns, inventory, payouts, settlements, commissions, moderation, delivery, notifications, content</li>
              </ul>
            </CardContent>
          </CardShell>
        </div>
        <p className="text-xs text-muted-foreground">Prototype only: mock data, no real database reads or writes, no real auth enforcement. Placeholder routes remain navigable: {tp("search")}, {tp("cart")}, {tp("wishlist")}, {tp("account")}, {tp("trackOrder")}, category/product/brand/campaign/collection pages.</p>
      </Section>
    </PageContainer>
  );
}
