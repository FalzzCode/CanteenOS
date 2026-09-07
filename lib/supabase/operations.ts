import { supabase } from "./client";

export type OpenShift = {
  id: string;
  outletId: string;
  openedAt: string;
};

export type PurchaseOrderRecord = {
  id: string;
  supplier: string;
  date: string;
  items: number;
  total: number;
  status: "Diterima" | "Menunggu" | "Draft";
};

export type CashMovementRecord = {
  id: string;
  type: "cash_in" | "cash_out";
  amount: number;
  category: string;
  reason: string;
  time: string;
};

export type CashWorkspaceSnapshot = {
  shift: {
    id: string;
    status: "open" | "closed" | "review";
    cashier: string;
    openingCash: number;
    openedAt: string;
    expectedCash: number;
    variance: number;
  } | null;
  movements: CashMovementRecord[];
  cashSales: number;
};

function relationValue<T>(relation: T | T[] | null | undefined): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

export async function getOpenShift(outletId: string): Promise<OpenShift | null> {
  if (!supabase || !outletId) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;

  const { data, error } = await supabase
    .from("shifts")
    .select("id, outlet_id, opened_at")
    .eq("outlet_id", outletId)
    .eq("cashier_id", userData.user.id)
    .eq("status", "open")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { id: data.id, outletId: data.outlet_id, openedAt: data.opened_at };
}

export async function getPurchaseOrders(outletId: string): Promise<PurchaseOrderRecord[] | null> {
  if (!supabase || !outletId) return null;

  const { data, error } = await supabase
    .from("purchase_orders")
    .select("id, order_no, status, total, created_at, supplier:suppliers(name), items:purchase_order_items(id)")
    .eq("outlet_id", outletId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return ((data ?? []) as Array<{
    id: string;
    order_no: string;
    status: "draft" | "submitted" | "partially_received" | "received" | "cancelled";
    total: number | string;
    created_at: string;
    supplier?: { name?: string } | Array<{ name?: string }> | null;
    items?: Array<{ id: string }> | null;
  }>).map((row) => ({
    id: row.order_no || row.id,
    supplier: relationValue(row.supplier)?.name ?? "Supplier",
    date: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(row.created_at)),
    items: row.items?.length ?? 0,
    total: Number(row.total),
    status: row.status === "received" ? "Diterima" : row.status === "draft" ? "Draft" : "Menunggu",
  }));
}

export async function getCashWorkspace(outletId: string, preferredShiftId?: string): Promise<CashWorkspaceSnapshot | null> {
  if (!supabase || !outletId) return null;

  let shiftQuery = supabase
    .from("shifts")
    .select("id, status, cashier_id, opening_cash, opened_at, expected_cash, variance, cashier:profiles(full_name)")
    .eq("outlet_id", outletId)
    .order("opened_at", { ascending: false })
    .limit(1);

  if (preferredShiftId && preferredShiftId !== "demo") shiftQuery = shiftQuery.eq("id", preferredShiftId);
  else shiftQuery = shiftQuery.eq("status", "open");

  const { data: shiftRows, error: shiftError } = await shiftQuery;
  if (shiftError) throw shiftError;
  const shift = (shiftRows?.[0] ?? null) as null | {
    id: string;
    status: "open" | "closed" | "review";
    opening_cash: number | string;
    opened_at: string;
    expected_cash?: number | string | null;
    variance?: number | string | null;
    cashier?: { full_name?: string } | Array<{ full_name?: string }> | null;
  };

  if (!shift) return { shift: null, movements: [], cashSales: 0 };

  const [{ data: movementRows, error: movementError }, { data: saleRows, error: salesError }] = await Promise.all([
    supabase.from("cash_movements").select("id, type, amount, category, reason, created_at").eq("shift_id", shift.id).order("created_at", { ascending: false }),
    supabase.from("sales").select("id").eq("shift_id", shift.id),
  ]);
  if (movementError) throw movementError;
  if (salesError) throw salesError;

  const saleIds = (saleRows ?? []).map((sale) => sale.id);
  let cashSales = 0;
  if (saleIds.length) {
    const { data: paymentRows, error: paymentError } = await supabase
      .from("payments")
      .select("amount")
      .in("sale_id", saleIds)
      .eq("method", "cash");
    if (paymentError) throw paymentError;
    cashSales = (paymentRows ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  }

  const movements = ((movementRows ?? []) as Array<{ id: string; type: "cash_in" | "cash_out"; amount: number | string; category: string; reason: string; created_at: string }>).map((movement) => ({
    id: movement.id,
    type: movement.type,
    amount: Number(movement.amount),
    category: movement.category,
    reason: movement.reason,
    time: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(movement.created_at)),
  }));
  const movementBalance = movements.reduce((sum, movement) => sum + (movement.type === "cash_in" ? movement.amount : -movement.amount), 0);
  const calculatedExpected = Number(shift.opening_cash) + movementBalance + cashSales;

  return {
    shift: {
      id: shift.id,
      status: shift.status,
      cashier: relationValue(shift.cashier)?.full_name ?? "Kasir",
      openingCash: Number(shift.opening_cash),
      openedAt: shift.opened_at,
      expectedCash: Number(shift.expected_cash ?? calculatedExpected),
      variance: Number(shift.variance ?? 0),
    },
    movements,
    cashSales,
  };
}

export async function addCashMovement(
  shiftId: string,
  type: CashMovementRecord["type"],
  amount: number,
  category: string,
  reason: string,
): Promise<CashMovementRecord | null> {
  if (!supabase || !shiftId || shiftId === "demo") return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.");

  const { data, error } = await supabase
    .from("cash_movements")
    .insert({ shift_id: shiftId, type, amount, category, reason, created_by: userData.user.id })
    .select("id, type, amount, category, reason, created_at")
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    type: data.type,
    amount: Number(data.amount),
    category: data.category,
    reason: data.reason,
    time: new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(new Date(data.created_at)),
  };
}
