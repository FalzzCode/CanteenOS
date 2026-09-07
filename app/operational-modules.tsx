"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";

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
  type DemoTransaction,
} from "../lib/demo-data";
import { getProductCatalog, setProductActive } from "../lib/supabase/catalog";
import { getDashboardSummary, type DashboardSummary } from "../lib/supabase/dashboard";
import { adjustInventory, getInventorySnapshot } from "../lib/supabase/inventory";
import { addCashMovement, getCashWorkspace, getPurchaseOrders } from "../lib/supabase/operations";
import { getSalesMix } from "../lib/supabase/reports";
import { getTransactions } from "../lib/supabase/transactions";
import { ProductIcon, UiIcon } from "./ui-icons";

export type ModuleKey = "transactions" | "products" | "inventory" | "purchasing" | "cash" | "reports" | "admin";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  if (typeof window === "undefined") return;
  const content = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const normalizeCsvHeader = (value: string) => value.replace(/^\uFEFF/, "").toLowerCase().replace(/[\s_-]+/g, "").replace(/[()]/g, "");

const productToneForCategory = (category: string) => category === "Minuman" ? "mint" : category === "Camilan" ? "gold" : category === "Lainnya" ? "blue" : "peach";

const parseNumber = (value: string | undefined, fallback = 0) => {
  if (!value) return fallback;
  const cleaned = value.trim().replace(/[^0-9,.-]/g, "");
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : /\.\d{3}$/.test(cleaned)
      ? cleaned.replace(/\./g, "")
      : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatReportDay = (day: string, includeDate = false) => {
  if (!/^\d{4}-\d{2}-\d{2}/.test(day)) return day;
  const date = new Date(`${day.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  const options: Intl.DateTimeFormatOptions = includeDate
    ? { weekday: "short", day: "numeric", month: "short" }
    : { weekday: "short" };
  return new Intl.DateTimeFormat("id-ID", options).format(date).replace(/\./g, "");
};

const transactionStatusLabels = {
  paid: "Selesai",
  review: "Review refund",
  voided: "Dibatalkan",
} as const;

const TRANSACTIONS_PER_PAGE = 4;

const transactionStatusClass = (status: "paid" | "review" | "voided") =>
  status === "paid" ? "paid" : status === "review" ? "review" : "voided";

const transactionProductLabel = (transaction: Pick<DemoTransaction, "items" | "itemNames">) => {
  const firstProduct = transaction.itemNames?.[0];
  if (!firstProduct) return transaction.items === 1 ? "1 menu kantin" : `${transaction.items} menu kantin`;
  const remainingProducts = (transaction.itemNames?.length ?? 1) - 1;
  return remainingProducts > 0 ? `${firstProduct} + ${remainingProducts} menu lainnya` : firstProduct;
};

const transactionReferenceLabel = (id: string) => {
  const reference = id.replace(/^#?INV-/i, "").replace(/^#/, "");
  return `Pesanan ${reference}`;
};

const getTransactionPaginationItems = (totalPages: number, currentPage: number): Array<number | "ellipsis"> => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = [1, currentPage - 1, currentPage, currentPage + 1, totalPages]
    .filter((page, index, allPages) => page >= 1 && page <= totalPages && allPages.indexOf(page) === index)
    .sort((left, right) => left - right);

  return pages.reduce<Array<number | "ellipsis">>((items, page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) items.push("ellipsis");
    items.push(page);
    return items;
  }, []);
};

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
  return <div className="module-notice" role="status"><span><UiIcon name="info" size={12} /></span>{children}</div>;
}

function TransactionsModule({ outletId, refreshToken }: { outletId: string; refreshToken: number }) {
  const [rows, setRows] = useState(demoTransactions);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState(demoTransactions[0]?.id ?? "");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (outletId === "demo") return;
    let cancelled = false;
    getTransactions(outletId).then((liveRows) => {
      if (!cancelled && liveRows) {
        setRows(liveRows);
        setCurrentPage(1);
      }
    }).catch(() => {
      // Keep the demo transaction list if the live query is unavailable.
    });
    return () => { cancelled = true; };
  }, [outletId, refreshToken]);

  const visibleRows = useMemo(() => rows.filter((transaction) => {
    const matchesQuery = `${transaction.id} ${transaction.cashier} ${transaction.payment} ${(transaction.itemNames ?? []).join(" ")}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || transaction.status === status;
    return matchesQuery && matchesStatus;
  }), [query, rows, status]);
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / TRANSACTIONS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageRows = useMemo(() => {
    const start = (safeCurrentPage - 1) * TRANSACTIONS_PER_PAGE;
    return visibleRows.slice(start, start + TRANSACTIONS_PER_PAGE);
  }, [safeCurrentPage, visibleRows]);
  const selected = pageRows.find((transaction) => transaction.id === selectedId) ?? pageRows[0] ?? visibleRows[0];
  const completedRows = rows.filter((transaction) => transaction.status === "paid");
  const completedTotal = completedRows.reduce((sum, transaction) => sum + transaction.total, 0);
  const reviewCount = rows.filter((transaction) => transaction.status === "review").length;

  const goToPage = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    const nextRows = visibleRows.slice((nextPage - 1) * TRANSACTIONS_PER_PAGE, nextPage * TRANSACTIONS_PER_PAGE);
    setCurrentPage(nextPage);
    setSelectedId(nextRows[0]?.id ?? "");
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const exportTransactions = () => {
    downloadCsv(
      `transaksi-kantinkita-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Invoice", "Waktu", "Kasir", "Item", "Nama produk", "Pembayaran", "Total", "Status"],
      visibleRows.map((transaction) => [
        transaction.id,
        transaction.time,
        transaction.cashier,
        transaction.items,
        transaction.itemNames?.join(" | ") ?? "",
        transaction.payment,
        transaction.total,
        transactionStatusLabels[transaction.status],
      ]),
    );
    showNotice(`${visibleRows.length} transaksi berhasil diekspor ke CSV.`);
  };

  const printReceipt = () => {
    if (!selected) return;
    const printWindow = window.open("", "_blank", "width=420,height=680");
    if (!printWindow) {
      showNotice("Popup cetak diblokir browser. Izinkan popup untuk mencetak struk.");
      return;
    }
    const selectedProductLabel = transactionProductLabel(selected);
    const selectedReferenceLabel = transactionReferenceLabel(selected.id);
    const itemList = (selected.itemNames ?? [`${selected.items} item`]).map((item) => `<li>${item}</li>`).join("");
    printWindow.document.write(`<!doctype html><html lang="id"><head><title>Struk ${selectedProductLabel}</title><style>body{font:14px Arial,sans-serif;max-width:340px;margin:28px auto;color:#1f2937}h1{font-size:20px;margin:0 0 4px}p{margin:5px 0;color:#64748b}ul{padding-left:18px;border-block:1px solid #e2e8f0;padding-block:12px;line-height:1.7}.total{display:flex;justify-content:space-between;font-weight:700;margin-top:16px}</style></head><body><h1>CanteenOS</h1><p>Struk transaksi sekolah</p><p>${selectedProductLabel} · ${selectedReferenceLabel} · ${selected.time}</p><p>Kasir: ${selected.cashier}</p><ul>${itemList}</ul><div class="total"><span>${selected.payment}</span><span>${formatCurrency(selected.total)}</span></div><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}</script></body></html>`);
    printWindow.document.close();
    showNotice(`Struk ${selectedProductLabel} siap dicetak.`);
  };

  const processRefund = () => {
    if (!selected) return;
    if (selected.status !== "review") {
      showNotice("Hanya transaksi dengan status review refund yang bisa diproses.");
      return;
    }
    setRows((current) => current.map((transaction) => transaction.id === selected.id ? { ...transaction, status: "voided" } : transaction));
    showNotice(`Refund ${transactionProductLabel(selected)} berhasil diproses di demo mode.`);
  };

  return (
    <div className="module-stack">
      <section className="module-stat-grid">
        <ModuleStat label="Penjualan hari ini" value={formatCurrency(completedTotal)} detail={`${completedRows.length} transaksi tercatat`} tone="module-stat-teal" />
        <ModuleStat label="Menunggu review" value={`${reviewCount} refund`} detail="Perlu persetujuan manager" tone="module-stat-gold" />
        <ModuleStat label="Rata-rata transaksi" value={formatCurrency(completedRows.length ? Math.round(completedTotal / completedRows.length) : 0)} detail="Dari transaksi selesai" tone="module-stat-sky" />
      </section>

      <section className="card module-card">
        <div className="module-toolbar">
          <label className="module-search"><UiIcon name="search" size={16} /><input aria-label="Cari transaksi" placeholder="Cari nomor invoice atau kasir" value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} /></label>
          <select className="module-select" aria-label="Filter status transaksi" value={status} onChange={(event) => { setStatus(event.target.value); setCurrentPage(1); }}>
            <option value="all">Semua status</option>
            <option value="paid">Selesai</option>
            <option value="review">Review refund</option>
            <option value="voided">Dibatalkan</option>
          </select>
          <button className="secondary-button" type="button" onClick={exportTransactions}>Export CSV</button>
        </div>
        <div className="transaction-table-desktop table-scroll">
          <table className="module-table transaction-table">
            <thead><tr><th>Menu dibeli</th><th>Kasir</th><th>Item</th><th>Metode</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {pageRows.map((transaction) => (
                <tr className={selected?.id === transaction.id ? "selected-row" : ""} key={transaction.id} tabIndex={0} onClick={() => setSelectedId(transaction.id)} onKeyDown={(event) => event.key === "Enter" && setSelectedId(transaction.id)}>
                  <td><strong>{transactionProductLabel(transaction)}</strong><small>{transactionReferenceLabel(transaction.id)} · {transaction.time}</small></td>
                  <td>{transaction.cashier}</td>
                  <td>{transaction.items} item</td>
                  <td>{transaction.payment}</td>
                  <td><strong>{formatCurrency(transaction.total)}</strong></td>
                  <td><span className={`status-pill ${transactionStatusClass(transaction.status)}`}>{transactionStatusLabels[transaction.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="transaction-mobile-list" aria-label="Daftar transaksi mobile">
          {pageRows.map((transaction) => (
            <button
              type="button"
              className={selected?.id === transaction.id ? "transaction-mobile-card selected" : "transaction-mobile-card"}
              key={transaction.id}
              onClick={() => setSelectedId(transaction.id)}
            >
              <div className="transaction-mobile-head">
                <div className="transaction-mobile-id"><strong>{transactionProductLabel(transaction)}</strong><small>{transactionReferenceLabel(transaction.id)} · {transaction.time}</small></div>
                <span className={`status-pill ${transactionStatusClass(transaction.status)}`}>{transactionStatusLabels[transaction.status]}</span>
              </div>
              <div className="transaction-mobile-items">
                <span className="transaction-mobile-items-icon"><UiIcon name="package" size={13} /></span>
                <span>{transaction.itemNames?.slice(0, 2).join(" · ") || `${transaction.items} item`}{transaction.itemNames && transaction.itemNames.length > 2 ? ` +${transaction.itemNames.length - 2} lainnya` : ""}</span>
              </div>
              <div className="transaction-mobile-meta">
                <div><span>Kasir</span><strong>{transaction.cashier}</strong></div>
                <div><span>Item</span><strong>{transaction.items} item</strong></div>
                <div><span>Bayar</span><strong>{transaction.payment}</strong></div>
                <div><span>Total</span><strong>{formatCurrency(transaction.total)}</strong></div>
              </div>
            </button>
          ))}
        </div>
        {!visibleRows.length && <div className="module-empty">Tidak ada transaksi yang cocok dengan filter.</div>}
        {visibleRows.length > 0 && <nav className="module-pagination" aria-label="Navigasi halaman transaksi">
          <span className="module-pagination-summary">Halaman {safeCurrentPage} dari {totalPages} · {visibleRows.length} transaksi</span>
          <div className="module-pagination-pages">
            <button type="button" aria-label="Halaman sebelumnya" disabled={safeCurrentPage === 1} onClick={() => goToPage(safeCurrentPage - 1)}><UiIcon name="arrowLeft" size={13} /></button>
            {getTransactionPaginationItems(totalPages, safeCurrentPage).map((page, index) => page === "ellipsis"
              ? <span className="module-pagination-ellipsis" aria-hidden="true" key={`ellipsis-${index}`}>…</span>
              : <button type="button" aria-label={`Halaman ${page}`} aria-current={safeCurrentPage === page ? "page" : undefined} className={safeCurrentPage === page ? "active" : ""} key={page} onClick={() => goToPage(page)}>{page}</button>)}
            <button type="button" aria-label="Halaman berikutnya" disabled={safeCurrentPage === totalPages} onClick={() => goToPage(safeCurrentPage + 1)}><UiIcon name="arrowRight" size={13} /></button>
          </div>
        </nav>}
      </section>

      {selected && <section className="module-detail-grid">
        <article className="card module-card detail-card">
          <div className="card-heading"><div><span className="section-kicker">Detail transaksi</span><h2>{transactionProductLabel(selected)}</h2><small className="detail-reference">{transactionReferenceLabel(selected.id)} · {selected.time}</small></div><span className={`status-pill ${transactionStatusClass(selected.status)}`}>{transactionStatusLabels[selected.status]}</span></div>
          <div className="detail-list"><div><span>Kasir</span><strong>{selected.cashier}</strong></div><div><span>Waktu</span><strong>{selected.time}</strong></div><div><span>Pembayaran</span><strong>{selected.payment}</strong></div><div><span>Total</span><strong>{formatCurrency(selected.total)}</strong></div></div>
          <div className="module-actions"><button className="secondary-button" type="button" onClick={printReceipt}>Cetak ulang struk</button><button className="primary-button" type="button" onClick={processRefund}>Proses refund</button></div>
        </article>
        <article className="card module-card detail-card"><span className="section-kicker">Jejak audit</span><h2>Aksi tercatat</h2><div className="timeline-list"><div><span className="timeline-dot teal-dot" /><span><strong>Transaksi dibuat</strong><small>{selected.time} · POS Kasir</small></span></div><div><span className="timeline-dot gold-dot" /><span><strong>Pembayaran dikonfirmasi</strong><small>Metode {selected.payment} · Nominal cocok</small></span></div><div><span className="timeline-dot gray-dot" /><span><strong>Snapshot siap dipertahankan</strong><small>Data harga dan nama item tersimpan</small></span></div></div></article>
      </section>}
      {notice && <ModuleNotice>{notice}</ModuleNotice>}
    </div>
  );
}

function ProductsModule({ outletId, refreshToken }: { outletId: string; refreshToken: number }) {
  const [rows, setRows] = useState<DemoProduct[]>(demoProductRows);
  const [query, setQuery] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [editingId, setEditingId] = useState<DemoProduct["id"] | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState("Makanan");
  const [draftPrice, setDraftPrice] = useState("");
  const [notice, setNotice] = useState("");
  const [productBusy, setProductBusy] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!showComposer || typeof window === "undefined") return;
    const frame = window.requestAnimationFrame(() => {
      if (window.matchMedia("(max-width: 620px)").matches) {
        composerRef.current?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [showComposer]);
  useEffect(() => {
    if (outletId === "demo") return;
    let cancelled = false;
    getProductCatalog(outletId).then((liveRows) => {
      if (cancelled || liveRows === null) return;
      setRows(liveRows.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category,
        cost: product.costReference,
        price: product.sellPrice,
        stock: product.stock,
        minStock: product.minStock,
        unit: product.unit,
        active: product.active,
        emoji: "",
        tone: product.category === "Minuman" ? "mint" : product.category === "Camilan" ? "gold" : "peach",
      })));
    }).catch(() => {
      // The existing rows stay visible while the connection recovers.
    });
    return () => { cancelled = true; };
  }, [outletId, refreshToken]);
  const visibleRows = rows.filter((product) => `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  const activeCount = rows.filter((product) => product.active).length;
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const saveProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (outletId !== "demo") {
      showNotice("Penambahan produk live belum tersedia. Data tidak diubah.");
      return;
    }
    const price = Number(draftPrice);
    if (!draftName.trim() || !Number.isFinite(price) || price <= 0) {
      showNotice("Isi nama dan harga produk terlebih dahulu.");
      return;
    }
    const trimmedName = draftName.trim();
    if (editingId !== null) {
      setRows((current) => current.map((product) => product.id === editingId ? { ...product, name: trimmedName, category: draftCategory, price, tone: productToneForCategory(draftCategory) } : product));
      setEditingId(null);
      setDraftName("");
      setDraftPrice("");
      setShowComposer(false);
      showNotice(`${trimmedName} diperbarui di katalog demo.`);
      return;
    }
    const id = `prod-${Date.now()}`;
    setRows((current) => [{ id, sku: `NEW-${String(current.length + 1).padStart(3, "0")}`, name: trimmedName, category: draftCategory, cost: 0, price, stock: 0, minStock: 5, unit: "porsi", active: true, emoji: "🍽️", tone: productToneForCategory(draftCategory) }, ...current]);
    setDraftName("");
    setDraftPrice("");
    setShowComposer(false);
    showNotice(`${trimmedName} ditambahkan ke katalog demo.`);
  };

  const startEditing = (product: DemoProduct) => {
    setEditingId(product.id);
    setDraftName(product.name);
    setDraftCategory(product.category);
    setDraftPrice(String(product.price));
    setShowComposer(true);
  };

  const downloadProductTemplate = () => {
    downloadCsv(
      "template-produk-kantinkita.csv",
      ["Nama Produk", "Kategori", "Harga Jual", "Harga Pokok", "Stok", "Minimum", "Satuan", "SKU", "Aktif"],
      [
        ["Nasi Goreng Spesial", "Makanan", 15000, 9500, 18, 5, "porsi", "MKN-001", "true"],
        ["Es Teh Manis", "Minuman", 5000, 2200, 42, 10, "gelas", "MNM-001", "true"],
      ],
    );
    showNotice("Contoh CSV produk berhasil diunduh.");
  };

  const importProducts = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type && !file.type.includes("csv")) {
      showNotice("Pilih file CSV produk agar data bisa dibaca.");
      return;
    }
    try {
      const records = parseCsv(await file.text());
      if (records.length < 2) {
        showNotice("CSV belum berisi baris produk.");
        return;
      }
      const headers = records[0].map(normalizeCsvHeader);
      const findValue = (row: string[], aliases: string[]) => {
        const index = aliases.map(normalizeCsvHeader).map((alias) => headers.indexOf(alias)).find((candidate) => candidate >= 0);
        return index === undefined ? "" : row[index] ?? "";
      };
      const imported = records.slice(1).map((row, index) => {
        const name = findValue(row, ["nama produk", "produk", "nama", "name"]).trim();
        const categoryValue = findValue(row, ["kategori", "category"]).trim();
        const category = ({ makanan: "Makanan", minuman: "Minuman", camilan: "Camilan", snack: "Camilan", lainnya: "Lainnya" } as Record<string, DemoProduct["category"]>)[categoryValue.toLowerCase()] ?? "Lainnya";
        const price = parseNumber(findValue(row, ["harga jual", "harga", "price"]));
        const sku = findValue(row, ["sku", "kode"]).trim() || `IMP-${Date.now()}-${String(index + 1).padStart(2, "0")}`;
        return { name, category, price, sku, cost: parseNumber(findValue(row, ["harga pokok", "modal", "cost"])), stock: parseNumber(findValue(row, ["stok", "stock"])), minStock: parseNumber(findValue(row, ["minimum", "min stok", "minstock"]), 5), unit: findValue(row, ["satuan", "unit"]).trim() || "porsi", active: findValue(row, ["aktif", "active"]).toLowerCase() !== "false", tone: productToneForCategory(category) };
      }).filter((product) => product.name && product.price > 0).map((product, index) => ({ ...product, id: `import-${Date.now()}-${index}` }));

      if (!imported.length) {
        showNotice("Tidak ada baris valid. Pastikan kolom nama produk dan harga jual terisi.");
        return;
      }
      if (outletId !== "demo") {
        showNotice("CSV berhasil dibaca, tetapi penyimpanan katalog live perlu endpoint katalog.");
        return;
      }
      setRows((current) => [...imported, ...current]);
      showNotice(`${imported.length} produk berhasil diimpor ke katalog demo.`);
    } catch {
      showNotice("File CSV tidak bisa dibaca. Simpan sebagai CSV UTF-8 lalu coba lagi.");
    }
  };

  const toggleProduct = async (product: DemoProduct) => {
    if (outletId === "demo") {
      setRows((current) => current.map((item) => item.id === product.id ? { ...item, active: !item.active } : item));
      return;
    }

    const productId = String(product.id);
    setProductBusy(productId);
    try {
      await setProductActive(outletId, productId, !product.active);
      setRows((current) => current.map((item) => item.id === product.id ? { ...item, active: !item.active } : item));
      showNotice(`${product.name} ${product.active ? "dinonaktifkan" : "diaktifkan"} dan disinkronkan.`);
    } catch (toggleError) {
      showNotice(toggleError instanceof Error ? toggleError.message : "Status produk gagal disimpan.");
    } finally {
      setProductBusy(null);
    }
  };

  return (
    <div className="module-stack">
      <section className="module-stat-grid">
        <ModuleStat label="Produk aktif" value={`${activeCount} menu`} detail="Tampil di POS kasir" tone="module-stat-teal" />
        <ModuleStat label="Kategori" value="3 kategori" detail="Makanan, minuman, camilan" tone="module-stat-gold" />
        <ModuleStat label="Perlu harga pokok" value="4 menu" detail="Lengkapi untuk gross profit" tone="module-stat-sky" />
      </section>
      <section className="card module-card">
        <div className="module-toolbar"><label className="module-search"><UiIcon name="search" size={16} /><input aria-label="Cari produk" placeholder="Cari nama, SKU, atau kategori" value={query} onChange={(event) => setQuery(event.target.value)} /></label><input ref={importInputRef} className="sr-only" type="file" accept=".csv,text/csv" aria-label="File CSV produk" onChange={(event) => void importProducts(event)} /><button className="secondary-button" type="button" onClick={downloadProductTemplate}><UiIcon name="fileText" size={15} /> Contoh CSV</button><button className="secondary-button" type="button" onClick={() => importInputRef.current?.click()}><UiIcon name="packageOpen" size={15} /> Import CSV</button><button className="primary-button" type="button" onClick={() => { setEditingId(null); setDraftName(""); setDraftPrice(""); setShowComposer((current) => !current); }}><UiIcon name="plus" size={16} /> Produk baru</button></div>
        {showComposer && <form ref={composerRef} className="product-composer" onSubmit={saveProduct}><label>Nama produk<input className="module-input" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Contoh: Salad buah" /></label><label>Kategori<select className="module-input" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}><option>Makanan</option><option>Minuman</option><option>Camilan</option><option>Lainnya</option></select></label><label>Harga jual<input className="module-input" type="number" min="1" value={draftPrice} onChange={(event) => setDraftPrice(event.target.value)} placeholder="15000" /></label><div className="module-actions"><button className="secondary-button" type="button" onClick={() => { setEditingId(null); setShowComposer(false); }}>Batal</button><button className="primary-button" type="submit">{editingId !== null ? "Simpan perubahan" : "Simpan produk"}</button></div></form>}
        <div className="table-scroll">
          <table className="module-table product-table">
            <thead><tr><th>Produk</th><th>Kategori</th><th>Harga jual</th><th>Harga pokok</th><th>Stok</th><th>Status</th><th /></tr></thead>
            <tbody>{visibleRows.map((product) => <tr key={product.id}><td><div className="table-product"><span className={`product-thumb ${product.tone}`}><ProductIcon tone={product.tone} size={18} /></span><span><strong>{product.name}</strong><small>{product.sku} · {product.unit}</small></span></div></td><td>{product.category}</td><td><strong>{formatCurrency(product.price)}</strong></td><td>{product.cost ? formatCurrency(product.cost) : <span className="muted-warning">Belum diisi</span>}</td><td>{product.stock} {product.unit}</td><td><button type="button" className={product.active ? "toggle active" : "toggle"} onClick={() => void toggleProduct(product)} disabled={productBusy === String(product.id)} aria-label={`${product.active ? "Nonaktifkan" : "Aktifkan"} ${product.name}`}><span /></button></td><td><button className="row-action" type="button" onClick={() => startEditing(product)}>Edit</button></td></tr>)}</tbody>
          </table>
          {!visibleRows.length && <div className="module-empty">Produk tidak ditemukan.</div>}
        </div>
      </section>
      {notice && <ModuleNotice>{notice}</ModuleNotice>}
    </div>
  );
}

function InventoryModule({ outletId, refreshToken }: { outletId: string; refreshToken: number }) {
  const [rows, setRows] = useState<DemoInventoryItem[]>(demoInventoryRows);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [adjustmentBusy, setAdjustmentBusy] = useState<string | null>(null);
  const [stocktakeOpen, setStocktakeOpen] = useState(false);
  const [reorderDraftIds, setReorderDraftIds] = useState<string[]>([]);
  const lowStockCount = rows.filter((item) => item.qty <= item.min).length;
  const inventorySnapshotLabel = outletId === "demo" ? "Demo snapshot" : "Live snapshot";
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
  }, [outletId, refreshToken]);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const receiveStock = async (id: string) => {
    if (outletId !== "demo") {
      setAdjustmentBusy(id);
      try {
        const result = await adjustInventory(outletId, id, 10, "Restock cepat dari inventory workspace");
        if (result) setRows((current) => current.map((item) => item.id === id ? { ...item, qty: result.qtyOnHand, movement: "Adjustment live baru saja dicatat" } : item));
        showNotice("Adjustment stok live berhasil dicatat dan diaudit.");
      } catch (adjustmentError) {
        showNotice(adjustmentError instanceof Error ? adjustmentError.message : "Adjustment stok gagal.");
      } finally {
        setAdjustmentBusy(null);
      }
      return;
    }
    setRows((current) => current.map((item) => item.id === id ? { ...item, qty: item.qty + 10, movement: "Adjustment baru saja dicatat" } : item));
    showNotice("Adjustment stok +10 berhasil dicatat di demo mode.");
  };
  const createReorderDraft = () => {
    const lowStockIds = rows.filter((item) => item.qty <= item.min).map((item) => item.id);
    if (!lowStockIds.length) {
      showNotice("Semua stok masih aman. Belum ada draft yang perlu dibuat.");
      return;
    }
    setReorderDraftIds(lowStockIds);
    showNotice(`${lowStockIds.length} item dimasukkan ke draft pembelian.`);
  };

  return (
    <div className="module-stack">
      <section className="module-stat-grid"><ModuleStat label="Item aktif" value={`${rows.length} item`} detail="Dalam snapshot persediaan" tone="module-stat-teal" /><ModuleStat label="Stok menipis" value={`${lowStockCount} item`} detail="Di bawah minimum" tone="module-stat-gold" /><ModuleStat label="Status data" value={inventorySnapshotLabel} detail="Sinkronisasi outlet" tone="module-stat-sky" /></section>
      <section className={stocktakeOpen ? "card module-card is-stocktake-open" : "card module-card"}><div className="module-toolbar"><div><span className="section-kicker">Kontrol persediaan</span><h2>Stok outlet utama</h2></div><div className="toolbar-spacer" /><select className="module-select" aria-label="Filter persediaan" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua item</option><option value="low">Stok menipis</option></select><button className="primary-button" type="button" onClick={() => { setStocktakeOpen((current) => !current); showNotice(stocktakeOpen ? "Opname ditutup. Perubahan stok tersimpan dari tombol adjustment." : "Mode opname aktif. Periksa item lalu gunakan adjustment untuk mengoreksi stok."); }}>{stocktakeOpen ? "Selesai opname" : "Mulai opname"}</button></div>{stocktakeOpen && <div className="module-notice stocktake-hint" role="status"><span><UiIcon name="info" size={12} /></span>Mode opname aktif — angka pada tabel adalah snapshot terkini dan setiap adjustment langsung dicatat.</div>}<div className="table-scroll"><table className="module-table inventory-table"><thead><tr><th>Item persediaan</th><th>Stok tersedia</th><th>Minimum</th><th>Supplier</th><th>Movement terakhir</th><th /></tr></thead><tbody>{visibleRows.map((item) => { const isLow = item.qty <= item.min; return <tr key={item.id}><td><div className="table-product"><span className={`inventory-icon ${isLow ? "low" : ""}`}><UiIcon name="boxes" size={17} /></span><span><strong>{item.name}</strong><small>{item.sku} · per {item.unit}</small></span></div></td><td><span className={isLow ? "stock-level low" : "stock-level"}>{item.qty} {item.unit}</span></td><td>{item.min} {item.unit}</td><td>{item.supplier}</td><td>{item.movement}</td><td><button className="row-action" type="button" onClick={() => receiveStock(item.id)} disabled={adjustmentBusy === item.id}>{adjustmentBusy === item.id ? "Menyimpan..." : "+10 stok"}</button></td></tr>; })}</tbody></table>{!visibleRows.length && <div className="module-empty">Tidak ada item pada filter ini.</div>}</div></section>
      <section className="module-grid-two"><article className="card module-card"><span className="section-kicker">Alur stok</span><h2>Movement terbaru</h2><div className="timeline-list"><div><span className="timeline-dot teal-dot" /><span><strong>Masuk · Beras premium</strong><small>+24 kg · CV Pangan Jaya · 2 jam lalu</small></span></div><div><span className="timeline-dot gold-dot" /><span><strong>Keluar · Telur ayam</strong><small>-12 butir · Nasi Goreng Spesial</small></span></div><div><span className="timeline-dot gray-dot" /><span><strong>Adjustment · Teh celup</strong><small>Opname · Ayu Nuraini · kemarin</small></span></div></div></article><article className="card module-card reorder-card"><span className="section-kicker">Rekomendasi</span><h2>Siap reorder</h2><strong className="reorder-number">{lowStockCount} item</strong><p>Gabungkan item stok menipis ke pembelian baru agar biaya supplier lebih mudah dilacak.</p><button className="secondary-button" type="button" onClick={createReorderDraft}>Buat draft pembelian <UiIcon name="arrowRight" size={15} /></button>{reorderDraftIds.length > 0 && <div className="reorder-draft" role="status"><div><span>Draft pembelian tersimpan</span><strong>{reorderDraftIds.length} item siap ditinjau</strong><small>{rows.filter((item) => reorderDraftIds.includes(item.id)).map((item) => item.name).join(" · ")}</small></div><button type="button" onClick={() => { setReorderDraftIds([]); showNotice("Draft pembelian dihapus."); }}>Hapus</button></div>}</article></section>
      {notice && <ModuleNotice>{notice}</ModuleNotice>}
    </div>
  );
}

function PurchasingModule({ outletId, refreshToken }: { outletId: string; refreshToken: number }) {
  const [rows, setRows] = useState<DemoPurchase[]>(demoPurchases);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useEffect(() => {
    if (outletId === "demo") return;
    let cancelled = false;
    getPurchaseOrders(outletId).then((liveRows) => {
      if (!cancelled && liveRows !== null) setRows(liveRows);
    }).catch(() => {
      // Keep the last confirmed purchase-order snapshot while reconnecting.
    });
    return () => { cancelled = true; };
  }, [outletId, refreshToken]);
  const visibleRows = rows.filter((purchase) => filter === "all" || purchase.status === filter);
  const openPurchaseCount = rows.filter((purchase) => purchase.status === "Menunggu" || purchase.status === "Draft").length;
  const purchaseTotal = rows.reduce((sum, purchase) => sum + purchase.total, 0);
  const supplierCount = new Set(rows.map((purchase) => purchase.supplier)).size;
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const createDraft = () => {
    if (outletId !== "demo") {
      showNotice("Pembuatan purchase order live belum tersedia. Data tidak diubah.");
      return;
    }
    const draft: DemoPurchase = { id: `PO-2026-${String(rows.length + 18).padStart(3, "0")}`, supplier: "Supplier baru", date: "09 Agu 2026", items: 0, total: 0, status: "Draft" };
    setRows((current) => [draft, ...current]);
    showNotice(`${draft.id} dibuat sebagai draft pembelian.`);
  };

  return (
    <div className="module-stack"><section className="module-stat-grid"><ModuleStat label="Open purchase order" value={`${openPurchaseCount} PO`} detail="Menunggu penerimaan" tone="module-stat-gold" /><ModuleStat label="Belanja tercatat" value={formatCurrency(purchaseTotal)} detail="Dari purchase order di snapshot" tone="module-stat-teal" /><ModuleStat label="Supplier aktif" value={`${supplierCount} supplier`} detail="Dengan histori penerimaan" tone="module-stat-sky" /></section><section className="card module-card"><div className="module-toolbar"><div><span className="section-kicker">Procurement</span><h2>Purchase order</h2></div><div className="toolbar-spacer" /><select className="module-select" aria-label="Filter status purchase order" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">Semua status</option><option value="Menunggu">Menunggu</option><option value="Diterima">Diterima</option><option value="Draft">Draft</option></select><button className="primary-button" type="button" onClick={createDraft}><UiIcon name="plus" size={16} /> Pembelian baru</button></div><div className="purchase-list">{visibleRows.map((purchase) => { const expanded = expandedId === purchase.id; return <article className={expanded ? "purchase-card is-expanded" : "purchase-card"} key={purchase.id}><div className="purchase-card-top"><span className="purchase-icon"><UiIcon name="clipboard" size={17} /></span><span><strong>{purchase.id}</strong><small>{purchase.date} · {purchase.items || "Belum ada"} item</small></span><span className={`status-pill ${purchase.status === "Diterima" ? "paid" : purchase.status === "Menunggu" ? "review" : "draft"}`}>{purchase.status}</span></div><div className="purchase-card-bottom"><span><small>Supplier</small><strong>{purchase.supplier}</strong></span><span><small>Total estimasi</small><strong>{purchase.total ? formatCurrency(purchase.total) : "Belum diisi"}</strong></span><button className="row-action" type="button" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : purchase.id)}>{expanded ? "Tutup detail ↑" : "Buka detail →"}</button></div>{expanded && <div className="purchase-detail"><span><small>Status penerimaan</small><strong>{purchase.status === "Diterima" ? "Semua item sudah diterima" : purchase.status === "Draft" ? "Lengkapi supplier dan item" : "Menunggu penerimaan stok"}</strong></span><span><small>Jumlah item</small><strong>{purchase.items || "Belum diisi"} item</strong></span></div>}</article>; })}</div></section>{notice && <ModuleNotice>{notice}</ModuleNotice>}</div>
  );
}

type CashMovement = { id: string; type: "cash_in" | "cash_out"; amount: number; category: string; reason: string; time: string };

function CashModule({ outletId, shiftId, refreshToken }: { outletId: string; shiftId: string; refreshToken: number }) {
  const [shiftOpen, setShiftOpen] = useState(true);
  const [movements, setMovements] = useState<CashMovement[]>([
    { id: "cash-1", type: "cash_in", amount: 300000, category: "Kas awal", reason: "Opening shift", time: "09:42" },
    { id: "cash-2", type: "cash_out", amount: 45000, category: "Operasional", reason: "Beli es batu", time: "11:15" },
  ]);
  const [notice, setNotice] = useState("");
  const [openingCash, setOpeningCash] = useState(0);
  const [cashSales, setCashSales] = useState(318000);
  const [shiftLabel, setShiftLabel] = useState("#SH-0816 · Ayu Nuraini");
  const [shiftOpenedAt, setShiftOpenedAt] = useState("09 Agu 2026, 09:42");
  const [recordedExpectedCash, setRecordedExpectedCash] = useState<number | null>(null);
  const [variance, setVariance] = useState(0);
  const [movementBusy, setMovementBusy] = useState(false);
  useEffect(() => {
    if (outletId === "demo") return;
    let cancelled = false;
    getCashWorkspace(outletId, shiftId).then((snapshot) => {
      if (cancelled || !snapshot) return;
      setMovements(snapshot.movements);
      setCashSales(snapshot.cashSales);
      if (!snapshot.shift) {
        setShiftOpen(false);
        setOpeningCash(0);
        setRecordedExpectedCash(0);
        setShiftLabel("Belum ada shift aktif");
        return;
      }
      setShiftOpen(snapshot.shift.status === "open");
      setOpeningCash(snapshot.shift.openingCash);
      setRecordedExpectedCash(snapshot.shift.expectedCash);
      setVariance(snapshot.shift.variance);
      setShiftLabel(`#${snapshot.shift.id.slice(0, 8).toUpperCase()} · ${snapshot.shift.cashier}`);
      setShiftOpenedAt(new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(snapshot.shift.openedAt)));
    }).catch(() => {
      // Keep the last confirmed shift snapshot while reconnecting.
    });
    return () => { cancelled = true; };
  }, [outletId, refreshToken, shiftId]);
  const cashIn = movements.filter((movement) => movement.type === "cash_in").reduce((sum, movement) => sum + movement.amount, 0);
  const cashOut = movements.filter((movement) => movement.type === "cash_out").reduce((sum, movement) => sum + movement.amount, 0);
  const expectedCash = recordedExpectedCash ?? openingCash + cashIn - cashOut + cashSales;
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const addMovement = async (type: CashMovement["type"]) => {
    if (!shiftOpen) {
      showNotice("Buka shift terlebih dahulu untuk mencatat mutasi kas.");
      return;
    }
    const amount = type === "cash_in" ? 50000 : 25000;
    const category = type === "cash_in" ? "Kas masuk" : "Operasional";
    const reason = type === "cash_in" ? "Setoran tambahan" : "Pengeluaran kecil";
    if (outletId !== "demo") {
      setMovementBusy(true);
      try {
        const movement = await addCashMovement(shiftId, type, amount, category, reason);
        if (movement) setMovements((current) => [movement, ...current]);
        showNotice(`${type === "cash_in" ? "Kas masuk" : "Kas keluar"} live berhasil dicatat dan diaudit.`);
      } catch (movementError) {
        showNotice(movementError instanceof Error ? movementError.message : "Mutasi kas gagal dicatat.");
      } finally {
        setMovementBusy(false);
      }
      return;
    }
    const movement: CashMovement = { id: `cash-${Date.now()}`, type, amount, category, reason: `${reason} demo`, time: "14:40" };
    setMovements((current) => [...current, movement]);
    showNotice(`${type === "cash_in" ? "Kas masuk" : "Kas keluar"} dicatat di demo mode.`);
  };

  return (
    <div className="module-stack"><section className="module-stat-grid"><ModuleStat label="Status shift" value={shiftOpen ? "OPEN" : "CLOSED"} detail={`${shiftLabel} · Outlet Utama`} tone={shiftOpen ? "module-stat-teal" : "module-stat-sky"} /><ModuleStat label="Expected cash" value={formatCurrency(expectedCash)} detail="Termasuk penjualan tunai" tone="module-stat-gold" /><ModuleStat label="Selisih terakhir" value={formatCurrency(variance)} detail={variance === 0 ? "Rekonsiliasi sesuai" : "Perlu review manager"} tone="module-stat-sky" /></section><section className="cash-layout"><article className="card module-card shift-summary"><div className="card-heading"><div><span className="section-kicker">Shift aktif</span><h2>{shiftLabel}</h2></div><span className={shiftOpen ? "live-shift" : "status-pill review"}>{shiftOpen ? "● OPEN" : "CLOSED"}</span></div><div className="shift-summary-grid"><div><span>Dibuka</span><strong>{shiftOpenedAt}</strong></div><div><span>Kas awal</span><strong>{formatCurrency(outletId === "demo" ? cashIn : openingCash)}</strong></div><div><span>Penjualan tunai</span><strong>{formatCurrency(cashSales)}</strong></div><div><span>Expected cash</span><strong className="teal-value">{formatCurrency(expectedCash)}</strong></div></div><div className="module-actions"><button className="secondary-button" type="button" onClick={() => void addMovement("cash_in")} disabled={movementBusy || !shiftOpen}>+ Kas masuk</button><button className="secondary-button" type="button" onClick={() => void addMovement("cash_out")} disabled={movementBusy || !shiftOpen}>- Kas keluar</button><button className="primary-button" type="button" onClick={() => { if (outletId !== "demo") { showNotice("Penutupan shift live belum tersedia. Data tidak diubah."); return; } setShiftOpen(false); showNotice("Shift ditutup di demo mode. Selisih kas perlu diisi pada langkah berikutnya."); }} disabled={!shiftOpen}>Tutup shift <span>→</span></button></div></article><article className="card module-card"><span className="section-kicker">Cash movement</span><h2>Mutasi kas hari ini</h2><div className="movement-list">{movements.map((movement) => <div className="movement-row" key={movement.id}><span className={movement.type === "cash_in" ? "movement-icon in" : "movement-icon out"}>{movement.type === "cash_in" ? "+" : "-"}</span><span><strong>{movement.category}</strong><small>{movement.reason} · {movement.time}</small></span><strong className={movement.type === "cash_in" ? "cash-in" : "cash-out"}>{movement.type === "cash_in" ? "+" : "-"}{formatCurrency(movement.amount)}</strong></div>)}</div></article></section>{notice && <ModuleNotice>{notice}</ModuleNotice>}</div>
  );
}

