# KantinKita Design QA

## Source visual truth path

- `C:\Users\falzz\Downloads\a981e7bc626d4f2f9cdea1f1aefc441f.jpg` — login composition reference, 1000 × 750 px.
- `C:\Users\falzz\AppData\Local\Temp\codex-clipboard-52a310f3-2416-4314-8e92-4f65a2f24632.png` — dashboard palette/layout reference, 1200 × 1200 px.
- User-provided browser annotation screenshots for Comments 1–4 — the annotated dashboard, sidebar, login boundary, and line-chart reference. These were supplied in the task but do not expose a separate filesystem path.

## Implementation screenshot path

- `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\login-rendered.png` — 1298 × 742 px.
- `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\dashboard-rendered.png` — 1283 × 734 px.

## Comparison setup

- Viewport/state: Codex In-app Browser desktop viewport, demo mode, dashboard and login states.
- Source and implementation dimensions: login source 1000 × 750 vs implementation 1298 × 742; dashboard style source 1200 × 1200 plus the 1298 × 742 browser annotation reference vs implementation 1283 × 734.
- Density normalization: screenshots were compared as browser-rendered compositions at their native captured pixels; browser chrome/scrollbar differences were excluded from visual findings.
- Full-view comparison: the login split composition, curved white-green boundary, dashboard hierarchy, KPI row, sales card, ratio card, and sidebar were reviewed together against the supplied references.
- Focused regions: login boundary/form panel, sales line chart/tooltip, and sidebar navigation were reviewed at readable scale.

## Findings

- No actionable P0, P1, or P2 findings remain.
- The line chart keeps the KantinKita teal palette instead of copying the reference purple so it remains consistent with the existing product tokens.
- The dashboard keeps the existing demo copy and product visuals because the requested changes were layout, statistics presentation, motion, and navigation polish.

## Comparison history

1. Initial implementation comparison: the login boundary was flat, the sales card used bars, and the sidebar hierarchy had weaker spacing. Fixed with an asymmetric curved login-art boundary, a responsive SVG line/area chart with point tooltips, workspace labeling, icon containers, active-state treatment, and compact navigation spacing.
2. First browser pass: the latest-point tooltip could overlap the period-comparison copy, and the sidebar bottom controls were clipped at the 742 px viewport height. Fixed with adaptive tooltip placement and a short-viewport sidebar density rule.
3. Final browser pass: login and dashboard screenshots were recaptured after the fixes; no actionable P0/P1/P2 differences remained.

## Primary interactions tested

- Demo email/password login returns to the dashboard.
- Sidebar navigation switches Dashboard → POS Kasir → Dashboard.
- Sales chart points are keyboard/focusable and clicking the Sen point updates the tooltip to `Rp 2.900.000 · Sen · omzet`.
- Dashboard and login screenshots captured after the final reload.
- Browser console checked after the interactions: no error entries.

## Mobile responsive pass

- Viewports checked: 390 x 844, 360 x 800, 320 x 800, plus a 1280 x 742 desktop regression pass.
- All nine workspace routes were checked at 360 px without document-level horizontal overflow.
- The narrow 320 px dashboard also passed the overflow check after the chart tooltip and root-width fixes.
- Mobile navigation is a compact two-column workspace menu with an explicit close action; the desktop sidebar remains visible at desktop width.
- POS keeps the cart actions visible on mobile, collapses the cart before scrolling to it, and exposes product search, payment, and clear-cart buttons without covering the flow.
- Transactions, products, and inventory tables switch to labeled responsive rows at mobile widths instead of requiring horizontal scrolling.
- Evidence: `docs/qa/mobile-dashboard-390.png`, `docs/qa/mobile-menu-390.png`, `docs/qa/mobile-pos-cart-390.png`, `docs/qa/mobile-transactions-390.png`, and `docs/qa/desktop-dashboard-final.png`.

## Navbar reference iteration

- Source references reviewed: `C:\Users\falzz\Downloads\0fcb041b8f7397ea31453eaeb5738e23.jpg` for the mobile floating active item and `C:\Users\falzz\Downloads\51f3c76ae0b5adc7dad3af1b01a11437.jpg` for the dark expanded sidebar hierarchy.
- Desktop navigation now uses a quiet charcoal rail, a larger brand lockup, a single inset active capsule, monochrome icon wells, and restrained badges. The duplicate profile card was removed from the rail so identity stays in the topbar.
- Mobile navigation now has a five-item quick bar with a raised active item; the full workspace menu hides the quick bar while open to avoid two competing navigation surfaces.
- Evidence: `docs/qa/navbar-desktop-reference.png`, `docs/qa/navbar-mobile-reference.png`, and `docs/qa/navbar-mobile-menu-reference.png`.

## Desktop connection annotation

- The desktop shell now has no outer padding or column gap. The dark rail is fixed full-height, flush to the viewport edge, and joins the content surface at the grid boundary even while the dashboard scrolls.
- The mobile breakpoint keeps its compact rounded header treatment and the five-item quick bar; desktop-only rail changes do not leak into mobile.
- Evidence: `docs/qa/navbar-connected-desktop.png` and `docs/qa/navbar-fixed-scroll.png`.

## Navigation information architecture annotation

- The single Workspace list is now split into four task-oriented groups: Ringkasan, Penjualan, Operasional, and Laporan & sistem.
- Group labels and dividers are visible in the desktop rail and the mobile all-area menu, while the quick mobile bar stays focused on the five most common destinations.
- The grouped mobile menu remains compact at 390 px, hides the quick bar while open, and still routes correctly to Laporan.
- Evidence: `docs/qa/navbar-grouped-desktop.png` and `docs/qa/navbar-grouped-mobile-menu.png`.

## Final result

## Account role pass

## Customer profile reference pass

- Source visual truth: the user-provided mobile profile reference with the dark hero, centered avatar, quick account summaries, and a raised active profile tab.
- The customer Profile view now uses that hierarchy without copying unrelated social/profile controls: a CanteenOS-branded hero, editable-profile avatar component, customer identity, logout action, favorite/order/outlet shortcuts, and order preferences.
- Existing actions remain wired: Menu favorit opens the filtered Menu view, Riwayat opens Order, notification preference shows the customer notice, pickup preference opens Order, and both logout controls use the existing session handler.
- Mobile screenshot pass at 416 × 742 confirms the profile hero, stats, preferences, and raised Profil navigation remain readable without horizontal overflow. Desktop layout uses the same visual language with three-column account summaries.

- Login screen now exposes separate `Admin sekolah` and `Pelanggan` entry points without adding a second navigation shell to the admin workspace.
- Customer demo registration/login was tested through the portal, including menu filtering and adding a product to the customer cart.
- Admin demo rejects a non-school email and accepts the school-domain test account only after the password condition is met.
- Live admin conditions are represented in the database migration: verified email, active profile, employee code, default outlet, and administrator approval.
- Customer portal uses a lighter menu/cart layout and never renders the admin sidebar or operational modules.

## Final result

passed

## UI/UX guide alignment

- Guide source: `C:\Users\falzz\Downloads\Panduan_UI_UX_Sistem_Kantin_Digital_Sekolah.docx`.
- The document was read structurally through its paragraphs and tables. A visual DOCX render was unavailable because LibreOffice/`soffice` is not installed in the environment; the guide contains no embedded visual assets, so the token and component checklist remained auditable.
- The presentation layer now follows the guide's calm institutional direction: `#F8FAFC` canvas, white surfaces, slate text, green primary actions, compact 8–10px radii, restrained shadows, persistent labels, and 42px controls.
- Desktop shell uses a connected 240px fixed rail with grouped navigation, a topbar identity area, max-width content, and an internal rail scroll fallback for shorter viewports. Tablet uses a 72px icon rail; mobile uses the existing quick navigation and grouped menu without duplicating the brand header.
- Auth was reduced to a centered 440px secure panel with neutral Google action, account-role switch, persistent labels, password visibility control, inline status messaging, and no decorative split-screen illustration. Auth handlers, role checks, and database calls remain unchanged.
- Dashboard keeps the existing KPI, sales trend, and rasio penjualan data while removing decorative gradients/glows from cards and charts. POS and operational modules retain their handlers and data contracts while receiving table-first spacing, compact controls, clear status badges, and a 400px desktop cart column.
- Product thumbnails and interface controls use the source-controlled Central fill SVG collection from `Speth-Labs/Assets`, rendered as local mask assets with tone-based backgrounds rather than emoji or CSS-generated labels. Product records and their existing visual metadata remain unchanged.
- Responsive checks completed in the in-app browser at the default desktop viewport and 390px mobile viewport: no document-level horizontal overflow, mobile menu grouping remains readable, and the customer portal keeps the same catalog/cart behavior with a neutral, non-gradient hero.

