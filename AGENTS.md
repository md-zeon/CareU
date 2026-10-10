# CareU.bd — Agent Guide

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`; do not remove it.

<!-- END:nextjs-agent-rules -->

## Project

CareU.bd

## Stack

- Next.js 16.4 (App Router, TypeScript, Turbopack), React 19
- `cacheComponents: true` + `partialPrefetching: true`
- Tailwind CSS v4 + shadcn/ui on **Base UI** primitives (Vega style)
- next-intl — locales `en` (default) + `bn`, `localePrefix: 'always'`
- Prisma + Neon Postgres (`aws-ap-southeast-1`)
- Better Auth — phone + OTP
- Zustand (cart), react-hook-form + zod, sonner (toasts)
- Vercel (`sin1`) behind Cloudflare (orange cloud)
- Media: Cloudflare R2 + Image Transformations; Bunny Stream for video
- Payments: SSLCommerz hosted checkout + validated IPN

## Commands

- `npm run dev` — dev server
- `npm run build` — must pass before committing
- `npm run lint` — ESLint
- `npm run typecheck` — run `tsc --noEmit` (add this script if missing)

## Layout

- `app/[locale]/` — all routes; locale is always in the path
- `lib/` — server-only domain logic. NEVER query Prisma from a component.
- `components/ui/` — generated shadcn components; avoid hand-editing
- `lib/i18n/messages/` — next-intl catalogs (`en.json`, `bn.json`)
- `node_modules/next/dist/docs/` — authoritative docs for this Next version

## Hard rules

### Money & data

- All money is integer BDT. Never float, never Prisma `Decimal`.
- Keep `PaymentStatus` and `FulfillmentStatus` as separate fields.

### Caching

- Wrap EVERY Prisma catalog read in `'use cache'` + `cacheLife(...)` + `cacheTag(...)`.
- NEVER call `headers()` or `cookies()` inside a `'use cache'` scope.
- `generateStaticParams` returns slugs only (one cheap query) — never full rows.
- On admin save: `updateTag(tag)`. In the background: `revalidateTag(tag, 'max')`.

### Auth

- Never `await` `sendOTP` — dispatch it via `waitUntil`.
- SMS is behind the `lib/sms.ts` provider interface. The console stub must
  refuse to run when `NODE_ENV === 'production'`.

### Commerce integrity

- Stock decrement must be atomic, inside the order transaction:
  `UPDATE variants SET stock = stock - $qty WHERE id = $id AND stock >= $qty`
  then verify affected rows.
- Payment IPN handlers must be idempotent.

### i18n

- Every user-facing string goes through next-intl. No hardcoded text.
- Read the locale with `next/root-params`; do not prop-drill it.
- In `lib/i18n/request.ts`, read the locale from `next/root-params` ONLY.
  Never use the `requestLocale` param — it reads `headers()` and silently
  opts every route into dynamic rendering, defeating
  `cacheComponents` + `generateStaticParams`.
- Keep messages server-side. If a Client Component needs translations, give it
  only that namespace via `NextIntlClientProvider` — never ship the whole
  catalog to the client from a root provider. Prefer passing already-translated
  strings down as props from Server Components.

## Library policy

Use: Tailwind v4, shadcn/ui, lucide-react, sonner, Zustand, react-hook-form +
zod, next-intl, date-fns, `Intl.*`.
Avoid: Ant Design, MUI, Chakra, Swiper.js, framer-motion/motion, Moment.js,
Axios, Redux Toolkit, TanStack Query on the storefront, GTM, full lodash.
Keep storefront client JS under the CI budget (~120 KB gzipped).

## Infra notes

- Cloudflare must BYPASS: `/api/*`, `/cart`, `/checkout`, `/account*`,
  `/admin*`, `/login`, `/register`, `/order/*`.
- `/` -> `/en` is a Cloudflare Redirect Rule in production (matches `defaultLocale`).

## Brand

- Font: Hind Siliguri (Bangla + Latin).
- Style: Base UI + Vega preset. Colors: placeholder (neutral) — TBD.
  Three things worth calling out:
- Don't delete the BEGIN:nextjs-agent-rules block. next dev re-injects it; removing it just creates churn in your diffs.
- The Commands section is the highest-value part — agents run these to verify work. typecheck doesn't exist yet; we should add it to package.json.
- Keep it rules, not documentation. Every line should be something an agent could accidentally get wrong. Prose that just restates the stack belongs in the README.
