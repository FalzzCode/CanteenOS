import type { DemoSalesMixItem } from "../demo-data";
import { supabase } from "./client";

const categoryColors: Record<string, string> = {
  Makanan: "#0f6675",
  Minuman: "#f1b653",
  Camilan: "#e58c6d",
  Lainnya: "#777d9a",
};

type SalesMixRow = {
  label?: unknown;
  amount?: unknown;
};

export async function getSalesMix(
  outletId: string,
  from: string,
  to: string,
): Promise<DemoSalesMixItem[] | null> {
  if (!supabase || !outletId) return null;

  const { data, error } = await supabase.rpc("sales_mix", {
    p_outlet_id: outletId,
    p_from: from,
    p_to: to,
  });

  if (error) throw error;

  const rows = (Array.isArray(data) ? data : []) as SalesMixRow[];
  const amounts = rows.map((row) => ({
    label: typeof row.label === "string" && row.label.trim() ? row.label : "Lainnya",
    amount: Number(row.amount ?? 0),
  })).filter((row) => Number.isFinite(row.amount) && row.amount > 0);
  const total = amounts.reduce((sum, row) => sum + row.amount, 0);

  if (!total) return null;

  return amounts.map((row) => ({
    label: row.label,
    amount: row.amount,
    value: Math.round((row.amount / total) * 100),
    color: categoryColors[row.label] ?? categoryColors.Lainnya,
  }));
}