## Verification after guide pass

- `npm.cmd run lint` passed.
- `npm.cmd test` passed: build plus 4 rendered HTML/contract tests.
- `git diff --check` passed; only line-ending normalization warnings were reported for existing Windows files.

## Completion audit

- Final production preview: `http://localhost:3003/`, served locally and checked through HTTP after the Central asset swap.
- Runtime computed styles confirm the guide canvas (`#F8FAFC`), white cards, flat connected charcoal rail, no card background gradients, 10px card radius, and restrained shadow.
- Auth runtime confirms a 440px centered panel, no legacy split illustration, neutral Google action, and icon-based password visibility control.
- Customer runtime confirms the admin sidebar is absent, the customer catalog renders eight products, and the hero is a flat white surface without a gradient.
- Seven operational destinations were opened successfully: Transaksi, Produk & Menu, Inventori, Pembelian, Shift & Kas, Laporan, and Administrasi.
- Final desktop runtime at 1280px has no horizontal overflow and no console errors; the 390px mobile runtime also has no horizontal overflow and keeps the grouped menu readable.
- The UI pass preserves the existing handlers, data contracts, and POS/customer behavior; icons now resolve from 59 byte-preserved SVG assets under `public/icons/central-fill/`, with provenance recorded in `public/icons/central-fill/SOURCE.md`.

## Purple reference and Motion pass (latest visual direction)

- Latest source visual truth: `C:\Users\falzz\.codex\attachments\712b6100-6ac7-4ff9-85cf-9d53654f65ba\image-1.png` (1200 x 2301). This explicit user reference supersedes the earlier green presentation direction while keeping the documented workflows and system behavior intact.
- Comparison artifact: `C:\Users\falzz\AppData\Local\Temp\kantinkita-reference-compare.png`, containing the reference dashboard and the 1280px implementation in one image for direct visual review.
- The implementation now matches the source's defining traits: eggplant connected rail, plum canvas and cards, compact five-card KPI row, violet/pink/blue accents, restrained borders, tight labels, dark toolbar controls, and purple analytical charts.
- The light theme remains available as a separate lavender/white system; the theme switch is persisted and was tested at mobile width.
- Motion is implemented with the official `motion` package and `motion/react`: shared-layout sidebar indicator, route enter/exit, navigation progress bar, KPI stagger, modal spring, toast presence, and animated live-data skeleton blocks.
- UX safeguards retained: visible POS actions, backdrop dismissal, reduced-motion CSS, readable focus states, connected desktop navigation, grouped mobile menu, and no horizontal overflow.
- Desktop verification: 1280 x 800, dashboard and POS, five KPI cards, one route view after transition, modal opened by the visible payment button, document width equals viewport content width.
- Mobile verification: 390 x 844, dashboard, grouped menu, and light theme. No document-level horizontal overflow; the fifth KPI spans the final row and the bottom navigation remains usable.
- Visual fixes from the review: replaced inherited serif display headings with the product sans stack, removed overlap between the animated theme thumb and its label in the topbar, and replaced residual green selection surfaces with violet states.

## Latest final result

passed

- Final hydration regression fixed by applying stored navigation, sidebar, and theme preferences after mount while bootstrapping the theme before paint.
- Fresh production tab after the fix: persisted dark theme and POS route restored, exactly one route view rendered, no horizontal overflow, and zero browser console errors.
- Final dashboard handoff: dark theme, five KPI cards, 1270px document/client width parity, and zero browser console errors.
- Final gates: `npm.cmd run lint`, `npm.cmd test` (build plus 4 tests), and `git diff --check` all passed.

## Humanized light pass — current handoff

- Reference direction: the supplied editorial mobile menu reference and the user's request for a calmer, more human customer role UI.
- Desktop capture: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\dashboard-light-desktop.png` at 1538 × 742, authenticated admin dashboard, light mode.
- Mobile capture: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\customer-light-mobile.png` at 396 × 742, demo customer portal with one active cart item.
- Additional captures: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\customer-light-desktop.png` and `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\dashboard-light-mobile.png`.
- Customer role surfaces checked: search, category tabs, favorites, menu detail, quantity controls, pickup time, sticky mobile cart, order history/reorder, and logout.
- Visual decisions: white canvas, thin rules, open list rows, restrained color accents, readable weight hierarchy, no decorative card pile, and a strong mobile cart contrast fix.
- Responsive evidence: 396px customer and admin viewports have no document-level horizontal overflow; 1538px admin and customer views preserve the connected shell and open content hierarchy.
- No handler, route key, storage contract, authorization rule, or data query was changed for this visual pass.

## Current result

passed

## Customer role storefront reconstruction — current pass

- Source visual truth: `C:\Users\falzz\Downloads\858d99c9733d7b60286a19efda290150.jpg` (720 × 1265 px), a Taco Bell-inspired food-ordering mobile reference. Brand, copy, food, and colors were adapted for KantinKita; the source brand was not copied.
- Customer UI is now a separate storefront surface. It no longer renders the admin sidebar, KPI workspace, operational modules, or management navigation.
- Home hierarchy follows the reference: compact brand/header actions, customer greeting, search/filter, plum food hero with CTA, circular menu categories, popular food cards, active-order status, offer banner, and a five-item bottom navigation with a raised Order action.
- Customer areas are separated into Home, Menu, Order, Offers, and Profil. Menu supports search, category filtering, favorites, detail modal, real food imagery, and add-to-order. Order supports quantity changes, pickup slot, active queue, reorder, and demo checkout. Offers and Profil have dedicated content instead of being placeholder tabs.
- Original KantinKita food assets are stored under `public/customer-assets/`: hero, nasi goreng, es teh manis, roti bakar coklat, air mineral, mie goreng telur, pisang keju, susu coklat, and chicken pop. They are used through normal image URLs and have no dependency on the reference image.
- Catalog imagery was checked against the card slot: product photos use `contain` inside the media frame so drinks and taller packaging remain fully legible instead of being cropped. Legacy SKU pseudo-labels were scoped back to the old admin thumbnails and no longer leak into the customer storefront.
- Admin boundary verified in the browser: customer login renders `.customer-app` without `.app-shell`; admin login renders `.app-shell` without the customer navigation.
- Browser interaction checks: customer demo login, home/menu/order/offers/profile navigation, drawer open/close, menu detail, favorite state, add-to-order, checkout into active queue, customer logout, and admin re-entry.
- Runtime checks: all generated customer images loaded successfully, customer document width matched the viewport at 1280px, and browser logs contained no errors.

### Current result

passed

- `npm.cmd run lint` passed with 0 errors and 3 `@next/next/no-img-element` warnings in the existing customer/page image renderers (`app/customer-portal-storefront.tsx:91`, `app/customer-portal-storefront.tsx:334`, `app/page.tsx:134`).
- `npm.cmd test` passed: build plus 8 rendered HTML and contract tests.
- `git diff --check` passed; only existing Windows line-ending normalization warnings were reported.

## Reference reconstruction pass — latest iteration

- Source visual truth: `C:\Users\falzz\AppData\Local\Temp\codex-clipboard-52a310f3-2416-4314-8e92-4f65a2f24632.png` (1200 × 1200 px) plus the supplied navigation references `C:\Users\falzz\Downloads\0fcb041b8f7397ea31453eaeb5738e23.jpg` and `C:\Users\falzz\Downloads\51f3c76ae0b5adc7dad3af1b01a11437.jpg`.
- Implementation evidence: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\dashboard-reference-desktop.png` (1538 × 742 CSS px at viewport 1538 × 742) and `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\dashboard-reference-mobile.png` (396 × 742 CSS px at viewport 396 × 742).
- State: authenticated demo manager, dashboard route, light theme, no open modal, live shift badge visible.
- Density: browser screenshots were captured at device scale 1; source is a framed 1200 × 1200 design board while implementation captures the viewport, so comparison focused on the dashboard content region rather than the source's outer mockup frame.

