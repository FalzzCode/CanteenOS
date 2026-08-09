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

test("server-renders the KantinKita workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /KantinKita/);
  assert.match(html, /Omzet hari ini/);
  assert.match(html, /Rasio penjualan/);
  assert.match(html, /POS Kasir/);
  assert.match(html, /Produk terlaris/);
  assert.doesNotMatch(html, /Your site is taking shape|codex-preview|react-loading-skeleton/i);
});

test("metadata and product UI replace the starter", async () => {
  const [page, layout, packageJson, modules, demoData, authScreen, plan, seed] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/operational-modules.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/demo-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/auth-screen.tsx", import.meta.url), "utf8"),
    readFile(new URL("../docs/IMPLEMENTATION_PLAN.md", import.meta.url), "utf8"),
    readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8"),
  ]);

  assert.match(page, /Rasio penjualan/);
  assert.match(authScreen, /Lanjutkan dengan Google/);
  assert.match(authScreen, /signInWithPassword/);
  assert.match(authScreen, /requestPasswordReset/);
  assert.match(page, /getOpenShift/);
  assert.match(page, /handleLogout/);
  assert.match(plan, /Rasio penjualan/);
  assert.match(plan, /Acceptance criteria MVP/);
  assert.match(seed, /Outlet Utama/);
  assert.match(seed, /Nasi Goreng Spesial/);
  assert.match(layout, /KantinKita/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(page, /OperationsModule/);
  assert.match(modules, /TransactionsModule/);
  assert.match(modules, /ProductsModule/);
  assert.match(modules, /InventoryModule/);
  assert.match(modules, /PurchasingModule/);
  assert.match(modules, /CashModule/);
  assert.match(modules, /ReportsModule/);
  assert.match(modules, /AdminModule/);
  assert.match(demoData, /demoSalesMix/);
});

test("KantinKita data contract keeps the proposal's critical controls", async () => {
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
  assert.match(migration, /create policy refund_requests_manager_update/i);
  assert.match(migration, /create policy expenses_manager_or_finance_update/i);
  assert.match(migration, /on conflict \(id\) do nothing/i);
});
