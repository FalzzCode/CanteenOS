export type DemoSalesMixItem = {
  label: string;
  value: number;
  amount: number;
  color: string;
};

export const demoSalesMix: DemoSalesMixItem[] = [
  { label: "Makanan", value: 42, amount: 2040000, color: "var(--ui-chart-1)" },
  { label: "Minuman", value: 31, amount: 1510000, color: "var(--ui-chart-2)" },
  { label: "Camilan", value: 17, amount: 826000, color: "var(--ui-chart-3)" },
  { label: "Lainnya", value: 10, amount: 486000, color: "var(--ui-chart-4)" },
];

export type DemoTransaction = {
  id: string;
  time: string;
  cashier: string;
  items: number;
  itemNames?: string[];
  payment: "QRIS" | "Tunai" | "Lainnya";
  total: number;
  status: "paid" | "review" | "voided";
};

export const demoTransactions: DemoTransaction[] = [
  { id: "#INV-240816", time: "Hari ini, 14:32", cashier: "Ayu Nuraini", items: 4, itemNames: ["Nasi Goreng Spesial", "Es Teh Manis", "Roti Bakar Coklat", "Air Mineral 600ml"], payment: "QRIS", total: 56000, status: "paid" },
  { id: "#INV-240815", time: "Hari ini, 14:29", cashier: "Dimas Pratama", items: 2, itemNames: ["Es Teh Manis", "Roti Bakar Coklat"], payment: "Tunai", total: 19000, status: "paid" },
  { id: "#INV-240814", time: "Hari ini, 14:24", cashier: "Ayu Nuraini", items: 6, itemNames: ["Nasi Goreng Spesial", "Mie Goreng Telur", "Pisang Keju", "Es Teh Manis", "Air Mineral 600ml", "Roti Bakar Coklat"], payment: "Tunai", total: 82000, status: "review" },
  { id: "#INV-240813", time: "Hari ini, 14:17", cashier: "Dimas Pratama", items: 3, itemNames: ["Mie Goreng Telur", "Es Teh Manis", "Pisang Keju"], payment: "QRIS", total: 37000, status: "paid" },
  { id: "#INV-240812", time: "Hari ini, 14:10", cashier: "Ayu Nuraini", items: 5, itemNames: ["Nasi Goreng Spesial", "Es Teh Manis", "Roti Bakar Coklat", "Pisang Keju", "Air Mineral 600ml"], payment: "Tunai", total: 64000, status: "paid" },
  { id: "#INV-240811", time: "Hari ini, 13:58", cashier: "Dimas Pratama", items: 1, itemNames: ["Nasi Goreng Spesial"], payment: "Lainnya", total: 15000, status: "voided" },
];

export type DemoProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  unit: string;
  active: boolean;
  emoji: string;
  tone: string;
};

export const demoProductRows: DemoProduct[] = [
  { id: "prod-1", sku: "MKN-001", name: "Nasi Goreng Spesial", category: "Makanan", cost: 9500, price: 15000, stock: 18, minStock: 8, unit: "porsi", active: true, emoji: "🍳", tone: "peach" },
  { id: "prod-2", sku: "MNM-001", name: "Es Teh Manis", category: "Minuman", cost: 2200, price: 5000, stock: 42, minStock: 15, unit: "gelas", active: true, emoji: "🧋", tone: "mint" },
  { id: "prod-3", sku: "CML-001", name: "Roti Bakar Coklat", category: "Camilan", cost: 6000, price: 10000, stock: 12, minStock: 8, unit: "porsi", active: true, emoji: "🍞", tone: "gold" },
  { id: "prod-4", sku: "MNM-002", name: "Air Mineral 600ml", category: "Minuman", cost: 2500, price: 4000, stock: 7, minStock: 12, unit: "botol", active: true, emoji: "💧", tone: "blue" },
  { id: "prod-5", sku: "MKN-002", name: "Mie Goreng Telur", category: "Makanan", cost: 7800, price: 13000, stock: 21, minStock: 8, unit: "porsi", active: true, emoji: "🍜", tone: "peach" },
  { id: "prod-6", sku: "CML-002", name: "Pisang Keju", category: "Camilan", cost: 5000, price: 9000, stock: 14, minStock: 8, unit: "porsi", active: true, emoji: "🍌", tone: "gold" },
  { id: "prod-7", sku: "MNM-003", name: "Susu Coklat", category: "Minuman", cost: 4500, price: 8000, stock: 16, minStock: 8, unit: "kotak", active: true, emoji: "🥛", tone: "rose" },
  { id: "prod-8", sku: "MKN-003", name: "Chicken Pop", category: "Makanan", cost: 7200, price: 12000, stock: 10, minStock: 8, unit: "porsi", active: false, emoji: "🍗", tone: "peach" },
];