### Comparison history

1. Earlier light pass finding [P1]: implementation retained the old white editorial shell and differed materially from the supplied dashboard reference. Fix: added a scoped reference-led dashboard layer with a navy connected rail, centered profile panel, active navigation capsule, colored KPI hierarchy, tighter command strip, chart/ratio grid, and dark mobile navigation surface. Evidence: `dashboard-reference-desktop.png`.
2. Mobile pass finding [P2]: the five-card desktop KPI rule leaked into 396px and stacked text vertically. Fix: mobile-specific two-column KPI grid with the final stock card spanning both columns. Evidence: `dashboard-reference-mobile.png`.
3. Mobile pass finding [P2]: the opened menu inherited the light surface and its text lost contrast against the reference direction. Fix: navy left panel, readable muted labels, light active capsule, and preserved logo/close area. Evidence: browser capture at 396 × 742 after the fix.

### Required fidelity surfaces

- Fonts/typography: retained the product sans stack, reduced oversized display weight in the shell, and kept KPI values readable on colored surfaces; labels wrap only where the responsive layout permits.
- Spacing/layout: desktop follows the reference's left rail → KPI strip → action panel → analytical cards rhythm; mobile collapses to a readable two-column KPI layout and keeps the bottom navigation fixed without document overflow.
- Colors/tokens: light admin shell now uses the reference's navy, teal, amber, pale blue, and off-white surfaces; active and disabled states remain distinguishable.
- Image/asset fidelity: existing source-controlled icons and character upload slot remain in place; no new placeholder imagery or copied screenshot fragments were introduced.
- Copy/content: existing KantinKita data and Indonesian labels remain intact, including outlet, shift, sales, ratio, alert, and product data.
- States/interactions: sidebar navigation, POS route, mobile menu open/close, dashboard actions, and mobile KPI layout were checked; `body.scrollWidth` stayed below viewport width in the 396px and 1538px passes.

### Intentional product adaptations

- The generic reference's calendar, social list, and four-card metric labels are represented by KantinKita's existing character slot, operational actions, five KPI values, sales chart, ratio, alert, and top-menu surfaces so the redesign stays faithful to the visual hierarchy without removing product workflows or changing data contracts.

## Latest reference result

passed

- `npm.cmd test`: passed, 8/8.
- `npm.cmd run lint`: passed, one pre-existing `@next/next/no-img-element` warning at `app/page.tsx:133`.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin typography readability pass — current

- Source visual truth: the latest admin browser review at 1263 × 742 px and the mobile admin review at 406 × 742 px, where several labels, metadata, status pills, and navigation captions read too small.
- Scope: admin `.app-shell` only. The customer storefront type scale and all application behavior remain unchanged.
- Readability changes: microcopy was lifted by roughly 1px in a few targeted groups—section labels, page descriptions, KPI labels/footers, chart legends, ratio metadata, product ranking metadata, activity details, operational module metadata, status pills, and mobile bottom-nav captions. Primary headings and KPI values were deliberately left at their existing scale.
- Runtime QA: desktop and mobile font checks confirmed the new readable sizes without document-level horizontal overflow; the customer role selector remains outside the typography scope.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and the same 2 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Customer profile refinement — current

- Source visual truth: the latest customer profile annotations at 416 × 742 px, focused on the crowded account summary modules, the order-history quick action, and the oversized profile cover.
- The profile cover is now shorter on mobile and ends in a centered, straight-edged geometric cut behind the avatar rather than a long curved field. The existing avatar, brand, navigation, and account actions remain unchanged.
- The three account summaries now have a consistent 12px rhythm and soft accent surfaces so favorite count, order history, and default outlet read as separate modules without looking like a rigid table.
- Quick-action buttons keep their existing routes and now transition to a light surface with dark ink on hover, focus, and press, so the receipt icon remains visible during interaction.
- Browser evidence: mobile content width is 401px with no horizontal overflow; cover height is 232px; summary modules render at 112px high with 12px gaps.

### Current result

final result: passed

- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Customer profile refinement pass — current

- Source visual truth: the user-provided mobile profile reference with a dark geometric hero, centered overlapping avatar, open account summaries, and rounded preference controls (416 × 742 CSS px browser annotation).
- Implementation evidence: browser captures from `http://localhost:3003/` at 416 × 742 CSS px for the customer Profile route. The top capture verifies the dark cover and avatar overlap; the lower capture verifies the account summary modules and preference rows.
- Finding [P2]: the profile hero still carried a white asset-shaped panel and the avatar relationship was visually ambiguous. Fix: the cover is now a transparent layout layer with an isolated dark/black geometric pseudo-layer clipped beneath the avatar stage; the page background remains outside that shape instead of being painted into the cover.
- Finding [P2]: favorite/order/outlet summaries were open columns separated by rigid divider lines. Fix: each summary is now a softly tinted, color-accented module with its own icon, action pill, hover depth, and responsive wrapping while preserving the same handlers.
- Finding [P2]: order preferences were full-width rows separated only by horizontal rules. Fix: each setting is now an independent rounded bar with a mint, amber, or danger accent, icon surface, value pill, hover/focus depth, and existing click behavior unchanged.
- Responsive evidence: profile content remains within the 416px mobile viewport (`body.scrollWidth` 401px in the checked state), and the desktop profile rules remain scoped separately from the customer mobile treatment.
- Runtime evidence: the profile route rendered the dark cover, avatar, three summary modules, and three preference rows after reload; no new route, auth, storage, or data behavior was introduced.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and 3 existing `@next/next/no-img-element` warnings only.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run build`: passed.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Customer profile editorial reference pass — current

- Source visual truth: the supplied mobile profile reference with a diagonal dark/light composition, circular avatar crossing the seam, centered identity, circular actions, a simple stats row, and an open settings rhythm instead of stacked cards.
- The customer profile now uses the real CanteenOS profile backdrop and avatar fallback assets in `public/customer-assets/`, while an uploaded customer avatar still takes precedence.
- Profile actions remain intact: back to home, order now, logout, favorites, order history, order notifications, outlet information, pickup-time preference, order notifications preference, and portal logout. The settings gear scrolls directly to `Pengaturan pesanan`.
- Visual hierarchy: the hero is an editorial composition with no enclosing profile card; stats use centered columns with light separators; preference rows use open typography and dividers instead of repeated rounded boxes.
- Mobile QA at 416 × 742: no horizontal overflow, the avatar remains centered over the diagonal seam, identity/actions wrap cleanly, the lower settings area remains reachable, and the fixed customer navigation does not change route behavior.
- Interaction QA: settings gear scrolled to the preference section; favorites opened `Menu`; order history opened `Pesananmu`; notification action opened the customer notification panel; returning through the profile tab restored the profile page.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin mobile bottom-tray spacing pass — current

- Source visual truth: the current browser annotation at 406 × 742 px targeting the fixed admin mobile bottom navigation.
- Scope: only the mobile tray surface was adjusted. Its bottom remains attached to the phone bezel, while the upper edge moves down by 4px so the floating active icon and the chart content have a little more breathing room.
- Preservation: desktop navigation remains hidden at desktop widths, the active destination treatment is unchanged, safe-area padding is preserved, and no admin routes or interactions were changed.
- Browser checks: mobile tray rect changed from `y=668.6 / h=73.8` to `y=672.4 / h=70` at 406 × 742 px; the document kept `overflowX=false`. Desktop at 1263 × 742 px kept the tray hidden and the welcome layout unchanged.

### Current result

final result: passed

## Admin welcome banner framing pass — current

- Source visual truth: the current desktop browser annotation showing the food visual clipped inside the short greeting banner.
- Desktop adjustment: the existing source-controlled food asset now uses a contained scale with a deliberate right inset at widths above 900px, so its composition reads as a framed visual instead of a full-bleed crop.
- Responsive preservation: the mobile rule remains unchanged (`74%` image scale), keeping the compact greeting composition and action buttons intact.
- Browser evidence: desktop checked at 1263 × 742 and mobile at 406 × 742; the banner stays within the viewport, no horizontal overflow was introduced, and the greeting copy/actions remain readable.
- `npm.cmd run lint`: passed with 0 errors and 2 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed.

## Admin topbar interaction pass — current

- Source visual truth: the current browser annotations for the admin Dashboard topbar, focused on the `Outlet aktif / Outlet Utama` control and the `Notifikasi workspace` panel.
- Outlet selector: the existing outlet control now exposes an accessible menu on click, keeps `Outlet Utama` visibly selected, and shows whether the current workspace is using demo-local data or the account's default outlet. It reuses the active outlet state and does not introduce a new route or data source.
- Notification panel: the notification header now has a compact back-arrow button with the accessible label `Kembali`; it closes the existing panel without changing notification read state or navigation behavior.
- Browser evidence: desktop checked at 1263 × 742 px with the outlet menu opened and closed, then the notification panel opened and closed through the new back control. Mobile checked at 406 × 742 px; the outlet selector remains intentionally hidden, the notification panel uses its fixed layout, and no horizontal overflow was introduced.
- `npm.cmd run lint`: passed with 0 errors and 2 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

### Current result

final result: passed

## Admin mobile bottom-navigation reference pass — current

- Source visual truth: the supplied mobile admin annotation at 442 × 742 px and the attached bottom-navigation reference showing a surface attached to the phone edge with a raised circular active destination.
- Implementation evidence: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-mobile-bottom-nav-active.png` at 442 × 742 CSS px, authenticated manager demo, light theme, Dashboard active.
- Finding [P2] the mobile tray sat 12px above the viewport and inherited a light outer shell while its inner surface stayed dark. Fix: the tray now has no bottom inset or duplicate outer background; the themed surface owns the visible border, radius, and shadow and finishes at the viewport edge.
- Finding [P2] the active destination used a normal-sized icon with a square-ish treatment. Fix: every admin mobile destination keeps the same five-item grid, while the selected icon becomes a 48px circular button with a themed ring and a 22px lift above the tray.
- Theme fidelity: light mode uses the light surface and readable muted labels; dark mode keeps the same geometry with a dark surface token and light contrast. The active state continues to use the existing reset accent and asset-backed icons.
- Browser interaction checks: Dashboard → Laporan → Dashboard produced exactly one active item each time; the active icon remained above the surface top, and the nav bottom aligned to the 742px viewport bottom without horizontal overflow.

