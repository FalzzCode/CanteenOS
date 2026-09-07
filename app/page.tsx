"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { demoSalesMix, demoTransactions, type DemoSalesMixItem } from "../lib/demo-data";
import type { AppRole, ProductRecord, ProfileRecord } from "../lib/domain";
import { getAuthorizedProfile, signOut } from "../lib/supabase/auth";
import { getCatalog, getCustomerCatalog } from "../lib/supabase/catalog";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { getDashboardSummary, type DashboardSummary } from "../lib/supabase/dashboard";
import { getOpenShift, type OpenShift } from "../lib/supabase/operations";
import { realtimeStatusCopy, subscribeToAuthChanges, subscribeToOutletRealtime, type RealtimeArea, type RealtimeConnectionStatus } from "../lib/supabase/realtime";
import { getSalesMix } from "../lib/supabase/reports";
import { AuthScreen } from "./auth-screen";
import { OperationsModule, type ModuleKey } from "./operational-modules";
import { ProfileAvatar, ProfileSettings } from "./profile-settings";
import { CustomerPortalStorefront } from "./customer-portal-storefront";
import type { CustomerPortalProps } from "./customer-portal.types";
import { prepareAdminMotion } from "./page-motion";
import { CanteenOSMark, ProductIcon, UiIcon, type UiIconName } from "./ui-icons";

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

type TopbarPanel = "notifications" | "messages" | null;

type WorkspaceNotification = {
  id: string;
  title: string;
  detail: string;
  icon: UiIconName;
  tone: string;
  target: NavKey;
};

const NAV_STORAGE_KEY = "kantinkita-active-nav";
const SIDEBAR_STORAGE_KEY = "kantinkita-sidebar-collapsed";
const DEMO_SHIFT_STORAGE_KEY = "kantinkita-demo-shift-opened-at";

const readDemoShiftOpenedAt = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(DEMO_SHIFT_STORAGE_KEY);
    if (stored && Number.isFinite(Date.parse(stored))) return stored;
    const openedAt = new Date().toISOString();
    window.localStorage.setItem(DEMO_SHIFT_STORAGE_KEY, openedAt);
    return openedAt;
  } catch {
    return null;
  }
};

const isNavKey = (value: string | null): value is NavKey => ["dashboard", "pos", "transactions", "products", "inventory", "purchasing", "cash", "reports", "admin"].includes(value ?? "");

type Product = {
  id: number | string;
  name: string;
  category: string;
  price: number;
  stock: number;
  emoji: string;
  tone: string;
  imageUrl?: string | null;
};

const navItems: { id: NavKey; label: string; icon: UiIconName; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "pos", label: "Manajemen", icon: "briefcase" },
  { id: "transactions", label: "Transaksi", icon: "receipt" },
  { id: "products", label: "Menu", icon: "utensils" },
  { id: "inventory", label: "Stok", icon: "boxes" },
  { id: "purchasing", label: "Pembelian", icon: "packageCheck" },
  { id: "cash", label: "Kas & Shift", icon: "wallet" },
  { id: "reports", label: "Laporan", icon: "chartPie" },
  { id: "admin", label: "Pengaturan", icon: "settings" },
];

const navSections: { label: string; items: NavKey[] }[] = [
  { label: "Ringkasan", items: ["dashboard"] },
  { label: "Penjualan", items: ["transactions"] },
  { label: "Manajemen", items: ["pos", "products", "inventory", "purchasing", "cash"] },
  { label: "Laporan & sistem", items: ["reports", "admin"] },
];

const workspaceSearchRoutes: { nav: NavKey; keywords: string[] }[] = [
  { nav: "dashboard", keywords: ["dashboard", "beranda", "ringkasan", "home"] },
  { nav: "transactions", keywords: ["transaksi", "penjualan", "refund", "struk"] },
  { nav: "pos", keywords: ["manajemen", "operasional", "workspace"] },
  { nav: "products", keywords: ["produk", "menu", "makanan", "minuman"] },
  { nav: "inventory", keywords: ["stok", "inventori", "persediaan", "reorder"] },
  { nav: "purchasing", keywords: ["pembelian", "purchase", "supplier", "pengadaan"] },
  { nav: "cash", keywords: ["kas", "shift", "mutasi", "rekonsiliasi"] },
  { nav: "reports", keywords: ["laporan", "omzet", "penjualan mingguan", "analitik"] },
  { nav: "admin", keywords: ["pengaturan", "admin", "pengguna", "audit", "keamanan"] },
];

const mobilePrimaryNavItems = navItems.filter((item) =>
  ["dashboard", "transactions", "reports", "cash", "admin"].includes(item.id),
);

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

const productVisuals: Record<string, { emoji: string; tone: string }> = {
  Makanan: { emoji: "🍳", tone: "peach" },
  Minuman: { emoji: "🧋", tone: "mint" },
  Camilan: { emoji: "🍞", tone: "gold" },
  Lainnya: { emoji: "🍽️", tone: "blue" },
};

const roleLabels: Record<AppRole, string> = {
  super_admin: "Super admin",
  manager: "Manager kantin",
  cashier: "Kasir",
  stock: "Petugas stok",
  finance: "Keuangan",
  viewer: "Pengamat",
};

const demoAdminProfile: ProfileRecord = {
  id: "demo-admin",
  fullName: "Ayu Nuraini",
  role: "manager",
  accountRole: "admin",
  status: "active",
  employeeCode: "DEMO-ADMIN",
  adminApprovedAt: "2026-01-01T00:00:00.000Z",
  defaultOutletId: "demo",
};

const productFromRecord = (item: ProductRecord): Product => {
  const visual = productVisuals[item.category] ?? productVisuals.Lainnya;
  return { id: item.id, name: item.name, category: item.category, price: item.sellPrice, stock: item.stock, emoji: visual.emoji, tone: visual.tone, imageUrl: item.imageUrl ?? null };
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

type SalesRange = 7 | 30 | 90;

const salesRangeOptions: Array<{ value: SalesRange; label: string; title: string }> = [
  { value: 7, label: "7 hari terakhir", title: "Penjualan minggu ini" },
  { value: 30, label: "30 hari terakhir", title: "Penjualan 30 hari terakhir" },
  { value: 90, label: "90 hari terakhir", title: "Penjualan 90 hari terakhir" },
];

const fallbackSalesByRange: Record<SalesRange, { total: number; change: string; daily: SalesChartPoint[] }> = {
  7: {
    total: 4860000,
    change: "18,6%",
    daily: [
      { day: "Sen", amount: 2900000 },
      { day: "Sel", amount: 3300000 },
      { day: "Rab", amount: 2400000 },
      { day: "Kam", amount: 3750000 },
      { day: "Jum", amount: 4300000 },
      { day: "Sab", amount: 3500000 },
      { day: "Min", amount: 4860000 },
    ],
  },
  30: {
    total: 18540000,
    change: "12,4%",
    daily: [
      { day: "M1", amount: 10200000 },
      { day: "M2", amount: 12600000 },
      { day: "M3", amount: 11400000 },
      { day: "M4", amount: 14800000 },
      { day: "M5", amount: 15900000 },
      { day: "M6", amount: 17100000 },
      { day: "Kini", amount: 18540000 },
    ],
  },
  90: {
    total: 52480000,
    change: "22,1%",
    daily: [
      { day: "Jan", amount: 31200000 },
      { day: "Feb", amount: 36800000 },
      { day: "Mar", amount: 34100000 },
      { day: "Apr", amount: 42300000 },
      { day: "Mei", amount: 45100000 },
      { day: "Jun", amount: 48700000 },
      { day: "Kini", amount: 52480000 },
    ],
  },
};

const selectedSalesRange = (value: SalesRange) => salesRangeOptions.find((option) => option.value === value) ?? salesRangeOptions[0];

const formatDayLabel = (day: string) => {
  if (!/^\d{4}-\d{2}-\d{2}/.test(day)) return day;
  const date = new Date(`${day.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date).replace(/\.$/, "");
};

const BANDUNG_TIME_ZONE = "Asia/Jakarta";
const bandungClockFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: BANDUNG_TIME_ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const bandungHourMinuteFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: BANDUNG_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const getValidDate = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatBandungTime = (value: string | number | Date = Date.now()) => {
  const date = getValidDate(value);
  if (!date) return "--:--:--";
  return bandungClockFormatter.formatToParts(date).filter(({ type }) => ["hour", "minute", "second"].includes(type)).map(({ value: partValue }) => partValue).join(":");
};

const formatShiftStart = (openedAt: string | null | undefined) => {
  if (!openedAt) return "09:42";
  const date = getValidDate(openedAt);
  return date ? bandungHourMinuteFormatter.formatToParts(date).filter(({ type }) => ["hour", "minute"].includes(type)).map(({ value: partValue }) => partValue).join(":") : "09:42";
};

const formatChartValue = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} rb`;
  return `${Math.round(value)}`;
};

function NavItemButton({ item, activeNav, onNavigate, motionIndicator = false }: { item: (typeof navItems)[number]; activeNav: NavKey; onNavigate: (key: NavKey) => void; motionIndicator?: boolean }) {
  const active = activeNav === item.id;
  return <motion.button whileTap={{ scale: .98 }} type="button" title={item.label} aria-current={active ? "page" : undefined} className={active ? "nav-item active" : "nav-item"} onClick={() => onNavigate(item.id)}>{active && motionIndicator && <motion.span layoutId="sidebar-active-indicator" className="nav-active-indicator" transition={{ type: "spring", stiffness: 460, damping: 38 }} />}<span className="nav-icon"><UiIcon name={item.icon} size={16} /></span><span className="nav-label">{item.label}</span>{item.badge && <span className={item.badge === "Shift aktif" ? "nav-badge live" : "nav-badge"}>{item.badge}</span>}</motion.button>;
}

function NavSections({ activeNav, onNavigate, motionIndicator = false }: { activeNav: NavKey; onNavigate: (key: NavKey) => void; motionIndicator?: boolean }) {
  return <>{navSections.map((section) => <div className="nav-section" key={section.label}><span className="nav-section-label">{section.label}</span><div className="nav-section-items">{section.items.map((id) => { const item = navItems.find((candidate) => candidate.id === id); return item ? <NavItemButton key={item.id} item={item} activeNav={activeNav} onNavigate={onNavigate} motionIndicator={motionIndicator} /> : null; })}</div></div>)}</>;
}

type SalesChartPoint = { day: string; amount: number };

function prepareSalesChartData(data: SalesChartPoint[]) {
  if (data.length <= 7) return data;

  return Array.from({ length: 7 }, (_, index) => {
    const start = Math.floor((index * data.length) / 7);
    const end = Math.max(start + 1, Math.floor(((index + 1) * data.length) / 7));
    const bucket = data.slice(start, end);
    const label = index === 0 ? "Awal" : index === 6 ? "Kini" : `P${index + 1}`;
    return { day: label, amount: bucket.reduce((sum, point) => sum + point.amount, 0) };
  });
}

function SalesLineChart({ data }: { data: SalesChartPoint[] }) {
  const [activeIndex, setActiveIndex] = useState(Math.max(data.length - 1, 0));
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const chartCanvasRef = useRef<HTMLDivElement>(null);
  const chartWidth = 680;
  const chartHeight = 200;
  const padding = { top: 18, right: 18, bottom: 28, left: 12 };
  const maxAmount = Math.max(...data.map((item) => item.amount), 1);
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const safeActiveIndex = Math.min(activeIndex, Math.max(data.length - 1, 0));
  const points = data.map((item, index) => {
    const x = padding.left + (plotWidth * index) / Math.max(data.length - 1, 1);
    const y = padding.top + plotHeight - (item.amount / maxAmount) * plotHeight;
    return {
      ...item,
      x,
      y,
      xPercent: (x / chartWidth) * 100,
      yPercent: (y / chartHeight) * 100,
    };
  });
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPoints = points.length ? `${padding.left},${chartHeight - padding.bottom} ${linePoints} ${chartWidth - padding.right},${chartHeight - padding.bottom}` : "";
  const activePoint = points[safeActiveIndex] ?? points[points.length - 1];
  const yLabels = [maxAmount, maxAmount * 0.66, maxAmount * 0.33, 0];
  const tooltipClass = activePoint ? `line-tooltip${activePoint.yPercent < 38 ? " below" : ""}${activePoint.xPercent > 72 ? " edge-right" : ""}${activePoint.xPercent < 28 ? " edge-left" : ""}` : "line-tooltip";

  const updateActivePointFromPointer = (clientX: number) => {
    const canvas = chartCanvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect || !points.length || rect.width <= 0) return;

    const chartX = Math.min(chartWidth, Math.max(0, ((clientX - rect.left) / rect.width) * chartWidth));
    const nearestIndex = points.reduce((closestIndex, point, index) => {
      const closestDistance = Math.abs(points[closestIndex].x - chartX);
      return Math.abs(point.x - chartX) < closestDistance ? index : closestIndex;
    }, 0);
    setActiveIndex(nearestIndex);
  };

  const handleChartPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPointerDragging(true);
    updateActivePointFromPointer(event.clientX);
  };

  const handleChartPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || isPointerDragging) updateActivePointFromPointer(event.clientX);
  };

  const finishChartPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    setIsPointerDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!data.length) return <div className="chart-empty">Belum ada data omzet untuk periode ini.</div>;

  return (
    <div className="chart-wrap line-chart-wrap">
      <div className="chart-y-labels" aria-hidden="true">
        {yLabels.map((value) => <span key={value}>{formatChartValue(value)}</span>)}
      </div>
      <div className="line-chart-shell">
        <div
          ref={chartCanvasRef}
          className={isPointerDragging ? "line-chart-canvas is-dragging" : "line-chart-canvas"}
          onPointerDown={handleChartPointerDown}
          onPointerMove={handleChartPointerMove}
          onPointerUp={finishChartPointer}
          onPointerCancel={finishChartPointer}
        >
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" aria-label="Grafik garis omzet penjualan selama tujuh hari">
            <defs>
              <linearGradient id="sales-area-gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--ui-chart-sales)" stopOpacity=".24" />
                <stop offset="100%" stopColor="var(--ui-chart-sales)" stopOpacity=".02" />
              </linearGradient>
            </defs>
            <g className="line-chart-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((step) => {
                const y = padding.top + (plotHeight * step) / 3;
                return <line key={step} x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} />;
              })}
            </g>
            <polygon className="sales-area" points={areaPoints} fill="url(#sales-area-gradient)" />
            <polyline className="sales-line" points={linePoints} />
            {points.map((point, index) => (
              <g className={index === safeActiveIndex ? "chart-point active" : "chart-point"} key={`${point.day}-${point.amount}`}>
                <circle className="chart-point-halo" cx={point.x} cy={point.y} r="10" />
                <circle
                  className="chart-point-dot"
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  tabIndex={0}
                  role="button"
                  aria-label={`${point.day}: ${formatCurrency(point.amount)}`}
                  onFocus={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveIndex(index);
                    }
                  }}
                />
              </g>
            ))}
          </svg>
          {activePoint && <div className={tooltipClass} style={{ left: `${activePoint.xPercent}%`, top: `${activePoint.yPercent}%` }}><strong>{formatCurrency(activePoint.amount)}</strong><span>{activePoint.day} · omzet</span></div>}
        </div>
        <div className="line-chart-xlabels" aria-hidden="true">
          {data.map((item) => <span key={item.day}>{item.day}</span>)}
        </div>
      </div>
    </div>
  );
}