function ReportsModule({ outletId, refreshToken }: { outletId: string; refreshToken: number }) {
  const [range, setRange] = useState<"7" | "30" | "90">("7");
  const [notice, setNotice] = useState("");
  const [salesMix, setSalesMix] = useState(demoSalesMix);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    if (outletId === "demo") return;
    let cancelled = false;
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - Number(range));
    Promise.all([
      getSalesMix(outletId, from.toISOString(), to.toISOString()),
      getDashboardSummary(outletId, from.toISOString(), to.toISOString()),
    ]).then(([liveMix, liveSummary]) => {
      if (cancelled) return;
      setSalesMix(liveMix ?? []);
      setSummary(liveSummary);
    }).catch(() => {
      // Preserve the last confirmed snapshot while Realtime reconnects.
    });
    return () => { cancelled = true; };
  }, [outletId, range, refreshToken]);

  const total = summary?.totalSales ?? salesMix.reduce((sum, item) => sum + item.amount, 0);
  const mix = salesMix.map((item) => ({ ...item, value: total ? Math.round((item.amount / total) * 100) : 0 }));
  const gradient = useMemo(() => {
    const stops = mix.map((item, index) => {
      const start = mix.slice(0, index).reduce((sum, previous) => sum + previous.value, 0);
      return `${item.color} ${start}% ${start + item.value}%`;
    });
    return stops.length ? `conic-gradient(${stops.join(", ")})` : "var(--ui-surface-strong)";
  }, [mix]);
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };
  const exportReport = () => {
    downloadCsv(
      `laporan-kantinkita-${range}hari-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Jenis", "Label", "Nilai", "Catatan"],
      [
        ["Ringkasan", "Omzet periode", total, periodLabel],
        ["Ringkasan", "Gross profit est.", summary?.grossProfitEstimate ?? 1_760_000, "Estimasi berdasarkan harga pokok"],
        ...mix.map((item) => ["Rasio penjualan", item.label, item.amount, `${item.value}% dari omzet`]),
        ...dailySales.map((item) => ["Penjualan harian", formatReportDay(item.day, true), item.amount, periodLabel]),
      ],
    );
    showNotice("Laporan berhasil diekspor ke CSV.");
  };
  const periodLabel = range === "7" ? "7 hari terakhir" : range === "30" ? "30 hari terakhir" : "90 hari terakhir";
  const demoTrend = [{ day: "Sen", amount: 2_700_000 }, { day: "Sel", amount: 3_200_000 }, { day: "Rab", amount: 2_350_000 }, { day: "Kam", amount: 3_600_000 }, { day: "Jum", amount: 4_100_000 }, { day: "Sab", amount: 3_350_000 }, { day: "Min", amount: 4_860_000 }];
  const dailySales = summary?.dailySales?.length ? summary.dailySales : outletId === "demo" ? demoTrend : [];
  const maxDailySales = Math.max(...dailySales.map((item) => item.amount), 1);
  const bestDay = dailySales.reduce<(typeof dailySales)[number] | null>((best, item) => !best || item.amount > best.amount ? item : best, null);
  const leadingMix = mix.reduce<(typeof mix)[number] | null>((leader, item) => !leader || item.value > leader.value ? item : leader, null);

  return (
    <div className="module-stack">
      <section className="module-stat-grid">
        <ModuleStat label="Omzet periode" value={formatCurrency(total)} detail={periodLabel} tone="module-stat-teal" />
        <ModuleStat label="Gross profit est." value={formatCurrency(summary?.grossProfitEstimate ?? 1_760_000)} detail="Estimasi berdasarkan harga pokok" tone="module-stat-gold" />
        <ModuleStat label="Rasio penjualan" value={`${mix.length} kategori`} detail={leadingMix ? `${leadingMix.label} memimpin ${leadingMix.value}%` : "Belum ada penjualan"} tone="module-stat-sky" />
      </section>
      <section className="report-layout">
        <article className="card module-card report-mix-card">
          <div className="card-heading"><div><span className="section-kicker">Mix pendapatan</span><h2>Rasio penjualan per kategori</h2></div><div className="range-switcher">{(["7", "30", "90"] as const).map((item) => <button key={item} className={range === item ? "active" : ""} type="button" onClick={() => setRange(item)}>{item}H</button>)}</div></div>
          <div className="report-mix-content"><div className="report-donut-large" style={{ background: gradient }}><div><strong>{mix.length ? "100%" : "0%"}</strong><span>total mix</span></div></div><div className="report-mix-list">{mix.map((item) => <div className="report-mix-row" key={item.label}><div><span><i className="legend-dot" style={{ background: item.color }} />{item.label}</span><strong>{item.value}%</strong></div><div className="ratio-track"><div className="ratio-fill" style={{ width: `${item.value}%`, background: item.color }} /></div><small>{formatCurrency(item.amount)} · kontribusi periode</small></div>)}</div></div>
          <div className="ratio-note"><span className="mini-spark">↑</span><span>{leadingMix ? <><strong>{leadingMix.label} memimpin</strong> dengan kontribusi {leadingMix.value}% dari omzet {periodLabel}.</> : "Belum ada transaksi pada periode ini."}</span></div>
        </article>
        <article className="card module-card report-bars-card">
          <div className="card-heading"><div><span className="section-kicker">Tren omzet</span><h2>Penjualan harian</h2></div><button className="link-button" type="button" onClick={exportReport}>Export laporan →</button></div>
          {dailySales.length ? <div className="report-bars">{dailySales.map((item) => <div className="report-bar-column" key={item.day}><span className="report-bar-track"><i style={{ height: `${Math.max((item.amount / maxDailySales) * 100, item.amount > 0 ? 6 : 0)}%` }} /></span><small title={item.day}>{formatReportDay(item.day)}</small></div>)}</div> : <div className="module-empty">Belum ada data omzet harian pada periode ini.</div>}
          <div className="report-highlight"><span>Hari terbaik</span><strong>{bestDay ? `${formatReportDay(bestDay.day, true)} · ${formatCurrency(bestDay.amount)}` : "Belum ada data"}</strong><small>{outletId === "demo" ? "Naik 18,6% dari periode sebelumnya" : periodLabel}</small></div>
        </article>
      </section>
      {notice && <ModuleNotice>{notice}</ModuleNotice>}
    </div>
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
  const exportAudit = () => {
    downloadCsv(
      `audit-kantinkita-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Waktu", "Aktor", "Aktivitas", "Detail"],
      demoAuditLogs.map((log) => [log.time, log.actor, log.action, log.detail]),
    );
    showNotice("Audit log berhasil diekspor ke CSV.");
  };

  return (
    <div className="module-stack"><section className="module-stat-grid"><ModuleStat label="Pengguna aktif" value={`${users.filter((user) => user.status === "Aktif").length} akun`} detail="Di seluruh outlet" tone="module-stat-teal" /><ModuleStat label="Menunggu approval" value={`${users.filter((user) => user.status === "Menunggu").length} akun`} detail="Perlu review manager" tone="module-stat-gold" /><ModuleStat label="Audit hari ini" value="18 aktivitas" detail="Aksi sensitif terlacak" tone="module-stat-sky" /></section><section className="admin-layout"><article className="card module-card"><div className="module-toolbar"><div><span className="section-kicker">Role & akses</span><h2>Pengguna workspace</h2></div><div className="toolbar-spacer" /><button className="primary-button" type="button" onClick={inviteUser}>+ Undang pengguna</button></div><div className="user-list">{users.map((user) => <div className="user-row" key={user.id}><span className="user-avatar">{user.initials}</span><span className="user-info"><strong>{user.name}</strong><small>{user.email}</small></span><span className="role-pill">{user.role}</span><span className={user.status === "Aktif" ? "status-pill paid" : user.status === "Menunggu" ? "status-pill review" : "status-pill voided"}>{user.status}</span><button className="row-action" type="button" onClick={() => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: item.status === "Aktif" ? "Nonaktif" : "Aktif" } : item))}>{user.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}</button></div>)}</div></article><article className="card module-card"><span className="section-kicker">Audit log</span><h2>Aktivitas kritis terbaru</h2><div className="audit-list">{demoAuditLogs.map((log) => <div className="audit-row" key={`${log.time}-${log.actor}`}><span className="audit-time">{log.time}</span><span><strong>{log.action}</strong><small>{log.actor} · {log.detail}</small></span></div>)}</div><button className="secondary-button" type="button" onClick={exportAudit}>Export audit CSV <UiIcon name="arrowDown" size={14} /></button></article></section><section className="card module-card permission-card"><span className="section-kicker">Kontrol sistem</span><h2>Role bawaan CanteenOS</h2><div className="permission-grid"><div><strong>Manager</strong><span>Kelola master data, approval refund, laporan, dan outlet.</span></div><div><strong>Kasir</strong><span>Jalankan shift dan transaksi POS tanpa akses konfigurasi.</span></div><div><strong>Stok</strong><span>Kelola inventory, opname, purchase order, dan receiving.</span></div><div><strong>Finance / Viewer</strong><span>Akses laporan sesuai scope tanpa menulis transaksi kasir.</span></div></div></section>{notice && <ModuleNotice>{notice}</ModuleNotice>}</div>
  );
}

export function OperationsModule({ activeNav, outletId = "demo", shiftId = "demo", refreshToken = 0 }: { activeNav: ModuleKey; outletId?: string; shiftId?: string; refreshToken?: number }) {
  switch (activeNav) {
    case "transactions": return <TransactionsModule outletId={outletId} refreshToken={refreshToken} />;
    case "products": return <ProductsModule outletId={outletId} refreshToken={refreshToken} />;
    case "inventory": return <InventoryModule outletId={outletId} refreshToken={refreshToken} />;
    case "purchasing": return <PurchasingModule outletId={outletId} refreshToken={refreshToken} />;
    case "cash": return <CashModule outletId={outletId} shiftId={shiftId} refreshToken={refreshToken} />;
    case "reports": return <ReportsModule outletId={outletId} refreshToken={refreshToken} />;
    case "admin": return <AdminModule />;
    default: return <div className="module-empty">Modul belum tersedia.</div>;
  }
}