### Current result

final result: passed

## Admin dashboard annotation pass — current

- The help card now uses the same dark navy rail family as the admin navigation, with a mint information accent and readable contrast in both themes.
- The dashboard command for `Kelola menu` now uses the existing source-controlled store icon instead of the diamond mark; route behavior and command handlers are unchanged.
- The greeting card no longer renders an interactive character slot or upload affordance. It uses the existing source-controlled customer food visual as a restrained background layer, with the greeting copy and actions kept in separate grid areas.
- The sales chart SVG now uses a non-letterboxed coordinate system so the tooltip anchor and directional marker share the exact rendered position of the active point on desktop and mobile.
- Browser verification: light admin dashboard checked at 1263 × 742 and 406 × 742; no character slot/picker remains in the dashboard DOM, the command icon resolves to `/icons/central-fill/store-4.svg`, the welcome panel has the food background, the tooltip and point share the same anchor, and mobile document width remains within the viewport.

### Current result

final result: passed

- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin shell spacing and brand polish pass — current

- Source visual truth: the current browser annotations at 1263 × 742 px for the admin `Outlet Utama` context pill, sidebar help card, and `KantinKita` brand row.
- Implementation capture: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-sidebar-polish.png` at the available 1280 × 720 CSS px viewport.
- Outlet context: tightened the pill to content-sized width with a smaller horizontal inset and icon gap, removing the unused trailing space while keeping the outlet label readable.
- Sidebar footer: inset the help card from the rail edges and retained its rounded surface so it no longer visually touches the navbar boundary; collapsed desktop navigation hides the footer completely instead of leaving a clipped fragment.
- Brand row: changed the expanded desktop brand layout to a three-column grid so the `KantinKita` wordmark has reserved space before the collapse button. The compact rail keeps its separate logo-and-toggle layout and all navigation icons remain visible.
- Browser evidence: expanded brand copy and collapse control have no overlap, the support card is inset by 8px on both sides, the outlet pill measures to its content, collapsed footer is `display: none`, and `document.documentElement.scrollWidth` remains equal to the viewport content width.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Customer profile editorial pass — current

- Source visual truth: the user-provided Cameron Garza profile reference, adapted to the CanteenOS customer account rather than copied as a social profile.
- The Profile view now uses an open composition instead of stacked cards: a dark cover band, centered avatar overlap, centered account identity, an unboxed three-column summary row, and a simple preference list separated by quiet rules.
- Existing functions remain wired: `Menu favorit` opens the filtered menu, `Total order` opens order history, `Outlet Utama` keeps its active-outlet notice, pickup and notification preferences keep their existing handlers, and both logout actions use the existing session logout flow.
- Mobile QA at 416 × 742 confirms the avatar, `Pelanggan Demo`, `Outlet Utama`, `Pengaturan pesanan`, and the raised `Profil` navigation state remain visible without horizontal overflow. The third summary preserves the full `Outlet Utama` label instead of truncating it.

### Current result

final result: passed

- `npm.cmd run build`: passed; only the existing chunk-size advisory was emitted.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin brand rail and sales chart accent pass — current

- Source visual truth: the current browser annotations at desktop and the requested light-theme sales chart refinement.
- Brand rail: the expanded desktop sidebar now allocates an explicit column for the collapse control; `Digital School Canteen` stays fully inside the copy column and no longer paints beneath or beyond the rail boundary.
- Sales chart: the existing interactive line, point selection, pointer dragging, tooltip, and data values are unchanged. The light theme now uses the existing blue-violet management accent for the line, area fill, point halo, and grid tint so the statistic reads as intentional without becoming noisy. Dark theme continues to use its existing purple accent tokens.
- Responsive check: desktop keeps the full navigation rail, while the 406 × 742 mobile layout hides the rail as before, keeps the bottom tray at the bezel, and introduces no horizontal overflow.

### Current result

final result: passed

- Desktop brand tagline fits within its 95px copy column (`scrollWidth === clientWidth`), and chart stroke resolves to the intended `#4f62d2` light-theme accent.
- Mobile document width remains within the 406px viewport; the chart remains visible and interactive, and the bottom navigation ends at the viewport edge.

## Admin welcome artwork fade pass — current

- Source visual truth: the latest admin dashboard annotation at 1263 × 742 px, where the food artwork in the welcome banner read as a separate rectangular block with a hard vertical edge.
- Scope: desktop welcome banner only. The existing mobile composition, dashboard copy, actions, route behavior, and asset source stay unchanged.
- The desktop artwork now lives on a masked pseudo-layer that expands from the right edge, uses a left-to-right alpha mask, and applies a restrained blur/saturation treatment so the image dissolves into the banner instead of forming a panel. A matching surface gradient remains above the image on the left to keep the greeting readable.
- Runtime QA: light-theme desktop at 1263 × 742 rendered a 990 × 126 welcome banner with the asset-backed image layer, visible fade layer, `mask-image` gradient, and `blur(1.2px)` filter. Mobile at 406 × 742 retained its previous background-image composition and no horizontal overflow was introduced.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and the same 2 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin mobile density and bezel navigation pass — current

- Source visual truth: the current browser annotations at 406 × 742 px for the admin Dashboard / Transactions mobile surface.
- Vertical rhythm: reduced mobile page-header and card gaps, tightened KPI cards, compacted chart height, and reduced module/table padding without hiding operational fields.
- Dashboard scan path: the three quick actions now form a horizontally scrollable row instead of three stacked blocks; the ratio panel uses a compact donut-plus-breakdown layout; recent transactions and top products use shorter touch cards while retaining names, totals, payment, cashier, and status.
- Cross-page scope: the same mobile density rules cover management, products, inventory, purchasing, cash/shift, reports, detail modules, and POS containers. Customer storefront selectors remain out of scope.
- Bottom navigation: the admin mobile tray is attached to the viewport bottom edge (bottom: 0) with the safe-area inset kept inside the surface, and the content bottom padding prevents the last content from being covered.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin Transaksi mobile-completeness pass — current

