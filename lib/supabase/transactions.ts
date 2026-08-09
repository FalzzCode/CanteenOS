import { supabase } from "./client";

export type LiveTransactionRecord = {
  id: string;
  time: string;
  cashier: string;
  items: number;
  payment: "QRIS" | "Tunai" | "Lainnya";
  total: number;
  status: "paid" | "review" | "voided";
};

type RawTransaction = {
  id: string;
  sale_no: string;
  sold_at: string;
  total: number | string;
  status: "paid" | "voided" | "refunded" | "partially_refunded";
  cashier?: { full_name?: string } | Array<{ full_name?: string }> | null;
  payments?: Array<{ method?: string }> | null;
  sale_items?: Array<{ qty?: number | string }> | null;
};

function relationValue<T>(relation: T | T[] | null | undefined): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

export async function getTransactions(outletId: string): Promise<LiveTransactionRecord[] | null> {
  if (!supabase || !outletId) return null;

  const { data, error } = await supabase
    .from("sales")
    .select("id, sale_no, sold_at, total, status, cashier:profiles(full_name), payments(method), sale_items(qty)")
    .eq("outlet_id", outletId)
    .order("sold_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return ((data ?? []) as RawTransaction[]).map((row) => {
    const cashier = relationValue(row.cashier);
    const paymentMethod = row.payments?.[0]?.method;
    const payment = paymentMethod === "cash" ? "Tunai" : paymentMethod === "qris_manual" ? "QRIS" : "Lainnya";
    const status = row.status === "voided" ? "voided" : row.status === "paid" ? "paid" : "review";
    const items = row.sale_items?.reduce((sum, item) => sum + Number(item.qty ?? 0), 0) ?? 0;

    return {
      id: `#${row.sale_no}`,
      time: new Date(row.sold_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      cashier: cashier?.full_name || "Kasir",
      items: Math.round(items),
      payment,
      total: Number(row.total),
      status,
    };
  });
}
