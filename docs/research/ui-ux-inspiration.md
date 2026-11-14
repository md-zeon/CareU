# UI/UX Inspiration and Findings (CareU.bd)

**Date:** 2026-11-14  
**Purpose:** Store findings gathered during scope replan (Facade, UI first, journey based) and live/dashboard review to guide CareU.bd prototype UI/UX work.

## Context and decisions applied

- **Build direction:** Facade (prototype grade). Build the whole product UI first on placeholder/mock data, then wire real backend after UI approval.
- **Sequencing:** by user journey (customer, seller, platform/admin). Each journey’s screens, navigation, and empty/loading/error/success states designed and built as complete UI flows before moving on.
- **Deferred in prototype:** real database writes, real auth enforcement, payments/IPN, stock reservation, integrations, and production correctness. Keep foundations only where needed to render/navigate.
- **Decisions (user confirmed):**
  - Prototype access: mock easy access (UI only sign in screens and easy way to enter customer/seller/admin views; no real enforcement).
  - Checkout/tracking policy in UI: follow CareU policy (no guest checkout, order tracking requires sign in).
  - Feature 3 (media storage): pause backend work, focus UI; use placeholder images/files and resume wiring after UI approval.

## Inspiration sites reviewed

### 1. Aniq UI Fashion E-Commerce Storefront
- **URL:** https://ecommerce-clothes-1.aniq-ui.com/en
- **Evidence:** demo docs/template descriptions and page structure (live demo opened in wrapper/iframe in this environment; inner pages not fully clickable via snapshot).

**Pages/areas**
- Home
- Shop/catalog (URL driven search, filters, sorting, pagination)
- Categories
- Product detail (gallery, variants, reviews, related)
- Cart
- Checkout
- Order confirmation
- Track order (by number + email)
- About, Contact, FAQ
- Auth: login, register, forgot password, reset password
- Account: overview, orders, order detail, addresses, profile, order tracking, wishlist

**Key features**
- Persistent cart and wishlist (browser side in template behavior)
- Guest checkout and guest order tracking
- Customer accounts and address/order management
- AI virtual try on / fitting room (template feature)
- SEO patterns: sitemap, robots, canonical, language alternates
- Analytics events/funnel tracking concepts
- EN/AR with RTL (template capability)

**CareU coverage (prototype, adapted)**
- **Will provide (UI flows, mock):** home/discovery, browse/search/brand, product/review, cart/wishlist, checkout/confirmation, account/addresses/orders/tracking, support/trust pages with navigation and empty/loading/error/success states.
- **Different/not now:** no guest checkout/tracking (CareU policy: sign in required). No AI virtual try on in this pass (virtual mannequin tryout is future). Multi vendor shop context, per shop shipment views, BDT and Bangladesh first flows, EN/BN.

### 2. Aniq UI E-Commerce Admin Dashboard
- **URL:** https://ecommerce-clothes-1-admin.aniq-ui.com/en/dashboard
- **Evidence:** demo docs plus live inspection via Playwright snapshots with user-assisted navigation (opened actual dashboard tab, logged in state available).

**Pages/areas observed (docs + live)**
- Overview/dashboard
- AI Assistant
- Products: All, Deleted, product create/edit form (and featured/best sellers referenced)
- Categories: All, Deleted
- Orders: list and order detail
- Users/customers: All, Deleted (and user detail reachable)
- Home Page (storefront CMS): section editors (Three Quiet Obsessions, Editorial Split, Categories Grid, Newly Dropped Collections, Best Sellers, Spotlight Gallery, Lux Difference, Editorial Slider)
- Admin Management (staff list, admin detail)
- Admin Roles (list, add role dialog, role permissions dialog)
- Settings (Profile, Security, App Settings tabs; App Settings table observed)
- Notifications (top bar panel, empty state observed)

**Key features (template/docs)**
- RBAC roles and permissions
- Real time notifications (template capability)
- Product studio / AI tools, AI assistant (template capabilities)
- Order status and payment state management, exports/CSV patterns
- Analytics widgets (some sample data)