- Source visual truth: the current browser annotation at 406 × 742 px on the admin `Transaksi` route, where the page hierarchy was complete functionally but the mobile surfaces felt sparse and overly formal.
- Mobile hierarchy: the page header now uses a tighter title/context rhythm, the three KPI cards become a deliberate two-column + full-width composition, and each tone keeps its own visual role instead of collapsing into one flat surface.
- Transaction module: search and filter controls are arranged for thumb reach, the mobile list cards expose invoice/time, status, menu summary, cashier, item count, payment, and total, and the existing pagination remains visible as a compact control group.
- Detail continuity: selecting a transaction still opens the existing detail and audit cards, now stacked with touch-sized actions and grouped metadata so the mobile flow does not feel cut off after the list.
- Scope safety: the pass is limited to the admin route through the existing transaction-list hook and mobile media rules; desktop table layout, live/demo data loading, pagination logic, and existing button handlers remain unchanged. Search now also matches the stored menu names.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Mobile navigation drawer and bottom-tray pass — current

- Source visual truth: the current browser annotations at 442 × 742 px showing the admin drawer with a distracting native scrollbar and the fixed bottom navigation covering the drawer's lower area.
- Implementation path: `app/ui-reset.css`, scoped to `.app-shell` and `@media (max-width: 900px)`, so the customer storefront and desktop admin rail keep their existing behavior.
- Drawer treatment: the panel now uses a layered navy surface, softer 24px radius, subtle glass highlight, clearer active-state pill, grouped section rhythm, modern icon tiles, and a larger touch-safe close button.
- Scroll behavior: the drawer remains internally scrollable with touch overscroll containment, but the grey scrollbar track is visually removed for WebKit and Firefox instead of disabling scrolling.
- Layering behavior: `.mobile-bottom-nav.is-menu-open` fades, moves below the viewport, and disables pointer events while the drawer is open; it returns when the drawer closes, so it no longer blocks navigation items.
- Desktop safety: the available browser smoke viewport remains horizontal-overflow free, the bottom nav remains hidden on desktop, and the responsive rule was parsed by the browser without stylesheet errors.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings.

## Admin brand, welcome, and mobile rhythm annotation pass — current

- Source visual truth: the latest browser annotations for the light Dashboard: the expanded sidebar brand at 1263 × 742 px, the welcome panel, and the mobile dashboard scrolled through the activity feed at 442 × 742 px.
- Implementation evidence: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-sidebar-welcome-mobile-fix-desktop.png`, captured at 1280 × 720 CSS px with device scale 1. The existing mobile reference capture remains `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-color-depth-mobile.png`; the responsive patch is scoped to the same mobile breakpoints and does not change route or data behavior.
- State used for comparison: authenticated manager demo, light theme, Dashboard route, expanded rail for brand review and collapsed rail smoke-tested afterward.

### Findings and fixes

1. [P2] The sidebar brand subtitle was clipped because the full rail left only 84px for the copy while the collapse button consumed the remaining row width. Fixed by tightening the brand grid gaps/padding and shrinking only the subtitle tracking so `Digital School Canteen` fits without changing the sidebar's overall width.
2. [P2] The light welcome area inherited a zero-radius, high-contrast rectangular treatment that read as a hard box above the KPI row. Fixed with a soft translucent gradient, rounded 26px desktop surface, restrained inset highlight, and reduced decorative opacity; the character upload slot remains visible and functional.
3. [P2] On mobile the dashboard welcome header still followed the parent flex column, so the character slot became a second full-width block and pushed the KPI strip too far down. Fixed by explicitly switching the dashboard welcome card to a two-column grid at ≤900px, keeping title/actions on the left and the character slot on the right; ≤520px uses a tighter 96px character rail, smaller actions, compact KPI cards, and a shorter chart.

### Focused comparison evidence

- Brand focus: current desktop capture shows the complete subtitle inside the rail; computed copy width is 100px with no text overflow, and the collapse control remains contained.
- Welcome focus: current desktop capture shows the welcome surface with rounded edges and a lower-contrast background, while the character upload affordance remains visible.
- Mobile focus: the responsive rules now use `display: grid` rather than relying on the inherited mobile flex column; the title, actions, and character slot have explicit grid areas, so the mobile hero no longer creates an avoidable full-width second section. The in-app preview used for this pass was fixed at the available 1280 × 720 viewport, so the mobile evidence path above is retained as the normalized breakpoint reference while the new geometry is validated from the scoped CSS rules.

### Browser and regression checks

- Desktop Dashboard rendered cleanly after hot reload; no document horizontal overflow (`scrollWidth === 1265` at `innerWidth === 1280`).
- Sidebar collapse/expand smoke test passed; collapsed state retained all 9 navigation icons and the document width stayed within the viewport.
- Preview logs contained only normal Vite/React informational messages; no new runtime errors were introduced.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

### Current result

final result: passed

## Admin color, depth, and responsive polish pass — current

- Source visual truth: the supplied admin dashboard reference `C:\Users\falzz\AppData\Local\Temp\codex-clipboard-86488dbc-2590-4151-91df-a9b3272f3c84.png` (1200 × 900 source px), used for the navy rail, light workspace, KPI strip, analytics pairing, and restrained management density.
- Implementation evidence: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-color-depth-desktop.png` (1280 × 720 CSS px, device scale 1), `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-color-depth-mobile.png` (390 × 844 CSS px, device scale 1), and `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-mobile-management.png` (390 × 844 CSS px, device scale 1). Desktop source and implementation heights differ, so the comparison was normalized to the admin content frame rather than browser chrome.
- State used for comparison: authenticated manager demo, light theme, Dashboard route for desktop/mobile, then `Produk & Menu` for the mobile management check. The app role boundary, existing data, route keys, realtime behavior, and action handlers were unchanged.
- Color system: the light admin shell now uses a more deliberate off-white canvas with coral/blue/mint ambient glows, a soft welcome gradient, and five distinct KPI treatments (teal, gold, sky, navy, violet). Analytics cards keep their semantic surfaces and the existing rasio penjualan / sales chart content.
- Depth and motion: the desktop shell receives a pointer-driven parallax variable capped to a small 12px × 8px range; the welcome decorative rings and character slot respond with separate damped transforms. Hover elevation is restrained, and `prefers-reduced-motion` plus the mobile breakpoint disable decorative transforms.
- Mobile behavior: at 390 × 844 the dashboard keeps the character slot, primary actions, colored KPI grid, and fixed bottom navigation inside the viewport. The document reports `scrollWidth === 375` against a 390px viewport with horizontal overflow hidden; the narrower 375px content width is the browser scrollbar-adjusted layout width, not a clipped horizontal page.
- Management rows: the mobile `Produk & Menu` table now removes its desktop 760px minimum, preserves the semantic table and labels, and renders each product as a rounded, spaced card so category, price, stock, status, and edit actions remain readable without horizontal scrolling.

### Comparison findings and fixes

1. [P2] The first visual pass still inherited a later light-theme `!important` rule that forced KPI cards to white, making white KPI text disappear. Fix: the new color variants now explicitly override that legacy background rule; post-fix desktop capture shows all five values and labels with readable contrast.
2. [P2] The first mobile management check retained the desktop product table's 760px minimum and produced a wide table inside the narrow card. Fix: the final mobile override resets the table width/min-width and converts product rows to compact cards; post-fix capture shows the first product row constrained to the card width and browser checks report no document horizontal overflow.
3. [P3] The source reference uses a generic sales-management vocabulary while KantinKita uses operational Indonesian copy and a five-KPI model. This is an intentional product constraint, not a visual regression; copy and system semantics remain KantinKita-specific.

### Required fidelity surfaces

