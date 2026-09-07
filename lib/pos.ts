import type { FinalizeSaleInput, FinalizeSaleResult } from "./domain";
import { supabase } from "./supabase/client";

const paymentMethodMap = {
  cash: "cash",
  qris_manual: "qris_manual",
  other: "other",
} as const;

export async function finalizeSale(input: FinalizeSaleInput): Promise<FinalizeSaleResult> {
  if (!supabase) {
    return {
      mode: "demo",
      saleNo: `DEMO-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${input.clientTransactionId.slice(-6)}`,
      total: input.paymentAmount,
    };
  }

  if (!input.outletId || input.outletId === "demo" || !input.shiftId || input.shiftId === "demo") {
    throw new Error("Transaksi live membutuhkan outlet dan shift aktif.");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("Sesi login tidak ditemukan. Silakan masuk kembali.");

  const { data, error } = await supabase.rpc("finalize_sale", {
    p_outlet_id: input.outletId,
    p_shift_id: input.shiftId,
    p_client_transaction_id: input.clientTransactionId,
    p_items: input.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      discount: 0,
    })),
    p_payment_method: paymentMethodMap[input.paymentMethod],
    p_payment_amount: input.paymentAmount,
    p_reference_no: input.referenceNo ?? null,
  });

  if (error) throw new Error(error.message);

  return {
    mode: "supabase",
    saleId: data.sale_id,
    saleNo: data.sale_no,
    total: Number(data.total),
  };
}
