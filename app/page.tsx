"use client";

import { useMemo, useState } from "react";

import { finalizeSale } from "../lib/pos";

type NavKey =
  | "dashboard"
  | "pos"
  | "transactions"
  | "products"
  | "inventory"
  | "purchasing"
  | "cash"
  | "reports"
  | "admin";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  emoji: string;
  tone: string;
};

type CartItem = Product & { quantity: number };

const navItems: { id: NavKey; label: string; icon: string; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⌂" },
  { id: "pos", label: "POS Kasir", icon: "▦", badge: "Shift aktif" },
  { id: "transactions", label: "Transaksi", icon: "↗" },
  { id: "products", label: "Produk & Menu", icon: "◇" },
  { id: "inventory", label: "Inventori", icon: "▤", badge: "7" },
  { id: "purchasing", label: "Pembelian", icon: "□" },
  { id: "cash", label: "Shift & Kas", icon: "◒" },
  { id: "reports", label: "Laporan", icon: "◩" },
  { id: "admin", label: "Administrasi", icon: "⚙" },
];

const products: Product[] = [
  { id: 1, name: "Nasi Goreng Spesial", category: "Makanan", price: 15000, stock: 18, emoji: "🍳", tone: "peach" },
  { id: 2, name: "Es Teh Manis", category: "Minuman", price: 5000, stock: 42, emoji: "🧋", tone: "mint" },
  { id: 3, name: "Roti Bakar Coklat", category: "Camilan", price: 10000, stock: 12, emoji: "🍞", tone: "gold" },
  { id: 4, name: "Air Mineral 600ml", category: "Minuman", price: 4000, stock: 7, emoji: "💧", tone: "blue" },
  { id: 5, name: "Mie Goreng Telur", category: "Makanan", price: 13000, stock: 21, emoji: "🍜", tone: "peach" },
  { id: 6, name: "Pisang Keju", category: "Camilan", price: 9000, stock: 14, emoji: "🍌", tone: "gold" },
  { id: 7, name: "Susu Coklat", category: "Minuman", price: 8000, stock: 16, emoji: "🥛", tone: "rose" },
  { id: 8, name: "Chicken Pop", category: "Makanan", price: 12000, stock: 10, emoji: "🍗", tone: "peach" },
];

const ratioData = [
  { label: "Makanan", value: 42, amount: "Rp 2,04 jt", color: "#0f6675" },
  { label: "Minuman", value: 31, amount: "Rp 1,51 jt", color: "#f1b653" },
  { label: "Camilan", value: 17, amount: "Rp 826 rb", color: "#e58c6d" },
  { label: "Lainnya", value: 10, amount: "Rp 486 rb", color: "#777d9a" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const pageMeta: Record<NavKey, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: "Ringkasan operasional",
    title: "Selamat sore, Ayu",
    description: "Pantau performa kantin dan temukan hal yang perlu ditindaklanjuti hari ini.",
  },
  pos: {
    eyebrow: "Penjualan langsung",
    title: "Kasir POS",
    description: "Layani antrean dengan alur cepat, total yang selalu terlihat, dan stok yang terjaga.",
  },
  transactions: {
    eyebrow: "Riwayat penjualan",
    title: "Transaksi",
    description: "Telusuri penjualan, cetak ulang struk, dan proses refund dengan jejak yang jelas.",
  },
  products: {
    eyebrow: "Master data",
    title: "Produk & Menu",
    description: "Kelola menu, harga, kategori, ketersediaan, dan item favorit kasir.",
  },
  inventory: {
    eyebrow: "Kontrol persediaan",
    title: "Inventori",
    description: "Pantau stok minimum, pergerakan barang, opname, dan item yang perlu diisi ulang.",
  },
  purchasing: {
    eyebrow: "Supplier & receiving",
    title: "Pembelian",
    description: "Catat pesanan supplier, penerimaan aktual, biaya, dan lampiran invoice.",
  },
  cash: {
    eyebrow: "Rekonsiliasi kas",
    title: "Shift & Kas",
    description: "Lihat shift berjalan, cash movement, expected cash, dan selisih kas.",
  },
  reports: {
    eyebrow: "Analitik bisnis",
    title: "Laporan",
    description: "Bandingkan penjualan, stok, pembelian, pengeluaran, dan rasio performa.",
  },
  admin: {
    eyebrow: "Kontrol akses",
    title: "Administrasi",
    description: "Atur pengguna, outlet, role, branding struk, dan audit log aktivitas kritis.",
  },
};