- Fonts and typography: existing KantinKita sans hierarchy and Indonesian copy were preserved; KPI labels remain compact while values retain their existing optical hierarchy. No display font or weight system was replaced.
- Spacing and layout rhythm: desktop card gaps and content frame remain stable; mobile welcome, KPI, analytics, and fixed navigation are contained within the viewport. The management table changes only below 640px.
- Colors and visual tokens: the light palette now maps distinct semantic accents to KPI and analytics surfaces; dark theme selectors retain their own purple token family, and no customer storefront selector is targeted.
- Image quality and asset fidelity: the existing logo, icons, product assets, and character upload slot remain intact. The parallax layer is decorative CSS motion only and does not replace source-backed imagery.
- Copy and content: existing dashboard metrics, operational actions, menu names, stock values, and role-specific labels remain unchanged.

### Browser verification

- Desktop: 1280 × 720, Dashboard active, 5 KPI cards rendered, document `scrollWidth` 1265 with `innerWidth` 1280, and parallax variables changed to `4.50px / -2.67px` on pointer movement.
- Mobile: 390 × 844, Dashboard active, 5 KPI cards rendered, mobile bottom navigation visible, no document horizontal overflow.
- Mobile management: `Produk & Menu` opened through the mobile navigation; product table width measured 317.6px inside the card after the fix, with `min-width: 0px` and `overflow-x: hidden` at document level.
- Console/runtime: no new application error was observed in the final fresh-tab checks. The earlier hot-reload disconnect was recovered by restarting the local preview and was not a runtime failure in the final state.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Dashboard loading order and activity product-copy pass — current

- Source visual truth: the current browser annotations for `PERFORMA PENJUALAN` and `Daftar transaksi terbaru` at 1263 × 742 px, with the existing light admin reference `C:\Users\falzz\AppData\Local\Temp\codex-clipboard-86488dbc-2590-4151-91df-a9b3272f3c84.png` used as the broader dashboard baseline.
- Implementation captures: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-dashboard-product-activity-top.png` and `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-dashboard-product-activity.png`, both captured at 1280 × 720 CSS px with device scale 1.
- State used for comparison: authenticated manager demo, light theme, Dashboard route. The top capture records the loading transition; the focused capture scrolls the `Aktivitas terbaru` card into view after data is ready.
- Finding [P2] the dashboard loading skeleton rendered the chart placeholder before the ratio placeholder, putting the circular donut geometry on the right even though the loaded dashboard places `Rasio penjualan` on the left. Fix: reorder `DashboardSkeleton` so `.skeleton-ratio` is the first main-insights child and `.skeleton-chart` remains second.
- Finding [P2] recent activity cards used invoice IDs as their primary title, which made the dashboard feel like an accounting log and hid the menu context. Fix: demo transaction records now carry real `itemNames`; the dashboard uses the first product as the title and the remaining products as supporting copy while preserving invoice IDs in the accessible label and transaction route.
- Browser evidence after the fix: activity titles are `Nasi Goreng Spesial`, `Es Teh Manis`, and `Nasi Goreng Spesial`; the activity feed contains zero visible `#INV` titles; the dashboard reports `scrollWidth === 1265` against a 1280px viewport.
- Fidelity surfaces checked: typography remains consistent with the light dashboard, card spacing and order match the loaded analytics composition, colors/tokens are unchanged, no image assets were altered, and copy now exposes human-readable menu names instead of implementation identifiers.

### Current result

final result: passed

- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin dashboard interaction and card modernization pass — current

- Source visual truth: the current admin browser annotations at 1263 × 742 px, focused on the sidebar footer, `Aktivitas terbaru`, `Produk terlaris`, and the seven-day sales chart.
- Implementation captures: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-dashboard-modern-cards.png` and `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-dashboard-chart-scrub.png`, captured at the available 1280 × 720 CSS px desktop viewport with the manager demo and light theme.
- Finding [P2] the help card, logout row, and metadata competed for the same compact rail area. Fix: the support card now uses a two-line icon/title/action layout, the footer metadata is a separate `Shift aktif` status row, and the green indicator pulses without painting the text background.
- Finding [P2] recent transactions and top products still read as line-separated tables. Fix: the existing real data now renders as three responsive activity cards and three compact product cards with grouped content, status pills, soft surfaces, and hover lift; the legacy activity table is hidden from the dashboard presentation layer.
- Finding [P2] the sales chart only reacted to individual point clicks. Fix: the chart canvas now owns pointer capture and resolves the nearest data point while the pointer is scrubbed horizontally, while preserving hover, keyboard focus, and click behavior. `Cua drag` QA moved the active selection from `Kam · omzet` to `Sab · omzet` and updated the tooltip without changing the underlying data.
- Theme/role boundary: selectors are scoped to `.app-shell` and `data-theme`; the data contracts, admin routes, POS flow, and customer storefront remain unchanged. The card treatment uses the existing light/dark reset tokens rather than introducing a second visual system.

### Current result

final result: passed

- Browser QA: support card and shift footer no longer overlap; activity feed reports a three-column grid with the legacy table hidden; product ranking reports three card surfaces; chart drag changed the active point and tooltip; no document-level horizontal overflow was introduced in the 1280 × 720 desktop check.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin light KPI and navigation polish pass — current

- Source visual truth: the current-task admin browser annotations at 1263 × 742 px, including the selected KPI strip, the desktop rail, and the scrolled rail state.
- Implementation captures: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-light-kpi-nav-polish.png` (1280 × 720 CSS px) and `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-light-sidebar-scroll-polish.png` (1280 × 720 CSS px).
- Light-theme surface correction: removed the white wrapper behind the KPI cards, kept the five cards as separate surfaces, and softened the admin cards with rounded corners, restrained borders, and lighter depth so the dashboard no longer reads as a stack of formal boxes.
- Rail behavior: the desktop admin rail is now fixed to the centered shell while the workspace scrolls, so the navigation does not get cut away with the page. Its internal scroll remains available for the help and account controls when the viewport is short.
- Collapsed navigation: every grouped nav section remains rendered in collapsed mode; labels hide while all nine source-backed icons retain their hit area and mask. Active-state checks passed across Dashboard, POS Kasir, Transaksi, Menu, Stok, Pembelian, Kas & Shift, Laporan, and Pengaturan.
- Role boundary: selectors are scoped to `.app-shell` and `data-theme="light"`; the customer storefront and its mobile bottom navigation are untouched.

### Current result

final result: passed

- Browser QA: 9/9 admin routes kept a visible active icon; collapsed rail rendered 9/9 icons; body scroll kept the rail aligned to the viewport; no document-level horizontal overflow was introduced.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin sidebar control icon pass — current

- Source visual truth: the supplied browser annotation on the admin sidebar brand row, where the collapse/expand control is the visible interaction target.
- Implementation evidence: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-light-collapsed-modern-toggle.png`, captured at a 1265 × 720 CSS px desktop viewport with device scale 1; the focused region is the top-left brand/control row.
- State used for comparison: authenticated manager demo, light theme, Dashboard route, collapsed rail state. The expanded state was also checked before collapsing so the icon direction can be validated in both states.
- Finding [P3] the sidebar glyph communicated a panel shape but did not clearly communicate the action. Fix: the control now uses the existing central-fill arrow assets—`arrow-left.svg` while the rail is open and `arrow-right.svg` while collapsed—without changing its label, keyboard behavior, or click action.
- Post-fix browser evidence: expanded control source is `/icons/central-fill/arrow-left.svg`; collapsed control source is `/icons/central-fill/arrow-right.svg`; the collapsed button remains fully contained at `[44, 19, 24, 24]` inside the 76px rail.
- Fidelity surfaces: typography and copy are unchanged; spacing and button geometry remain stable; the icon uses the existing KantinKita asset system and inherits the established rail color tokens; no image or CSS-drawn substitute was introduced.

### Current result

final result: passed

- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin desktop shell and collapsed rail pass — current

- Source visual truth: the supplied browser annotations for the light admin Dashboard at 1263 × 742 px, focused on the collapsed `Perluas navigasi` control and the full dashboard content frame.
- Implementation evidence: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-light-fullscreen.png` and `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-light-collapsed-fullscreen.png`, captured at a 1265 × 720 CSS px desktop viewport with device scale 1.
- State used for comparison: authenticated manager demo, light theme, Dashboard route, first expanded and then collapsed sidebar state. The source and implementation differ by browser chrome and height, so the comparison was normalized to the workspace frame and rail/content relationship.
- Finding [P2] the light desktop shell retained a centered 1200px frame, leaving visible gutters around the workspace. Fix: the light desktop shell now fills the viewport (`width: 100%`, `min-height: 100vh`, zero outer margin/radius/shadow) and the fixed rail begins at the viewport edge.
- Finding [P2] the collapsed sidebar button was positioned outside the rail and clipped by horizontal overflow, leaving only part of the control visible. Fix: the collapsed rail uses a compact two-column brand row with a fully contained 24px toggle; the control is static inside the 76px rail and no longer relies on a translated overflow position.
- Post-fix browser evidence: expanded shell rect is `[0, 0, 1265, 1412]` with the sidebar at `[0, 0, 188, 720]`; collapsed shell remains full width, the content starts at x=76, and the toggle is `[44, 19, 24, 24]` fully inside the rail. Document `scrollWidth` remains 1265, matching the viewport.
- Fidelity surfaces: typography and copy remain unchanged; spacing now follows the reference's edge-to-edge desktop frame; the navy rail and light admin tokens remain intact; no image or icon assets were replaced; mobile rules stay scoped below 901px.

