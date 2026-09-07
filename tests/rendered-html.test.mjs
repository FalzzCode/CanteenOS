import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the authenticated CanteenOS entrypoint", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const isLoadingMarkup = /Menyiapkan workspace/.test(html);
  assert.match(html, /CanteenOS/);
  assert.match(html, /app-shell|auth-loading|Menyiapkan workspace/);
  if (isLoadingMarkup) assert.doesNotMatch(html, /Omzet hari ini|Produk terlaris/);
  else assert.match(html, /Omzet hari ini|Produk terlaris/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/i);
});

test("metadata and product UI replace the starter", async () => {
  const [page, layout, systemUi, uiReset, packageJson, modules, demoData, authScreen, auth, domain, catalog, plan, seed, customerPortal, googleAuthMigration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/system-ui.css", import.meta.url), "utf8"),
    readFile(new URL("../app/ui-reset.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/operational-modules.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/demo-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/auth-screen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/domain.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../docs/IMPLEMENTATION_PLAN.md", import.meta.url), "utf8"),
    readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/customer-portal-storefront.tsx", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260821222639_google_customer_only.sql", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Rasio penjualan/);
  assert.match(page, /Omzet hari ini/);
  assert.match(page, /Manajemen kantin/);
  assert.match(page, /Produk terlaris/);
  assert.match(page, /dashboard-command-bar/);
  assert.match(page, /motion\/react/);
  assert.match(page, /AnimatePresence/);
  assert.match(page, /DashboardSkeleton/);
  assert.match(page, /RouteSkeleton/);
  assert.match(page, /ManagementSkeleton/);
  assert.match(page, /ManagementWorkspace/);
  assert.match(page, /TablePageSkeleton/);
  assert.match(page, /ReportsSkeleton/);
  assert.match(page, /AdminSkeleton/);
  assert.match(page, /routeLoading/);
  assert.match(page, /route-progress/);
  assert.match(page, /salesRangeOptions/);
  assert.match(page, /sales-range-menu/);
  assert.match(page, /activity-feed/);
  assert.match(page, /recentActivities/);
  assert.match(page, /itemNames/);
  assert.match(page, /skeleton-ratio[\s\S]*skeleton-chart/);
  assert.match(page, /onClick=\{\(\) => setActiveIndex\(index\)\}/);
  assert.match(page, /activePoint\.xPercent < 28 \? " edge-left"/);
  assert.match(page, /left: `\$\{activePoint\.xPercent\}%`/);
  assert.match(page, /SIDEBAR_STORAGE_KEY/);
  assert.match(page, /management-action-grid/);
  assert.match(page, /Tambah produk/);
  assert.match(page, /Cek pembelian/);
  assert.match(customerPortal, /customer-app-bottom-nav/);
  assert.match(customerPortal, /customer-app-order-tab/);
  assert.match(customerPortal, /Menu tidak ditemukan/);
  assert.match(customerPortal, /Pemesanan online belum aktif/);
  assert.match(uiReset, /\.customer-app-home-cart-bar/);
  assert.match(uiReset, /\.customer-portal\.customer-app \.customer-app-empty-state/);
  assert.match(page, /readDemoShiftOpenedAt/);
  assert.match(page, /visibilitychange/);
  assert.match(page, /Asia\/Jakarta/);
  assert.match(page, /formatBandungTime/);
  assert.match(page, /formatBandungTime\(lastUpdatedAt\)\} WIB/);
  assert.match(page, /hourCycle: "h23"/);
  assert.match(uiReset, /\.customer-portal\.customer-app \.customer-app-payment-methods/);
  assert.match(systemUi, /\.module-search input:focus-visible\s*\{[\s\S]*?outline:\s*none[\s\S]*?box-shadow:\s*none/);
  assert.match(systemUi, /\.module-search:focus-within\s*\{[\s\S]*?border-color:\s*var\(--ui-border\)[\s\S]*?box-shadow:\s*none/);
  assert.match(systemUi, /html\[data-theme="dark"\] \.module-search:focus-within\s*\{[\s\S]*?box-shadow:\s*none/);
  assert.doesNotMatch(page, /handleShortcut|Ctrl K|F2|F4|cart-shortcuts/);
  assert.match(page, /mobile-menu-scrim/);
  assert.match(page, /mobile-menu-button[\s\S]*mobile-brand/);
  assert.match(page, /mobile-menu-brand/);
  assert.match(page, /mobile-menu" aria-label="Menu navigasi mobile" initial=\{\{ opacity: 0, x: -24 \}\}/);
  assert.doesNotMatch(page, /admin-parallax|adminIsScrolled/);
  assert.match(layout, /system-ui\.css/);
  assert.match(layout, /data-theme="light"/);
  assert.doesNotMatch(layout, /kantinkita-theme/);
  assert.match(systemUi, /\.sidebar-collapsed/);
  assert.match(systemUi, /\.app-shell\.sidebar-collapsed\s*\{[\s\S]*?column-gap:\s*0/);
  assert.match(systemUi, /\.app-shell\.sidebar-collapsed\s*> \.main-content\s*> \.content-wrap\s*\{[\s\S]*?padding-left:\s*16px/);
  assert.match(systemUi, /\.app-shell\.sidebar-collapsed\s+\.sidebar-collapse\s*\{[\s\S]*?position:\s*static/);
  assert.match(page, /className="nav-label"/);
  assert.match(systemUi, /\.sidebar-collapsed \.nav-label/);
  assert.match(systemUi, /\.app-shell\.sidebar-collapsed \.nav-icon\s*\{[\s\S]*?display:\s*grid/);
  assert.match(systemUi, /\.sidebar\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(systemUi, /\.side-nav\s*\{[\s\S]*?overflow-y:\s*auto/);
  assert.match(systemUi, /\.main-content\s*\{[\s\S]*?grid-column:\s*2/);
  assert.match(systemUi, /@media \(max-width: 860px\)/);
  assert.match(systemUi, /\.mobile-menu\s*\{[\s\S]*?right: auto;[\s\S]*?left: 0;[\s\S]*?border-radius: 0 18px 18px 0/);
  assert.match(systemUi, /\.mobile-menu \.nav-section-items\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(systemUi, /html\[data-theme="dark"\]/);
  assert.match(systemUi, /html\[data-theme="light"\]/);
  assert.match(systemUi, /@media \(min-width: 861px\)[\s\S]*?\.login-form-side[\s\S]*?border-radius: 64px 22px 22px 64px \/ 50% 22px 22px 50%/);
  assert.match(systemUi, /@media \(min-width: 861px\)[\s\S]*?\.login-form-side[\s\S]*?margin-left:\s*-52px[\s\S]*?padding-left:\s*clamp\(104px, calc\(6vw \+ 52px\), 140px\)/);
  assert.match(systemUi, /scrollbar-color:/);
  assert.match(systemUi, /nav-active-indicator/);
  assert.match(systemUi, /\.sales-range-menu/);
  assert.match(systemUi, /\.activity-item/);
  assert.match(systemUi, /\.topbar \.icon-button/);
  assert.match(systemUi, /\.dashboard-motion \.stats-grid \.stat-value[\s\S]*?font-weight:\s*600/);
  assert.match(systemUi, /\.dashboard-motion \.sales-summary-row strong[\s\S]*?font-weight:\s*600/);
  assert.match(systemUi, /\.dashboard-motion \.line-tooltip\s*\{[\s\S]*?calc\(-100% - 5px\)/);
  assert.match(systemUi, /\.dashboard-motion \.line-tooltip\.edge-left/);
  assert.match(systemUi, /\.dashboard-motion \.line-tooltip\.edge-right::after/);
  assert.match(systemUi, /Mobile route context:[\s\S]*?\.page-context-outlet\s*\{[\s\S]*?width:\s*auto[\s\S]*?\.page-context-outlet b\s*\{[\s\S]*?display:\s*inline/);
  assert.match(systemUi, /\.page-context-outlet > \.ui-icon\s*\{[\s\S]*?display:\s*none/);
  assert.match(systemUi, /Cash movement is a dense information card;[\s\S]*?\.cash-layout > \.module-card:nth-child\(2\)[\s\S]*?border-radius:\s*16px/);
  assert.match(systemUi, /skeleton-block/);
  assert.match(uiReset, /customer-skeleton-product-grid/);
  assert.match(systemUi, /skeleton-report-grid/);
  assert.match(systemUi, /skeleton-table-transactions/);
assert.match(uiReset, /\.app-shell:not\(\.sidebar-collapsed\) \.sidebar-brand \{\s*display: grid;\s*grid-template-columns: 36px minmax\(0, 1fr\) 30px/);
  assert.match(uiReset, /Admin performance guard/);
  assert.match(uiReset, /\.app-shell \.page-motion-skeleton/);
  assert.doesNotMatch(page, /ThemeToggle|onThemeChange|theme-toggle|kantinkita-theme/);
  assert.doesNotMatch(authScreen, /ThemeToggle|onThemeChange|theme-toggle|kantinkita-theme/);
  assert.match(authScreen, /Lanjutkan dengan Google/);
  assert.match(authScreen, /accountRole !== "customer"/);
  assert.match(authScreen, /Login Google hanya tersedia untuk pelanggan/);
  assert.match(authScreen, /signInWithGoogle\(accountRole\)/);
  assert.match(authScreen, /signInWithPassword/);
  assert.match(authScreen, /requestPasswordReset/);
  assert.match(authScreen, /Admin sekolah/);
  assert.match(authScreen, /Pelanggan/);
  assert.match(authScreen, /signUpAsCustomer/);
  assert.match(authScreen, /VITE_DEMO_ADMIN_EMAIL/);
  assert.match(authScreen, /Akses admin ditolak/);
  assert.match(auth, /getAuthorizedProfile/);
  assert.match(auth, /admin_requirements/);
  assert.match(auth, /role_escalation_blocked/);
  assert.match(auth, /google_admin_blocked/);
  assert.match(auth, /app_metadata\?\.provider === "google"/);
  assert.match(googleAuthMigration, /raw_app_meta_data[\s\S]*provider[\s\S]*<> 'google'/);
  assert.match(domain, /export type AccountRole = "admin" \| "customer"/);
  assert.match(catalog, /getCustomerCatalog/);
  assert.match(catalog, /inventory:inventory_items\(qty_on_hand, unit\)/);
  assert.match(catalog, /stock: Number\(inventoryRelation\?\.qty_on_hand/);
  assert.match(page, /CustomerPortal/);
  assert.match(page, /getCustomerCatalog/);
  assert.match(page, /getOpenShift/);
  assert.match(page, /getCatalog/);
  assert.match(page, /getDashboardSummary/);
  assert.match(page, /outletId={activeOutletId}/);
  assert.match(page, /catalog={catalog}/);
  assert.match(page, /handleLogout/);
  assert.match(customerPortal, /PESANAN AKTIF/);
  assert.match(customerPortal, /Pilih waktu ambil/);
  assert.match(customerPortal, /Pesan lagi tanpa cari ulang/);
  assert.match(customerPortal, /Simpan .* ke favorit/);
  assert.match(customerPortal, /Detail menu/);
  assert.match(uiReset, /\.customer-portal\.customer-app \.customer-app-active-order/);
  assert.match(systemUi, /\.customer-detail-sheet/);
  assert.match(uiReset, /\.customer-portal\.customer-app \.customer-app-history-panel/);
  assert.match(plan, /Rasio penjualan/);
  assert.match(plan, /Acceptance criteria MVP/);
  assert.match(seed, /Outlet Utama/);
  assert.match(seed, /Nasi Goreng Spesial/);
  assert.match(layout, /CanteenOS/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(packageJson, /"motion"/);
  assert.match(page, /OperationsModule/);
  assert.match(modules, /TransactionsModule/);
  assert.match(modules, /TRANSACTIONS_PER_PAGE/);
  assert.match(modules, /transaction-mobile-list/);
  assert.match(modules, /transaction-mobile-meta/);
  assert.match(modules, /module-pagination/);
  assert.match(modules, /setCurrentPage\(1\)/);
  assert.match(modules, /ProductsModule/);
  assert.match(modules, /InventoryModule/);
  assert.match(modules, /PurchasingModule/);
  assert.match(modules, /CashModule/);
  assert.match(modules, /ReportsModule/);
  assert.match(modules, /AdminModule/);
  assert.match(modules, /getTransactions/);
  assert.match(modules, /getInventorySnapshot/);
  assert.match(modules, /adjustInventory/);
  assert.match(demoData, /demoSalesMix/);
});

test("CanteenOS data contract keeps the proposal's critical controls", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20260809100000_kantinkita_mvp.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /create table if not exists public\.profiles/i);
  assert.match(migration, /create table if not exists public\.outlet_memberships/i);
  assert.match(migration, /create table if not exists public\.suppliers/i);
  assert.match(migration, /create table if not exists public\.purchase_orders/i);
  assert.match(migration, /create table if not exists public\.purchase_order_items/i);
  assert.match(migration, /create table if not exists public\.expenses/i);
  assert.match(migration, /create table if not exists public\.refund_requests/i);
  assert.match(migration, /create table if not exists public\.stock_movements/i);
  assert.match(migration, /alter table public\.sales enable row level security/i);
  assert.match(migration, /client_transaction_id text not null unique/i);
  assert.match(migration, /create or replace function private\.finalize_sale/i);
  assert.match(migration, /grant execute on function public\.finalize_sale[\s\S]*to authenticated/i);
  assert.match(migration, /create or replace function private\.sales_mix/i);
  assert.match(migration, /grant execute on function public\.sales_mix[\s\S]*to authenticated/i);
  assert.match(migration, /create or replace function private\.dashboard_summary/i);
  assert.match(migration, /grant execute on function public\.dashboard_summary[\s\S]*to authenticated/i);
  assert.match(migration, /create policy refund_requests_manager_update/i);
  assert.match(migration, /create policy expenses_manager_or_finance_update/i);
  assert.match(migration, /create or replace function private\.adjust_inventory/i);
  assert.match(migration, /grant execute on function public\.adjust_inventory[\s\S]*to authenticated/i);
  assert.match(migration, /on conflict \(id\) do nothing/i);
});

test("account roles keep admin and customer access separate", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20260809140000_account_roles.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /create type public\.account_role/i);
  assert.match(migration, /account_role public\.account_role/i);
  assert.match(migration, /admin_approved_at/i);
  assert.match(migration, /private\.admin_access_ready/i);
  assert.match(migration, /email_confirmed_at/i);
  assert.match(migration, /employee_code/i);
  assert.match(migration, /default_outlet_id/i);
  assert.match(migration, /private\.is_customer_account/i);
  assert.match(migration, /create policy products_customer_select/i);
  assert.match(migration, /account_role\)\s*values[\s\S]*'customer'/i);
  assert.match(migration, /drop trigger if exists on_auth_user_created/i);
});

test("customer catalog stock stays least-privilege", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20260814120000_customer_catalog_stock_policy.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /drop policy if exists inventory_accessible_select/i);
  assert.match(migration, /private\.is_customer_account\(\)/i);
  assert.match(migration, /p\.inventory_item_id = inventory_items\.id/i);
  assert.match(migration, /p\.active/i);
  assert.match(migration, /o\.active/i);
  assert.match(migration, /private\.can_access_outlet\(outlet_id\)/i);
});

test("customer accounts cannot escalate themselves into admins", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20260810172148_prevent_customer_admin_escalation.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /alter column account_role set default 'customer'/i);
  assert.match(migration, /create or replace function private\.can_manage_account_roles/i);
  assert.match(migration, /create or replace function private\.prevent_customer_admin_escalation/i);
  assert.match(migration, /new\.account_role <> 'customer'/i);
  assert.match(migration, /new\.role <> 'viewer'/i);
  assert.match(migration, /new\.account_role is distinct from old\.account_role/i);
  assert.match(migration, /errcode = '42501'/i);
  assert.match(migration, /before insert or update of account_role, role, employee_code/i);
  assert.match(migration, /revoke all on function private\.prevent_customer_admin_escalation\(\) from public, anon, authenticated/i);
  assert.doesNotMatch(migration, /raw_user_meta_data\s*->>\s*'role'/i);
});

test("management route and profile settings are interactive and privilege-safe", async () => {
  const [page, profileSettings, auth, systemUi, migration] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/profile-settings.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/auth.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/system-ui.css", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260810174840_profile_settings_and_avatars.sql", import.meta.url), "utf8"),
  ]);

  assert.match(page, /ManagementWorkspace/);
  assert.match(page, /CustomerPortalStorefront/);
  assert.match(page, /profileMenuOpen/);
  assert.match(page, /ProfileSettings/);
  assert.match(profileSettings, /Ganti foto/);
  assert.match(profileSettings, /Perbarui password/);
  assert.match(profileSettings, /onLogout/);
  assert.match(auth, /updateProfileSettings/);
  assert.match(auth, /changePassword/);
  assert.match(auth, /storage\.from\("avatars"\)/);
  assert.match(systemUi, /html\[data-theme="dark"\] \.report-bar-column small/);
  assert.match(migration, /add column if not exists avatar_url/i);
  assert.match(migration, /create policy profiles_self_update/i);
  assert.match(migration, /new\.status is distinct from old\.status/i);
  assert.match(migration, /create policy avatar_owner_update/i);
  assert.match(migration, /storage\.foldername\(name\)/i);
});

test("operational data has an outlet-scoped realtime contract", async () => {
  const [realtime, page, modules, catalog, pos, migration, rlsMigration, dataApiMigration, verifier] = await Promise.all([
    readFile(new URL("../lib/supabase/realtime.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/operational-modules.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/supabase/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/pos.ts", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260810180451_enable_operational_realtime.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260810183814_optimize_rls_policies_for_realtime.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/migrations/20260810184536_grant_data_api_privileges.sql", import.meta.url), "utf8"),
    readFile(new URL("../scripts/verify-supabase-realtime.mjs", import.meta.url), "utf8"),
  ]);

  for (const table of ["sales", "inventory_items", "products", "shifts", "purchase_orders", "refund_requests", "stock_movements", "expenses"]) {
    assert.match(realtime, new RegExp(`table: "${table}"`));
    assert.match(migration, new RegExp(`'${table}'`));
  }

  assert.match(realtime, /"postgres_changes"/);
  assert.match(realtime, /filter: `outlet_id=eq\.\$\{outletId\}`/);
  assert.match(realtime, /filter: `id=eq\.\$\{profileId\}`/);
  assert.match(realtime, /table: "cash_movements"/);
  assert.match(realtime, /filter: `shift_id=eq\.\$\{shiftId\}`/);
  assert.match(realtime, /client\.removeChannel\(channel\)/);
  assert.match(realtime, /visibilitychange/);
  assert.match(realtime, /onAuthStateChange/);
  assert.match(realtime, /Realtime aktif/);
  assert.match(page, /subscribeToOutletRealtime/);
  assert.match(page, /subscribeToAuthChanges/);
  assert.match(page, /setRealtimeRefreshToken/);
  assert.match(page, /RealtimeStatusBadge/);
  assert.match(page, /activeTitle = activeNav === "dashboard"/);
  assert.match(modules, /refreshToken/);
  assert.match(modules, /getProductCatalog/);
  assert.match(modules, /setProductActive/);
  assert.match(modules, /getPurchaseOrders/);
  assert.match(modules, /getCashWorkspace/);
  assert.match(catalog, /\.update\(\{ active \}\)/);
  assert.match(pos, /product_id: item\.productId/);
  assert.match(pos, /throw new Error\(error\.message\)/);
  assert.match(migration, /create publication supabase_realtime/i);
  assert.match(migration, /pg_publication_tables/i);
  assert.match(migration, /alter publication supabase_realtime add table/i);
  assert.match(migration, /grant select on public\.sales to authenticated/i);
  assert.match(migration, /grant select on public\.cash_movements to authenticated/i);
  assert.doesNotMatch(rlsMigration, /for all to authenticated/i);
  assert.match(rlsMigration, /create policy profiles_authorized_update/i);
  assert.match(rlsMigration, /create policy products_authorized_select/i);
  assert.match(dataApiMigration, /grant select on[\s\S]*public\.sales[\s\S]*to authenticated/i);
  assert.match(dataApiMigration, /grant update on[\s\S]*public\.products[\s\S]*to authenticated/i);
  assert.doesNotMatch(dataApiMigration, /on all tables in schema public/i);
  assert.match(verifier, /kantinkita-realtime-writer/);
  assert.match(verifier, /kantinkita-realtime-observer/);
  assert.match(verifier, /writer\.rpc\("finalize_sale"/);
  assert.match(verifier, /customer privilege escalation unexpectedly succeeded/i);
  assert.doesNotMatch(verifier, /sb_secret_/i);
});
