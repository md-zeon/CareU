# CareU.bd — Agent Guide

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`; do not remove it.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:skills-agent-rules -->

This is not the skills you know. Read the relevant guide in
`.agents/skills` before writing any code. Heed deprecation notices.

<!-- END:skills-agent-rules -->

## Project

CareU.bd — a Bangladesh-first multi-vendor marketplace with a CareU-operated
first-party store. Two sales models (third-party seller shops and CareU's own
inventory) sharing catalogue, checkout, order, inventory, delivery and support
workflows — but **never** sharing commission, seller-balance or payout
accounting. See "Product architecture" below.

## Stack

**Installed and verified** (`package.json` @ commit `5524e2c`):

- Next.js 16.4 (App Router, TypeScript, Turbopack), React 19.3
- `cacheComponents: true` + `partialPrefetching: true` in `next.config.ts`
- Tailwind CSS v4 + shadcn/ui on **Base UI** primitives (`base-vega` style)
- next-intl 4.14 — locales `en` (default) + `bn`, `localePrefix: 'always'`
  (next-intl's default; `lib/i18n/routing.ts` does not set it explicitly)
- Prisma **7.10.1** + `@prisma/client` 7.10.1 + `@prisma/adapter-pg` 7.10.1
- Better Auth 1.7.11 + `@better-auth/prisma-adapter` 1.7.11
- `lucide-react`, `clsx`/`tailwind-merge` (`cn`), `dotenv` (dev)
- Node v24 (TS type-stripping available for scripts)

**Not yet installed** — do not import until you add them:
`zustand`, `react-hook-form`, `zod`, `sonner`, `date-fns`, `@better-auth/cli`,
`tsx`, any test runner.

**Targets** (not yet provisioned): Vercel (`sin1`) behind Cloudflare; Neon
Postgres (`aws-ap-southeast-1`) — **runtime driver is a pending decision**;
SSLCommerz for online payments — **confirmed** initial online gateway;
product media storage — **pending decision** (Cloudflare R2 vs. Cloudinary);
Bunny Stream for video. **Local dev runs against PostgreSQL 18.1 on
`localhost:5432`, database `careu_db`.**

## Commands

- `npm run dev` — dev server
- `npm run build` — must pass before committing (also the static/dynamic audit)
- `npm run lint` — ESLint (`eslint.config.mjs`, `eslint-config-next` core-web-vitals + typescript)
- `npm run typecheck` — `tsc --noEmit` (script exists)
- `npm run generate` — `prisma generate` (also runs on `postinstall`)
- `npm run migrate` — `prisma migrate dev`
- `npm run db:deploy` — `prisma migrate deploy`
- `npm run db:push` — `prisma db push` (dev-only; never on production)
- `npm run studio` — `prisma studio`
- **No test script and no test runner exist.** Add one before claiming test
  coverage; `npm run test` must exist and pass before a change is "done" if
  the change touches permissions, inventory, payments, orders, refunds or
  commissions.

## Verified status — do not overstate

**Exists and works:** Next 16 shell + Tailwind v4/Base UI theme + dark mode;
next-intl (`en`/`bn`, locale from `next/root-params`); Hind Siliguri + Inter via
`next/font`; storefront header (announcement bar, mega menu, GET-form search,
mobile drawer), footer; session-aware `AccountArea` behind `<Suspense>`;
Better Auth (phone OTP + email OTP, DB-backed rate limiting, cookie cache);
Prisma 7 + pg adapter + one applied migration; `formatPrice()` integer-BDT
helper; `lib/catalog/menu.ts` (static seed data behind a `'use cache'` facade);
`lib/provider/{email,sms}.ts` (console stubs that refuse to run in production).

**Placeholder only:** `/` (five empty section headings), `/search`, `/cart`,
`/wishlist`, `/account`, `/order/track`, `/login`, `/register` — all render
`Placeholder.message`. `lib/store/counts.ts` returns `0`.

**Does not exist yet:** every marketplace domain model, RBAC, admin area,
seller dashboard, checkout, stock reservation, payment/IPN, fulfilment,
delivery, coupons, tax, notifications, support cases, disputes, settlements,
audit log, real search, media/storage integration, seed script, and tests.
The only Prisma models are the five Better Auth ones in
`prisma/schema/auth.prisma`.

## Layout

- `app/[locale]/` — all routes; locale is always in the path. Route groups:
  `(auth)` (login/register, minimal chrome) and `(storefront)`.
- `app/api/auth/[...all]/route.ts` — Better Auth handler (`toNextJsHandler`).
- `proxy.ts` — Next 16 middleware (renamed from `middleware.ts`); next-intl
  locale routing. Matcher excludes `api|trpc|_next|_vercel|.*\..*`.
- `lib/` — server-only domain logic. NEVER query Prisma from a component.
  Group by domain (`lib/catalog/`, `lib/i18n/`, `lib/provider/`, `lib/store/`).
- `components/ui/` — generated shadcn components; avoid hand-editing.
- `components/storefront/` — storefront feature components.
- `lib/i18n/messages/` — next-intl catalogs (`en.json`, `bn.json`).
- `node_modules/next/dist/docs/` — authoritative docs for this Next version.
- `prisma/schema/` — multi-file Prisma schema **directory**:
  - `schema.prisma` — generator + datasource only (no models).
  - `auth.prisma` — the Better Auth models.
- `prisma7.config.ts` — Prisma CLI config (root, next to `package.json`).
- `lib/generated/prisma/` — generated client; **gitignored**, never edited.

## Hard rules

### Money & data

- All money is integer BDT. Never float, never Prisma `Decimal`.
- One transaction currency per order. Snapshot the currency, the applied
  exchange rate and the converted amount on the order — never recompute a
  historical order with today's rate. Store FX rates as scaled integers
  (fixed-point), never floats.
- Keep `PaymentStatus` and `FulfillmentStatus` as separate fields.
- Order lines, orders, refunds and settlements keep immutable financial
  snapshots (title, SKU/variant, unit price, quantity, discount, delivery fee,
  tax, commission). Never rewrite history to "fix" a transaction — post a
  correcting entry.

### Caching

- Public/shared catalogue reads: `'use cache'` + `cacheLife(...)` +
  `cacheTag(...)`.
- **Per-user, per-shop, per-order, per-permission reads: `'use cache: private'`
  (or no cache).** A shared `'use cache'` scope that keys on user identity
  leaks one user's data to another.
- NEVER call `headers()` or `cookies()` inside a plain `'use cache'` scope.
  Exception: `'use cache: private'` scopes MAY read them (browser-only,
  request-time) — that's where session reads belong.
- `generateStaticParams` returns slugs only (one cheap query) — never full rows.
- On admin save: `updateTag(tag)`. In the background: `revalidateTag(tag, 'max')`.
- Never cache carts, orders, permissions, payouts or any personalized content
  in a shared scope.

### Auth

- `lib/auth.ts` must stay **CLI-clean** — the Better Auth CLI loads it in
  plain Node via jiti: no `server-only` import, no `@/` path aliases, relative
  imports only. `lib/prisma.ts` is imported by `lib/auth.ts`, so it must NOT
  import `server-only` either. Session helpers live in `lib/session.ts`
  (`server-only` is allowed there).
- The CLI needs `DATABASE_URL` present and `lib/generated/prisma` generated
  (`npm run generate`) before `npx auth` will run.
- `@better-auth/cli` is not a local dependency — `npx auth` fetches it
  unpinned. Pin it in `devDependencies` before relying on it.
- After every `npx auth generate`, restore the generator block — it rewrites
  the files under `prisma/schema/` and drops the `output` path. The block must
  read `provider = "prisma-client"` and `output = "../../lib/generated/prisma"`
  (the schema lives in `prisma/schema/`, so the path is two levels up).
  Pass `--yes` to skip the overwrite prompt. Never use `npx prisma@latest`
  (Prisma 8 is RC; `latest` resolves to v8 and breaks the toolchain).
- OTP sends (`sendOTP`, `sendVerificationOTP`) must return fast: dispatch via
  `after()` from `next/server` — never `await` the SMS/email send.
- SMS is behind the `lib/provider/sms.ts` interface; email behind
  `lib/provider/email.ts`. The console stubs must refuse to run when
  `NODE_ENV === 'production'`.
- Session reads: `getCurrentUser` in `lib/session.ts` is a `use cache: private`
  function (Next Cache Components auth guide). Call it only from Suspense-leaf
  server components — never from a layout top level and never from inside a
  plain `'use cache'` scope.
- In **route handlers and server actions**, resolve the session directly with
  `auth.api.getSession({ headers: await headers() })` — the cached helper is
  for Suspense-leaf rendering only.
- Keep `session.cookieCache` enabled, but narrow the returned user to
  `{id, name, email?, phone?}` — never pass the full session user down.
- Rate limiting is DB-backed (`storage: "database"`) with tight custom rules
  on the OTP endpoints (re-run `npx auth generate` after changing it — it
  manages the `RateLimit` model). Client IP comes from `cf-connecting-ip`
  only (we sit behind Cloudflare).
- BD phone numbers must match `/^(\+880|0)1[3-9]\d{8}$/` (`phoneNumberValidator`).
- `nextCookies()` is the LAST plugin in the array.

### Authorization & RBAC

- Enforce authorization on the server for **every** protected operation.
  Hiding a button is not authorization.
- Derive the acting user, their roles, their shop scope and their permissions
  from the trusted server-side session. Never trust a client-supplied
  `role`, `shopId`, `sellerId` or `isAdmin`.
- Shop-scoped staff must not read or mutate another shop's data and must not
  perform platform-level actions. Platform permissions (CareU catalogue,
  pricing, procurement, inventory, margins) are separate from shop permissions.
- Customer-support permissions are separate from financial permissions.
- Least privilege by default: newly invited staff receive no sensitive
  permission automatically.
- Audit every sensitive administrative, financial, pricing, inventory,
  seller-trust, moderation and settlement action.

### Commerce integrity

- Stock decrement must be atomic, inside the order transaction:
  `UPDATE variants SET stock = stock - $qty WHERE id = $id AND stock >= $qty`
  then verify affected rows.
- Multi-seller checkout is all-or-nothing for required items: reserve all
  stock in one transaction; on any failure roll the whole attempt back.
- Reservations are idempotent, expire on a configurable duration, and release
  safely under concurrent checkout.
- Never trust client-provided totals: revalidate price, stock, discount,
  delivery fee, tax and totals server-side at checkout.
- Payment callbacks (IPN/webhook) must be verified and idempotent. A browser
  redirect is **not** proof of payment — only a verified server-to-server
  callback or a reconciled gateway query may settle an order.
- Reconcile delayed, uncertain and duplicate payment notifications before
  finalizing order or stock state. Never apply a financial effect twice.
- Refunds, disputes, payout batches and stock adjustments are manual,
  admin-approved, reasoned and audited.

### i18n

- Every user-facing string goes through next-intl. No hardcoded text.
- In `lib/i18n/request.ts`, read the locale from `next/root-params` ONLY.
  Never use the `requestLocale` param — it reads `headers()` and silently
  opts every route into dynamic rendering, defeating
  `cacheComponents` + `generateStaticParams`.
- In Server Components read the locale with `next/root-params` or
  `getLocale()` from `next-intl/server` (both are safe: `getLocale()` shares
  `getConfig()` with `getTranslations()`, which does not read headers here).
  Never use `getRequestLocale()` / `requestLocale`.
- Passing the locale to a **Client** Component as a prop is correct (it needs
  it for `Intl` formatting). Avoid threading it through several layers of
  Server Components — read it where you need it.
- Keep messages server-side. If a Client Component needs translations, give it
  only that namespace via `NextIntlClientProvider` — never ship the whole
  catalog to the client from a root provider. Prefer passing already-translated
  strings down as props from Server Components.

### SEO (mandatory)

- Use semantic HTML and server-render or statically generate public content
  wherever appropriate. Public product, category and landing pages must be
  crawlable **without a customer session**.
- Every indexable page gets a unique, accurate `<title>` and meta description
  via `generateMetadata`. Never reuse a template across products/categories.
- Set `metadataBase` (currently missing) and emit absolute canonical URLs via
  `alternates.canonical`. One canonical URL per page — decide, per route, whether
  pagination, filters, sort, and search queries are canonical, redirected, or
  `noindex`. Never let filter/sort permutations compete as duplicates.
- Emit `alternates.languages` for `en`/`bn` with `x-default`, only where the
  translated page genuinely exists. Do not point `hreflang` at 404s.
- Generate valid XML sitemaps (`app/sitemap.ts`) containing **only** canonical,
  indexable URLs — split per locale, exclude faceted/search URLs, admin,
  account, checkout and other private routes. Sitemap URLs must match the
  canonical URLs exactly.
- Configure robots directives (`app/robots.ts`) so crawlers can fetch the
  resources needed to render public pages. Never block CSS/JS/images that
  public pages need, and never block the sitemap.
- Implement Open Graph and social sharing metadata for public pages.
- Add JSON-LD structured data where the visible page content supports it:
  `Product` + `Offer`, `BreadcrumbList`, `Organization`. Structured data must
  reflect real price, availability, currency and rating — **never fabricate
  ratings or reviews**.
- Use descriptive product URLs, real internal linking, breadcrumb navigation,
  and meaningful image `alt` text.
- Do not index private surfaces: dashboards, account pages, cart, checkout,
  internal search results, admin pages, order detail. Use `noindex` and/or
  `robots` rules **in addition to** the access control below, never instead
  of it.
- **`robots.txt` and `noindex` are crawler hints, not security controls.**
  They do not authenticate, authorize or hide anything — a disallowed URL is
  still fetchable by anyone who knows it, and `noindex` is honoured only by
  cooperating crawlers. Private order information (and every record or
  document behind it) must be protected by server-side authorization: resolve
  the session on every read and check that the actor owns the order or holds
  the required permission. For a public order-tracking flow, use a secure,
  scoped, time-limited token that grants access to exactly one order and
  nothing else. An unguessable URL, a token that is not scope-limited, or
  `noindex` is never an access boundary.
- Validate before shipping: metadata presence, canonical correctness,
  sitemap validity, redirect chains and status codes, structured-data
  well-formedness. Do not add a third-party SEO library unless it clearly beats
  what Next's Metadata API already provides.

### Performance (mandatory)

- Prefer React Server Components and server rendering. Add `"use client"` only
  for interactivity or browser APIs.
- Minimize client JavaScript, hydration cost, dependencies and duplicate
  fetching. The ~120 KB gzipped storefront budget is **provisional** — the
  measurement scope (which routes, which build, gzip vs. brotli) and the
  baseline are not yet defined. Define and record both before treating the
  number as a pass/fail gate.
- Use `next/image` with responsive `sizes`, explicit `width`/`height` (or
  `fill` + sized container) and correct `priority` for above-the-fold images.
  Remote hosts (R2, Cloudinary, CDN) must be allow-listed via
  `images.remotePatterns` in `next.config.ts` — it is **not** configured yet.
- Optimize fonts (`next/font` with `display: "swap"` — already used), critical
  rendering path, layout and above-the-fold content.
- Avoid waterfalls and N+1 queries. Select only the fields you need
  (`select`, not `include` of everything) and paginate every potentially
  large result set.
- Add indexes that match real query patterns; verify with the actual execution
  plan before adding one.
- Use caching and revalidation intentionally for public catalogue content.
  Do not disable caching everywhere as a blanket safety measure.
- Keep checkout, stock reservation and financial operations correct under
  concurrent requests.
- Avoid excessive serverless invocations and repeated authentication or
  database work per request (batch, memoize within a request, reuse the
  session read).
- Measure before optimizing. Establish repeatable Lighthouse and Core Web
  Vitals checks rather than making unsupported performance claims. Targets at
  the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.

### Code quality & maintainability

- Strict TypeScript (`strict: true` is on). Avoid `any` unless justified.
- Organize by feature/domain with clear separation between UI, business logic,
  data access, validation and infrastructure. Keep business rules out of
  presentation components.
- Validate untrusted input on the server with shared, reusable schemas (zod
  is the intended library — add it when first needed).
- Use consistent error handling and typed return values. Log with structure
  (actor, action, entity, request id) but never log secrets, session tokens,
  full OTP codes, or unmasked personal data.
- Prefer small, composable modules over giant files, excessive abstraction and
  duplicated business logic.
- Use database transactions and idempotency for anything affecting inventory,
  payments, orders, refunds or settlements.
- Add tests for permissions, inventory concurrency, payment callbacks, order
  totals, commission calculations, refunds and critical user journeys.
- Run `npm run lint`, `npm run typecheck`, `npm run test` (once it exists) and
  `npm run build` before considering work complete.
- Document architectural decisions and significant trade-offs.

### Security, privacy & reliability

- Seller verification documents and proof-of-delivery media live in
  **private, access-controlled** storage, never in the public product-media
  bucket. Serve them through time-limited signed URLs with an auditable
  access log.
- Files uploaded by sellers/users: validate type and size server-side, never
  trust the client's content type, never serve from a public path.
- Keep secrets in environment variables. Never commit secrets, credentials or
  production values, and never echo env values into logs or reports.
- Payment callbacks: verify the gateway signature, reject replays, and make
  the handler idempotent. A successful browser redirect alone never settles an
  order.
- Audit trails for sensitive admin, financial, pricing, inventory,
  seller-trust, moderation and settlement actions; append-only.
- Rate-limit sensitive endpoints (registration, OTP, checkout, refunds,
  support intake) beyond the Better Auth defaults.
- Data retention must be configurable per record type. Account deletion
  **anonymizes** eligible personal data (scramble name/email/phone) while
  retaining financial, order and audit records required for legal compliance
  and to resolve outstanding obligations. Do not hard-delete rows that carry
  financial or audit obligations — `Session`/`Account` cascade on user delete,
  so the user row itself must survive as an anonymized shell.
- Least-privilege authorization throughout; backend enforcement everywhere.
- Private order information is protected by server-side authorization on every
  read: resolve the session, then check ownership or the required permission.
  A public order-tracking link must use a secure, scoped, time-limited token.
  `robots.txt` and `noindex` are discovery hints and are never a security
  boundary.

## Product architecture

### Two sales models

- **Third-party sellers** apply, are approved, operate one shop each, manage
  listings and stock, fulfil orders, and receive eligible settlements.
- **CareU first-party** is CareU's own inventory, managed by platform staff
  with platform permissions (catalogue, pricing, procurement, inventory).
- Both share catalogue, cart, checkout, order, inventory, delivery and support
  workflows. They must NOT share financial treatment: first-party sales are
  excluded from marketplace commission, produce no third-party seller balance,
  and create no seller payout liability. Modelled as one seller/shop entity
  with a first-party flag so the shared pipeline stays single-sourced, with
  the financial distinction enforced at the split/settlement boundary.
- A single checkout may span several third-party sellers and CareU, and
  produces one seller-specific fulfilment record/shipment per shop, each with
  its own status, tracking, delivery charge and payout eligibility.

### Confirmed requirements

Read this list as two different things. A **capability** — the platform must
support the behaviour at all — is confirmed. A **policy** — who qualifies, by
when, at whose cost, under which conditions — is **not** confirmed unless it
is stated here. Build the capability; never hard-code an unapproved policy
default. Every policy value that is still open is listed under "Pending
decisions" below.

- Seller onboarding: individual and business applicants, type-specific
  information and verification documents; admin approve/reject with recorded
  reasons and review history; rejected applicants may correct and resubmit;
  admins grant/revoke trusted-seller status.
- Shop lifecycle: one shop per account; owner invites staff with restricted
  shop-scoped permissions; sellers may pause their shop; admins may suspend;
  pausing/suspending hides listings and stops new sales while existing
  orders, shipments, disputes and settlements continue.
- Catalogue: shared catalogue definitions plus independent seller listings
  against them plus unique products; category tree with category-specific
  attributes; simple and variant-based products with per-variant SKU, price
  and stock; allowed / restricted / prohibited categories configurable by
  admins; untrusted sellers' listings require approval, trusted sellers
  publish subject to configurable moderation; sensitive edits (category,
  price, restricted attributes, product claims) may require review; admins
  review reports and remove listings.
- Inventory: seller-managed and CareU-managed ledgers; every movement
  recorded with a reason (sale, return, restock, damage, adjustment); no
  overselling; no backorders; sensitive adjustments reasoned and audited; one
  CareU stock location at launch with the model ready for more; basic supplier
  receipts (supplier, quantities, unit cost, receipt date, invoice/reference);
  configurable low-stock thresholds and out-of-stock alerts.
- Checkout: customer account required (no guest checkout); cart is
  browser-only; server revalidates everything; all-or-nothing stock
  reservation in one transaction; orders keep full historical snapshots;
  multiple saved delivery addresses.
- Orders & delivery: the platform must **support** partial fulfilment, partial
  cancellation, partial returns and partial refunds, and preserve status
  history; seller-managed and CareU-managed delivery; CareU-managed deliveries
  manually assigned to staff or a courier (no courier API at launch); proof of
  delivery configurable (confirmation, recipient name, optional
  photo/signature, timestamp, staff/courier identity); delivery charges per
  seller shipment, configurable by destination, shipment, method, weight or
  order value, snapshotted. **Which** items are eligible, **when** the
  deadlines fall, **who** bears the shipping cost and **how** a partial action
  affects the money are policies, not confirmed rules — see "Pending
  decisions".
- Payments: COD + online; BDT default; customer sees the actual charge
  currency before confirming; provider-independent payment layer with
  SSLCommerz as the initial online gateway behind a validated IPN; verified,
  idempotent callbacks; pending/failed/delayed/uncertain states handled
  safely; late payments reconciled before stock/order finalisation.
- Commissions & settlements: category-based commission rates; CareU collects
  online payments and settles eligible seller earnings later; manual payout
  batches recording amount, currency, method, destination reference, status and
  transaction references; failed transfers reconciled; COD collection
  coordinated by CareU; earnings become eligible only after delivery, expiry
  of the return window and no blocking dispute; eligibility computed at
  item/seller-order granularity so one seller's dispute does not block
  unrelated sellers; refunds reviewed and processed manually by admins. The
  eligibility *mechanism* is confirmed; the return-window length it waits on
  is a pending policy.
- Discounts: coupons and campaigns with eligibility and usage limits; funded
  by CareU, sellers or both; multi-seller discounts allocated proportionally
  across eligible items with traceable funding and allocation; seller earnings
  and commission treatment configurable per campaign; allocations snapshotted.
- Tax: configurable country/region tax *rules* exist and the applied tax is
  snapshotted on the order; Bangladesh at launch; architecture extensible to
  other jurisdictions' currency, tax, address, payment and delivery
  configuration. Whether a tax is actually applied at launch, and its
  inclusive/exclusive treatment and rounding, are pending policies.
- Returns/refunds/disputes: the platform must **support** configurable
  return-eligibility and deadline *settings*, actions gated on item and
  shipment status, exceptions routed to authorized review, refunds to the
  original method where supported, COD refunds requiring a manually verified
  payout method + admin approval + a recorded transaction reference, and
  disputes that preserve both explanations, attachments, order/item history,
  decision reason, resolution and refund/settlement impact, decided by CareU
  support/admin, with unresolved disputes blocking **only the affected
  seller's** eligibility. The **actual** window lengths, eligibility
  criteria, return-shipping cost responsibility and refund limits are pending
  policies — see "Pending decisions".
- Customer: account wishlist, multiple addresses, verified-purchase reviews
  only (one review per eligible purchased product), review editing and
  reporting, email + in-app notifications with history and status.
- Support: cases linked to an order or an item, categories and priority,
  attachments, assignment, internal notes invisible to customers, status
  history, resolutions, and separation of support operations from financial
  operations.
- Analytics: seller analytics (sales trends, orders, top products, inventory,
  cancellations, returns, commissions, payout balances) kept separate from
  CareU first-party reporting and cost/margin data.

### Pending decisions — ask, do not invent

Undecided at the time of writing. These are **business policies and
infrastructure choices**, not missing capabilities — the capabilities they
govern are listed above as confirmed; their values, rules and thresholds are
not. Do not hard-code a value or pick a default in code without explicit
confirmation.

- Commission rates per category, and who bears commission on discounted items
  (CareU-funded vs seller-funded).
- Return window and eligibility per category; who pays return shipping; is
  return shipping refunded.
- Refund policy: partial refunds allowed, maximum refund window after
  delivery, acceptable COD refund payout methods.
- Delivery pricing model and coverage (all districts vs. Dhaka-first), free
  delivery threshold, and whether the buyer, seller or platform bears it.
- COD remittance mechanics (per-seller receivable vs. netted into a payout
  batch).
- Tax/VAT at launch: applicability, inclusive vs exclusive, integer-BDT
  rounding.
- Display currency scope at launch and the FX rate source.
- Initial staff roles and their exact permission sets (platform admin,
  moderator, customer support, finance, catalogue/pricing, inventory,
  delivery, procurement).
- Seller onboarding document list and retention period; payout cadence,
  minimum threshold and destination method (bank vs mobile wallet).
- Review moderation (auto-publish vs pre-moderation).
- Whether serial/warranty-tracked products are in launch scope.
- Notification channels (email only vs email + SMS).
- Categories with special legal/compliance requirements (cosmetics, baby
  food, medical devices, electronics certification).
- Record-retention periods for orders, financial records and audit logs under
  BD requirements.
- Public order tracking without login (secure, scoped, time-limited token vs.
  sign-in required).
- Neon runtime driver: `@prisma/adapter-pg` over the pooled endpoint vs.
  `@prisma/adapter-neon` — **pending decision**; and whether to add
  `DIRECT_DATABASE_URL` for migrations (currently only `url` is configured).
- Storage vendor for product media and seller documents: Cloudflare R2 vs.
  Cloudinary — **pending decision**. R2 satisfies private storage + signed
  URLs; neither may be hard-coded until this is approved.

## Library policy

Use: Tailwind v4, shadcn/ui, lucide-react, next-intl, `Intl.*` — plus, once
installed, sonner, Zustand, react-hook-form + zod, date-fns.

Avoid by default (duplicates or heavy alternatives that conflict with the
existing stack): Ant Design, MUI, Chakra, full lodash, Moment.js, GTM.

Do not add a dependency on reflex. Before adding one, justify it against
performance (bundle size, hydration cost, runtime work), maintainability (how
well it fits the existing patterns) and the actual use case. Prefer built-in
platform APIs — `fetch`, CSS transitions/animations, `<details>`, CSS scroll
snapping, server actions — when they meet the requirement. Motion libraries
(e.g. framer-motion), carousel libraries (e.g. Swiper.js), client-side data
fetching (e.g. TanStack Query) and client state libraries (e.g. Redux Toolkit)
are not banned, but each must earn its place with a stated reason — "we might
need it later" is not a reason. Record the justification in the change
description.

The ~120 KB gzipped storefront client-JS budget is **provisional** until the
measurement scope and baseline are defined (see Performance).

## Infra notes

- Cloudflare must BYPASS: `/api/*`, `/cart`, `/checkout`, `/account*`,
  `/admin*`, `/login`, `/register`, `/order/*`. (`/checkout` and `/admin*` do
  not exist yet — keep the rule for when they land.)
- `/` -> `/en` is a Cloudflare Redirect Rule in production (matches
  `defaultLocale`).
- Env vars: single root `.env`, gitignored via `.env*` (note: that pattern also
  ignores `.env.example` — add a `!` negation if you want one committed).
  Bare `SCREAMING_SNAKE` names, no `NEXT_PUBLIC_*` prefix, read via
  `process.env.X`. Currently set: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`.
- Production DB is Neon Postgres; local dev is local PostgreSQL 18.1. Do not
  use PostgreSQL 18-only features — Neon runs 16/17.

## Brand

- Font: Hind Siliguri (Bangla + Latin).
- Style: Base UI + Vega preset. Colors: placeholder (neutral) — TBD.

## Working with this file

- Don't delete the BEGIN:nextjs-agent-rules block. next dev re-injects it;
  removing it just creates churn in your diffs.
- Don't delete the BEGIN:skills-agent-rules block either.
- The Commands section is the highest-value part — agents run these to verify
  work.
- Keep it rules, not documentation. Every line should be something an agent
  could accidentally get wrong. Prose that just restates the stack belongs in
  the README.