**CareU coverage (prototype, adapted)**
- **Will provide (UI flows, mock):** admin shell/overview, seller/shop/listing moderation, catalog/pricing/inventory ops, orders/payments/COD/delivery ops, returns/refunds/disputes/support/settlements, content/theme/notifications/analytics, plus seller journey dashboards/flows, all role aware in UI on mock data.
- **Different/not now:** no real AI assistant/studio/background removal in scope now; no real time websocket updates in prototype (show UI states). CareU adds marketplace separation (CareU first party vs third party), CareU owned COD workflow, support vs finance separation, seller scoped views.

### 3. Flannels
- **URL:** https://www.flannels.com/
- **Evidence:** sitemap and public site structure/content descriptions (live fetch timed out in this environment).

**Pages/structure observed**
- Large departments: women, men, kids, beauty, gifts, home, sale/clearance, designers/brands, new arrivals
- Deep category trees (clothing, shoes, bags, accessories, jewelry, etc.)
- Designer/brand pages and brand directories
- Editorial/style news
- Bag/wishlist/account/app entry points implied

**Key features**
- Luxury multi department merchandising
- Brand/designer discovery
- Seasonal edits and gift guides
- Sale/clearance discovery
- Personalization/app patterns

**CareU coverage (prototype, adapted)**
- **Inspiration:** premium merchandising, category/brand navigation, editorial highlights, and clear browse/filter patterns.
- **Different/not now:** not a marketplace model; CareU keeps multi vendor seller/shop context and CareU first party distinction. Specific departments or app-only features are not commitments unless added as scope rows.

### 4. Masari Shop
- **URL:** https://www.masarishop.com/
- **Evidence:** direct page content inspected.

**Pages/structure observed**
- Home: hero, new now, editorial, editor picks, popular brands, shop by category, designer spotlight, digest
- Nav: new arrivals, men/women/kids RTW, shoes, accessories, bags, beauty and lifestyle, brands A-Z, sale, editorial
- Search, sign in/register, wishlist, bag
- Editorial
- Footer/info: about, terms, privacy, store locator, newsroom, FAQ, how to shop, shipping, returns/exchanges, payment info, newsletter, social

**Key features**
- Editorial and brand storytelling
- Curated merchandising and promotions
- Brand directory and category led discovery
- Trust/info pages

**CareU coverage (prototype, adapted)**
- **Inspiration:** discovery and storytelling, brands/categories/editorial blocks, wishlist/cart/account entry points, and trust/legal/support pages.
- **Different/not now:** store locator/newsroom relate to future branch features; payment methods market specific; CareU follows confirmed payment/COD rules.

## Live Aniq admin dashboard observations (snapshots)

### Shell and navigation
- Left sidebar grouped into Main (Overview, AI Assistant), Catalogue (Products, Categories), Sales (Orders, Users), Storefront (Home Page), Administration (Admin Management, Admin Roles, Settings), Demos (UI Component), with Logout.
- Expandable subnavigation (e.g. Products All/Deleted, Categories All/Deleted, Users All/Deleted, Home Page sections).
- Top bar: sidebar toggle, home/overview link, “Go to storefront”, global search (Ctrl+K), language (EN/US), theme/control buttons, notifications, profile (e.g. DT Demo).
- Breadcrumbs, page titles with subtitles, and contextual actions (e.g. This Month, Export, Add Product).

### Overview
- Bento/grid of metric widgets: Total Revenue (month, breakdown, trend, chart), Total Sales (week bars), Monthly Goal (progress), Weekly Visitors (trend/chart), Conversion Rate, Recent Orders (list + View all), Active Campaign (mix), Customer Growth (trend/chart), Sales by Region (map).
- “All Orders” table widget: Order #, Customer (avatar/initials/name/email), Total, Status (progress + label), Date, View all.