function StatCard({
  label,
  value,
  change,
  icon,
  tone,
  detail,
}: {
  label: string;
  value: string;
  change: string;
  icon: string;
  tone: string;
  detail: string;
}) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-topline">
        <span>{label}</span>
        <span className="stat-icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        <span className="trend">↗ {change}</span>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function Dashboard({ onNavigate }: { onNavigate: (key: NavKey) => void }) {
  return (
    <div className="page-stack">
      <section className="stats-grid" aria-label="Ringkasan KPI">
        <StatCard label="Omzet hari ini" value="Rp 4,86 jt" change="14,8%" detail="vs kemarin" icon="↗" tone="stat-teal" />
        <StatCard label="Transaksi" value="186" change="8,2%" detail="order selesai" icon="▦" tone="stat-gold" />
        <StatCard label="Rata-rata order" value="Rp 26,1 rb" change="5,4%" detail="per transaksi" icon="◎" tone="stat-sky" />
        <StatCard label="Gross profit est." value="Rp 1,76 jt" change="12,1%" detail="margin 36,2%" icon="◒" tone="stat-navy" />
      </section>

      <section className="dashboard-grid main-insights">
        <article className="card sales-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Performa penjualan</span>
              <h2>Penjualan minggu ini</h2>
            </div>
            <button className="soft-select" type="button">7 hari terakhir <span>⌄</span></button>
          </div>
          <div className="sales-summary-row">
            <div>
              <strong>Rp 24.860.000</strong>
              <span className="positive-copy">↗ 18,6%</span>
            </div>
            <span className="muted-copy">dibanding periode sebelumnya</span>
          </div>
          <div className="chart-wrap">
            <div className="chart-y-labels" aria-hidden="true"><span>5 jt</span><span>3 jt</span><span>1 jt</span><span>0</span></div>
            <div className="bar-chart" aria-label="Grafik omzet penjualan selama tujuh hari">
              {[{ day: "Sen", value: 58 }, { day: "Sel", value: 66 }, { day: "Rab", value: 48 }, { day: "Kam", value: 75 }, { day: "Jum", value: 86 }, { day: "Sab", value: 70 }, { day: "Min", value: 92 }].map((item, index) => (
                <div className="bar-column" key={item.day}>
                  <span className="bar-tooltip">{index === 6 ? "Rp 4,86 jt" : `${Math.round(item.value / 20)} jt`}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ height: `${item.value}%` }} /></div>
                  <span>{item.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-legend"><span><i className="legend-dot teal-dot" />Omzet</span><span><i className="legend-dot gold-dot" />Target harian</span></div>
        </article>

        <article className="card ratio-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Mix pendapatan</span>
              <h2>Rasio penjualan</h2>
            </div>
            <button className="link-button" type="button" onClick={() => onNavigate("reports")}>Lihat laporan →</button>
          </div>
          <div className="ratio-content">
            <div className="ratio-donut" aria-label="Total rasio penjualan 100 persen">
              <div><strong>100%</strong><span>total mix</span></div>
            </div>
            <div className="ratio-list">
              {ratioData.map((item) => (
                <div className="ratio-row" key={item.label}>
                  <div className="ratio-row-top"><span><i className="legend-dot" style={{ background: item.color }} />{item.label}</span><strong>{item.value}%</strong></div>
                  <div className="ratio-track"><div className="ratio-fill" style={{ width: `${item.value}%`, background: item.color }} /></div>
                  <span className="ratio-amount">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ratio-note"><span className="mini-spark">↗</span><span><strong>Makanan memimpin</strong> dengan kontribusi 42% dari omzet minggu ini.</span></div>
        </article>
      </section>

      <section className="dashboard-grid lower-insights">
        <article className="card alert-card">
          <div className="card-heading">
            <div><span className="section-kicker">Perlu perhatian</span><h2>Alert operasional</h2></div>
            <span className="alert-count">4 item</span>
          </div>
          <div className="alert-list">
            <button className="alert-row warning" type="button" onClick={() => onNavigate("inventory")}>
              <span className="alert-symbol">!</span><span><strong>7 item stok menipis</strong><small>Air mineral dan beberapa bahan perlu diisi ulang.</small></span><span className="arrow">→</span>
            </button>
            <button className="alert-row neutral" type="button" onClick={() => onNavigate("cash")}>
              <span className="alert-symbol">◒</span><span><strong>Shift kasir masih aktif</strong><small>Shift Ayu · Outlet Utama · sejak 09:42.</small></span><span className="arrow">→</span>
            </button>
            <button className="alert-row danger" type="button" onClick={() => onNavigate("transactions")}>
              <span className="alert-symbol">↩</span><span><strong>2 refund menunggu review</strong><small>Total Rp 38.000 membutuhkan persetujuan manager.</small></span><span className="arrow">→</span>
            </button>
          </div>
        </article>

        <article className="card top-product-card">
          <div className="card-heading">
            <div><span className="section-kicker">Produk terlaris</span><h2>Top products</h2></div>
            <button className="link-button" type="button" onClick={() => onNavigate("products")}>Kelola menu →</button>
          </div>
          <div className="product-ranking">
            {[{ rank: "01", name: "Es Teh Manis", meta: "142 terjual", value: "Rp 710 rb", tone: "mint" }, { rank: "02", name: "Nasi Goreng Spesial", meta: "86 terjual", value: "Rp 1,29 jt", tone: "peach" }, { rank: "03", name: "Roti Bakar Coklat", meta: "61 terjual", value: "Rp 610 rb", tone: "gold" }].map((item) => (
              <div className="ranking-row" key={item.rank}>
                <span className="rank-number">{item.rank}</span><span className={`product-thumb ${item.tone}`}>{item.name === "Es Teh Manis" ? "🧋" : item.name === "Nasi Goreng Spesial" ? "🍳" : "🍞"}</span><span className="ranking-name"><strong>{item.name}</strong><small>{item.meta}</small></span><strong className="ranking-value">{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card recent-card">
        <div className="card-heading">
          <div><span className="section-kicker">Aktivitas terbaru</span><h2>Transaksi terakhir</h2></div>
          <button className="link-button" type="button" onClick={() => onNavigate("transactions")}>Lihat semua →</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Transaksi</th><th>Kasir</th><th>Item</th><th>Pembayaran</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td><strong>#INV-240816</strong><small>Hari ini, 14:32</small></td><td>Ayu Nuraini</td><td>4 item</td><td>QRIS</td><td><strong>Rp 56.000</strong></td><td><span className="status-pill paid">Selesai</span></td></tr>
              <tr><td><strong>#INV-240815</strong><small>Hari ini, 14:29</small></td><td>Dimas Pratama</td><td>2 item</td><td>Tunai</td><td><strong>Rp 19.000</strong></td><td><span className="status-pill paid">Selesai</span></td></tr>
              <tr><td><strong>#INV-240814</strong><small>Hari ini, 14:24</small></td><td>Ayu Nuraini</td><td>6 item</td><td>Tunai</td><td><strong>Rp 82.000</strong></td><td><span className="status-pill review">Review refund</span></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function POS({
  cart,
  search,
  setSearch,
  addToCart,
  updateQty,
  cartTotal,
  paymentOpen,
  setPaymentOpen,
  paymentMethod,
  setPaymentMethod,
  onPayment,
  notice,
}: {
  cart: CartItem[];
  search: string;
  setSearch: (value: string) => void;
  addToCart: (product: Product) => void;
  updateQty: (id: number, delta: number) => void;
  cartTotal: number;
  paymentOpen: boolean;
  setPaymentOpen: (value: boolean) => void;
  paymentMethod: string;
  setPaymentMethod: (value: string) => void;
  onPayment: () => void | Promise<void>;
  notice: string;
}) {
  const [category, setCategory] = useState("Semua");
  const filteredProducts = useMemo(() => products.filter((product) => (category === "Semua" || product.category === category) && product.name.toLowerCase().includes(search.toLowerCase())), [category, search]);

  return (
    <div className="pos-layout">
      <section className="pos-catalog">
        <div className="pos-toolbar">
          <label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Cari produk" placeholder="Cari nama, SKU, atau barcode" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label>
          <button className="square-action" type="button" aria-label="Scan barcode">▦</button>
        </div>
        <div className="category-row" role="tablist" aria-label="Kategori produk">
          {["Semua", "Makanan", "Minuman", "Camilan"].map((item) => <button className={category === item ? "category-pill active" : "category-pill"} key={item} type="button" onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        <div className="catalog-heading"><div><span className="section-kicker">Menu aktif</span><h2>Pilih produk</h2></div><span className="muted-copy">{filteredProducts.length} produk tersedia</span></div>
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <button className="catalog-product" type="button" key={product.id} onClick={() => addToCart(product)}>
              <span className={`catalog-emoji ${product.tone}`}>{product.emoji}</span><span className="catalog-name">{product.name}</span><span className="catalog-bottom"><strong>{formatCurrency(product.price)}</strong><small>{product.stock} stok</small></span>
            </button>
          ))}
        </div>
        {notice && <div className="toast-message" role="status">✓ {notice}</div>}
      </section>

      <aside className="cart-panel">
        <div className="cart-head"><div><span className="section-kicker">Order aktif</span><h2>Keranjang</h2></div><button className="clear-button" type="button" onClick={() => cart.forEach((item) => updateQty(item.id, -item.quantity))}>Kosongkan</button></div>
        <div className="shift-badge"><span className="live-dot" />Shift #SH-0816 · Outlet Utama<span className="shift-status">OPEN</span></div>
        <div className="cart-items">
          {cart.length === 0 ? <div className="empty-cart"><span>🛍️</span><strong>Keranjang masih kosong</strong><small>Pilih produk di sebelah kiri untuk mulai transaksi.</small></div> : cart.map((item) => <div className="cart-item" key={item.id}><span className={`cart-thumb ${item.tone}`}>{item.emoji}</span><span className="cart-item-info"><strong>{item.name}</strong><small>{formatCurrency(item.price)} / item</small></span><span className="quantity-control"><button type="button" onClick={() => updateQty(item.id, -1)} aria-label={`Kurangi ${item.name}`}>−</button><strong>{item.quantity}</strong><button type="button" onClick={() => updateQty(item.id, 1)} aria-label={`Tambah ${item.name}`}>+</button></span></div>)}
        </div>
        <div className="cart-summary"><div><span>Subtotal</span><strong>{formatCurrency(cartTotal)}</strong></div><div><span>Diskon</span><strong>Rp 0</strong></div><div className="cart-total"><span>Total pembayaran</span><strong>{formatCurrency(cartTotal)}</strong></div></div>
        <button className="pay-button" type="button" disabled={!cart.length} onClick={() => setPaymentOpen(true)}>Bayar sekarang <span>→</span></button>
        <div className="cart-shortcuts"><span><kbd>F2</kbd> Cari</span><span><kbd>F4</kbd> Bayar</span><span><kbd>Esc</kbd> Batal</span></div>
      </aside>

      {paymentOpen && <div className="modal-backdrop" role="presentation"><div className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title"><button className="modal-close" type="button" onClick={() => setPaymentOpen(false)} aria-label="Tutup">×</button><span className="section-kicker">Finalisasi transaksi</span><h2 id="payment-title">Pilih metode pembayaran</h2><p>Total yang harus dibayar</p><strong className="modal-total">{formatCurrency(cartTotal)}</strong><div className="payment-methods">{["Tunai", "QRIS", "Lainnya"].map((method) => <button type="button" className={paymentMethod === method ? "payment-method active" : "payment-method"} key={method} onClick={() => setPaymentMethod(method)}><span>{method === "Tunai" ? "◒" : method === "QRIS" ? "▦" : "◇"}</span>{method}<i>{paymentMethod === method ? "✓" : ""}</i></button>)}</div><button className="confirm-pay" type="button" onClick={onPayment}>Konfirmasi pembayaran <span>→</span></button></div></div>}
    </div>
  );
}

function PlaceholderPage({ activeNav, onNavigate }: { activeNav: NavKey; onNavigate: (key: NavKey) => void }) {
  const meta = pageMeta[activeNav];
  return <div className="placeholder-page"><div className="placeholder-icon">{navItems.find((item) => item.id === activeNav)?.icon}</div><span className="section-kicker">{meta.eyebrow}</span><h1>{meta.title}</h1><p>{meta.description}</p><div className="placeholder-actions"><button className="primary-button" type="button" onClick={() => onNavigate(activeNav === "reports" ? "dashboard" : "pos")}>{activeNav === "reports" ? "Kembali ke dashboard" : "Buka alur utama"}<span>→</span></button><button className="secondary-button" type="button" onClick={() => onNavigate("dashboard")}>Lihat ringkasan</button></div><div className="coming-soon-grid"><div><strong>Siap dikembangkan</strong><span>Struktur modul sudah mengikuti blueprint proposal.</span></div><div><strong>Terhubung dengan audit</strong><span>Aksi sensitif nantinya tercatat dengan actor dan timestamp.</span></div><div><strong>Multi-outlet ready</strong><span>Filter outlet disiapkan sejak fondasi pertama.</span></div></div></div>;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return <main className="login-screen"><section className="login-art"><div className="login-brand"><span className="brand-mark">KS</span><span><strong>Kantin<span>Kita</span></strong><small>Sistem Kantin Digital Sekolah</small></span></div><div className="login-art-content"><span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" /><div className="art-plate"><span className="food-icon">🍱</span><span className="food-leaf">✦</span><span className="food-dot dot-one" /><span className="food-dot dot-two" /><span className="food-dot dot-three" /></div><h1>Operasional kantin,<br /><em>lebih rapi.</em></h1><p>Layani antrean dengan cepat. Pantau stok dan kas dengan tenang.</p></div><span className="login-footer">© 2026 KantinKita · Untuk sekolah yang terus bertumbuh</span></section><section className="login-form-side"><div className="login-form-wrap"><span className="section-kicker">Portal operasional</span><h2>Selamat datang</h2><p>Masuk untuk melanjutkan ke workspace kantin sekolah.</p><button className="google-button" type="button" onClick={onLogin}><span className="google-g">G</span>Lanjutkan dengan Google</button><div className="form-divider"><span>atau masuk dengan email</span></div><label>Email kerja<input type="email" placeholder="nama@sekolah.sch.id" /></label><label>Password<div className="password-input"><input type="password" placeholder="Masukkan password" /><span>◉</span></div></label><button className="login-button" type="button" onClick={onLogin}>Masuk ke dashboard <span>→</span></button><button className="forgot-button" type="button">Lupa password?</button><div className="login-note"><span>i</span><span>Akses operasional hanya aktif untuk akun yang sudah diverifikasi dan disetujui admin.</span></div></div></section></main>;
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([products[1] ? { ...products[1], quantity: 2 } : { ...products[0], quantity: 1 }]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [notice, setNotice] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const activeMeta = pageMeta[activeNav];

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      return existing ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }];
    });
    setNotice(`${product.name} ditambahkan ke keranjang`);
    window.setTimeout(() => setNotice(""), 2400);
  };

  const updateQty = (id: number, delta: number) => setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0));
  const handlePayment = async () => {
    const normalizedPaymentMethod = paymentMethod === "Tunai" ? "cash" : paymentMethod === "QRIS" ? "qris_manual" : "other";
    const clientTransactionId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `demo-${Date.now()}`;
    const result = await finalizeSale({
      outletId: "demo",
      shiftId: "demo",
      clientTransactionId,
      items: cart.map((item) => ({ productId: String(item.id), quantity: item.quantity })),
      paymentMethod: normalizedPaymentMethod,
      paymentAmount: cartTotal,
    });
    setPaymentOpen(false);
    setNotice(result.mode === "demo" ? `Pembayaran ${paymentMethod} tersimpan di demo mode` : `Transaksi ${result.saleNo} berhasil dicatat`);
    setCart([]);
    window.setTimeout(() => setNotice(""), 2800);
  };

  if (showLogin) return <LoginScreen onLogin={() => setShowLogin(false)} />;

  return <main className="app-shell"><aside className="sidebar"><div className="sidebar-brand"><span className="brand-mark">KS</span><span><strong>Kantin<span>Kita</span></strong><small>Digital School Canteen</small></span></div><div className="sidebar-profile"><div className="profile-avatar">AN<span className="online-indicator" /></div><div><strong>Ayu Nuraini</strong><span>Manager Kantin</span></div><span className="profile-menu">•••</span></div><nav className="side-nav" aria-label="Navigasi utama">{navItems.map((item) => <button type="button" key={item.id} className={activeNav === item.id ? "nav-item active" : "nav-item"} onClick={() => setActiveNav(item.id)}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>{item.badge && <span className={item.badge === "Shift aktif" ? "nav-badge live" : "nav-badge"}>{item.badge}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="support-card"><span className="support-icon">✦</span><strong>Butuh bantuan?</strong><span>Pelajari shortcut kasir dan SOP operasional.</span><button type="button">Buka panduan <span>→</span></button></div><button type="button" className="logout-button" onClick={() => setShowLogin(true)}><span>↪</span> Keluar dari akun</button><div className="sidebar-meta"><span>v0.1 MVP</span><span>Online <i className="online-dot" /></span></div></div></aside><section className="main-content"><header className="topbar"><div className="mobile-brand"><span className="brand-mark">KS</span><strong>Kantin<span>Kita</span></strong></div><div className="breadcrumb"><span>Workspace</span><i>•</i><strong>{activeMeta.title}</strong></div><div className="topbar-actions"><button className="outlet-select" type="button"><span className="outlet-dot" /><span><small>Outlet aktif</small>Outlet Utama</span><b>⌄</b></button><button className="icon-button" type="button" aria-label="Notifikasi">♢<span className="notification-dot" /></button><button className="top-profile" type="button" onClick={() => setShowLogin(true)}><span className="top-avatar">AN</span><span><strong>Ayu Nuraini</strong><small>Manager</small></span><b>⌄</b></button></div></header><div className="content-wrap"><div className="page-header"><div><span className="section-kicker">{activeMeta.eyebrow}</span><h1>{activeMeta.title}</h1><p>{activeMeta.description}</p></div><div className="page-actions">{activeNav === "dashboard" && <><button className="secondary-button" type="button" onClick={() => setActiveNav("reports")}>Unduh laporan <span>↓</span></button><button className="primary-button" type="button" onClick={() => setActiveNav("pos")}>Buka POS <span>→</span></button></>}{activeNav === "pos" && <span className="live-shift"><i className="live-dot" />Shift aktif · 09:42</span>}</div></div>{activeNav === "dashboard" ? <Dashboard onNavigate={setActiveNav} /> : activeNav === "pos" ? <POS cart={cart} search={search} setSearch={setSearch} addToCart={addToCart} updateQty={updateQty} cartTotal={cartTotal} paymentOpen={paymentOpen} setPaymentOpen={setPaymentOpen} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} onPayment={handlePayment} notice={notice} /> : <PlaceholderPage activeNav={activeNav} onNavigate={setActiveNav} />}</div></section></main>;
}
