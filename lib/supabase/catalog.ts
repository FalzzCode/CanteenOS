import type { ProductCategory, ProductRecord } from "../domain";
import { supabase } from "./client";

type RawProduct = {
  id: string;
  outlet_id: string;
  category_id: string;
  inventory_item_id?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  sell_price: number | string;
  cost_reference: number | string;
  active: boolean;
  favorite: boolean;
  category?: { name?: string } | Array<{ name?: string }> | null;
  inventory?: { qty_on_hand?: number | string; min_stock?: number | string; unit?: string } | Array<{ qty_on_hand?: number | string; min_stock?: number | string; unit?: string }> | null;
};

const knownCategories = new Set<ProductCategory>(["Makanan", "Minuman", "Camilan", "Lainnya"]);

function relationValue<T>(relation: T | T[] | null | undefined): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation ?? null;
}

export async function getCatalog(outletId: string): Promise<ProductRecord[] | null> {
  if (!supabase || !outletId) return null;

  const { data, error } = await supabase
    .from("products")
    .select("id, outlet_id, category_id, inventory_item_id, sku, barcode, name, sell_price, cost_reference, active, favorite, category:categories(name), inventory:inventory_items(qty_on_hand, min_stock, unit)")
    .eq("outlet_id", outletId)
    .eq("active", true)
    .order("favorite", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as RawProduct[]).map((row) => {
    const categoryRelation = relationValue(row.category);
    const inventoryRelation = relationValue(row.inventory);
    const categoryName = categoryRelation?.name ?? "Lainnya";
    const category = knownCategories.has(categoryName as ProductCategory) ? categoryName as ProductCategory : "Lainnya";

    return {
      id: row.id,
      outletId: row.outlet_id,
      category,
      name: row.name,
      sku: row.sku,
      barcode: row.barcode ?? null,
      sellPrice: Number(row.sell_price),
      costReference: Number(row.cost_reference),
      stock: Number(inventoryRelation?.qty_on_hand ?? 0),
      minStock: Number(inventoryRelation?.min_stock ?? 0),
      unit: inventoryRelation?.unit ?? "pcs",
      active: row.active,
      favorite: row.favorite,
      inventoryItemId: row.inventory_item_id ?? null,
    } satisfies ProductRecord;
  });
}
