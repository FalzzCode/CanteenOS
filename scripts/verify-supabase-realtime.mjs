import assert from "node:assert/strict";

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_TEST_URL;
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_TEST_SECRET_KEY;

assert.ok(url, "SUPABASE_TEST_URL is required");
assert.ok(publishableKey, "SUPABASE_TEST_PUBLISHABLE_KEY is required");
assert.ok(secretKey, "SUPABASE_TEST_SECRET_KEY is required");

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
};

const service = createClient(url, secretKey, clientOptions);
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `Realtime-${suffix}-Aa1!`;

async function createConfirmedUser(email, fullName) {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  assert.ok(data.user, `Auth user ${email} was not created`);
  return data.user;
}

async function signIn(email, storageKey) {
  const client = createClient(url, publishableKey, {
    auth: { ...clientOptions.auth, storageKey },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function waitForSubscription(channel) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Realtime subscription timed out")), 10_000);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timer);
        reject(new Error(`Realtime channel failed with ${status}`));
      }
    });
  });
}

async function waitFor(predicate, label) {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const { data: outlet, error: outletError } = await service
  .from("outlets")
  .select("id")
  .eq("code", "UTAMA")
  .single();
if (outletError) throw outletError;

const { data: product, error: productError } = await service
  .from("products")
  .select("id, inventory_item_id, sell_price, active")
  .eq("outlet_id", outlet.id)
  .eq("active", true)
  .not("inventory_item_id", "is", null)
  .limit(1)
  .single();
if (productError) throw productError;

const adminEmail = `realtime-admin-${suffix}@kantinkita.local`;
const customerEmail = `realtime-customer-${suffix}@kantinkita.local`;
const adminUser = await createConfirmedUser(adminEmail, "Realtime Admin");
const customerUser = await createConfirmedUser(customerEmail, "Realtime Customer");

const { error: promoteError } = await service
  .from("profiles")
  .update({
    account_role: "admin",
    role: "manager",
    status: "active",
    employee_code: `RT-${suffix}`,
    admin_approved_at: new Date().toISOString(),
    default_outlet_id: outlet.id,
  })
  .eq("id", adminUser.id);
if (promoteError) throw promoteError;

const { error: membershipError } = await service
  .from("outlet_memberships")
  .insert({ profile_id: adminUser.id, outlet_id: outlet.id });
if (membershipError) throw membershipError;

const writer = await signIn(adminEmail, `kantinkita-realtime-writer-${suffix}`);
const observer = await signIn(adminEmail, `kantinkita-realtime-observer-${suffix}`);
const customer = await signIn(customerEmail, `kantinkita-realtime-customer-${suffix}`);
let channel;

try {
  const { data: shift, error: shiftError } = await writer
    .from("shifts")
    .insert({ outlet_id: outlet.id, cashier_id: adminUser.id, opening_cash: 100_000 })
    .select("id")
    .single();
  if (shiftError) throw shiftError;

  const eventTables = [];
  channel = observer
    .channel(`kantinkita-verification-${suffix}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "sales", filter: `outlet_id=eq.${outlet.id}` }, (payload) => eventTables.push(payload.table))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "inventory_items", filter: `outlet_id=eq.${outlet.id}` }, (payload) => eventTables.push(payload.table))
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "products", filter: `outlet_id=eq.${outlet.id}` }, (payload) => eventTables.push(payload.table));
  await waitForSubscription(channel);
  // SUBSCRIBED confirms the websocket join; give the local CDC replication
  // process a brief moment to finish attaching on a freshly started stack.
  await new Promise((resolve) => setTimeout(resolve, 1_000));

  const transactionId = `verify-${suffix}`;
  const { data: sale, error: saleError } = await writer.rpc("finalize_sale", {
    p_outlet_id: outlet.id,
    p_shift_id: shift.id,
    p_client_transaction_id: transactionId,
    p_items: [{ product_id: product.id, quantity: 1, discount: 0 }],
    p_payment_method: "cash",
    p_payment_amount: Number(product.sell_price),
    p_reference_no: null,
  });
  if (saleError) throw saleError;
  assert.ok(sale?.sale_id, "Atomic sale did not return a sale id");

  const { error: productUpdateError } = await writer
    .from("products")
    .update({ active: !product.active })
    .eq("id", product.id)
    .eq("outlet_id", outlet.id);
  if (productUpdateError) throw productUpdateError;

  await waitFor(
    () => eventTables.includes("sales") && eventTables.includes("inventory_items") && eventTables.includes("products"),
    `sales, inventory, and product Realtime events (received: ${eventTables.join(", ") || "none"})`,
  );

  const { data: persistedSale, error: persistedSaleError } = await observer
    .from("sales")
    .select("id, client_transaction_id, total")
    .eq("client_transaction_id", transactionId)
    .single();
  if (persistedSaleError) throw persistedSaleError;
  assert.equal(persistedSale.id, sale.sale_id);

  const { data: customerProducts, error: customerProductsError } = await customer
    .from("products")
    .select("id")
    .eq("outlet_id", outlet.id);
  if (customerProductsError) throw customerProductsError;
  assert.ok(customerProducts.length > 0, "Customer cannot read the active catalog");

  const { error: escalationError } = await customer
    .from("profiles")
    .update({ account_role: "admin", role: "manager", status: "active" })
    .eq("id", customerUser.id);
  assert.ok(escalationError, "Customer privilege escalation unexpectedly succeeded");

  const { data: customerSales, error: customerSalesError } = await customer
    .from("sales")
    .select("id")
    .eq("outlet_id", outlet.id);
  if (customerSalesError) throw customerSalesError;
  assert.equal(customerSales.length, 0, "Customer can read protected sales rows");

  await writer.from("products").update({ active: product.active }).eq("id", product.id).eq("outlet_id", outlet.id);

  process.stdout.write(JSON.stringify({
    ok: true,
    outletId: outlet.id,
    saleId: sale.sale_id,
    realtimeEvents: [...new Set(eventTables)].sort(),
    customerEscalationBlocked: true,
    customerSalesHidden: true,
  }, null, 2));
} finally {
  await service.from("products").update({ active: product.active }).eq("id", product.id).eq("outlet_id", outlet.id);
  if (channel) await observer.removeChannel(channel);
  await Promise.allSettled([writer.auth.signOut(), observer.auth.signOut(), customer.auth.signOut()]);
}