export type DemoInventoryItem = {
  id: string;
  sku: string;
  name: string;
  qty: number;
  min: number;
  unit: string;
  supplier: string;
  movement: string;
};

export const demoInventoryRows: DemoInventoryItem[] = [
  { id: "inv-1", sku: "BHN-001", name: "Beras premium", qty: 24, min: 12, unit: "kg", supplier: "CV Pangan Jaya", movement: "Masuk 2 jam lalu" },
  { id: "inv-2", sku: "BHN-002", name: "Telur ayam", qty: 38, min: 30, unit: "butir", supplier: "Mitra Tani", movement: "Keluar 18 menit lalu" },
  { id: "inv-3", sku: "BHN-003", name: "Air mineral 600ml", qty: 7, min: 12, unit: "botol", supplier: "Depot Segar", movement: "Keluar 25 menit lalu" },
  { id: "inv-4", sku: "BHN-004", name: "Teh celup", qty: 9, min: 10, unit: "box", supplier: "CV Pangan Jaya", movement: "Opname kemarin" },
  { id: "inv-5", sku: "BHN-005", name: "Minyak goreng", qty: 16, min: 8, unit: "liter", supplier: "Sumber Makmur", movement: "Masuk kemarin" },
];

export type DemoPurchase = {
  id: string;
  supplier: string;
  date: string;
  items: number;
  total: number;
  status: "Diterima" | "Menunggu" | "Draft";
};

export const demoPurchases: DemoPurchase[] = [
  { id: "PO-2026-017", supplier: "CV Pangan Jaya", date: "09 Agu 2026", items: 8, total: 1240000, status: "Menunggu" },
  { id: "PO-2026-016", supplier: "Depot Segar", date: "08 Agu 2026", items: 4, total: 680000, status: "Diterima" },
  { id: "PO-2026-015", supplier: "Mitra Tani", date: "07 Agu 2026", items: 6, total: 915000, status: "Diterima" },
];

export const demoUsers = [
  { id: "usr-1", initials: "AN", name: "Ayu Nuraini", email: "ayu@sekolah.sch.id", role: "Manager", status: "Aktif" },
  { id: "usr-2", initials: "DP", name: "Dimas Pratama", email: "dimas@sekolah.sch.id", role: "Kasir", status: "Aktif" },
  { id: "usr-3", initials: "SR", name: "Sari Rahma", email: "sari@sekolah.sch.id", role: "Stok", status: "Menunggu" },
];

export const demoAuditLogs = [
  { time: "14:32", actor: "Ayu Nuraini", action: "Menyelesaikan transaksi", detail: "#INV-240816 · Rp 56.000" },
  { time: "13:48", actor: "Dimas Pratama", action: "Mencatat penerimaan", detail: "PO-2026-016 · Depot Segar" },
  { time: "11:20", actor: "Ayu Nuraini", action: "Mengubah harga produk", detail: "Es Teh Manis · Rp 5.000" },
  { time: "09:42", actor: "Ayu Nuraini", action: "Membuka shift kasir", detail: "Outlet Utama · Kas awal Rp 300.000" },
];