### Products (All) and product edit
- Summary cards: Total, Active, Inactive, Out of Stock, Featured.
- Filters: search, category, featured, status, filter/reset.
- Table: Product (image/name/SKU), Price (incl. compare-at/sale display), Stock, Status, Last Updated, Actions; pagination.
- Product edit (`/products/all/:id/edit`): header actions (Cancel, Update Product), AI/media workspace panel (“Ask for anything…” quick actions like write details/clean studio shot/photograph on model, Assistant/Animate tabs, media thumbnails/stage/add, main preview with remove background/download), and form sections:
  - Basic Information: Product Name (EN/AR), Description (EN/AR), Full Description rich text (EN/AR), SKU*, URL Slug.
  - Options & Variants: option/variant rows with SKU and stock, add/remove.
  - Pricing & Inventory: Price*, Compare at Price, Cost Price, Stock Quantity.
  - Organization: Category*, Tags (chips).
  - Settings: Active, Featured, Best Seller toggles with helper text.

### Categories (All)
- Summary cards: Total, Active, Inactive, Deleted, With Products.
- Filters: search, status, parent, sort order.
- Table: Name (image/name/description), Status, Products count, Sort Order, Actions.

### Orders (list and detail)
- List: summary cards (Total, Pending, Processing, Delivered, Cancelled), filters (search, order status, payment status, date), table (Customer, Order #, Items, Total, Status progress+label, Payment, Date, Actions), pagination.
- Detail (`/orders/:id`): order number/date, Export CSV; status/payment badges and fulfillment stepper (Pending/Confirmed/Processing/Shipped/Delivered) with actions (e.g. Cancel order, Mark as Processing); customer card + View customer; tracking number input/save; order items linked to product edits; totals (amount, items, method, subtotal/shipping/tax); shipping/billing address tabs; timeline.

### Users/customers
- Summary cards: Total, Deleted, Unverified, Verified, New This Week.
- Rich filters: email, phone, country, username, first/last name, verification, from/to date.
- Table: Name (avatar), Email, Phone, Status, Joined Date, Actions; All/Deleted views.

### Home Page CMS (section editors)
- Sections: Three Quiet Obsessions, Editorial Split, Categories Grid, Newly Dropped Collections, Best Sellers, Spotlight Gallery, Lux Difference, Editorial Slider.
- Common pattern: “In This Section” curated slots with capacity/usage, ordering, remove/reorder, behavior notes (auto-save; some sections have fallback/auto-fill or display rules) + “Add Products” searchable/paginated picker with add/remove and section-full states.
- Section-specific behaviors observed:
  - **Three Quiet Obsessions:** 3 product slots.
  - **Editorial Split:** 2 slots; first product’s image used as large editorial panel.
  - **Categories Grid (Categories Order):** reorder storefront categories with active toggles and sort order (homepage row shows up to 7 active in order).
  - **Newly Dropped Collections:** 6 slots; if empty can auto-fill with newest products (one per category).
  - **Best Sellers:** 8 slots.
  - **Spotlight Gallery:** 6 slots for interactive accordion gallery.
  - **Lux Difference:** 1 slot; image used as section background (brand storytelling).
  - **Editorial Slider:** 5 slots; scroll-driven split-screen slider; products need two images (left/right halves).

### Administration
- **Admin Management:** summary cards (total, with roles, recently added/updated, without roles), filters, table (name/role, email, phone, created, actions). Detail page (e.g. William Moore): profile/summary (status, assigned role), tabs Basic Information/Activity Logs, account and contact details.
- **Admin Roles:** summary cards (total/active/inactive/recent), filters, role table (role + guard, dates). Add New Role dialog (Role Name*). Role Permissions dialog (e.g. Manager): All Permissions toggle, grouped permissions with group toggles/expand, Save/Close (some group labels appeared as translation keys in demo).

### Settings and notifications
- **Settings:** tabs Profile, Security, App Settings. Profile shows account card and editable/view fields (name, email, phone with country, country). App Settings shows categorized key-value table (search/filter/category, descriptions, values, copy/edit/actions, pagination).
- **Notifications:** bell opens panel with clear empty state (“No notifications…” with explanatory text).

### AI Assistant
- Model selector (e.g. Gemini 3.6 Flash), demo API key/chat history/new chat controls, welcome state, prompt input with attach image, suggested operational prompts (“How is my store doing?”, “What is running out?”, “Orders to ship”, “Best sellers”). Inspiration only for CareU now.

## UI/UX inspiration checklist for CareU prototype

Use as a reference while designing/building the Facade UI on mock data. Adapt to CareU: EN/BN, BDT, multi vendor (CareU first party + third party), CareU owned COD, sign in required where policy requires, seller vs platform scope, support/finance separation.

### 1. App shell and navigation
- [ ] Grouped sidebar by domain with collapsible sections and clear active states.
- [ ] Top bar: toggle, home, global search (shortcut), context/storefront link, language, theme/actions, notifications, profile.
- [ ] Breadcrumbs, title + subtitle, primary actions per page.
- [ ] Consistent cards/layout primitives and responsive structure.
- [ ] Prototype journey/role switcher (customer/seller/admin) with mock access (no real enforcement).

### 2. Overview / dashboard
- [ ] Metric cards with trends/charts and period context.
- [ ] Actionable lists/tables (recent/all orders) with “View all”.
- [ ] Scope-appropriate metrics for seller vs platform/CareU views.

### 3. Catalogue: products and categories
- [ ] Summary counts, filters/reset, rich table (image/name/SKU, price states, stock, status, updated, actions), pagination.
- [ ] Product editor sections: basic/multilingual info, rich description, identifiers, variants, pricing/inventory, organization/tags, flags/settings.
- [ ] Media/variant management UX with clear states; placeholder media in prototype.
- [ ] Categories with hierarchy/order/status/product counts.
- [ ] Multi vendor ownership, listing/moderation states, BDT.

### 4. Orders and fulfillment
- [ ] List with status/payment totals, filters, fulfillment progress+payment columns.
- [ ] Detail with stepper, badges, actions, customer/tracking, linked items, totals, addresses, timeline.
- [ ] Per-shop shipments, multi-seller breakdowns, COD states, sign-in required tracking (UI).

### 5. Users, admins, roles, permissions
- [ ] Customer list/detail with verification/status filters and All/Deleted views.
- [ ] Admin/staff management separate, with role visibility.
- [ ] Role list/create and permissions editor (global/group/individual controls).
- [ ] Platform vs shop scopes and duty separation reflected in UI; enforcement later.

### 6. Storefront content / homepage CMS
- [ ] Section-based editors with varied rules (slots, ordering, capacity, fallback, content constraints).
- [ ] Curated lists, category ordering/visibility, hero/background and slider patterns.
- [ ] Searchable/paginated picker, add/remove/reorder, auto-save or clear save states.
- [ ] EN/BN content and performance-aware publishing model later.

### 7. Settings, notifications, assistant
- [ ] Tabbed settings (profile/security/app/config) with view/edit states.
- [ ] Categorized config records with search/filter/actions.
- [ ] Notifications panel with empty/list states.
- [ ] AI assistant patterns noted as inspiration only (not committed).

### 8. Cross-cutting
- [ ] Every journey: navigation + empty/loading/error/success states.
- [ ] Mock/placeholder data; no real writes/enforcement/payments/stock/integrations in prototype.
- [ ] Clickable end-to-end flows per journey, accessible and consistent UI.
- [ ] CareU policies reflected in UI (no guest checkout, tracking requires sign in); server-side protection wired later.

## Live Aniq storefront observations (snapshots, in progress)

### Home (`/en`)
- **Header/nav:** Home, Shop, New Arrivals, Sale; centered logo; language (EN/US), theme, search (Ctrl+K), account menu (Sign In/Create Account), cart/bag with empty-state drawer content.
- **Mega menu content:** grouped links (Shop, Categories, Explore: FAQ/Track Order/Contact) with promo tiles.
- **Hero:** collection label, headline, supporting copy, primary/secondary CTAs (Shop Now, New Arrivals).
- **Trust strip:** Free Shipping, Easy Returns, Secure Payment, Premium Quality.
- **Merchandising/editorial:** curated "Three quiet obsessions" blocks, seasonal edit split promo, category grid, newly dropped/new arrivals, sale banner, best sellers, interactive collection gallery/accordion, "A Closer Look" editorial slider, verified-buyer reviews, closing editorial/about CTA.
- **Product cards:** image link, wishlist, "Try on model", rating, name, price/compare-at/sale badge, Add to Cart.
- **Footer:** newsletter signup, company/support/shop/quick links (Categories, Wishlist, Cart, My Account), contact info, payment methods, region/language, copyright.
- **Floating action:** "Try it on" button.

### Global search overlay (home, opened state)
- **Trigger:** search button with shortcut hint (Ctrl+K).
- **UI:** modal/overlay search input ("Search for a piece"), close action, "Latest arrivals" suggestion list with product image/name/category/price (sale shown), keyboard hints (move/open/close) and result count. Useful pattern for quick discovery.

### Shop/Catalog (`/en/shop`)
- **Breadcrumbs:** Home / Shop / (current context e.g. New Arrivals).
- **Promo carousel:** category/campaign slides with image, label, heading, copy, CTA.
- **Page header:** title (e.g. New Arrivals), product count, sort dropdown (e.g. Newest).
- **Filters sidebar:** search products, Category list (All + categories), Price Range (dual slider + min/max inputs), Highlights (On Sale, Featured, Best Sellers checkboxes).
- **Results grid:** product cards (image, wishlist, try-on, rating, name, price/compare-at/sale, Add to Cart).
- **Pagination:** previous/next and page numbers.

### Product detail (`/en/products/...`)
- **Breadcrumbs:** Home / Shop / Category / Product.
- **Media/actions:** main image gallery area, discount badge, wishlist and "Try on model" actions.
- **Info:** category label, title, share links (social + copy), short description, rating/review count, price/compare-at/discount and tax note.
- **Variants & purchase:** color selection (with selected label), size selection, quantity stepper, stock/availability message, **Buy Now** and **Add to Cart**.
- **Trust/service highlights:** shipping, returns, secure checkout notes.
- **Content tabs/sections:** Description (benefits/details/care) and Reviews (count shown).
- **Cross-sell:** "You May Also Like" product grid.

### Cart (`/en/cart`)
- **Header:** breadcrumbs, page title, item count; header cart badge/drawer reflects items and subtotal.
- **Line items:** image, title link, quantity stepper, remove, line price.
- **Order summary:** subtotal, shipping, total, **Proceed to Checkout**, **Continue Shopping**.
- **Feedback:** toast notification on add to cart ("Added to your bag" with view bag/dismiss).

### Checkout (`/en/checkout`)
- **Breadcrumbs:** Home / Shop / Cart / Checkout; page title "Checkout".
- **Shipping Address form:** First/Last name, Email, Phone, Street Address, City, ZIP/Postal Code, Country (required fields marked).
- **Payment Method:** radio options — **Credit / Debit Card** (shown unavailable in demo with note to choose cash on delivery) and **Cash on Delivery** (selected by default in this state, "Pay when your order is delivered to your door").
- **Primary action:** **Place Order** button.
- **Order Summary sidebar:** line items with name/qty/price, subtotal, shipping (e.g. Free), total.
- **Note (CareU adaptation):** CareU prototype must follow policy — **no guest checkout and order tracking requires sign-in** (show sign-in gate/mock flow as needed), BDT/COD-first considerations, and per-shop/multi-seller breakdowns when applicable; all on mock data.

### Order confirmation (`/en/order-confirmation/...`)
- **Success state:** prominent "Order Placed!" confirmation with thank-you message and instruction to keep order number for tracking.
- **Order reference:** order number displayed with **Copy** action.
- **Next actions:** **Continue Shopping** and **Track Order** (link prefilled with order parameter in this demo).
- **Post-checkout state:** cart shown as empty in header/drawer.
- **CareU adaptation:** confirmation should reflect sign-in context, per-shop shipment/order references as applicable, and policy-correct tracking access (sign-in required).

### Track Order (`/en/track-order`)
- **Layout:** breadcrumbs (Home / Track Order), title "Track Your Order", helper text.
- **Lookup form:** **Order number*** and **Email used for the order*** inputs (can be prefilled via query param) and **Track order** action.
- **Demo behavior:** supports guest-style lookup by order number + email in this template.
- **CareU adaptation:** CareU policy requires **sign-in for order tracking** (no public token/number+email lookup at launch). Prototype UI should show the sign-in gate and authenticated tracking/order status views on mock data, with per-shop shipment progress where applicable.

### Contact (`/en/contact`)
- **Layout:** breadcrumbs, title "Contact Us", response-time helper copy.
- **Form:** name, email, subject, message/help field, **Send message** action.
- **Contact details panel:** email, phone, address, hours.
- **CareU adaptation:** can align with support intake/contact patterns and trust pages; prototype can show form states (empty/loading/error/success) on mock submission.

### Auth – Sign In (`/en/auth/login`)
- **Layout:** split screen — brand/value panel ("Style that lasts", benefits like track orders/save wishlist/faster checkout) and sign-in form.
- **Form:** Email*, Password* (show/hide), Remember me, **Forgot your password?**, **Sign In**.
- **Secondary action:** link to **Create one** (register).
- **CareU adaptation:** prototype should include UI-only sign-in/entry flows and easy access to customer/seller/admin views (mock), while real enforcement is deferred. Support phone/email OTP patterns per CareU stack later; UI can reflect chosen method(s).

### Auth – Create Account (`/en/auth/register`)
- **Layout:** consistent split screen with brand/value panel.
- **Form:** First/Last name, Email*, Password* (show/hide, hint e.g. min length), Terms/Privacy agreement checkbox; **Create Account** action (disabled until agreement in this state).
- **Secondary action:** link to **Sign in**.
- **CareU adaptation:** reflect CareU account requirements/policies in UI copy and flows (e.g. verified contact/OTP where applicable) as mock/prototype states.

### About (`/en/about`)
- **Layout:** breadcrumbs, page title and intro copy.
- **Content sections:** "Our story" narrative block, "What we stand for" value pillars (e.g. quality, sustainability, customer support), and key stats/metrics (customers, products curated, countries served).
- **CareU adaptation:** useful pattern for trust/brand storytelling pages (About, policies/support context) in EN/BN with marketplace-appropriate claims.

### Categories (`/en/categories`)
- **Layout:** breadcrumbs, intro/hero carousel blocks with CTAs, then categories index.
- **Index controls:** heading with count, search categories, sort/order control.
- **Category cards/grid:** image/visual card, name, short description, and link/action (e.g. View Products) routing to filtered shop view.
- **CareU adaptation:** good for category discovery/SEO-friendly browsing; adapt to CareU category tree, attributes, and multi-vendor context as needed.

### Account – Orders (`/en/account/orders`, authenticated)
- **Shell:** account layout with breadcrumbs and left sidebar navigation.
- **Sidebar:** user identity (name/email), grouped sections — Shopping (Overview, Orders with sublinks All orders / Track an order, Wishlist), My details (Addresses, Profile), and **Sign Out**.
- **Orders view:** "Order History" list with order cards showing order number, date, status (e.g. Confirmed), total, and **View Details** link.
- **CareU adaptation:** aligns with required sign-in account/order history/tracking surfaces; prototype should include empty/loading/error/success states and reflect per-shop shipments, statuses, and CareU policies on mock data.

### Account – Order detail (`/en/account/orders/:id`, authenticated)
- **Header:** breadcrumbs, order number, placed date/time, current status badge.
- **Status progress:** stepper/progress states (e.g. Pending, Confirmed, Processing, Shipped, Delivered).
- **Items:** line items with name, qty × unit price, line total.
- **Summary:** subtotal, shipping, total.
- **Addresses:** shipping and billing address blocks.
- **CareU adaptation:** extend to multi-seller/per-shop shipment sections, payment/COD details, tracking info, and policy-correct actions/history as mock UI states.

### Account – Wishlist (`/en/account/wishlist`, authenticated)
- **Header:** breadcrumbs, "My Wishlist" title, item count, **Clear wishlist** action.
- **Content:** grid of saved product cards with image/link, remove-from-wishlist toggle, try-on, rating, name, price/sale badge, **Add to Cart**.
- **CareU adaptation:** show wishlist states (empty/loading/error) and integrate with product/shop context on mock data.

### Account – Addresses (`/en/account/addresses`, authenticated)
- **Page:** breadcrumbs, "My Addresses", **Add New Address** action.
- **Empty state:** "No addresses saved" with guidance (add shipping/billing for faster checkout) and add action.
- **Add/Edit dialog ("Address Details"):** Address Type (e.g. Shipping), First/Last name, Street Address, Apartment/suite (optional), City, State/Province, ZIP/Postal, Country, Phone, "Set as default address" checkbox, **Cancel/Save Address**.
- **CareU adaptation:** support multiple saved addresses and BD-relevant address fields/formatting in prototype UI; validate and enforce on server later.

### Account – Overview (`/en/account`, authenticated)
- **Header:** breadcrumbs, personalized welcome ("Welcome back, ..."), short description.
- **Summary cards:** key stats/shortcuts (e.g. Orders placed, On the way, Saved addresses) linking to relevant sections.
- **Recent orders:** compact list of recent orders with number/date/status/total and **View Details**.
- **CareU adaptation:** dashboard-like entry point for customer journey; include sign-in-gated tracking/order states and relevant counts on mock data.

### Account – Track an order (`/en/account/track-order`, authenticated)
- **Layout:** account shell with breadcrumbs and sidebar; page title "Track Your Order" and helper text.
- **Form:** **Order number*** input and **Track order** action (authenticated context, no email field shown here unlike public track page).
- **CareU adaptation:** fits CareU's sign-in-required tracking policy; show status/progress, per-shop shipment tracking, and empty/error/result states on mock data.

### Storefront review status (Aniq, user-assisted)
- **Captured:** Home (+ search overlay), Shop/Catalog, Product detail, Cart, Checkout, Order confirmation, Track Order (public), Contact, Sign In, Create Account, About, Categories, Account Orders, Account Order detail, Account Wishlist, Account Addresses (+ add dialog), Account Overview, Account Track an order.
- **Not captured in this pass:** Forgot/Reset password, Account Profile, FAQ page (`/en/faq`) — user ended the guided review here.

## Independent follow-up review: Masari and Flannels

### Masari (`https://www.masarishop.com/`)
- **Observed (direct review):** luxury multi-brand fashion storefront with prominent navigation (New Arrivals, Men/Women/Kids RTW, Shoes, Accessories, Bags, Beauty & Lifestyle, Brands A–Z, Sale, Editorial) and search/account/wishlist/bag utilities.
- **Home/merchandising:** large hero/campaign visuals, "New Now" and curated edits, editorial storytelling blocks, editor's picks, popular brands, shop-by-category modules, designer spotlights, and digest/editorial content.
- **Discovery patterns:** brand-led and category-led browsing, seasonal campaigns, curated collections, and strong visual merchandising.
- **Trust/support/footer:** About, Terms, Privacy, store locator, newsroom, FAQ, how to shop, shipping, returns/exchanges, payment info, newsletter signup, and social links.
- **CareU inspiration/takeaways:** polished editorial + brand discovery, clear trust/info architecture, and curated category/brand entry points. Adapt to CareU's marketplace model (multi-vendor, CareU first-party distinction), Bangladesh-first flows, EN/BN, BDT/COD considerations, and confirmed policies.

### Flannels (`https://www.flannels.com/`)
- **Observed (public structure/sitemap and prior evidence; direct live fetch may be limited):** large luxury retail catalog with deep department taxonomy (Women, Men, Kids, Beauty, Gifts, Home, Sale/Clearance, Designers/Brands, New Arrivals) and extensive category/subcategory trees.
- **Key patterns:** designer/brand directories, new-in and seasonal edits, sale/clearance discovery, strong faceted browsing expectations, and account/wishlist/bag entry points.
- **CareU inspiration/takeaways:** depth of navigation/IA, brand and department discovery, and promotional/sale surfacing patterns. Not a marketplace; CareU should adapt merchandising/IA ideas without adopting non-applicable single-retailer assumptions.

## Notes
- Live Aniq demo was accessed via wrapper/iframe constraints; user assisted by opening the actual dashboard tab and navigating. Some demo labels showed translation keys and console errors were present; observations focus on UI/UX patterns.
- Storefront review was done with user-assisted navigation in the same browser session and paused at user request; see "Storefront review status" for captured/missing pages.
- Masari was reviewed directly; Flannels review is based on accessible public structure/evidence in this environment and may benefit from a later live visual pass.
- This document is research/inspiration input for UI prototype features in `docs/scope/scope.md`; it does not change confirmed CareU policies or add committed features beyond scope.