type RatioRow = DemoSalesMixItem & { amountLabel: string };

function buildRatioData(salesMix: DemoSalesMixItem[]): RatioRow[] {
  const referencePalette = ["var(--ui-chart-1)", "var(--ui-chart-2)", "var(--ui-chart-3)", "var(--ui-chart-4)"];
  return salesMix.map((item, index) => ({ ...item, color: referencePalette[index % referencePalette.length], amountLabel: formatCurrency(item.amount) }));
}

function buildRatioGradient(ratioData: RatioRow[]): string {
  if (!ratioData.length) return "var(--ui-surface-strong)";
  const stops = ratioData.map((item, index) => {
    const start = ratioData.slice(0, index).reduce((sum, previous) => sum + previous.value, 0);
    return `${item.color} ${start}% ${start + item.value}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

const pageMeta: Record<NavKey, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: "Ringkasan operasional",
    title: "Selamat sore, Ayu",
    description: "Pantau performa kantin dan temukan hal yang perlu ditindaklanjuti hari ini.",
  },
  pos: {
    eyebrow: "Manajemen operasional",
    title: "Manajemen kantin",
    description: "Tambah menu, cek stok, pantau pembelian, dan rapikan kas dari satu ruang kerja.",
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
    title: "Stok & inventori",
    description: "Pantau stok minimum, pergerakan barang, opname, dan item yang perlu diisi ulang.",
  },
  purchasing: {
    eyebrow: "Pemasok & penerimaan",
    title: "Pembelian",
    description: "Catat pesanan supplier, penerimaan aktual, biaya, dan lampiran invoice.",
  },
  cash: {
    eyebrow: "Rekonsiliasi kas",
    title: "Kas & shift",
    description: "Lihat shift berjalan, mutasi kas, saldo harapan, dan selisih kas.",
  },
  reports: {
    eyebrow: "Analitik bisnis",
    title: "Laporan",
    description: "Bandingkan penjualan, stok, pembelian, pengeluaran, dan rasio performa.",
  },
  admin: {
    eyebrow: "Kontrol akses",
    title: "Pengaturan",
    description: "Atur pengguna, outlet, role, branding struk, dan audit log aktivitas kritis.",
  },
};

const statIconMap: Record<string, UiIconName> = {
  "↗": "arrowUpRight",
  "▦": "grid",
  "◎": "circle",
  "◒": "circleMinus",
  stock: "boxes",
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
    <motion.article
      className={`stat-card ${tone}`}
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      whileHover={{ y: -3, transition: { duration: .18 } }}
    >
      <div className="stat-topline">
        <span>{label}</span>
        <span className="stat-icon"><UiIcon name={statIconMap[icon] ?? "circle"} size={16} /></span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">
        <span className="trend"><UiIcon name="arrowUpRight" size={13} /> {change}</span>
        <span>{detail}</span>
      </div>
    </motion.article>
  );
}

function SkeletonBlock({ className = "", style }: { className?: string; style?: CSSProperties }) {
  const reduceMotion = useReducedMotion();
  return <motion.span aria-hidden="true" className={`skeleton-block ${className}`} style={style} animate={reduceMotion ? { opacity: .58 } : { opacity: [.38, .82, .38] }} transition={reduceMotion ? { duration: 0 } : { duration: 1.25, repeat: Infinity, ease: "easeInOut" }} />;
}

function WorkspaceBootSkeleton() {
  return (
    <main className="auth-loading auth-loading-skeleton" role="status" aria-label="Menyiapkan workspace">
      <div className="auth-loading-orbit" aria-hidden="true"><span className="brand-mark"><CanteenOSMark size={34} /></span></div>
      <div className="auth-loading-copy" aria-hidden="true"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /><SkeletonBlock className="skeleton-meta" /></div>
      <span className="sr-only">Menyiapkan workspace...</span>
    </main>
  );
}

function AdminPageHeaderSkeleton({ activeNav }: { activeNav: NavKey }) {
  const isDashboard = activeNav === "dashboard";
  const hasActions = isDashboard || activeNav === "pos";

  return (
    <div className={`page-header admin-page-skeleton-header${isDashboard ? " dashboard-welcome-card" : ""}`}>
      <div className="admin-page-skeleton-copy">
        <SkeletonBlock className="admin-page-skeleton-eyebrow" />
        <SkeletonBlock className="admin-page-skeleton-title" />
        <SkeletonBlock className="admin-page-skeleton-description" />
        <div className="admin-page-skeleton-context"><SkeletonBlock className="admin-page-skeleton-context-pill" /><SkeletonBlock className="admin-page-skeleton-context-pill secondary" /></div>
      </div>
      {hasActions && <div className="admin-page-skeleton-actions">{Array.from({ length: 2 }, (_, index) => <SkeletonBlock className={`admin-page-skeleton-action${index === 1 ? " primary" : ""}`} key={index} />)}</div>}
      {isDashboard && <SkeletonBlock className="admin-page-skeleton-art" />}
    </div>
  );
}

function SkeletonStats({ count = 3, dashboard = false }: { count?: number; dashboard?: boolean }) {
  return (
    <section className={`skeleton-stat-grid${dashboard ? " dashboard-skeleton-stats" : ""}`} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => <div className="skeleton-card skeleton-stat" key={index}><div className="skeleton-stat-top"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-icon" /></div><SkeletonBlock className="skeleton-value" /><SkeletonBlock className="skeleton-meta" /></div>)}
    </section>
  );
}

function SkeletonToolbar({ search = true, actions = 2 }: { search?: boolean; actions?: number }) {
  return (
    <div className="skeleton-toolbar" aria-hidden="true">
      {search ? <SkeletonBlock className="skeleton-search" /> : <div className="skeleton-toolbar-title"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /></div>}
      <span className="skeleton-toolbar-spacer" />
      {Array.from({ length: actions }, (_, index) => <SkeletonBlock className={index === actions - 1 ? "skeleton-action primary" : "skeleton-action"} key={index} />)}
    </div>
  );
}

type SkeletonTableVariant = "transactions" | "products" | "inventory";

function SkeletonTable({ variant, rows = 5 }: { variant: SkeletonTableVariant; rows?: number }) {
  const cellsByVariant: Record<SkeletonTableVariant, number> = { transactions: 6, products: 7, inventory: 6 };
  return (
    <div className={`skeleton-table skeleton-table-${variant}`} aria-hidden="true">
      <div className="skeleton-table-head">{Array.from({ length: cellsByVariant[variant] }, (_, index) => <SkeletonBlock className="skeleton-cell-head" key={index} />)}</div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="skeleton-table-row" key={rowIndex}>
          {Array.from({ length: cellsByVariant[variant] }, (_, cellIndex) => <SkeletonBlock className={`skeleton-cell skeleton-cell-${cellIndex + 1}`} key={cellIndex} />)}
        </div>
      ))}
    </div>
  );
}

function TablePageSkeleton({ variant }: { variant: SkeletonTableVariant }) {
  const labels: Record<SkeletonTableVariant, string> = { transactions: "transaksi", products: "produk dan menu", inventory: "inventori" };
  return (
    <div className={`contextual-skeleton skeleton-${variant} module-stack`} role="status" aria-label={`Memuat ${labels[variant]}`}>
      <SkeletonStats count={3} />
      <section className="skeleton-card skeleton-module-card">
        <SkeletonToolbar search={variant !== "inventory"} actions={variant === "products" ? 3 : 2} />
        <SkeletonTable variant={variant} rows={variant === "products" ? 6 : 5} />
      </section>
      {variant === "inventory" && <section className="skeleton-lower-grid" aria-hidden="true"><div className="skeleton-card skeleton-summary-card"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" />{Array.from({ length: 3 }, (_, index) => <div className="skeleton-list-line" key={index}><SkeletonBlock className="skeleton-list-icon" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span></div>)}</div><div className="skeleton-card skeleton-summary-card"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /><SkeletonBlock className="skeleton-big-number" /><SkeletonBlock className="skeleton-paragraph" /><SkeletonBlock className="skeleton-action wide" /></div></section>}
      <span className="sr-only">Struktur {labels[variant]} sedang disiapkan.</span>
    </div>
  );
}

function PurchasingSkeleton() {
  return (
    <div className="contextual-skeleton module-stack" role="status" aria-label="Memuat pembelian">
      <SkeletonStats />
      <section className="skeleton-card skeleton-module-card" aria-hidden="true">
        <SkeletonToolbar search={false} actions={2} />
        <div className="skeleton-purchase-list">{Array.from({ length: 4 }, (_, index) => <div className="skeleton-purchase-card" key={index}><div className="skeleton-purchase-top"><SkeletonBlock className="skeleton-list-icon" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span><SkeletonBlock className="skeleton-status" /></div><div className="skeleton-purchase-bottom"><span><SkeletonBlock className="skeleton-row-meta" /><SkeletonBlock className="skeleton-row-title" /></span><span><SkeletonBlock className="skeleton-row-meta" /><SkeletonBlock className="skeleton-row-title" /></span><SkeletonBlock className="skeleton-action" /></div></div>)}</div>
      </section>
      <span className="sr-only">Daftar purchase order sedang disiapkan.</span>
    </div>
  );
}

function CashSkeleton() {
  return (
    <div className="contextual-skeleton module-stack" role="status" aria-label="Memuat shift dan kas">
      <SkeletonStats />
      <section className="skeleton-cash-grid" aria-hidden="true">
        <div className="skeleton-card skeleton-cash-summary"><div className="skeleton-section-heading"><span><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /></span><SkeletonBlock className="skeleton-status" /></div><div className="skeleton-metric-grid">{Array.from({ length: 4 }, (_, index) => <div key={index}><SkeletonBlock className="skeleton-row-meta" /><SkeletonBlock className="skeleton-row-title" /></div>)}</div><div className="skeleton-action-row"><SkeletonBlock className="skeleton-action" /><SkeletonBlock className="skeleton-action" /><SkeletonBlock className="skeleton-action primary" /></div></div>
        <div className="skeleton-card skeleton-movement-card"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" />{Array.from({ length: 4 }, (_, index) => <div className="skeleton-list-line movement" key={index}><SkeletonBlock className="skeleton-list-icon" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span><SkeletonBlock className="skeleton-price" /></div>)}</div>
      </section>
      <span className="sr-only">Ringkasan shift dan mutasi kas sedang disiapkan.</span>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="contextual-skeleton module-stack" role="status" aria-label="Memuat laporan">
      <SkeletonStats />
      <section className="skeleton-report-grid" aria-hidden="true">
        <div className="skeleton-card skeleton-report-card"><div className="skeleton-section-heading"><span><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /></span><SkeletonBlock className="skeleton-tabs" /></div><div className="skeleton-report-mix"><SkeletonBlock className="skeleton-donut ring" /><div>{Array.from({ length: 4 }, (_, index) => <div className="skeleton-ratio-line" key={index}><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-ratio-track" /><SkeletonBlock className="skeleton-row-meta" /></div>)}</div></div><SkeletonBlock className="skeleton-note" /></div>
        <div className="skeleton-card skeleton-report-card"><div className="skeleton-section-heading"><span><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /></span><SkeletonBlock className="skeleton-action" /></div><div className="skeleton-bars">{[46, 62, 38, 74, 88, 68, 94].map((height, index) => <SkeletonBlock className="skeleton-bar" key={index} style={{ "--skeleton-height": `${height}%` } as CSSProperties} />)}</div><SkeletonBlock className="skeleton-highlight" /></div>
      </section>
      <span className="sr-only">Grafik dan rasio laporan sedang disiapkan.</span>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="contextual-skeleton module-stack" role="status" aria-label="Memuat administrasi">
      <SkeletonStats />
      <section className="skeleton-admin-grid" aria-hidden="true">
        <div className="skeleton-card skeleton-admin-card"><SkeletonToolbar search={false} actions={1} />{Array.from({ length: 5 }, (_, index) => <div className="skeleton-user-row" key={index}><SkeletonBlock className="skeleton-user-avatar" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span><SkeletonBlock className="skeleton-role" /><SkeletonBlock className="skeleton-status" /><SkeletonBlock className="skeleton-action" /></div>)}</div>
        <div className="skeleton-card skeleton-admin-card"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" />{Array.from({ length: 5 }, (_, index) => <div className="skeleton-audit-row" key={index}><SkeletonBlock className="skeleton-time" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span></div>)}<SkeletonBlock className="skeleton-action wide" /></div>
      </section>
      <section className="skeleton-card skeleton-permission-grid" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <div key={index}><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-paragraph" /></div>)}</section>
      <span className="sr-only">Pengguna, audit, dan role sedang disiapkan.</span>
    </div>
  );
}

function ManagementSkeleton() {
  return (
    <div className="contextual-skeleton management-skeleton page-stack" role="status" aria-label="Memuat manajemen kantin">
      <section className="skeleton-card management-skeleton-hero" aria-hidden="true">
        <div><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading wide" /><SkeletonBlock className="skeleton-paragraph" /></div>
        <div className="management-skeleton-actions"><SkeletonBlock className="skeleton-action" /><SkeletonBlock className="skeleton-action primary" /></div>
      </section>
      <SkeletonStats count={4} />
      <section className="management-skeleton-grid" aria-hidden="true">
        <div className="skeleton-card management-skeleton-actions-card"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" />{Array.from({ length: 4 }, (_, index) => <div className="management-skeleton-action-row" key={index}><SkeletonBlock className="skeleton-list-icon" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span><SkeletonBlock className="skeleton-action" /></div>)}</div>
        <div className="skeleton-card management-skeleton-menu-card"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" />{Array.from({ length: 4 }, (_, index) => <div className="management-skeleton-product-row" key={index}><SkeletonBlock className="skeleton-list-icon" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span><SkeletonBlock className="skeleton-status" /></div>)}</div>
      </section>
      <span className="sr-only">Ruang kerja manajemen sedang disiapkan.</span>
    </div>
  );
}

function RouteSkeleton({ activeNav }: { activeNav: NavKey }) {
  switch (activeNav) {
    case "dashboard": return <DashboardSkeleton />;
    case "pos": return <ManagementSkeleton />;
    case "transactions": return <TablePageSkeleton variant="transactions" />;
    case "products": return <TablePageSkeleton variant="products" />;
    case "inventory": return <TablePageSkeleton variant="inventory" />;
    case "purchasing": return <PurchasingSkeleton />;
    case "cash": return <CashSkeleton />;
    case "reports": return <ReportsSkeleton />;
    case "admin": return <AdminSkeleton />;
  }
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton page-stack" role="status" aria-label="Memuat ringkasan dashboard">
      <section className="dashboard-skeleton-command skeleton-card" aria-hidden="true">
        <div className="dashboard-skeleton-command-copy"><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading wide" /><SkeletonBlock className="skeleton-paragraph" /></div>
        <div className="dashboard-skeleton-command-actions">{Array.from({ length: 3 }, (_, index) => <SkeletonBlock className={`skeleton-action${index === 0 ? " primary" : ""}`} key={index} />)}</div>
      </section>
      <SkeletonStats count={5} dashboard />
      <section className="dashboard-skeleton-grid dashboard-skeleton-main" aria-hidden="true">
        <div className="skeleton-card dashboard-skeleton-card dashboard-skeleton-ratio skeleton-ratio"><div className="skeleton-section-heading"><span><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /></span><SkeletonBlock className="skeleton-action" /></div><div className="dashboard-skeleton-ratio-body"><SkeletonBlock className="skeleton-donut" /><div>{Array.from({ length: 4 }, (_, index) => <div className="skeleton-ratio-line" key={index}><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-ratio-track" /><SkeletonBlock className="skeleton-row-meta" /></div>)}</div></div><SkeletonBlock className="skeleton-note" /></div>
        <div className="skeleton-card dashboard-skeleton-card dashboard-skeleton-sales skeleton-chart"><div className="skeleton-section-heading"><span><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /></span><SkeletonBlock className="skeleton-action" /></div><div className="dashboard-skeleton-sales-summary"><SkeletonBlock className="skeleton-big-number" /><SkeletonBlock className="skeleton-row-title" /></div><SkeletonBlock className="skeleton-visual" /><div className="dashboard-skeleton-legend"><SkeletonBlock className="skeleton-row-meta" /><SkeletonBlock className="skeleton-row-meta" /></div></div>
      </section>
      <section className="dashboard-skeleton-grid dashboard-skeleton-lower" aria-hidden="true">
        <div className="skeleton-card dashboard-skeleton-card"><div className="skeleton-section-heading"><span><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /></span><SkeletonBlock className="skeleton-status" /></div>{Array.from({ length: 3 }, (_, index) => <div className="dashboard-skeleton-alert-row" key={index}><SkeletonBlock className="skeleton-list-icon" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span><SkeletonBlock className="skeleton-action" /></div>)}</div>
        <div className="skeleton-card dashboard-skeleton-card"><div className="skeleton-section-heading"><span><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /></span><SkeletonBlock className="skeleton-action" /></div>{Array.from({ length: 3 }, (_, index) => <div className="dashboard-skeleton-product-row" key={index}><SkeletonBlock className="skeleton-list-icon" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span><SkeletonBlock className="skeleton-price" /></div>)}</div>
      </section>
      <section className="skeleton-card dashboard-skeleton-recent" aria-hidden="true"><div className="skeleton-section-heading"><span><SkeletonBlock className="skeleton-label" /><SkeletonBlock className="skeleton-heading" /></span><SkeletonBlock className="skeleton-action" /></div>{Array.from({ length: 3 }, (_, index) => <div className="dashboard-skeleton-activity-row" key={index}><SkeletonBlock className="skeleton-list-icon" /><span><SkeletonBlock className="skeleton-row-title" /><SkeletonBlock className="skeleton-row-meta" /></span><SkeletonBlock className="skeleton-price" /><SkeletonBlock className="skeleton-status" /></div>)}<SkeletonBlock className="dashboard-skeleton-recent-footer" />
      </section>
      <span className="sr-only">Data operasional sedang disiapkan.</span>
    </div>
  );
}

function Dashboard({ onNavigate, outletId, refreshToken, shiftOpenedAt, shiftCashierName }: { onNavigate: (key: NavKey) => void; outletId: string; refreshToken: number; shiftOpenedAt?: string | null; shiftCashierName?: string }) {
  const [salesMix, setSalesMix] = useState<DemoSalesMixItem[]>(demoSalesMix);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesRange, setSalesRange] = useState<SalesRange>(7);
  const [salesRangeOpen, setSalesRangeOpen] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured && outletId !== "demo");
  const loadedOnce = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const loadLiveMix = async () => {
      if (!isSupabaseConfigured || outletId === "demo") {
        if (!cancelled) setLoading(false);
        return;
      }

      const to = new Date();
      const from = new Date(to);
      from.setDate(from.getDate() - salesRange + 1);
      setLoading(true);

      try {
        const minimumSkeletonTime = loadedOnce.current
          ? Promise.resolve()
          : new Promise((resolve) => window.setTimeout(resolve, 420));
        const [liveMix, liveSummary] = await Promise.all([
          getSalesMix(outletId, from.toISOString(), to.toISOString()),
          getDashboardSummary(outletId, from.toISOString(), to.toISOString()),
          minimumSkeletonTime,
        ]);
        if (!cancelled) setSalesMix(liveMix ?? []);
        if (liveSummary && !cancelled) setSummary(liveSummary);
      } catch {
        // Keep the demo mix visible when the live reporting function is not configured yet.
      } finally {
        if (!cancelled) {
          loadedOnce.current = true;
          setLoading(false);
        }
      }
    };

    void loadLiveMix();
    return () => { cancelled = true; };
  }, [outletId, refreshToken, salesRange]);

  const ratioData = buildRatioData(salesMix);
  const ratioGradient = buildRatioGradient(ratioData);
  const salesRangeView = fallbackSalesByRange[salesRange];
  const selectedRange = selectedSalesRange(salesRange);
  const dailySales = prepareSalesChartData(summary?.dailySales.length ? summary.dailySales.map((item) => ({ day: formatDayLabel(item.day), amount: item.amount })) : salesRangeView.daily);
  const totalSales = summary?.totalSales ?? 4860000;
  const periodSalesTotal = summary?.totalSales ?? salesRangeView.total;
  const periodSalesChange = summary ? "18,6%" : salesRangeView.change;
  const transactionCount = summary?.transactionCount ?? 186;
  const averageOrder = summary?.averageOrder ?? 26100;
  const grossProfitEstimate = summary?.grossProfitEstimate ?? 1760000;
  const lowStockCount = summary?.lowStockCount ?? 7;
  const lowStockSignal = lowStockCount ? `${lowStockCount} item` : "Aman";
  const reviewTaskLabel = outletId === "demo" ? "2 menunggu" : "Perlu review";
  const reviewAlertTitle = outletId === "demo" ? "2 refund menunggu review" : "Refund menunggu review";
  const reviewAlertDetail = outletId === "demo" ? "Total Rp 38.000 membutuhkan persetujuan manager." : "Perlu persetujuan manager sebelum diproses.";
  const leadingRatio = ratioData.reduce<RatioRow | null>((leader, item) => !leader || item.value > leader.value ? item : leader, null);
  const topProducts = summary?.topProducts.length ? summary.topProducts.map((item, index) => {
    const visual = Object.values(productVisuals)[index % Object.values(productVisuals).length];
    return { rank: String(index + 1).padStart(2, "0"), name: item.name, meta: `${Math.round(item.units)} terjual`, value: formatCurrency(item.amount), tone: visual.tone, emoji: visual.emoji };
  }) : [
    { rank: "01", name: "Es Teh Manis", meta: "142 terjual", value: "Rp 710 rb", tone: "mint", emoji: "🧋" },
    { rank: "02", name: "Nasi Goreng Spesial", meta: "86 terjual", value: "Rp 1,29 jt", tone: "peach", emoji: "🍳" },
    { rank: "03", name: "Roti Bakar Coklat", meta: "61 terjual", value: "Rp 610 rb", tone: "gold", emoji: "🍞" },
  ];

  const recentActivities = demoTransactions.slice(0, 3).map((transaction) => {
    const itemNames = transaction.itemNames ?? [];
    const itemName = itemNames[0] ?? "Menu kantin";
    const secondaryNames = itemNames.slice(1, 3);
    const additionalCount = Math.max(itemNames.length - 3, 0);
    const itemSummary = secondaryNames.length
      ? `${secondaryNames.join(" · ")}${additionalCount ? ` + ${additionalCount} menu lainnya` : ""}`
      : `${transaction.items} item`;
    const isReview = transaction.status === "review";

    return {
      id: transaction.id,
      time: transaction.time,
      cashier: transaction.cashier,
      itemCount: `${transaction.items} item`,
      payment: transaction.payment,
      total: formatCurrency(transaction.total),
      itemName,
      itemSummary,
      status: isReview ? "Review refund" : transaction.status === "voided" ? "Dibatalkan" : "Selesai",
      statusTone: transaction.status === "paid" ? "paid" : transaction.status,
      icon: isReview ? "undo" as UiIconName : transaction.payment === "QRIS" ? "creditCard" as UiIconName : "wallet" as UiIconName,
    };
  });

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="dashboard-motion page-stack">
      <section className="dashboard-command-bar" aria-label="Fokus operasional hari ini">
        <div className="dashboard-command-copy">
          <span className="section-kicker">Fokus operasional</span>
          <h2>Mulai dari tugas yang paling berdampak</h2>
          <p>Menu, stok, pembelian, dan kas dirangkum menjadi tindakan yang bisa langsung dibuka.</p>
        </div>
        <div className="dashboard-command-actions">
          <button type="button" onClick={() => onNavigate("pos")}><span><UiIcon name="store" size={17} /></span><strong>Kelola menu</strong><small>Tambah atau ubah produk</small><UiIcon name="arrowRight" size={15} /></button>
          <button type="button" onClick={() => onNavigate("inventory")}><span><UiIcon name="boxes" size={17} /></span><strong>Isi stok</strong><small>{lowStockCount} menipis</small><UiIcon name="arrowRight" size={15} /></button>
          <button type="button" onClick={() => onNavigate("transactions")}><span><UiIcon name="undo" size={17} /></span><strong>Review refund</strong><small>{reviewTaskLabel}</small><UiIcon name="arrowRight" size={15} /></button>
        </div>
      </section>

      <section className="stats-grid" aria-label="Ringkasan KPI">
        <StatCard label="Omzet hari ini" value={formatCurrency(totalSales)} change="14,8%" detail="vs kemarin" icon="↗" tone="stat-teal" />
        <StatCard label="Transaksi" value={transactionCount.toLocaleString("id-ID")} change="8,2%" detail="pesanan selesai" icon="▦" tone="stat-gold" />
        <StatCard label="Rata-rata order" value={formatCurrency(averageOrder)} change="5,4%" detail="per transaksi" icon="◎" tone="stat-sky" />
        <StatCard label="Perkiraan laba kotor" value={formatCurrency(grossProfitEstimate)} change="12,1%" detail="margin 36,2%" icon="◒" tone="stat-navy" />
        <StatCard label="Stok menipis" value={`${lowStockCount} item`} change={lowStockSignal} detail="perlu reorder" icon="stock" tone="stat-violet" />
      </section>

      <section className="dashboard-grid main-insights">
        <article className="card sales-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Performa penjualan</span>
              <h2>{selectedRange.title}</h2>
            </div>
            <div className="sales-range-picker">
              <button className="soft-select" type="button" aria-haspopup="menu" aria-expanded={salesRangeOpen} onClick={() => setSalesRangeOpen((current) => !current)}>
                {selectedRange.label} <UiIcon name="chevronDown" size={15} />
              </button>
              <AnimatePresence>
                {salesRangeOpen && <motion.div key="sales-range-menu" className="sales-range-menu" role="menu" initial={{ opacity: 0, y: -5, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .985 }} transition={{ duration: .14 }}>
                  {salesRangeOptions.map((option) => <button key={option.value} className={option.value === salesRange ? "sales-range-option active" : "sales-range-option"} type="button" role="menuitemradio" aria-checked={option.value === salesRange} onClick={() => { setSalesRange(option.value); setSalesRangeOpen(false); }}><span>{option.label}</span>{option.value === salesRange && <UiIcon name="check" size={14} />}</button>)}
                </motion.div>}
              </AnimatePresence>
            </div>
          </div>
          <div className="sales-summary-row">
            <div>
              <strong>{formatCurrency(periodSalesTotal)}</strong>
              <span className="positive-copy"><UiIcon name="trendingUp" size={14} /> {periodSalesChange}</span>
            </div>
            <span className="muted-copy">dibanding periode sebelumnya</span>
          </div>
          <SalesLineChart data={dailySales} />
          <div className="chart-legend"><span><i className="legend-dot teal-dot" />Omzet</span><span className="chart-legend-hint">Arah tren harian · hover titik untuk detail</span></div>
        </article>

        <article className="card ratio-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">Komposisi omzet</span>
              <h2>Rasio penjualan</h2>
            </div>
            <button className="link-button" type="button" onClick={() => onNavigate("reports")}>Lihat laporan <UiIcon name="arrowRight" size={15} /></button>
          </div>
          <div className="ratio-content">
            <div className="ratio-donut" aria-label="Total rasio penjualan 100 persen" style={{ background: ratioGradient }}>
              <div><strong>100%</strong><span>total omzet</span></div>
            </div>
            <div className="ratio-list">
              {ratioData.map((item) => (
                <div className="ratio-row" key={item.label}>
                  <div className="ratio-row-top"><span><i className="legend-dot" style={{ background: item.color }} />{item.label}</span><strong>{item.value}%</strong></div>
                  <div className="ratio-track"><div className="ratio-fill" style={{ width: `${item.value}%`, background: item.color }} /></div>
                  <span className="ratio-amount">{item.amountLabel}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="ratio-note"><span className="mini-spark"><UiIcon name="trendingUp" size={15} /></span><span>{leadingRatio ? <><strong>{leadingRatio.label} memimpin</strong> dengan kontribusi {leadingRatio.value}% dari omzet minggu ini.</> : "Belum ada transaksi pada periode ini."}</span></div>
        </article>
      </section>

      <section className="dashboard-grid lower-insights">
        <article className="card alert-card">
          <div className="card-heading">
            <div><span className="section-kicker">Perlu perhatian</span><h2>Alert operasional</h2></div>
            <span className="alert-count">{lowStockCount} item</span>
          </div>
          <div className="alert-list">
            <button className="alert-row warning" type="button" onClick={() => onNavigate("inventory")}>
              <span className="alert-symbol"><UiIcon name="circleAlert" size={16} /></span><span><strong>{lowStockCount} item stok menipis</strong><small>Air mineral dan beberapa bahan perlu diisi ulang.</small></span><span className="arrow"><UiIcon name="arrowRight" size={15} /></span>
            </button>
            <button className="alert-row neutral" type="button" onClick={() => onNavigate("cash")}>
              <span className="alert-symbol"><UiIcon name="clock" size={16} /></span><span><strong>Shift kasir masih aktif</strong><small>Shift {shiftCashierName ?? "Kasir"} · Outlet Utama · sejak {formatShiftStart(shiftOpenedAt)}.</small></span><span className="arrow"><UiIcon name="arrowRight" size={15} /></span>
            </button>
            <button className="alert-row danger" type="button" onClick={() => onNavigate("transactions")}>
              <span className="alert-symbol"><UiIcon name="undo" size={16} /></span><span><strong>{reviewAlertTitle}</strong><small>{reviewAlertDetail}</small></span><span className="arrow"><UiIcon name="arrowRight" size={15} /></span>
            </button>
          </div>
        </article>

        <article className="card top-product-card">
          <div className="card-heading">
            <div><span className="section-kicker">Produk terlaris</span><h2>Menu terlaris</h2></div>
            <button className="link-button" type="button" onClick={() => onNavigate("products")}>Kelola menu <UiIcon name="arrowRight" size={15} /></button>
          </div>
          <div className="product-ranking">
            {topProducts.map((item) => (
              <div className="ranking-row" key={item.rank}>
                <span className="rank-number">{item.rank}</span><span className={`product-thumb ${item.tone}`}><ProductIcon tone={item.tone} size={18} /></span><span className="ranking-name"><strong>{item.name}</strong><small>{item.meta}</small></span><strong className="ranking-value">{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="card recent-card">
        <div className="card-heading">
          <div><span className="section-kicker">Aktivitas terbaru</span><h2>Transaksi terakhir</h2></div>
          <button className="link-button" type="button" onClick={() => onNavigate("transactions")}>Lihat semua <UiIcon name="arrowRight" size={15} /></button>
        </div>
        <div className="activity-feed" aria-label="Daftar transaksi terbaru">
          {recentActivities.map((activity) => <button className="activity-item" type="button" key={activity.id} aria-label={`${activity.itemName}, ${activity.time}, ${activity.total}`} onClick={() => onNavigate("transactions")}>
            <span className={`activity-icon ${activity.statusTone}`}><UiIcon name={activity.icon} size={16} /></span>
            <span className="activity-main"><span className="activity-id-row"><strong>{activity.itemName}</strong><time>{activity.time}</time></span><small>{activity.itemSummary} · {activity.payment} · {activity.itemCount} · {activity.cashier}</small></span>
            <span className="activity-meta"><small>Kasir</small><strong>{activity.cashier}</strong></span>
            <span className="activity-meta"><small>Item</small><strong>{activity.itemCount}</strong></span>
            <span className="activity-total"><small>Total</small><strong>{activity.total}</strong></span>
            <span className={`status-pill ${activity.statusTone}`}>{activity.status}</span>
            <UiIcon name="arrowRight" size={15} className="activity-arrow" />
          </button>)}
        </div>
        <div className="activity-footer"><span><i className="activity-live-dot" />Live terbaru</span><small>Data tersinkron beberapa detik lalu</small></div>
        <div className="table-scroll legacy-activity-table">
          <table>
            <thead><tr><th>Transaksi</th><th>Kasir</th><th>Item</th><th>Pembayaran</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {recentActivities.map((activity) => <tr key={activity.id}><td><strong>{activity.itemName}</strong><small>{activity.time}</small><span className="mobile-row-meta">{activity.itemSummary} · {activity.payment} · {activity.itemCount} · {activity.cashier}</span></td><td>{activity.cashier}</td><td>{activity.itemCount}</td><td>{activity.payment}</td><td><strong>{activity.total}</strong></td><td><span className={`status-pill ${activity.statusTone}`}>{activity.status}</span></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ManagementWorkspace({ catalog, onNavigate }: { catalog: Product[]; onNavigate: (key: NavKey) => void }) {
  const lowStockProducts = [...catalog].filter((product) => product.stock <= 10).sort((a, b) => a.stock - b.stock);
  const managementProducts = [...catalog].sort((a, b) => a.stock - b.stock).slice(0, 4);
  const categoryCount = new Set(catalog.map((product) => product.category)).size;
  const stockValue = catalog.reduce((total, product) => total + product.price * product.stock, 0);
  const stats = [
    { label: "Menu aktif", value: `${catalog.length}`, detail: "Siap ditampilkan ke pelanggan", tone: "violet", icon: "utensils" as UiIconName },
    { label: "Kategori", value: `${categoryCount}`, detail: "Makanan, minuman, dan camilan", tone: "mint", icon: "grid" as UiIconName },
    { label: "Stok menipis", value: `${lowStockProducts.length}`, detail: lowStockProducts.length ? "Perlu diisi ulang" : "Semua stok aman", tone: "gold", icon: "boxes" as UiIconName },
    { label: "Nilai stok", value: formatCurrency(stockValue), detail: "Estimasi dari menu aktif", tone: "sky", icon: "wallet" as UiIconName },
  ];
  const actions: Array<{ key: NavKey; eyebrow: string; title: string; detail: string; icon: UiIconName; tone: string }> = [
    { key: "products", eyebrow: "Katalog", title: "Tambah & atur menu", detail: "Harga, kategori, foto, dan status tampil", icon: "utensils", tone: "violet" },
    { key: "inventory", eyebrow: "Persediaan", title: "Pantau stok", detail: lowStockProducts.length ? `${lowStockProducts.length} item perlu perhatian` : "Stok outlet dalam kondisi aman", icon: "boxes", tone: "mint" },
    { key: "purchasing", eyebrow: "Pengadaan", title: "Cek pembelian", detail: "Pesanan bahan, supplier, dan penerimaan", icon: "packageCheck", tone: "gold" },
    { key: "cash", eyebrow: "Keuangan", title: "Kas & shift", detail: "Opening, mutasi, dan rekonsiliasi", icon: "wallet", tone: "sky" },
  ];
  const followUps: Array<{ key: NavKey; tone: string; icon: UiIconName; title: string; detail: string; action: string }> = [
    { key: "inventory", tone: "warning", icon: "boxes", title: lowStockProducts.length ? `${lowStockProducts.length} item stok menipis` : "Stok outlet aman", detail: lowStockProducts.length ? "Buka inventori untuk mengisi ulang." : "Tetap pantau minimum stok harian.", action: "Buka stok" },
    { key: "purchasing", tone: "info", icon: "packageCheck", title: "Periksa pembelian bahan", detail: "Pastikan pesanan dan penerimaan tercatat rapi.", action: "Buka pembelian" },
    { key: "reports", tone: "neutral", icon: "chartPie", title: "Lihat performa menu", detail: "Bandingkan omzet dan rasio penjualan terbaru.", action: "Buka laporan" },
  ];

  return (
    <div className="management-workspace page-stack">
      <section className="management-overview">
        <div className="management-overview-copy"><span className="section-kicker">Ruang kerja manajemen</span><h2>Kelola kantin dengan lebih tenang</h2><p>Semua kebutuhan operasional ada di sini. Tambah menu, cek stok, pantau pembelian, dan rapikan kas tanpa masuk ke alur kasir.</p></div>
        <div className="management-overview-actions"><button className="secondary-button" type="button" onClick={() => onNavigate("inventory")}><UiIcon name="boxes" size={15} />Periksa stok</button><button className="primary-button" type="button" onClick={() => onNavigate("products")}><UiIcon name="plus" size={15} />Tambah produk</button></div>
      </section>

      <section className="management-stat-grid" aria-label="Ringkasan manajemen">
        {stats.map((stat) => <article className={`management-stat-card ${stat.tone}`} key={stat.label}><div className="management-stat-topline"><span>{stat.label}</span><span className="management-stat-icon"><UiIcon name={stat.icon} size={16} /></span></div><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}
      </section>

      <section className="management-content-grid">
        <article className="card management-actions-card"><div className="management-card-heading"><div><span className="section-kicker">Pusat kendali</span><h2>Apa yang mau kamu rapikan?</h2><p>Pilih area kerja sesuai kebutuhan hari ini.</p></div><span className="management-heading-mark"><UiIcon name="settings" size={18} /></span></div><div className="management-action-grid">{actions.map((action) => <motion.button className={`management-action ${action.tone}`} type="button" key={action.key} onClick={() => onNavigate(action.key)} whileHover={{ y: -2 }} whileTap={{ scale: .985 }}><span className="management-action-icon"><UiIcon name={action.icon} size={18} /></span><span className="management-action-copy"><small>{action.eyebrow}</small><strong>{action.title}</strong><span>{action.detail}</span></span><UiIcon name="arrowUpRight" size={16} /></motion.button>)}</div></article>

        <article className="card management-catalog-card"><div className="management-card-heading"><div><span className="section-kicker">Menu & persediaan</span><h2>Perlu perhatian</h2><p>Item dengan stok paling dekat ke minimum.</p></div><button className="text-link-button" type="button" onClick={() => onNavigate("products")}>Kelola menu <UiIcon name="arrowRight" size={14} /></button></div><div className="management-product-list">{managementProducts.length ? managementProducts.map((product) => <button className="management-product-row" type="button" key={product.id} onClick={() => onNavigate(product.stock <= 10 ? "inventory" : "products")}><span className={`management-product-art ${product.tone}`}><ProductIcon tone={product.tone} size={18} /></span><span className="management-product-copy"><strong>{product.name}</strong><small>{product.category} · {product.stock} tersedia</small></span><span className={product.stock <= 10 ? "management-stock-badge low" : "management-stock-badge"}>{product.stock <= 10 ? "Menipis" : "Aman"}</span><UiIcon name="chevronRight" size={14} /></button>) : <div className="management-empty-state"><UiIcon name="boxes" size={18} />Belum ada menu untuk ditampilkan.</div>}</div><button className="management-card-footer-link" type="button" onClick={() => onNavigate("inventory")}>Lihat semua persediaan <UiIcon name="arrowRight" size={14} /></button></article>
      </section>

      <section className="card management-followup-card"><div className="management-followup-heading"><div><span className="section-kicker">Langkah berikutnya</span><h2>Yang bisa kamu cek sekarang</h2></div><span className="management-live-note"><i />Data demo tersinkron</span></div><div className="management-followup-grid">{followUps.map((item) => <button className={`management-followup-item ${item.tone}`} type="button" key={item.title} onClick={() => onNavigate(item.key)}><span className="management-followup-icon"><UiIcon name={item.icon} size={16} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><span className="management-followup-action">{item.action}<UiIcon name="arrowRight" size={14} /></span></button>)}</div></section>
    </div>
  );
}

function CustomerPortal({ profile, catalog, onLogout, realtimeStatus }: CustomerPortalProps) {
  return <CustomerPortalStorefront profile={profile} catalog={catalog} onLogout={onLogout} realtimeStatus={realtimeStatus} />;
}

function OperationsRoute({ activeNav, outletId = "demo", shiftId = "demo", refreshToken = 0 }: { activeNav: NavKey; outletId?: string; shiftId?: string; refreshToken?: number }) {
  return <OperationsModule activeNav={activeNav as ModuleKey} outletId={outletId} shiftId={shiftId} refreshToken={refreshToken} />;
}

function RealtimeStatusBadge({ status, lastUpdatedAt }: { status: RealtimeConnectionStatus; lastUpdatedAt: number | null }) {
  const title = lastUpdatedAt
    ? `Sinkron terakhir ${formatBandungTime(lastUpdatedAt)} WIB`
    : realtimeStatusCopy[status];
  return <span className={`realtime-status realtime-${status}`} title={title} role="status"><i />{realtimeStatusCopy[status]}</span>;
}

function LoginScreen({ onLogin, initialError }: { onLogin: (profile?: ProfileRecord) => void | Promise<void>; initialError?: string }) {
  return <AuthScreen onLoginSuccess={onLogin} initialError={initialError} />;
}

function WorkspaceHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="workspace-help-backdrop" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.section className="workspace-help-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-help-title" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .985 }} transition={{ duration: .18 }} onMouseDown={(event) => event.stopPropagation()}>
        <div className="workspace-help-heading"><span className="workspace-help-icon"><UiIcon name="info" size={18} /></span><div><span className="section-kicker">Panduan workspace</span><h2 id="workspace-help-title">Mulai dari sini</h2></div><button className="icon-button" type="button" aria-label="Tutup panduan" onClick={onClose}><UiIcon name="arrowLeft" size={17} /></button></div>
        <p>Alur utama CanteenOS sudah dipisah per area supaya pekerjaan harian tidak tercampur.</p>
        <div className="workspace-help-list"><div><span>01</span><strong>Kelola menu</strong><small>Tambah, edit, impor CSV, dan aktifkan menu yang tampil di kasir.</small></div><div><span>02</span><strong>Jaga stok</strong><small>Gunakan opname dan adjustment untuk memperbarui persediaan.</small></div><div><span>03</span><strong>Periksa transaksi</strong><small>Export transaksi, cetak ulang struk, dan proses refund yang menunggu review.</small></div></div>
        <button className="primary-button" type="button" onClick={onClose}>Mengerti <UiIcon name="arrowRight" size={15} /></button>
      </motion.section>
    </motion.div>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavKey>("dashboard");
  const [showLogin, setShowLogin] = useState(false);
  const [authFeedback, setAuthFeedback] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [routeProgress, setRouteProgress] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [adminScrollTopVisible, setAdminScrollTopVisible] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [activeOutletId, setActiveOutletId] = useState("demo");
  const [activeShiftId, setActiveShiftId] = useState("demo");
  const [activeShift, setActiveShift] = useState<OpenShift | null>(null);
  const [demoShiftOpenedAt, setDemoShiftOpenedAt] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [sessionProfile, setSessionProfile] = useState<ProfileRecord | null>(isSupabaseConfigured ? null : demoAdminProfile);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [outletMenuOpen, setOutletMenuOpen] = useState(false);
  const [topbarPanel, setTopbarPanel] = useState<TopbarPanel>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [profileSettingsTab, setProfileSettingsTab] = useState<"profile" | "security">("profile");
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [workspaceSearchMessage, setWorkspaceSearchMessage] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionStatus>(isSupabaseConfigured ? "connecting" : "demo");
  const [realtimeRefreshToken, setRealtimeRefreshToken] = useState(0);
  const [realtimeLastUpdatedAt, setRealtimeLastUpdatedAt] = useState<number | null>(null);
  const adminShellRef = useRef<HTMLElement>(null);
  const adminRouteMotionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authReady || showLogin || sessionProfile?.accountRole === "customer") {
      return;
    }

    const shell = adminShellRef.current;
    if (!shell) return;

    const syncAdminScrollState = () => {
      const shouldShowScrollTop = window.scrollY > 420;
      setAdminScrollTopVisible((current) => current === shouldShowScrollTop ? current : shouldShowScrollTop);
    };

    syncAdminScrollState();
    window.addEventListener("scroll", syncAdminScrollState, { passive: true });
    return () => window.removeEventListener("scroll", syncAdminScrollState);
  }, [authReady, sessionProfile?.accountRole, showLogin]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    const syncDemoShift = () => {
      const openedAt = readDemoShiftOpenedAt();
      setDemoShiftOpenedAt((current) => openedAt ?? current ?? new Date().toISOString());
    };
    syncDemoShift();
    window.addEventListener("focus", syncDemoShift);
    window.addEventListener("storage", syncDemoShift);
    document.addEventListener("visibilitychange", syncDemoShift);
    return () => {
      window.removeEventListener("focus", syncDemoShift);
      window.removeEventListener("storage", syncDemoShift);
      document.removeEventListener("visibilitychange", syncDemoShift);
    };
  }, []);

  const applyProfile = useCallback(async (profile: ProfileRecord): Promise<boolean> => {
    const outletId = profile.defaultOutletId ?? (import.meta.env.VITE_DEFAULT_OUTLET_ID as string | undefined) ?? "demo";
    setSessionProfile(profile);
    setActiveOutletId(outletId);

    if (profile.accountRole === "customer") {
      setActiveShiftId("demo");
      setActiveShift(null);
      try {
        const liveCustomerCatalog = outletId === "demo" ? null : await getCustomerCatalog(outletId);
        setCatalog(liveCustomerCatalog === null ? products : liveCustomerCatalog.map(productFromRecord));
      } catch {
        setCatalog(products);
      }
      return true;
    }

    let openShift: OpenShift | null = null;
    let liveCatalog: ProductRecord[] | null = null;
    if (outletId !== "demo") {
      try {
        openShift = await getOpenShift(outletId);
      } catch {
        // A temporary shift query failure must not invalidate the authenticated session.
      }
      try {
        liveCatalog = await getCatalog(outletId);
      } catch {
        // Keep the authenticated workspace usable with its safe local catalog fallback.
      }
    }
    setActiveShiftId(openShift?.id ?? "demo");
    setActiveShift(openShift);
    if (liveCatalog !== null) {
      setCatalog(liveCatalog.map(productFromRecord));
    }
    return true;
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      setSessionProfile(demoAdminProfile);
      setAuthReady(true);
      return true;
    }

    try {
      const authorization = await getAuthorizedProfile();
      if (!authorization.profile) {
        if (authorization.reason === "google_admin_blocked") await signOut();
        setSessionProfile(null);
        setAuthFeedback(authorization.message ?? "");
        setShowLogin(true);
        return false;
      }
      setAuthFeedback("");
      return await applyProfile(authorization.profile);
    } catch {
      setSessionProfile(null);
      setAuthFeedback("");
      setShowLogin(true);
      return false;
    } finally {
      setAuthReady(true);
    }
  }, [applyProfile]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refreshSession(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshSession]);

  useEffect(() => subscribeToAuthChanges((event) => {
    if (event === "SIGNED_OUT") {
      setSessionProfile(null);
      setActiveShift(null);
      setCatalog(products);
      setAuthFeedback("");
      setShowLogin(true);
      return;
    }
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
      window.setTimeout(() => { void refreshSession(); }, 0);
    }
  }), [refreshSession]);

  const sessionProfileId = sessionProfile?.id;
  const sessionAccountRole = sessionProfile?.accountRole;

  useEffect(() => {
    if (!sessionProfileId || !sessionAccountRole) return;

    let cancelled = false;
    let refreshTimer: number | undefined;
    const pendingAreas = new Set<RealtimeArea>();

    const refreshLiveResources = async () => {
      const areas = new Set(pendingAreas);
      pendingAreas.clear();
      if (cancelled) return;

      try {
        if (areas.has("all") || areas.has("catalog") || areas.has("inventory")) {
          const liveCatalog = sessionAccountRole === "customer"
            ? await getCustomerCatalog(activeOutletId)
            : await getCatalog(activeOutletId);
          if (!cancelled && liveCatalog !== null) setCatalog(liveCatalog.map(productFromRecord));
        }

        if (sessionAccountRole === "admin" && (areas.has("all") || areas.has("shift"))) {
          const openShift = await getOpenShift(activeOutletId);
          if (!cancelled) {
            setActiveShiftId(openShift?.id ?? "demo");
            setActiveShift(openShift);
          }
        }

        if (areas.has("profile")) {
          const authorization = await getAuthorizedProfile(sessionAccountRole);
          if (!cancelled && authorization.profile) setSessionProfile(authorization.profile);
        }
      } finally {
        if (!cancelled) {
          setRealtimeRefreshToken((current) => current + 1);
          setRealtimeLastUpdatedAt(Date.now());
        }
      }
    };

    const scheduleRefresh = (area: RealtimeArea) => {
      pendingAreas.add(area);
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => { void refreshLiveResources(); }, 140);
    };

    const unsubscribe = subscribeToOutletRealtime({
      outletId: activeOutletId,
      profileId: sessionProfileId,
      shiftId: activeShiftId,
      onEvent: (event) => scheduleRefresh(event.area),
      onStatus: setRealtimeStatus,
    });

    return () => {
      cancelled = true;
      if (refreshTimer) window.clearTimeout(refreshTimer);
      unsubscribe();
    };
  }, [activeOutletId, activeShiftId, sessionAccountRole, sessionProfileId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const storedNav = window.localStorage.getItem(NAV_STORAGE_KEY);
        if (isNavKey(storedNav)) setActiveNav(storedNav);
        setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
      } catch {
        // Browser privacy settings can disable persistence; defaults remain usable.
      } finally {
        setPreferencesReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    try {
      window.localStorage.setItem(NAV_STORAGE_KEY, activeNav);
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // The workspace remains usable when persistence is unavailable.
    }
  }, [activeNav, preferencesReady, sidebarCollapsed]);

  useEffect(() => {
    if (!routeProgress) return;
    const timer = window.setTimeout(() => setRouteProgress(false), 520);
    return () => window.clearTimeout(timer);
  }, [activeNav, routeProgress]);

  useEffect(() => {
    if (!routeLoading || !authReady || showLogin) return;
    const timer = window.setTimeout(() => setRouteLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, [activeNav, authReady, routeLoading, showLogin]);

  useEffect(() => {
    const shell = adminShellRef.current;
    const routeView = adminRouteMotionRef.current;
    if (!shell || !routeView || showLogin || !authReady) return;

    let cleanup: (() => void) | undefined;
    const frame = window.requestAnimationFrame(() => {
      cleanup = prepareAdminMotion(shell, routeView, routeLoading);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, [activeNav, authReady, routeLoading, showLogin]);

  const handleLoginSuccess = async (profile?: ProfileRecord) => {
    if (!isSupabaseConfigured && profile) {
      await applyProfile(profile);
      setAuthFeedback("");
      setShowLogin(false);
      return;
    }
    if (await refreshSession()) setShowLogin(false);
  };

  const handleLogout = async () => {
    await signOut();
    setSessionProfile(null);
    setActiveOutletId("demo");
    setActiveShiftId("demo");
    setActiveShift(null);
    setCatalog(products);
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setOutletMenuOpen(false);
    setTopbarPanel(null);
    setHelpOpen(false);
    setProfileSettingsOpen(false);
    setAuthFeedback("");
    setShowLogin(true);
  };

  const openProfileSettings = (tab: "profile" | "security") => {
    setProfileSettingsTab(tab);
    setProfileSettingsOpen(true);
    setProfileMenuOpen(false);
    setOutletMenuOpen(false);
    setTopbarPanel(null);
  };

  const activeMeta = pageMeta[activeNav];
  const profileFirstName = sessionProfile?.fullName.trim().split(/\s+/)[0] || "Pengguna";
  const activeTitle = activeNav === "dashboard" ? `Selamat sore, ${profileFirstName}` : activeMeta.title;
  const handleNavigate = (key: NavKey) => {
    if (key !== activeNav) {
      setRouteProgress(true);
      setRouteLoading(true);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setActiveNav(key);
    setMobileMenuOpen(false);
    setOutletMenuOpen(false);
    setTopbarPanel(null);
  };

  const handleWorkspaceSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = workspaceQuery.trim().toLowerCase();
    if (!query) {
      setWorkspaceSearchMessage("Ketik nama halaman untuk mencari.");
      window.setTimeout(() => setWorkspaceSearchMessage(""), 2200);
      return;
    }

    const match = workspaceSearchRoutes.find((route) => route.keywords.some((keyword) => query.includes(keyword)));
    if (!match) {
      setWorkspaceSearchMessage("Halaman belum ditemukan di workspace ini.");
      window.setTimeout(() => setWorkspaceSearchMessage(""), 2200);
      return;
    }

    setWorkspaceQuery("");
    setWorkspaceSearchMessage(`Membuka ${match.nav === "dashboard" ? "Dashboard" : pageMeta[match.nav].title}.`);
    handleNavigate(match.nav);
    window.setTimeout(() => setWorkspaceSearchMessage(""), 1400);
  };

  const scrollAdminToTop = () => window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  if (!authReady) return <WorkspaceBootSkeleton />;
  if (showLogin) return <LoginScreen key={authFeedback} onLogin={handleLoginSuccess} initialError={authFeedback} />;
  if (sessionProfile?.accountRole === "customer") return <CustomerPortal profile={sessionProfile} catalog={catalog} onLogout={handleLogout} realtimeStatus={realtimeStatus} />;

  const displayProfile = sessionProfile ?? demoAdminProfile;
  const displayRole = displayProfile.accountRole === "admin" ? roleLabels[displayProfile.role] : "Pelanggan";
  const lowStockCount = catalog.filter((product) => product.stock <= 10).length;
  const reviewCount = demoTransactions.filter((transaction) => transaction.status === "review").length;
  const workspaceNotifications: WorkspaceNotification[] = [
    ...(lowStockCount > 0 ? [{ id: "low-stock", title: `${lowStockCount} item stok menipis`, detail: "Buka inventory untuk cek kebutuhan reorder.", icon: "boxes" as const, tone: "warning", target: "inventory" as const }] : []),
    ...(reviewCount > 0 ? [{ id: "refund-review", title: `${reviewCount} refund menunggu review`, detail: "Periksa transaksi sebelum pelanggan menunggu lebih lama.", icon: "undo" as const, tone: "danger", target: "transactions" as const }] : []),
    ...((activeShift || activeOutletId === "demo") ? [{ id: "active-shift", title: "Shift kasir masih aktif", detail: "Kas dan penjualan sedang dipantau realtime.", icon: "clock" as const, tone: "success", target: "cash" as const }] : []),
  ];
  const unreadNotificationCount = workspaceNotifications.filter((item) => !readNotificationIds.includes(item.id)).length;
  const toggleTopbarPanel = (panel: Exclude<TopbarPanel, null>) => {
    setProfileMenuOpen(false);
    setOutletMenuOpen(false);
    setTopbarPanel((current) => current === panel ? null : panel);
  };
  const toggleOutletMenu = () => {
    setProfileMenuOpen(false);
    setTopbarPanel(null);
    setOutletMenuOpen((current) => !current);
  };
  const closeOutletMenu = () => setOutletMenuOpen(false);

  return (
    <main ref={adminShellRef} className={`${sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}${routeLoading ? " is-route-loading" : ""}`} aria-busy={routeLoading}>
      <aside className={`sidebar${routeLoading ? " is-route-loading" : " is-route-ready"}`}>
        <div className="sidebar-brand"><span className="brand-mark"><CanteenOSMark size={42} /></span><span className="sidebar-brand-copy"><strong>Canteen<span>OS</span></strong><small>Digital School Canteen</small></span><button className="sidebar-collapse" type="button" aria-label={sidebarCollapsed ? "Perluas navigasi" : "Ciutkan navigasi"} aria-pressed={sidebarCollapsed} onClick={() => setSidebarCollapsed((current) => !current)}><UiIcon name={sidebarCollapsed ? "arrowRight" : "arrowLeft"} size={15} /></button></div>
        <div className="sidebar-profile"><div className="sidebar-profile-avatar-wrap"><ProfileAvatar profile={displayProfile} className="profile-avatar" /><span className="online-indicator" /></div><div><strong>{displayProfile.fullName}</strong><span>{displayRole}</span></div><span className="profile-menu">•••</span></div>
        <nav className="side-nav" aria-label="Navigasi utama"><NavSections activeNav={activeNav} onNavigate={handleNavigate} motionIndicator /></nav>
        <div className="sidebar-bottom"><div className="support-card"><span className="support-icon"><UiIcon name="info" size={18} /></span><strong>Butuh bantuan?</strong><span>Pelajari alur manajemen dan SOP operasional.</span><button type="button" onClick={() => setHelpOpen(true)}>Buka panduan <UiIcon name="arrowRight" size={15} /></button></div><button type="button" className="logout-button" onClick={handleLogout}><span><UiIcon name="arrowLeft" size={15} /></span> Keluar dari akun</button><div className="sidebar-meta"><span className="sidebar-shift-status"><i className="online-dot realtime-dot-live" />Shift aktif</span></div></div>
      </aside>
      <section className="main-content">
        <header className={`topbar${routeLoading ? " is-route-loading" : " is-route-ready"}`}>
          <button className="mobile-menu-button" type="button" aria-label="Buka menu navigasi" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((current) => !current)}><UiIcon name="menu" size={16} /><span>Menu</span></button>
          <div className="mobile-brand"><span className="brand-mark"><CanteenOSMark size={34} /></span><strong>Canteen<span>OS</span></strong></div>
          <div className="breadcrumb"><span>Workspace</span><i>•</i><strong>{activeNav === "dashboard" ? `Selamat datang kembali, ${profileFirstName}` : activeMeta.title}</strong></div>
          <form className="admin-header-search" role="search" onSubmit={handleWorkspaceSearch}><UiIcon name="search" size={15} /><input type="search" aria-label="Cari di workspace" placeholder="Cari apa saja" value={workspaceQuery} onChange={(event) => { setWorkspaceQuery(event.target.value); setWorkspaceSearchMessage(""); }} /></form>
          {workspaceSearchMessage && <span className="admin-search-status" role="status">{workspaceSearchMessage}</span>}
          <div className="topbar-actions"><div className="outlet-select-wrap"><button className="outlet-select" type="button" aria-haspopup="menu" aria-expanded={outletMenuOpen} onClick={toggleOutletMenu}><span className="outlet-dot" /><span><small>Outlet aktif</small>Outlet Utama</span><UiIcon name="chevronDown" size={16} /></button><AnimatePresence>{outletMenuOpen && <motion.div className="outlet-popover" role="menu" aria-label="Pilih outlet" initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .985 }} transition={{ duration: .16 }}><div className="outlet-popover-heading"><span className="section-kicker">Outlet kerja</span><strong>Pilih outlet aktif</strong></div><button className="outlet-option is-selected" type="button" role="menuitemradio" aria-checked="true" onClick={closeOutletMenu}><span className="outlet-option-icon"><UiIcon name="store" size={16} /></span><span><strong>Outlet Utama</strong><small>{activeOutletId === "demo" ? "Mode demo lokal" : "Outlet default akun"}</small></span><UiIcon name="circleCheck" size={16} /></button></motion.div>}</AnimatePresence></div><button className={topbarPanel === "messages" ? "icon-button admin-message-button is-active" : "icon-button admin-message-button"} type="button" aria-label="Pesan masuk" aria-expanded={topbarPanel === "messages"} onClick={() => toggleTopbarPanel("messages")}><UiIcon name="fileText" size={17} /></button><button className={topbarPanel === "notifications" ? "icon-button is-active" : "icon-button"} type="button" aria-label="Notifikasi" aria-expanded={topbarPanel === "notifications"} onClick={() => toggleTopbarPanel("notifications")}><UiIcon name="bell" size={17} />{unreadNotificationCount > 0 && <span className="notification-dot" />}</button><div className="top-profile-wrap"><button className="top-profile" type="button" aria-haspopup="menu" aria-expanded={profileMenuOpen} onClick={() => { setTopbarPanel(null); setOutletMenuOpen(false); setProfileMenuOpen((current) => !current); }}><ProfileAvatar profile={displayProfile} className="top-avatar" /><span><strong>{displayProfile.fullName}</strong><small>{displayRole}</small></span><UiIcon name="chevronDown" size={16} /></button><AnimatePresence>{profileMenuOpen && <motion.div className="profile-popover" role="menu" initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .985 }} transition={{ duration: .16 }}><div className="profile-popover-head"><ProfileAvatar profile={displayProfile} className="profile-popover-avatar" /><span><strong>{displayProfile.fullName}</strong><small>{displayRole}</small></span></div><button type="button" role="menuitem" onClick={() => openProfileSettings("profile")}><span><UiIcon name="user" size={16} /></span><span><strong>Profil & foto</strong><small>Nama dan foto profil</small></span><UiIcon name="chevronRight" size={15} /></button><button type="button" role="menuitem" onClick={() => openProfileSettings("security")}><span><UiIcon name="settings" size={16} /></span><span><strong>Password & keamanan</strong><small>Perbarui password akun</small></span><UiIcon name="chevronRight" size={15} /></button><button className="profile-popover-logout" type="button" role="menuitem" onClick={handleLogout}><span><UiIcon name="arrowLeft" size={16} /></span><span><strong>Keluar</strong><small>Akhiri sesi perangkat ini</small></span></button></motion.div>}</AnimatePresence></div><AnimatePresence>{topbarPanel && <motion.div className="topbar-panel" role="dialog" aria-label={topbarPanel === "notifications" ? "Notifikasi workspace" : "Pesan masuk"} initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: .985 }} transition={{ duration: .16 }}>{topbarPanel === "notifications" ? <><div className="topbar-panel-heading"><div><span className="section-kicker">Pusat perhatian</span><strong>Notifikasi</strong></div><div className="topbar-panel-heading-actions">{unreadNotificationCount > 0 && <button type="button" onClick={() => setReadNotificationIds(workspaceNotifications.map((item) => item.id))}>Tandai dibaca</button>}<button className="topbar-panel-back" type="button" aria-label="Kembali" onClick={() => setTopbarPanel(null)}><UiIcon name="arrowLeft" size={15} /></button></div></div><div className="topbar-panel-list">{workspaceNotifications.length ? workspaceNotifications.map((item) => <button className="topbar-panel-item" type="button" key={item.id} onClick={() => { setReadNotificationIds((current) => current.includes(item.id) ? current : [...current, item.id]); handleNavigate(item.target); }}><span className={`topbar-panel-icon ${item.tone}`}><UiIcon name={item.icon} size={15} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><UiIcon name="chevronRight" size={14} /></button>) : <div className="topbar-panel-empty"><UiIcon name="circleCheck" size={20} /><strong>Semua aman</strong><span>Tidak ada hal yang perlu ditindaklanjuti.</span></div>}</div></> : <><div className="topbar-panel-heading"><div><span className="section-kicker">Workspace</span><strong>Pesan masuk</strong></div><button type="button" onClick={() => setTopbarPanel(null)}>Tutup</button></div><div className="topbar-panel-list"><button className="topbar-panel-item" type="button" onClick={() => handleNavigate("reports")}><span className="topbar-panel-icon info"><UiIcon name="chartLine" size={15} /></span><span><strong>Ringkasan laporan siap dilihat</strong><small>Data omzet dan rasio penjualan sudah tersedia untuk periode berjalan.</small></span><UiIcon name="chevronRight" size={14} /></button><button className="topbar-panel-item" type="button" onClick={() => handleNavigate("products")}><span className="topbar-panel-icon success"><UiIcon name="package" size={15} /></span><span><strong>Master menu tetap sinkron</strong><small>Gunakan menu untuk menambah atau memperbarui produk.</small></span><UiIcon name="chevronRight" size={14} /></button></div></>}</motion.div>}</AnimatePresence></div>
        </header>
        <AnimatePresence>{routeProgress && <motion.div key="admin-route-progress" className="route-progress" role="progressbar" aria-label="Membuka halaman" initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .42, ease: [0.22, 1, 0.36, 1] }} />}</AnimatePresence>
        <AnimatePresence>
          {mobileMenuOpen && <motion.button key="mobile-menu-scrim" className="mobile-menu-scrim" type="button" aria-label="Tutup menu navigasi" onClick={() => setMobileMenuOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
          {mobileMenuOpen && <motion.nav key="mobile-menu-panel" className="mobile-menu" aria-label="Menu navigasi mobile" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: .22, ease: [0.22, 1, 0.36, 1] }}><div className="mobile-menu-brand"><span className="brand-mark"><CanteenOSMark size={42} /></span><button className="mobile-menu-close" type="button" aria-label="Tutup panel navigasi" onClick={() => setMobileMenuOpen(false)}><UiIcon name="arrowLeft" size={18} /></button></div><NavSections activeNav={activeNav} onNavigate={handleNavigate} /></motion.nav>}
        </AnimatePresence>
        <nav className={`${mobileMenuOpen ? "mobile-bottom-nav is-menu-open" : "mobile-bottom-nav"}${routeLoading ? " is-route-loading" : " is-route-ready"}`} aria-label="Navigasi cepat"><div className="mobile-bottom-nav-surface">{mobilePrimaryNavItems.map((item) => <button type="button" key={item.id} aria-current={activeNav === item.id ? "page" : undefined} className={activeNav === item.id ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"} onClick={() => handleNavigate(item.id)}><span className="nav-icon"><UiIcon name={item.icon} size={16} /></span><span>{item.label}</span></button>)}</div></nav>
        <div className="content-wrap">
          <AnimatePresence mode="wait" initial={false}>
            <div ref={adminRouteMotionRef} className={`route-view${routeLoading ? " is-route-loading" : " is-route-ready"}`} key={activeNav}>
              {routeLoading ? <AdminPageHeaderSkeleton activeNav={activeNav} /> : <div className={activeNav === "dashboard" ? "page-header dashboard-welcome-card" : "page-header"}>
                <div className="page-title-block"><span className="section-kicker">{activeMeta.eyebrow}</span><h1>{activeTitle}</h1><p>{activeMeta.description}</p><div className="page-context"><span className="page-context-outlet" title="Outlet Utama" aria-label="Outlet Utama"><UiIcon name="store" size={13} /><b>Outlet Utama</b></span><RealtimeStatusBadge status={realtimeStatus} lastUpdatedAt={realtimeLastUpdatedAt} /></div></div>
                <div className="page-actions">{activeNav === "dashboard" && <><button className="secondary-button" type="button" onClick={() => handleNavigate("reports")}>Unduh laporan <UiIcon name="arrowDown" size={15} /></button><button className="primary-button" type="button" onClick={() => handleNavigate("pos")}>Buka manajemen <UiIcon name="arrowRight" size={15} /></button></>}{activeNav === "pos" && <><button className="secondary-button" type="button" onClick={() => handleNavigate("purchasing")}><UiIcon name="packageCheck" size={15} />Cek pembelian</button><button className="primary-button" type="button" onClick={() => handleNavigate("products")}><UiIcon name="plus" size={15} />Tambah produk</button></>}</div>
              </div>}
                {routeLoading ? (
                  <div className="route-content-state route-content-loading" key={`skeleton-${activeNav}`}>
                    <RouteSkeleton activeNav={activeNav} />
                  </div>
                ) : (
                  <div className="route-content-state route-content-ready" key={`content-${activeNav}`}>
                    {activeNav === "dashboard" ? <Dashboard onNavigate={handleNavigate} outletId={activeOutletId} refreshToken={realtimeRefreshToken} shiftOpenedAt={activeShift?.openedAt ?? demoShiftOpenedAt} shiftCashierName={displayProfile.fullName} /> : activeNav === "pos" ? <ManagementWorkspace catalog={catalog} onNavigate={handleNavigate} /> : <OperationsRoute activeNav={activeNav} outletId={activeOutletId} shiftId={activeShiftId} refreshToken={realtimeRefreshToken} />}
                  </div>
                )}
            </div>
          </AnimatePresence>
        </div>
      </section>
      <AnimatePresence>
        {adminScrollTopVisible && <motion.button className="admin-scroll-top" type="button" aria-label="Kembali ke atas" onClick={scrollAdminToTop} initial={{ opacity: 0, y: 8, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .94 }} transition={{ duration: .2, ease: [0.22, 1, 0.36, 1] }}><UiIcon name="chevronDown" size={14} className="admin-scroll-top-icon" /><span>Ke atas</span></motion.button>}
      </AnimatePresence>
      <AnimatePresence>{helpOpen && <WorkspaceHelpModal onClose={() => setHelpOpen(false)} />}</AnimatePresence>
      {profileSettingsOpen && <ProfileSettings profile={displayProfile} initialTab={profileSettingsTab} onClose={() => setProfileSettingsOpen(false)} onProfileChanged={setSessionProfile} onLogout={handleLogout} />}
    </main>
  );
}