### Current result

final result: passed

- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin report surfaces polish pass — current

- Source visual truth: the supplied light Reports screenshot at 1263 × 742 px.
- Implementation evidence: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-light-report-polish-mobile.png` at the available 442 × 742 CSS px viewport, plus computed browser checks on the Reports route.
- State used for comparison: authenticated manager demo, light theme, Reports route. The focused QA check normalized to the report stat-strip and loading geometry because the available browser viewport was narrower than the supplied desktop reference.
- Finding [P2] loading donut inherited the generic skeleton radius and could render as a rounded square. Fix: the final `html[data-theme] .skeleton-donut` / `.ring` override uses `border-radius: 50%` so the report placeholder preserves circular geometry.
- Finding [P2] the light operational stat grid rendered a long surface behind its cards. Fix: `.app-shell .module-stat-grid` now has a 10px card gap, transparent background, no border, and no shadow in light theme; computed browser state reports a transparent wrapper with no top or bottom border.
- Broader check: the corrected module-stat-grid selector is shared by the operational report surfaces; the dashboard stats wrapper remains transparent from the earlier light-theme pass, and the report donut remains circular. No document horizontal overflow was introduced in the tested mobile viewport.

### Current result

final result: passed

- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin light rail smoothing pass — current

- Source visual truth: `C:\Users\falzz\AppData\Local\Temp\codex-clipboard-f1b7dff2-332d-49a2-8c29-04b0fda18729.png`, showing the admin light dashboard with the lower help area partially clipped.
- Implementation capture: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-light-sidebar-smooth.png` at 1280 × 720 CSS px.
- Rail fit: compacted the light-theme desktop navigation rhythm, support card, logout row, and metadata spacing so the fixed rail fits its viewport without pushing the footer below the visible canvas.
- Preservation: the help affordance remains available, the rail can still scroll on unusually short viewports, and the collapsed rail keeps all nine source-backed navigation icons visible.
- Browser QA: light dashboard rail reported `scrollHeight === clientHeight` at 1280 × 720, lower controls ended above the viewport edge, collapsed mode rendered 9/9 icons, and no document-level horizontal overflow was introduced.

## Customer storefront reconstruction pass

- Source direction: the supplied KantinKita customer portal screenshot plus the user's instruction to rebuild the customer-facing home, navbar, food menu, cart, and order journey instead of only recoloring the existing admin UI.
- New customer shell: dedicated customer navbar with Beranda, Menu hari ini, Pesanan saya, outlet context, realtime state, account popover, and responsive menu button.
- Homepage hierarchy: welcome hero, featured menu recommendation, service strip, menu-first storefront, sticky desktop cart, active-order tracking, and order history/reorder.
- Core interactions checked in the browser: customer demo login, menu search/category tabs, favorite toggle, menu detail modal, Tambah, Beli sekarang, quantity controls, pickup slot, checkout into an active queue, simulated order status progression, and logout popover.
- Responsive evidence: desktop storefront at 1280px and mobile storefront at 396px. Mobile keeps the food menu readable, uses one-column product cards at the narrowest width, keeps the sticky cart bar visible, and reports `body.scrollWidth` below the viewport width.
- Theme handling: storefront tokens have dedicated light and dark selectors so the customer experience keeps its own warm/teal hierarchy while following the app's `data-theme` value.
- System safety: existing auth, customer role authorization, catalog query, local favorites/order storage, and demo order behavior remain intact. The admin workspace still uses its existing shell and route set.

## Latest customer storefront result

passed

- `npm.cmd test`: passed, 8/8.
- `npm.cmd run lint`: passed with two existing `@next/next/no-img-element` warnings for local product image fallbacks.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Full UI reset — current pass

- The latest pass resets the visual layer around the supplied references while retaining the existing route keys, demo data, role checks, realtime subscriptions, POS three-step flow, profile settings, customer ordering, and operational module handlers.
- Admin shell: connected navy rail, grouped navigation, centered workspace content, colored KPI strip, operational command bar, sales/ratio cards, alert/product/activity surfaces, and a functional character upload slot.
- POS: product grid now fills the desktop content column, product actions remain explicit (`Tambah` and `Beli sekarang`), and the separate `Pilih produk → Cek keranjang → Bayar` pages stay usable.
- Customer role: dedicated storefront treatment remains separate from the admin shell, with home recommendation, menu filtering, favorites, detail, cart, pickup time, active-order tracking, reorder, and logout surfaces.
- Login: the role-aware login keeps the organic left/right split and curved operational panel from the supplied direction, with admin/customer demo entry and existing security validation intact.
- Collapsed desktop rail was rechecked after the reset: the active indicator is now bounded to the icon row, labels disappear cleanly, and no white vertical gutter remains.
- Evidence captures: `docs/qa/reset-login.png`, `docs/qa/reset-dashboard-light.png`, `docs/qa/reset-customer-light.png`, and `docs/qa/reset-customer-menu-light.png`.
- Source/prototype comparisons were reviewed side by side for the dashboard and login references. The implementation preserves the product's real content and controls instead of replacing them with a static screenshot.

### Current verification

- `npm.cmd run lint`: passed with two existing `@next/next/no-img-element` warnings only.
- `npm.cmd test`: passed, 8/8 (production build plus rendered HTML and contract tests).
- `git diff --check`: passed; only Windows line-ending normalization warnings were reported.
- Browser smoke checks: admin dashboard, POS product/cart/payment steps, profile settings/logout, customer demo login, customer menu add-to-order, grouped operational routes, and collapsed/expanded navigation.

## Admin sales-dashboard reference pass — current

- Source visual truth: `C:\Users\falzz\AppData\Local\Temp\codex-clipboard-86488dbc-2590-4151-91df-a9b3272f3c84.png` (1200 × 900 px), a light sales-management dashboard with a navy rail, white topbar, KPI strip, invoice donut, sales line chart, and recent-invoice table.
- State used for comparison: authenticated demo manager, admin dashboard route, light theme, no modal, 1280 × 720 in-app browser viewport.
- The reference was treated as a visual hierarchy rather than a reason to remove KantinKita workflows: the existing character upload, five operational KPIs, sales range control, rasio penjualan, quick actions, alerts, top products, and recent transactions remain available.
- Admin-only visual layer: the reference pass is scoped to `.app-shell` and `data-theme="light"`; the customer storefront keeps its separate `.customer-app` shell and warm ordering navigation.

### Comparison findings and fixes

1. The existing desktop shell inherited a full-viewport green/teal dashboard treatment. Fixed with a centered light canvas, compact navy management rail, white topbar, restrained borders/shadows, and reference-like KPI accent bars.
2. The legacy sidebar grid stretched each navigation section and made the bottom controls collide with the last group. Fixed by making desktop rail sections content-sized and letting the rail itself scroll when the viewport is short.
3. Two colored KPI variants inherited light-theme text intended for dark surfaces. Fixed with explicit readable ink tokens while retaining each card's colored accent line and tinted icon.
4. The welcome area duplicated the topbar greeting and pushed the analytical row too far below the fold. Fixed with a compact one-row header that keeps the character-upload function and primary actions without competing with the KPI strip.
5. The dashboard source places mix and sales analytics together. Fixed by ordering the existing rasio penjualan card first and the interactive sales chart second on desktop; the chart points and tooltip remain functional.

