import type { DemoInventoryItem } from "../demo-data";
import { supabase } from "./client";

type RawInventoryItem = {
  id: string;
  sku: string;
  name: string;
  qty_on_hand: number | string;
  min_stock: number | string;
  unit: string;
};

export async function getInventorySnapshot(outletId: string): Promise<DemoInventoryItem[] | null> {
  if (!supabase || !outletId) return null;

  const { data, error } = await supabase
    .from("inventory_items")
    .select("id, sku, name, qty_on_hand, min_stock, unit")
    .eq("outlet_id", outletId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as RawInventoryItem[]).map((item) => ({
    id: item.id,
    sku: item.sku,
    name: item.name,
    qty: Number(item.qty_on_hand),
    min: Number(item.min_stock),
    unit: item.unit,
    supplier: "Supplier outlet",
    movement: "Snapshot live",
  }));
}

export async function adjustInventory(
  outletId: string,
  inventoryItemId: string,
  qtyDelta: number,
  reason: string,
): Promise<{ qtyOnHand: number } | null> {
  if (!supabase || !outletId || !inventoryItemId) return null;

  const { data, error } = await supabase.rpc("adjust_inventory", {
    p_outlet_id: outletId,
    p_inventory_item_id: inventoryItemId,
    p_qty_delta: qtyDelta,
    p_reason: reason,
  });

  if (error) throw error;
  const result = (data ?? {}) as { qty_on_hand?: number | string };
  return { qtyOnHand: Number(result.qty_on_hand ?? 0) };
}
