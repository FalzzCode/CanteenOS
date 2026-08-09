import { supabase } from "./client";

export type DashboardDailySale = {
  day: string;
  amount: number;
};

export type DashboardTopProduct = {
  name: string;
  units: number;
  amount: number;
};

export type DashboardSummary = {
  totalSales: number;
  transactionCount: number;
  averageOrder: number;
  grossProfitEstimate: number;
  lowStockCount: number;
  dailySales: DashboardDailySale[];
  topProducts: DashboardTopProduct[];
};

type RawDashboardSummary = {
  total_sales?: unknown;
  transaction_count?: unknown;
  average_order?: unknown;
  gross_profit_estimate?: unknown;
  low_stock_count?: unknown;
  daily_sales?: unknown;
  top_products?: unknown;
};

export async function getDashboardSummary(
  outletId: string,
  from: string,
  to: string,
): Promise<DashboardSummary | null> {
  if (!supabase || !outletId) return null;

  const { data, error } = await supabase.rpc("dashboard_summary", {
    p_outlet_id: outletId,
    p_from: from,
    p_to: to,
  });

  if (error) throw error;

  const raw = (data ?? {}) as RawDashboardSummary;
  const dailySales = (Array.isArray(raw.daily_sales) ? raw.daily_sales : []) as Array<{ day?: unknown; amount?: unknown }>;
  const topProducts = (Array.isArray(raw.top_products) ? raw.top_products : []) as Array<{ name?: unknown; units?: unknown; amount?: unknown }>;

  return {
    totalSales: Number(raw.total_sales ?? 0),
    transactionCount: Number(raw.transaction_count ?? 0),
    averageOrder: Number(raw.average_order ?? 0),
    grossProfitEstimate: Number(raw.gross_profit_estimate ?? 0),
    lowStockCount: Number(raw.low_stock_count ?? 0),
    dailySales: dailySales.map((item) => ({ day: typeof item.day === "string" ? item.day : "", amount: Number(item.amount ?? 0) })).filter((item) => item.day && Number.isFinite(item.amount)),
    topProducts: topProducts.map((item) => ({ name: typeof item.name === "string" ? item.name : "Produk", units: Number(item.units ?? 0), amount: Number(item.amount ?? 0) })).filter((item) => item.name && Number.isFinite(item.amount)),
  };
}
