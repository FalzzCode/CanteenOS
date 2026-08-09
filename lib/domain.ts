export type AppRole =
  | "super_admin"
  | "manager"
  | "cashier"
  | "stock"
  | "finance"
  | "viewer";

export type ProfileStatus = "pending" | "active" | "inactive" | "suspended";

export type PaymentMethod = "cash" | "qris_manual" | "other";

export type PurchaseOrderStatus = "draft" | "submitted" | "partially_received" | "received" | "cancelled";

export type RefundStatus = "requested" | "approved" | "rejected" | "processed";

export type ExpenseStatus = "submitted" | "approved" | "rejected" | "voided";

export type ProductCategory = "Makanan" | "Minuman" | "Camilan" | "Lainnya";

export interface ProductRecord {
  id: string;
  outletId: string;
  category: ProductCategory;
  name: string;
  sku: string;
  barcode?: string | null;
  sellPrice: number;
  costReference: number;
  stock: number;
  minStock: number;
  unit: string;
  active: boolean;
  favorite: boolean;
  inventoryItemId?: string | null;
}

export interface SaleLineInput {
  productId: string;
  quantity: number;
  discount?: number;
}

export interface FinalizeSaleInput {
  outletId: string;
  shiftId: string;
  clientTransactionId: string;
  items: SaleLineInput[];
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  referenceNo?: string | null;
}

export interface FinalizeSaleResult {
  mode: "demo" | "supabase";
  saleId?: string;
  saleNo: string;
  total: number;
}

export interface ProfileRecord {
  id: string;
  fullName: string;
  role: AppRole;
  status: ProfileStatus;
  defaultOutletId?: string | null;
}

export interface PurchaseOrderRecord {
  id: string;
  outletId: string;
  supplierId: string;
  orderNo: string;
  status: PurchaseOrderStatus;
  total: number;
  expectedAt?: string | null;
}

export interface RefundRequestRecord {
  id: string;
  saleId: string;
  outletId: string;
  requestedAmount: number;
  reason: string;
  status: RefundStatus;
}

export interface ExpenseRecord {
  id: string;
  outletId: string;
  category: string;
  description: string;
  amount: number;
  status: ExpenseStatus;
}
