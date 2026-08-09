"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  demoAuditLogs,
  demoInventoryRows,
  demoProductRows,
  demoPurchases,
  demoSalesMix,
  demoTransactions,
  demoUsers,
  type DemoInventoryItem,
  type DemoProduct,
  type DemoPurchase,
} from "../lib/demo-data";
import { getInventorySnapshot } from "../lib/supabase/inventory";
import { getTransactions } from "../lib/supabase/transactions";

export type ModuleKey = "transactions" | "products" | "inventory" | "purchasing" | "cash" | "reports" | "admin";
export type KantinNavKey = "dashboard" | "pos" | ModuleKey;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const transactionStatusLabels = {
  paid: "Selesai",
  review: "Review refund",
  voided: "Dibatalkan",
} as const;

function ModuleStat({ label, value, detail, tone = "" }: { label: string; value: string; detail: string; tone?: string }) {
  return (
    <article className={`module-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function ModuleNotice({ children }: { children: string }) {
  return <div className="module-notice" role="status"><span>i</span>{children}</div>;
}

function TransactionsModule({ outletId }: { outletId: string }) {
  const [rows, setRows] = useState(demoTransactions);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState(demoTransactions[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (outletId === "demo") return;
    let cancelled = false;
    getTransactions(outletId).then((liveRows) => {
      if (!cancelled && liveRows) setRows(liveRows);
    }).catch(() => {
      // Keep the demo transaction list if the live query is unavailable.
    });
    return () => { cancelled = true; };
  }, [outletId]);

  const visibleRows = useMemo(() => rows.filter((transaction) => {
    const matchesQuery = `${transaction.id} ${transaction.cashier} ${transaction.payment}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || transaction.status === status;
    return matchesQuery && matchesStatus;
  }), [query, rows, status]);
  const selected = visibleRows.find((transaction) => transaction.id === selectedId) ?? visibleRows[0];
  const completedTotal = rows.filter((transaction) => transaction.status === "paid").reduce((sum, transaction) => sum + transaction.total, 0);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <div className="module-stack">
      <section className="module-stat-grid">
        <ModuleStat label="Penjualan hari ini" value={formatCurrency(completedTotal)} detail="6 transaksi tercatat" tone="module-stat-teal" />
        <ModuleStat label="Menunggu review" value="2 refund" detail="Perlu persetujuan manager" tone="module-stat-gold" />
        <ModuleStat label="Rata-rata transaksi" value={formatCurrency(Math.round(completedTotal / 5))} detail="Dari transaksi selesai" tone="module-stat-sky" />
      </section>

      <section className="card module-card">
        <div className="module-toolbar">
          <label className="module-search"><span aria-hidden="true">Search</span><input aria-label="Cari transaksi" placeholder="Cari nomor invoice atau kasir" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select className="module-select" aria-label="Filter status transaksi" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Semua status</option>
            <option value="paid">Selesai</option>
            <option value="review">Review refund</option>
            <option value="voided">Dibatalkan</option>
          </select>
          <button className="secondary-button" type="button" onClick={() => showNotice("Export transaksi demo siap dihubungkan ke CSV.")}>Export CSV</button>
        </div>
        <div className="table-scroll">
          <table className="module-table">
            <thead><tr><th>Invoice</th><th>Kasir</th><th>Item</th><th>Metode</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {visibleRows.map((transaction) => (
                <tr className={selected?.id === transaction.id ? "selected-row" : ""} key={transaction.id} tabIndex={0} onClick={() => setSelectedId(transaction.id)} onKeyDown={(event) => event.key === "Enter" && setSelectedId(transaction.id)}>
                  <td><strong>{transaction.id}</strong><small>{transaction.time}</small></td>
                  <td>{transaction.cashier}</td>
                  <td>{transaction.items} item</td>
                  <td>{transaction.payment}</td>
                  <td><strong>{formatCurrency(transaction.total)}</strong></td>
                  <td><span className={`status-pill ${transaction.status === "paid" ? "paid" : transaction.status === "review" ? "review" : "voided"}`}>{transactionStatusLabels[transaction.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleRows.length && <div className="module-empty">Tidak ada transaksi yang cocok dengan filter.</div>}
        </div>
      </section>

      {selected && <section className="module-detail-grid">
        <article className="card module-card detail-card">
          <div className="card-heading"><div><span className="section-kicker">Detail transaksi</span><h2>{selected.id}</h2></div><span className={`status-pill ${selected.status === "paid" ? "paid" : selected.status === "review" ? "review" : "voided"}`}>{transactionStatusLabels[selected.status]}</span></div>
          <div className="detail-list"><div><span>Kasir</span><strong>{selected.cashier}</strong></div><div><span>Waktu</span><strong>{selected.time}</strong></div><div><span>Pembayaran</span><strong>{selected.payment}</strong></div><div><span>Total</span><strong>{formatCurrency(selected.total)}</strong></div></div>
          <div className="module-actions"><button className="secondary-button" type="button" onClick={() => showNotice(`Struk ${selected.id} masuk antrean cetak demo.`)}>Cetak ulang struk</button><button className="primary-button" type="button" onClick={() => showNotice(selected.status === "review" ? "Refund demo diteruskan ke manager." : "Hanya transaksi refund yang perlu review.")}>Proses refund</button></div>
        </article>
        <article className="card module-card detail-card"><span className="section-kicker">Jejak audit</span><h2>Aksi tercatat</h2><div className="timeline-list"><div><span className="timeline-dot teal-dot" /><span><strong>Transaksi dibuat</strong><small>{selected.time} · POS Kasir</small></span></div><div><span className="timeline-dot gold-dot" /><span><strong>Pembayaran dikonfirmasi</strong><small>Metode {selected.payment} · Nominal cocok</small></span></div><div><span className="timeline-dot gray-dot" /><span><strong>Snapshot siap dipertahankan</strong><small>Data harga dan nama item tersimpan</small></span></div></div></article>
      </section>}
      {notice && <ModuleNotice>{notice}</ModuleNotice>}
    </div>
  );
}

function ProductsModule() {
  const [rows, setRows] = useState<DemoProduct[]>(demoProductRows);
  const [query, setQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState("Makanan");
  const [draftPrice, setDraftPrice] = useState("");
  const [notice, setNotice] = useState("");
  const visibleRows = rows.filter((product) => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  const activeCount = rows.filter((product) => product.active).length;
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const saveProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(draftPrice);
    if (!draftName.trim() || !Number.isFinite(price) || price <= 0) {
      showNotice("Isi nama dan harga produk terlebih dahulu.");
      return;
    }
    const id = `prod-${Date.now()}`;
    setRows((current) => [{ id, sku: `NEW-${String(current.length + 1).padStart(3, "0")}`, name: draftName.trim(), category: draftCategory, cost: 0, price, stock: 0, minStock: 5, unit: "porsi", active: true, emoji: "🍽️", tone: "mint" }, ...current]);
    setDraftName("");
    setDraftPrice("");
    setShowComposer(false);
    showNotice(`${draftName.trim()} ditambahkan ke katalog demo.`);
  };

  return (
    <div className="module-stack">
      <section className="module-stat-grid">
        <ModuleStat label="Produk aktif" value={`${activeCount} menu`} detail="Tampil di POS kasir" tone="module-stat-teal" />
        <ModuleStat label="Kategori" value="3 kategori" detail="Makanan, minuman, camilan" tone="module-stat-gold" />
        <ModuleStat label="Perlu harga pokok" value="4 menu" detail="Lengkapi untuk gross profit" tone="module-stat-sky" />
      </section>
      <section className="card module-card">
        <div className="module-toolbar"><label className="module-search"><span aria-hidden="true">Search</span><input aria-label="Cari produk" placeholder="Cari nama, SKU, atau kategori" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="secondary-button" type="button" onClick={() => showNotice("Import produk demo siap dihubungkan ke CSV.")}>Import</button><button className="primary-button" type="button" onClick={() => setShowComposer((current) => !current)}>+ Produk baru</button></div>
        {showComposer && <form className="product-composer" onSubmit={saveProduct}><label>Nama produk<input className="module-input" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Contoh: Salad buah" /></label><label>Kategori<select className="module-input" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}><option>Makanan</option><option>Minuman</option><option>Camilan</option></select></label><label>Harga jual<input className="module-input" type="number" min="1" value={draftPrice} onChange={(event) => setDraftPrice(event.target.value)} placeholder="15000" /></label><div className="module-actions"><button className="secondary-button" type="button" onClick={() => setShowComposer(false)}>Batal</button><button className="primary-button" type="submit">Simpan produk</button></div></form>}
        <div className="table-scroll"><table className="module-table"><thead><tr><th>Produk</th><th>Kategori</th><th>Harga jual</th><th>Harga pokok</th><th>Stok</th><th>Status</th><th /></tr></thead><tbody>{visibleRows.map((product) => <tr key={product.id}><td><div className="table-product"><span className={`product-thumb ${product.tone}`}>{product.emoji}</span><span><strong>{product.name}</strong><small>{product.sku} · {product.unit}</small></span></div></td><td>{product.category}</td><td><strong>{formatCurrency(product.price)}</strong></td><td>{product.cost ? formatCurrency(product.cost) : <span className="muted-warning">Belum diisi</span>}</td><td>{product.stock} {product.unit}</td><td><button type="button" className={product.active ? "toggle active" : "toggle"} onClick={() => setRows((current) => current.map((item) => item.id === product.id ? { ...item, active: !item.active } : item))} aria-label={`${product.active ? "Nonaktifkan" : "Aktifkan"} ${product.name}`}><span /></button></td><td><button className="row-action" type="button" onClick={() => showNotice(`Editor ${product.name} siap dihubungkan ke master data.`)}>Edit</button></td></tr>)}</tbody></table>{!visibleRows.length && <div className="module-empty">Produk tidak ditemukan.</div>}</div>
      </section>
      {notice && <ModuleNotice>{notice}</ModuleNotice>}
    </div>
  );
}

function InventoryModule({ outletId }: { outletId: string }) {
  const [rows, setRows] = useState<DemoInventoryItem[]>(demoInventoryRows);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const lowStockCount = rows.filter((item) => item.qty <= item.min).length;
  const visibleRows = rows.filter((item) => filter === "all" || item.qty <= item.min);
  useEffect(() => {
    if (outletId === "demo") return;
    let cancelled = false;
    getInventorySnapshot(outletId).then((liveRows) => {
      if (!cancelled && liveRows) setRows(liveRows);
    }).catch(() => {
      // Keep the demo inventory list if the live query is unavailable.
    });
    return () => { cancelled = true; };
  }, [outletId]);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const receiveStock = (id: string) => {
    if (outletId !== "demo") {
      showNotice("Snapshot stok live aktif. Gunakan RPC receiving setelah server-side adjustment disiapkan.");
      return;
    }
    setRows((current) => current.map((item) => item.id === id ? { ...item, qty: item.qty + 10, movement: "Adjustment baru saja dicatat" } : item));
    showNotice("Adjustment stok +10 berhasil dicatat di demo mode.");
  };

  return (
    <div className="module-stack">
      <section className="module-stat-grid"><ModuleStat label="Nilai persediaan" value="Rp 8,42 jt" detail="Estimasi harga pokok" tone="module-stat-teal" /><ModuleStat label="Stok menipis" value={`${lowStockCount} item`} detail="Di bawah minimum" tone="module-stat-gold" /><ModuleStat label="Pergerakan hari ini" value="28 movement" detail="Masuk dan keluar" tone="module-stat-sky" /></section>
      <section className="card module-card"><div className="module-toolbar"><div><span className="section-kicker">Kontrol persediaan</span><h2>Stok outlet utama</h2></div><div className="toolbar-spacer" /><select className="module-select" aria-label="Filter persediaan" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua item</option><option value="low">Stok menipis</option></select><button className="primary-button" type="button" onClick={() => showNotice("Mode opname demo dibuka untuk outlet utama.")}>Mulai opname</button></div><div className="table-scroll"><table className="module-table"><thead><tr><th>Item persediaan</th><th>Stok tersedia</th><th>Minimum</th><th>Supplier</th><th>Movement terakhir</th><th /></tr></thead><tbody>{visibleRows.map((item) => { const isLow = item.qty <= item.min; return <tr key={item.id}><td><div className="table-product"><span className={`inventory-icon ${isLow ? "low" : ""}`}>INV</span><span><strong>{item.name}</strong><small>{item.sku} · per {item.unit}</small></span></div></td><td><span className={isLow ? "stock-level low" : "stock-level"}>{item.qty} {item.unit}</span></td><td>{item.min} {item.unit}</td><td>{item.supplier}</td><td>{item.movement}</td><td><button className="row-action" type="button" onClick={() => receiveStock(item.id)}>+10 stok</button></td></tr>; })}</tbody></table>{!visibleRows.length && <div className="module-empty">Tidak ada item pada filter ini.</div>}</div></section>
      <section className="module-grid-two"><article className="card module-card"><span className="section-kicker">Alur stok</span><h2>Movement terbaru</h2><div className="timeline-list"><div><span className="timeline-dot teal-dot" /><span><strong>Masuk · Beras premium</strong><small>+24 kg · CV Pangan Jaya · 2 jam lalu</small></span></div><div><span className="timeline-dot gold-dot" /><span><strong>Keluar · Telur ayam</strong><small>-12 butir · Transaksi #INV-240816</small></span></div><div><span className="timeline-dot gray-dot" /><span><strong>Adjustment · Teh celup</strong><small>Opname · Ayu Nuraini · kemarin</small></span></div></div></article><article className="card module-card reorder-card"><span className="section-kicker">Rekomendasi</span><h2>Siap reorder</h2><strong className="reorder-number">{lowStockCount} item</strong><p>Gabungkan item stok menipis ke pembelian baru agar biaya supplier lebih mudah dilacak.</p><button className="secondary-button" type="button" onClick={() => showNotice("Draft reorder dibuat dari item stok menipis.")}>Buat draft pembelian <span>→</span></button></article></section>
      {notice && <ModuleNotice>{notice}</ModuleNotice>}
    </div>
  );
}

function PurchasingModule() {
  const [rows, setRows] = useState<DemoPurchase[]>(demoPurchases);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const visibleRows = rows.filter((purchase) => filter === "all" || purchase.status === filter);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const createDraft = () => {
    const draft: DemoPurchase = { id: `PO-2026-${String(rows.length + 18).padStart(3, "0")}`, supplier: "Supplier baru", date: "09 Agu 2026", items: 0, total: 0, status: "Draft" };
    setRows((current) => [draft, ...current]);
    showNotice(`${draft.id} dibuat sebagai draft pembelian.`);
  };

  return (
    <div className="module-stack"><section className="module-stat-grid"><ModuleStat label="Open purchase order" value="1 PO" detail="Menunggu penerimaan" tone="module-stat-gold" /><ModuleStat label="Belanja bulan ini" value="Rp 12,8 jt" detail="Naik 6,4% vs bulan lalu" tone="module-stat-teal" /><ModuleStat label="Supplier aktif" value="8 supplier" detail="Dengan histori penerimaan" tone="module-stat-sky" /></section><section className="card module-card"><div className="module-toolbar"><div><span className="section-kicker">Procurement</span><h2>Purchase order</h2></div><div className="toolbar-spacer" /><select className="module-select" aria-label="Filter status purchase order" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option><option value="Menunggu">Menunggu</option><option value="Diterima">Diterima</option><option value="Draft">Draft</option></select><button className="primary-button" type="button" onClick={createDraft}>+ Pembelian baru</button></div><div className="purchase-list">{visibleRows.map((purchase) => <article className="purchase-card" key={purchase.id}><div className="purchase-card-top"><span className="purchase-icon">PO</span><span><strong>{purchase.id}</strong><small>{purchase.date} · {purchase.items || "Belum ada"} item</small></span><span className={`status-pill ${purchase.status === "Diterima" ? "paid" : purchase.status === "Menunggu" ? "review" : "draft"}`}>{purchase.status}</span></div><div className="purchase-card-bottom"><span><small>Supplier</small><strong>{purchase.supplier}</strong></span><span><small>Total estimasi</small><strong>{purchase.total ? formatCurrency(purchase.total) : "Belum diisi"}</strong></span><button className="row-action" type="button" onClick={() => showNotice(`${purchase.id} dibuka untuk detail penerimaan demo.`)}>Buka detail →</button></div></article>)}</div></section>{notice && <ModuleNotice>{notice}</ModuleNotice>}</div>
  );
}

type CashMovement = { id: string; type: "cash_in" | "cash_out"; amount: number; category: string; reason: string; time: string };

function CashModule() {
  const [shiftOpen, setShiftOpen] = useState(true);
  const [movements, setMovements] = useState<CashMovement[]>([
    { id: "cash-1", type: "cash_in", amount: 300000, category: "Kas awal", reason: "Opening shift", time: "09:42" },
    { id: "cash-2", type: "cash_out", amount: 45000, category: "Operasional", reason: "Beli es batu", time: "11:15" },
  ]);
  const [notice, setNotice] = useState("");
  const cashIn = movements.filter((movement) => movement.type === "cash_in").reduce((sum, movement) => sum + movement.amount, 0);
  const cashOut = movements.filter((movement) => movement.type === "cash_out").reduce((sum, movement) => sum + movement.amount, 0);
  const cashSales = 318000;
  const expectedCash = cashIn - cashOut + cashSales;
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const addMovement = (type: CashMovement["type"]) => {
    const movement: CashMovement = { id: `cash-${Date.now()}`, type, amount: type === "cash_in" ? 50000 : 25000, category: type === "cash_in" ? "Kas masuk" : "Operasional", reason: type === "cash_in" ? "Setoran tambahan demo" : "Pengeluaran kecil demo", time: "14:40" };
    setMovements((current) => [...current, movement]);
    showNotice(`${type === "cash_in" ? "Kas masuk" : "Kas keluar"} dicatat di demo mode.`);
  };

  return (
    <div className="module-stack"><section className="module-stat-grid"><ModuleStat label="Status shift" value={shiftOpen ? "OPEN" : "CLOSED"} detail="Ayu Nuraini · Outlet Utama" tone={shiftOpen ? "module-stat-teal" : "module-stat-sky"} /><ModuleStat label="Expected cash" value={formatCurrency(expectedCash)} detail="Termasuk penjualan tunai" tone="module-stat-gold" /><ModuleStat label="Selisih terakhir" value="Rp 0" detail="Rekonsiliasi sesuai" tone="module-stat-sky" /></section><section className="cash-layout"><article className="card module-card shift-summary"><div className="card-heading"><div><span className="section-kicker">Shift aktif</span><h2>#SH-0816 · Ayu Nuraini</h2></div><span className={shiftOpen ? "live-shift" : "status-pill review"}>{shiftOpen ? "● OPEN" : "CLOSED"}</span></div><div className="shift-summary-grid"><div><span>Dibuka</span><strong>09 Agu 2026, 09:42</strong></div><div><span>Kas awal</span><strong>{formatCurrency(cashIn)}</strong></div><div><span>Penjualan tunai</span><strong>{formatCurrency(cashSales)}</strong></div><div><span>Expected cash</span><strong className="teal-value">{formatCurrency(expectedCash)}</strong></div></div><div className="module-actions"><button className="secondary-button" type="button" onClick={() => addMovement("cash_in")}>+ Kas masuk</button><button className="secondary-button" type="button" onClick={() => addMovement("cash_out")}>- Kas keluar</button><button className="primary-button" type="button" onClick={() => { setShiftOpen(false); showNotice("Shift ditutup di demo mode. Selisih kas perlu diisi pada langkah berikutnya."); }} disabled={!shiftOpen}>Tutup shift <span>→</span></button></div></article><article className="card module-card"><span className="section-kicker">Cash movement</span><h2>Mutasi kas hari ini</h2><div className="movement-list">{movements.map((movement) => <div className="movement-row" key={movement.id}><span className={movement.type === "cash_in" ? "movement-icon in" : "movement-icon out"}>{movement.type === "cash_in" ? "+" : "-"}</span><span><strong>{movement.category}</strong><small>{movement.reason} · {movement.time}</small></span><strong className={movement.type === "cash_in" ? "cash-in" : "cash-out"}>{movement.type === "cash_in" ? "+" : "-"}{formatCurrency(movement.amount)}</strong></div>)}</div></article></section>{notice && <ModuleNotice>{notice}</ModuleNotice>}</div>
  );
}

function ReportsModule() {
  const [range, setRange] = useState<"7" | "30" | "90">("7");
  const [notice, setNotice] = useState("");
  const total = demoSalesMix.reduce((sum, item) => sum + item.amount, 0);
  const mix = demoSalesMix.map((item) => ({ ...item, value: Math.round((item.amount / total) * 100) }));
  const gradient = useMemo(() => {
    const stops = mix.map((item, index) => {
      const start = mix.slice(0, index).reduce((sum, previous) => sum + previous.value, 0);
      return `${item.color} ${start}% ${start + item.value}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [mix]);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const periodLabel = range === "7" ? "7 hari terakhir" : range === "30" ? "30 hari terakhir" : "90 hari terakhir";

  return (
    <div className="module-stack"><section className="module-stat-grid"><ModuleStat label="Omzet periode" value={formatCurrency(total)} detail={periodLabel} tone="module-stat-teal" /><ModuleStat label="Gross profit est." value="Rp 1,76 jt" detail="Margin 36,2%" tone="module-stat-gold" /><ModuleStat label="Rasio penjualan" value="4 kategori" detail="Makanan memimpin 42%" tone="module-stat-sky" /></section><section className="report-layout"><article className="card module-card report-mix-card"><div className="card-heading"><div><span className="section-kicker">Mix pendapatan</span><h2>Rasio penjualan per kategori</h2></div><div className="range-switcher">{(["7", "30", "90"] as const).map((item) => <button key={item} className={range === item ? "active" : ""} type="button" onClick={() => setRange(item)}>{item}H</button>)}</div></div><div className="report-mix-content"><div className="report-donut-large" style={{ background: gradient }}><div><strong>100%</strong><span>total mix</span></div></div><div className="report-mix-list">{mix.map((item) => <div className="report-mix-row" key={item.label}><div><span><i className="legend-dot" style={{ background: item.color }} />{item.label}</span><strong>{item.value}%</strong></div><div className="ratio-track"><div className="ratio-fill" style={{ width: `${item.value}%`, background: item.color }} /></div><small>{formatCurrency(item.amount)} · kontribusi periode</small></div>)}</div></div><div className="ratio-note"><span className="mini-spark">↑</span><span><strong>Makanan memimpin</strong> dengan kontribusi {mix[0]?.value ?? 0}% dari omzet {periodLabel}.</span></div></article><article className="card module-card report-bars-card"><div className="card-heading"><div><span className="section-kicker">Tren omzet</span><h2>Penjualan harian</h2></div><button className="link-button" type="button" onClick={() => showNotice("Laporan detail demo siap diekspor.")}>Export laporan →</button></div><div className="report-bars">{[{ day: "Sen", value: 54 }, { day: "Sel", value: 68 }, { day: "Rab", value: 47 }, { day: "Kam", value: 76 }, { day: "Jum", value: 88 }, { day: "Sab", value: 70 }, { day: "Min", value: 94 }].map((item) => <div className="report-bar-column" key={item.day}><span className="report-bar-track"><i style={{ height: `${item.value}%` }} /></span><small>{item.day}</small></div>)}</div><div className="report-highlight"><span>Hari terbaik</span><strong>Minggu · Rp 4,86 jt</strong><small>Naik 18,6% dari periode sebelumnya</small></div></article></section>{notice && <ModuleNotice>{notice}</ModuleNotice>}</div>
  );
}

function AdminModule() {
  const [users, setUsers] = useState(demoUsers);
  const [notice, setNotice] = useState("");
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const inviteUser = () => {
    const user = { id: `usr-${Date.now()}`, initials: "NN", name: "Pengguna baru", email: "undangan@sekolah.sch.id", role: "Viewer", status: "Menunggu" };
    setUsers((current) => [...current, user]);
    showNotice("Undangan pengguna demo dibuat dengan status menunggu.");
  };

  return (
    <div className="module-stack"><section className="module-stat-grid"><ModuleStat label="Pengguna aktif" value={`${users.filter((user) => user.status === "Aktif").length} akun`} detail="Di seluruh outlet" tone="module-stat-teal" /><ModuleStat label="Menunggu approval" value={`${users.filter((user) => user.status === "Menunggu").length} akun`} detail="Perlu review manager" tone="module-stat-gold" /><ModuleStat label="Audit hari ini" value="18 aktivitas" detail="Aksi sensitif terlacak" tone="module-stat-sky" /></section><section className="admin-layout"><article className="card module-card"><div className="module-toolbar"><div><span className="section-kicker">Role & akses</span><h2>Pengguna workspace</h2></div><div className="toolbar-spacer" /><button className="primary-button" type="button" onClick={inviteUser}>+ Undang pengguna</button></div><div className="user-list">{users.map((user) => <div className="user-row" key={user.id}><span className="user-avatar">{user.initials}</span><span className="user-info"><strong>{user.name}</strong><small>{user.email}</small></span><span className="role-pill">{user.role}</span><span className={user.status === "Aktif" ? "status-pill paid" : "status-pill review"}>{user.status}</span><button className="row-action" type="button" onClick={() => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: item.status === "Aktif" ? "Nonaktif" : "Aktif" } : item))}>{user.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}</button></div>)}</div></article><article className="card module-card"><span className="section-kicker">Audit log</span><h2>Aktivitas kritis terbaru</h2><div className="audit-list">{demoAuditLogs.map((log) => <div className="audit-row" key={`${log.time}-${log.actor}`}><span className="audit-time">{log.time}</span><span><strong>{log.action}</strong><small>{log.actor} · {log.detail}</small></span></div>)}</div><button className="secondary-button" type="button" onClick={() => showNotice("Audit log lengkap siap dihubungkan ke query Supabase.")}>Lihat semua audit <span>→</span></button></article></section><section className="card module-card permission-card"><span className="section-kicker">Kontrol sistem</span><h2>Role bawaan KantinKita</h2><div className="permission-grid"><div><strong>Manager</strong><span>Kelola master data, approval refund, laporan, dan outlet.</span></div><div><strong>Kasir</strong><span>Jalankan shift dan transaksi POS tanpa akses konfigurasi.</span></div><div><strong>Stok</strong><span>Kelola inventory, opname, purchase order, dan receiving.</span></div><div><strong>Finance / Viewer</strong><span>Akses laporan sesuai scope tanpa menulis transaksi kasir.</span></div></div></section>{notice && <ModuleNotice>{notice}</ModuleNotice>}</div>
  );
}

export function OperationsModule({ activeNav, outletId = "demo" }: { activeNav: ModuleKey; outletId?: string }) {
  switch (activeNav) {
    case "transactions": return <TransactionsModule outletId={outletId} />;
    case "products": return <ProductsModule />;
    case "inventory": return <InventoryModule outletId={outletId} />;
    case "purchasing": return <PurchasingModule />;
    case "cash": return <CashModule />;
    case "reports": return <ReportsModule />;
    case "admin": return <AdminModule />;
    default: return <div className="module-empty">Modul belum tersedia.</div>;
  }
}