### Required fidelity surfaces

- Layout: centered shell → navy rail → white topbar → KPI strip → ratio/sales analytics → recent transactions, with KantinKita's operational command and alert surfaces retained below the primary analysis.
- Typography: calmer sans hierarchy, less display-heavy KPI values, readable muted labels, and Indonesian copy that stays natural to the product.
- Color: off-white canvas, white surfaces, navy navigation, violet/blue/teal/gold/pink accent bars, and dark ink with no low-contrast light text on white cards.
- Interaction: dashboard range selector changed from 7 to 30 days and restored to 7 days in the browser; Transaksi route opened successfully and its white module cards/table remained readable.
- Role boundary: admin continues to render `.app-shell`; customer storefront remains a separate `.customer-app` surface and is not targeted by the admin reference selectors.

### Current result

final result: passed

- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and 3 existing `@next/next/no-img-element` warnings in the current local image renderers.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.
- Final admin browser state: light theme, Dashboard active, 1280px viewport, no customer shell, no document-level horizontal overflow, and the 7-day sales range restored after testing the 30-day option.

## Customer bottom-navigation active-state pass — current

- Source visual truth: the current-task browser annotation at 442 × 742 px with the customer `Order` tab selected and shown as a raised plum circle.
- State used for comparison: customer demo account, light theme, customer Home and Order views, fixed bottom navigation visible.
- The active circular treatment is now shared by all five customer destinations: Home, Menu, Order, Offers, and Profil. Each button keeps its own label and icon, while the selected icon receives the same plum circular surface, light ring, small lift, and shadow.
- The Order cart badge remains attached to the shopping-bag icon and no longer controls the active-state geometry. Existing customer routes, order state, cart behavior, and role separation were left unchanged.
- Browser interaction checks: clicked Home → Menu → Order → Offers → Profil and confirmed exactly one active button, one active circle, and the expected customer page after every transition. Home and Order were captured at the same 442 × 742 viewport for visual review.

### Current result

final result: passed

- Customer shell stayed isolated from `.app-shell`; no horizontal overflow was introduced at the tested mobile viewport.
- `npm.cmd test`, `npm.cmd run lint`, and `git diff --check` are the required final checks for this iteration.

## Customer responsive desktop and order-status pass — current

- Source visual truth: the current-task browser annotations for the customer storefront (desktop evidence at 1263 × 742 px and the status-row evidence in the same flow).
- Implementation captures: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\customer-desktop-navigation-current.png` (1280 × 720 CSS px) and `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\customer-desktop-order-status-current.png` (1280 × 720 CSS px), plus `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\customer-mobile-status-current.png` (442 × 742 CSS px). The desktop browser capture uses the available 1280 × 720 QA viewport; the annotated source viewport is 1263 × 742, so comparison was normalized to the storefront content rather than browser chrome.
- Desktop layout: the customer frame now has a deliberate wide canvas, larger hero and product-media rhythm, centered content gutters, a three-column popular grid, a horizontal active-order status row, and a fixed desktop bottom navigation without changing the mobile breakpoint rules.
- Status affordance: each order step now has a real asset-backed icon—`circleCheck` for Diterima, `clock` for Disiapkan, and `packageCheck` for Siap diambil. The icon wrapper selector was scoped so the mask icon is no longer overwritten by the step-card background.
- Mobile preservation: the 442 × 742 capture keeps the two-column food layout, stacked order status cards, fixed bottom navigation, and one active circular nav indicator. No horizontal overflow was introduced.
- Interaction checks: desktop customer demo login, Home → Order navigation, active circle movement, and status icon rendering were checked; the three progress steps expose descriptive labels for assistive technology.

### Current result

final result: passed

- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Admin management workspace pass — current

- Source visual truth: the supplied admin management reference at `C:\Users\falzz\AppData\Local\Temp\codex-clipboard-86488dbc-2590-4151-91df-a9b3272f3c84.png`, plus the latest browser annotation showing the admin POS screen that needed to become management-only.
- Implementation capture: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-management-workspace-desktop.png` at the available 1280 × 720 CSS px viewport.
- State used for comparison: authenticated manager demo, light theme, desktop admin route, active `Manajemen` navigation, no modal. The reference was used for hierarchy and density; the product's existing KantinKita tokens and Indonesian operational copy remain the source of truth.
- Information architecture: the former admin-facing POS destination now opens `Manajemen kantin` with direct actions for `Tambah produk`, `Pantau stok`, `Cek pembelian`, and `Kas & shift`. Customer ordering/POS behavior remains isolated to the customer role and legacy internal POS flow.
- Visual hierarchy: a calm management hero, four operational stats, task cards, low-stock attention list, and follow-up links replace the cashier stepper/cart surface. The cards use restrained violet, mint, gold, and sky accents to keep the light theme readable without making the page feel like a static admin form.
- Interaction QA: `Tambah produk` opened `Produk & Menu`; `Cek pembelian` opened `Pembelian`; returning to `Manajemen` restored the new workspace. The old `Kasir POS` heading was absent on the management route.

### Current result

final result: passed

- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Product management row-surface pass — current

- Source visual truth: the current browser annotation for the `Produk & Menu` module at 1263 × 742 px, focused on the Import / Produk baru toolbar and product table separators.
- Implementation capture: `C:\Users\falzz\OneDrive\Documents\ChatGPT\Sistem Kasir\docs\qa\admin-products-modern-rows.png` at the available 1280 × 720 CSS px viewport.
- The product table keeps semantic `<table>` markup and every existing action, but replaces the ledger-like horizontal rules with spaced row surfaces, rounded outer corners, calm soft-surface contrast, and a light accent hover/focus state.
- The header remains visually quiet and the row spacing is consistent across the product name, category, pricing, stock, status, and edit columns; no new route or data behavior was introduced.
- Browser evidence: 8 product rows rendered, row backgrounds are separated by 7px vertical spacing, row cell borders are `0px`, document overflow remains absent, and product names / controls remain visible.

### Current result

final result: passed

- `npm.cmd run lint`: passed with 0 errors and the same 3 existing `@next/next/no-img-element` warnings.
- `npm.cmd test`: passed, build plus 8/8 rendered HTML and contract tests.
- `git diff --check`: passed; only existing Windows line-ending normalization warnings were reported.

## Customer mobile command drawer pass — current

- Source visual truth: `C:\Users\falzz\.codex\generated_images\019fe5ff-bb15-7e23-b072-0ad3688e7991\exec-3daf0566-ae5a-44b0-8cf8-e1e9a8ab9505.png` — the selected Command Drawer reference, 1011 × 1556 px.
- Intended implementation state: customer role, mobile viewport 482 × 742 CSS px, command drawer open, bottom navigation unchanged behind the scrim.
- Implementation screenshot path: no matching customer/drawer capture available. The only fresh headless capture is `docs\qa\customer-command-drawer-current.png` at 482 × 742 px, but it is the default authenticated admin dashboard and is not valid comparison evidence for this customer state.
- Density normalization: source is a 1011 × 1556 raster concept; the intended implementation is a 482 × 742 CSS viewport at device scale 1. A same-state comparison was not performed because the customer drawer could not be opened in an automated browser session.
- Full-view comparison: blocked. The Codex in-app browser automation failed during initialization, and the fallback headless browser could not reuse the user's authenticated customer session.
- Focused-region comparison: blocked for the same reason; no customer drawer DOM, screenshot, hover/focus state, or interaction capture was available.
- Implementation completed in code: the drawer now has a dark command-panel surface, CanteenOS brand header with close action, outlet/live status, color-accented route rows, Notifikasi and Preferensi utility actions, logout action, and the existing order/outlet footer. The bottom navigation markup and route keys remain unchanged.
- Static verification: `npm run lint` passed with 0 errors and three pre-existing image warnings; `npm test` passed with 8/8 tests.

### Current result

final result: blocked

- Blocker: the required same-state rendered customer drawer screenshot and interaction check could not be captured because the available in-app browser automation failed and the fallback browser opened the default admin state.
