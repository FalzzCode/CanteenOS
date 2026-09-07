"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";

import type { ProfileRecord } from "../lib/domain";
import { isSupabaseConfigured } from "../lib/supabase/client";
import { realtimeStatusCopy } from "../lib/supabase/realtime";
import { ProfileAvatar } from "./profile-settings";
import { CanteenOSMark, ProductIcon, UiIcon, type UiIconName } from "./ui-icons";
import type { CustomerPortalProduct, CustomerPortalProps } from "./customer-portal.types";
import { CustomerLenisScroll } from "./customer-lenis";
import { prepareCustomerMotion } from "./page-motion";

type CustomerOrderStatus = "received" | "preparing" | "ready" | "completed";
type CustomerView = "home" | "menu" | "order" | "offers" | "profile";
type CustomerMenuSortOption = "featured" | "priceAsc" | "priceDesc";
type CartItem = CustomerPortalProduct & { quantity: number };
type CustomerPaymentMethodId = "cash" | "gopay" | "dana" | "bca" | "bri" | "mandiri";
type CustomerPaymentMethod = {
  id: CustomerPaymentMethodId;
  label: string;
  description: string;
  icon: UiIconName;
  appUrl?: string;
};
type CustomerPaymentProof = {
  fileName: string;
  dataUrl: string;
};
type CustomerOrder = {
  id: string;
  queueNumber: number;
  createdAt: string;
  pickupSlot: string;
  status: CustomerOrderStatus;
  items: CartItem[];
  total: number;
  paymentMethod?: CustomerPaymentMethodId;
  paymentProof?: CustomerPaymentProof;
};

const CUSTOMER_FAVORITES_STORAGE_KEY = "kantinkita-customer-favorites";
const CUSTOMER_ORDERS_STORAGE_KEY = "kantinkita-customer-orders";

const customerPickupOptions = [
  { value: "Sekarang", label: "Sekarang", helper: "Estimasi 10–15 menit" },
  { value: "10.15–10.30", label: "10.15–10.30", helper: "Ambil setelah jam pelajaran" },
  { value: "10.30–10.45", label: "10.30–10.45", helper: "Kasir siapkan sebelum datang" },
  { value: "11.00–11.15", label: "11.00–11.15", helper: "Pas untuk jam istirahat" },
];

const customerPaymentMethods: CustomerPaymentMethod[] = [
  { id: "cash", label: "Cash", description: "Bayar di kasir", icon: "banknote" },
  { id: "gopay", label: "GoPay", description: "Buka aplikasi GoPay", icon: "wallet", appUrl: "gojek://gopay" },
  { id: "dana", label: "DANA", description: "Buka aplikasi DANA", icon: "walletMinimal", appUrl: "dana://home" },
  { id: "bca", label: "BCA mobile", description: "Buka aplikasi BCA", icon: "creditCard", appUrl: "bca://" },
  { id: "bri", label: "BRImo", description: "Buka aplikasi BRImo", icon: "creditCard", appUrl: "brimo://home" },
  { id: "mandiri", label: "Livin' by Mandiri", description: "Buka aplikasi Livin'", icon: "creditCard", appUrl: "livin://" },
];

const customerPaymentBrandLabels: Record<Exclude<CustomerPaymentMethodId, "cash">, string> = {
  gopay: "Go",
  dana: "DANA",
  bca: "BCA",
  bri: "BRI",
  mandiri: "L",
};

const CUSTOMER_PAYMENT_PROOF_MAX_BYTES = 5 * 1024 * 1024;
const CUSTOMER_PAYMENT_PROOF_MAX_DIMENSION = 1600;

const customerOrderSteps: Array<{ status: CustomerOrderStatus; label: string; description: string; icon: UiIconName }> = [
  { status: "received", label: "Diterima", description: "Pesanan masuk ke kasir.", icon: "circleCheck" },
  { status: "preparing", label: "Disiapkan", description: "Menu sedang dibuat.", icon: "clock" },
  { status: "ready", label: "Siap diambil", description: "Tinggal ambil di kasir.", icon: "packageCheck" },
];

const customerOrderStatusCopy: Record<CustomerOrderStatus, string> = {
  received: "Pesanan diterima",
  preparing: "Sedang disiapkan",
  ready: "Siap diambil",
  completed: "Selesai",
};

const customerNavigationItems: Array<{ view: CustomerView; label: string; description: string; icon: UiIconName }> = [
  { view: "home", label: "Home", description: "Ringkasan kantin", icon: "home" },
  { view: "menu", label: "Menu", description: "Pilih makanan favorit", icon: "utensils" },
  { view: "order", label: "Order", description: "Pantau antrean pesanan", icon: "shoppingBag" },
  { view: "offers", label: "Offers", description: "Promo untuk hari ini", icon: "tag" },
  { view: "profile", label: "Profil", description: "Akun dan preferensi", icon: "user" },
];

const customerAssetByName: Record<string, string> = {
  "Nasi Goreng Spesial": "/customer-assets/nasi-goreng.png",
  "Es Teh Manis": "/customer-assets/es-teh-manis.png",
  "Roti Bakar Coklat": "/customer-assets/roti-bakar-coklat.png",
  "Air Mineral 600ml": "/customer-assets/air-mineral.png",
  "Mie Goreng Telur": "/customer-assets/mie-goreng-telur.png",
  "Pisang Keju": "/customer-assets/pisang-keju.png",
  "Susu Coklat": "/customer-assets/susu-coklat.png",
  "Chicken Pop": "/customer-assets/chicken-pop.png",
};

const customerAssetByCategory: Record<string, string> = {
  Makanan: "/customer-assets/nasi-goreng.png",
  Minuman: "/customer-assets/es-teh-manis.png",
  Camilan: "/customer-assets/roti-bakar-coklat.png",
};

type CustomerHeroSlide = {
  image: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  cta: string;
  alt: string;
};

const customerHeroSlides: CustomerHeroSlide[] = [
  {
    image: "/customer-assets/customer-hero.png",
    eyebrow: "RASA LEBIH SERU",
    title: "Enak, cepat,",
    highlight: "tinggal ambil.",
    description: "Favorit kantinmu siap menemani jam istirahat.",
    cta: "Pesan sekarang",
    alt: "Nasi goreng, roti bakar, dan es teh CanteenOS",
  },
  {
    image: "/customer-assets/nasi-goreng.png",
    eyebrow: "MENU FAVORIT",
    title: "Hangat, gurih,",
    highlight: "siap dinikmati.",
    description: "Nasi goreng spesial untuk jeda makan yang lebih nikmat.",
    cta: "Lihat menu",
    alt: "Nasi Goreng Spesial CanteenOS",
  },
  {
    image: "/customer-assets/roti-bakar-coklat.png",
    eyebrow: "CAMILAN HARI INI",
    title: "Manisnya pas,",
    highlight: "mood ikut naik.",
    description: "Roti bakar coklat yang enak untuk teman ngobrol.",
    cta: "Pilih camilan",
    alt: "Roti Bakar Coklat CanteenOS",
  },
];

function readCustomerStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

const customerStorageKey = (base: string, profileId: string) => `${base}:${profileId || "demo-customer"}`;
const profileInitials = (profile: ProfileRecord) => profile.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "KS";
const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const customerPaymentMethodLabel = (id?: CustomerPaymentMethodId) => customerPaymentMethods.find((method) => method.id === id)?.label ?? "Cash";
const formatCustomerOrderDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru saja";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
};
const createCustomerOrderId = () => `KK-${String(Date.now()).slice(-6)}`;

function customerProductAsset(product: CustomerPortalProduct) {
  return product.imageUrl || customerAssetByName[product.name] || customerAssetByCategory[product.category] || null;
}

function CustomerProductVisual({ product, size = 34 }: { product: CustomerPortalProduct; size?: number }) {
  const asset = customerProductAsset(product);
  return <span className={`customer-product-visual ${product.tone}`} aria-hidden="true">
    {asset ? <img src={asset} alt="" loading="lazy" /> : <ProductIcon tone={product.tone} size={size} />}
  </span>;
}

function CustomerPaymentLogo({ method }: { method: CustomerPaymentMethod }) {
  if (method.id === "cash") return <UiIcon name={method.icon} size={17} />;
  if (method.id === "gopay") return <Image className="customer-payment-brand-image" src="/payment-logos/gopay-logogram-blue.svg" alt="" width={22} height={21} />;
  return <span className={`customer-payment-brand customer-payment-brand-${method.id}`} aria-hidden="true">{customerPaymentBrandLabels[method.id]}</span>;
}

function readCustomerPaymentProof(file: File): Promise<CustomerPaymentProof> {
  return new Promise((resolve, reject) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      reject(new Error("Gunakan gambar JPG, PNG, atau WEBP."));
      return;
    }
    if (file.size > CUSTOMER_PAYMENT_PROOF_MAX_BYTES) {
      reject(new Error("Ukuran bukti pembayaran maksimal 5 MB."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gambar belum bisa dibaca. Coba pilih ulang."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Gambar belum bisa dibaca. Coba pilih ulang."));
        return;
      }

      const source = new window.Image();
      source.onerror = () => reject(new Error("Gambar tidak valid. Coba gunakan screenshot lain."));
      source.onload = () => {
        const largestSide = Math.max(source.naturalWidth, source.naturalHeight);
        const scale = largestSide > CUSTOMER_PAYMENT_PROOF_MAX_DIMENSION ? CUSTOMER_PAYMENT_PROOF_MAX_DIMENSION / largestSide : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve({ fileName: file.name, dataUrl: reader.result as string });
          return;
        }
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        resolve({ fileName: file.name, dataUrl: canvas.toDataURL("image/jpeg", .84) });
      };
      source.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function CustomerSkeletonBlock({ className = "" }: { className?: string }) {
  return <span className={`customer-skeleton-block ${className}`} aria-hidden="true" />;
}

function CustomerSkeletonHeading({ variant = "default" }: { variant?: "default" | "order" | "profile" }) {
  return <div className={`customer-skeleton-heading customer-skeleton-heading-${variant}`}>
    <CustomerSkeletonBlock className="customer-skeleton-eyebrow" />
    <CustomerSkeletonBlock className="customer-skeleton-title" />
    <CustomerSkeletonBlock className="customer-skeleton-paragraph" />
  </div>;
}

function CustomerSkeletonSearch() {
  return <div className="customer-skeleton-search" aria-hidden="true"><CustomerSkeletonBlock className="customer-skeleton-search-icon" /><CustomerSkeletonBlock className="customer-skeleton-search-field" /><CustomerSkeletonBlock className="customer-skeleton-search-action" /></div>;
}

function CustomerSkeletonProductCard() {
  return <article className="customer-skeleton-product-card" aria-hidden="true">
    <CustomerSkeletonBlock className="customer-skeleton-product-media" />
    <div className="customer-skeleton-product-copy">
      <CustomerSkeletonBlock className="customer-skeleton-product-category" />
      <CustomerSkeletonBlock className="customer-skeleton-product-title" />
      <CustomerSkeletonBlock className="customer-skeleton-product-meta" />
      <div><CustomerSkeletonBlock className="customer-skeleton-product-price" /><CustomerSkeletonBlock className="customer-skeleton-product-action" /></div>
    </div>
  </article>;
}

function CustomerSkeletonCategories() {
  return <div className="customer-skeleton-category-row" aria-hidden="true">
    {Array.from({ length: 5 }, (_, index) => <div className="customer-skeleton-category" key={index}><CustomerSkeletonBlock className="customer-skeleton-category-art" /><CustomerSkeletonBlock className="customer-skeleton-category-label" /></div>)}
  </div>;
}

function CustomerSkeletonSectionHeading() {
  return <div className="customer-skeleton-section-heading" aria-hidden="true"><span><CustomerSkeletonBlock className="customer-skeleton-eyebrow" /><CustomerSkeletonBlock className="customer-skeleton-section-title" /></span><CustomerSkeletonBlock className="customer-skeleton-section-action" /></div>;
}

function CustomerSkeletonActiveOrder({ compact = false }: { compact?: boolean }) {
  return <div className={`customer-skeleton-active-order${compact ? " customer-skeleton-active-order-compact" : ""}`} aria-hidden="true">
    <div className="customer-skeleton-active-order-head"><CustomerSkeletonBlock className="customer-skeleton-eyebrow" /><CustomerSkeletonBlock className="customer-skeleton-section-title" /><CustomerSkeletonBlock className="customer-skeleton-paragraph short" /></div>
    <div className="customer-skeleton-progress"><CustomerSkeletonBlock /><CustomerSkeletonBlock /><CustomerSkeletonBlock /></div>
    {!compact && <div className="customer-skeleton-active-order-footer"><CustomerSkeletonBlock className="customer-skeleton-product-meta" /><CustomerSkeletonBlock className="customer-skeleton-action" /></div>}
  </div>;
}

function CustomerSkeletonHistory() {
  return <div className="customer-skeleton-history-panel" aria-hidden="true">
    <CustomerSkeletonSectionHeading />
    <div className="customer-skeleton-history-list"><div><CustomerSkeletonBlock className="customer-skeleton-list-icon" /><span><CustomerSkeletonBlock className="customer-skeleton-product-title" /><CustomerSkeletonBlock className="customer-skeleton-product-meta" /></span><CustomerSkeletonBlock className="customer-skeleton-action" /></div></div>
  </div>;
}

function CustomerPageSkeleton({ view }: { view: CustomerView }) {
  const labels: Record<CustomerView, string> = { home: "beranda pelanggan", menu: "menu", order: "pesanan", offers: "offers", profile: "profil" };
  const productCards = Array.from({ length: view === "home" ? 3 : view === "menu" ? 8 : 6 }, (_, index) => <CustomerSkeletonProductCard key={index} />);

  return <section className={`customer-page-skeleton customer-page-skeleton-${view}`} role="status" aria-label={`Memuat ${labels[view]}`}>
    <div className="customer-skeleton-visual" aria-hidden="true">
      {view === "home" && <>
        <div className="customer-skeleton-intro"><CustomerSkeletonHeading /><CustomerSkeletonBlock className="customer-skeleton-intro-art" /><CustomerSkeletonBlock className="customer-skeleton-service-pill" /></div>
        <CustomerSkeletonSearch />
        <div className="customer-skeleton-hero"><CustomerSkeletonBlock className="customer-skeleton-hero-copy" /><CustomerSkeletonBlock className="customer-skeleton-hero-art" /><div className="customer-skeleton-hero-dots"><CustomerSkeletonBlock /><CustomerSkeletonBlock /><CustomerSkeletonBlock /></div></div>
        <div className="customer-skeleton-section customer-skeleton-home-categories"><CustomerSkeletonSectionHeading /><CustomerSkeletonCategories /></div>
        <CustomerSkeletonActiveOrder compact />
        <div className="customer-skeleton-section customer-skeleton-home-popular"><CustomerSkeletonSectionHeading /><div className="customer-skeleton-product-grid">{productCards}</div></div>
        <CustomerSkeletonBlock className="customer-skeleton-offer-banner" />
      </>}

      {view === "menu" && <>
        <div className="customer-skeleton-page-heading"><CustomerSkeletonHeading /><CustomerSkeletonBlock className="customer-skeleton-count" /></div>
        <CustomerSkeletonSearch />
        <CustomerSkeletonCategories />
        <div className="customer-skeleton-product-grid">{productCards}</div>
      </>}

      {view === "order" && <>
        <div className="customer-skeleton-page-heading"><CustomerSkeletonHeading variant="order" /><CustomerSkeletonBlock className="customer-skeleton-order-count" /></div>
        <CustomerSkeletonActiveOrder />
        <div className="customer-skeleton-order-layout"><div className="customer-skeleton-panel"><CustomerSkeletonSectionHeading />{Array.from({ length: 3 }, (_, index) => <div className="customer-skeleton-order-row" key={index}><CustomerSkeletonBlock className="customer-skeleton-order-thumb" /><span><CustomerSkeletonBlock className="customer-skeleton-product-title" /><CustomerSkeletonBlock className="customer-skeleton-product-meta" /></span><CustomerSkeletonBlock className="customer-skeleton-quantity" /></div>)}</div><div className="customer-skeleton-panel customer-skeleton-checkout"><CustomerSkeletonBlock className="customer-skeleton-eyebrow" /><CustomerSkeletonBlock className="customer-skeleton-section-title" /><CustomerSkeletonBlock className="customer-skeleton-form-row" /><div className="customer-skeleton-payment-methods"><CustomerSkeletonBlock className="customer-skeleton-payment-heading" /><div className="customer-skeleton-payment-grid">{Array.from({ length: 6 }, (_, index) => <CustomerSkeletonBlock className="customer-skeleton-payment-option" key={index} />)}</div></div><div className="customer-skeleton-payment-proof"><CustomerSkeletonBlock className="customer-skeleton-payment-proof-heading" /><CustomerSkeletonBlock className="customer-skeleton-payment-proof-upload" /></div><CustomerSkeletonBlock className="customer-skeleton-total" /><CustomerSkeletonBlock className="customer-skeleton-checkout-action" /></div></div>
        <CustomerSkeletonHistory />
      </>}

      {view === "offers" && <>
        <div className="customer-skeleton-page-heading"><CustomerSkeletonHeading /></div>
        <div className="customer-skeleton-offer-grid"><CustomerSkeletonBlock className="customer-skeleton-offer-card purple" /><CustomerSkeletonBlock className="customer-skeleton-offer-card peach" /></div>
        <CustomerSkeletonBlock className="customer-skeleton-offer-note" />
      </>}

      {view === "profile" && <>
        <div className="customer-skeleton-profile-hero">
          <div className="customer-skeleton-profile-cover"><CustomerSkeletonBlock className="customer-skeleton-profile-cover-field" /><CustomerSkeletonBlock className="customer-skeleton-profile-back" /><CustomerSkeletonBlock className="customer-skeleton-profile-brand" /><CustomerSkeletonBlock className="customer-skeleton-profile-settings" /></div>
          <div className="customer-skeleton-profile-avatar-stage"><CustomerSkeletonBlock className="customer-skeleton-profile-avatar" /></div>
          <div className="customer-skeleton-profile-identity"><CustomerSkeletonHeading variant="profile" /><div className="customer-skeleton-profile-actions"><CustomerSkeletonBlock /><CustomerSkeletonBlock /></div></div>
        </div>
        <div className="customer-skeleton-quick-actions"><CustomerSkeletonBlock /><CustomerSkeletonBlock /><CustomerSkeletonBlock /></div>
        <div className="customer-skeleton-profile-stats">{Array.from({ length: 3 }, (_, index) => <div className="customer-skeleton-profile-stat" key={index}><CustomerSkeletonBlock className="customer-skeleton-profile-stat-value" /><CustomerSkeletonBlock className="customer-skeleton-profile-stat-label" /><CustomerSkeletonBlock className="customer-skeleton-profile-stat-action" /></div>)}</div>
        <div className="customer-skeleton-preferences"><CustomerSkeletonHeading variant="profile" />{Array.from({ length: 3 }, (_, index) => <div className="customer-skeleton-setting-row" key={index}><CustomerSkeletonBlock className="customer-skeleton-setting-icon" /><span><CustomerSkeletonBlock className="customer-skeleton-product-title" /><CustomerSkeletonBlock className="customer-skeleton-product-meta" /></span><CustomerSkeletonBlock className="customer-skeleton-setting-value" /></div>)}</div>
      </>}
    </div>
    <span className="sr-only">Konten {labels[view]} sedang disiapkan.</span>
  </section>;
}

export function CustomerPortalStorefront({ profile, catalog, onLogout, realtimeStatus }: CustomerPortalProps) {
  const [activeView, setActiveView] = useState<CustomerView>("home");
  const [customerRouteLoading, setCustomerRouteLoading] = useState(true);
  const [category, setCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notice, setNotice] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orderHistory, setOrderHistory] = useState<CustomerOrder[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [pickupSlot, setPickupSlot] = useState(customerPickupOptions[0].value);
  const [paymentMethod, setPaymentMethod] = useState<CustomerPaymentMethodId>("cash");
  const [paymentProof, setPaymentProof] = useState<CustomerPaymentProof | null>(null);
  const [paymentProofError, setPaymentProofError] = useState("");
  const [menuDetail, setMenuDetail] = useState<CustomerPortalProduct | null>(null);
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [customerMenuFilterOpen, setCustomerMenuFilterOpen] = useState(false);
  const [customerMenuAvailableOnly, setCustomerMenuAvailableOnly] = useState(false);
  const [customerMenuSort, setCustomerMenuSort] = useState<CustomerMenuSortOption>("featured");
  const [customerNotificationsOpen, setCustomerNotificationsOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const heroTouchStartX = useRef<number | null>(null);
  const paymentProofInputRef = useRef<HTMLInputElement>(null);
  const customerFrameRef = useRef<HTMLDivElement>(null);
  const customerRouteMotionRef = useRef<HTMLDivElement>(null);
  const [storageLoadedForProfile, setStorageLoadedForProfile] = useState<string | null>(null);
  const storageProfileId = profile.id || "demo-customer";
  const favoriteIdSet = useMemo(() => new Set(favorites), [favorites]);
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchingProducts = catalog.filter((product) => {
      const matchesCategory = category === "Favorit" ? favoriteIdSet.has(String(product.id)) : category === "Semua" || product.category === category;
      const matchesAvailability = !customerMenuAvailableOnly || product.stock > 0;
      return matchesCategory && matchesAvailability && product.name.toLowerCase().includes(normalizedSearch);
    });

    if (customerMenuSort === "featured") return matchingProducts;
    return [...matchingProducts].sort((left, right) => customerMenuSort === "priceAsc" ? left.price - right.price : right.price - left.price);
  }, [catalog, category, customerMenuAvailableOnly, customerMenuSort, favoriteIdSet, search]);
  const activeMenuFilterCount = (search.trim() ? 1 : 0) + (category !== "Semua" ? 1 : 0) + (customerMenuAvailableOnly ? 1 : 0) + (customerMenuSort !== "featured" ? 1 : 0);
  const availableProducts = useMemo(() => catalog.filter((product) => product.stock > 0), [catalog]);
  const popularProducts = useMemo(() => availableProducts.slice(0, 3), [availableProducts]);
  const homeDiscoveryProducts = useMemo(() => availableProducts.slice(3, 7), [availableProducts]);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrder = orderHistory.find((order) => order.id === activeOrderId) ?? null;
  const activeOrderStepIndex = activeOrder ? customerOrderSteps.findIndex((step) => step.status === activeOrder.status) : -1;
  const activeOrderStatus = activeOrder?.status ?? null;
  const completedOrders = orderHistory.filter((order) => order.status === "completed");
  const recentOrders = useMemo(() => orderHistory.filter((order) => order.status === "completed").slice(0, 3), [orderHistory]);
  const favoriteProducts = useMemo(() => catalog.filter((product) => favoriteIdSet.has(String(product.id)) && product.stock > 0).slice(0, 3), [catalog, favoriteIdSet]);
  const selectedPickupOption = customerPickupOptions.find((option) => option.value === pickupSlot) ?? customerPickupOptions[0];
  const selectedPaymentMethod = customerPaymentMethods.find((method) => method.id === paymentMethod) ?? customerPaymentMethods[0];
  const featuredProduct = useMemo(() => catalog.find((product) => product.stock > 0) ?? catalog[0] ?? null, [catalog]);
  const customerFirstName = profile.fullName.split(/\s+/).filter(Boolean)[0] ?? "teman";
  const customerNotifications: Array<{ id: string; title: string; detail: string; icon: UiIconName; target: CustomerView }> = [
    activeOrder
      ? {
        id: "active-order",
        title: customerOrderStatusCopy[activeOrder.status],
        detail: `Antrean #${String(activeOrder.queueNumber).padStart(2, "0")} · ambil ${activeOrder.pickupSlot}`,
        icon: activeOrder.status === "ready" ? "packageCheck" : activeOrder.status === "preparing" ? "clock" : "circleCheck",
        target: "order",
      }
      : {
        id: "menu-prompt",
        title: "Menu favorit siap dipesan",
        detail: "Pilih menu lalu susun antrean tanpa perlu menunggu lama.",
        icon: "shoppingBag",
        target: "menu",
      },
    { id: "outlet-hours", title: "Outlet Utama buka hari ini", detail: "Jam layanan 07.00–15.00 untuk pengambilan pesanan.", icon: "store", target: "home" },
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedFavorites = readCustomerStorage<unknown>(customerStorageKey(CUSTOMER_FAVORITES_STORAGE_KEY, storageProfileId), []);
      const storedOrders = readCustomerStorage<unknown>(customerStorageKey(CUSTOMER_ORDERS_STORAGE_KEY, storageProfileId), []);
      const safeFavorites = Array.isArray(storedFavorites) ? storedFavorites.filter((item): item is string => typeof item === "string") : [];
      const safeOrders = Array.isArray(storedOrders)
        ? storedOrders.filter((item) => {
          if (!item || typeof item !== "object") return false;
          const candidate = item as { id?: unknown; items?: unknown };
          return typeof candidate.id === "string" && Array.isArray(candidate.items);
        }) as CustomerOrder[]
        : [];
      setFavorites(safeFavorites);
      setOrderHistory(safeOrders);
      setActiveOrderId(safeOrders.find((order) => order.status !== "completed")?.id ?? null);
      setStorageLoadedForProfile(storageProfileId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageProfileId]);

  useEffect(() => {
    if (storageLoadedForProfile !== storageProfileId || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(customerStorageKey(CUSTOMER_FAVORITES_STORAGE_KEY, storageProfileId), JSON.stringify(favorites));
      window.localStorage.setItem(customerStorageKey(CUSTOMER_ORDERS_STORAGE_KEY, storageProfileId), JSON.stringify(orderHistory));
    } catch {
      // Demo persistence is optional; the ordering flow stays usable if storage is unavailable.
    }
  }, [favorites, orderHistory, storageLoadedForProfile, storageProfileId]);

  useEffect(() => {
    if (!activeOrderId || !activeOrderStatus || isSupabaseConfigured) return;
    if (activeOrderStatus !== "received" && activeOrderStatus !== "preparing") return;
    const nextStatus = activeOrderStatus === "received" ? "preparing" : "ready";
    const timer = window.setTimeout(() => {
      setOrderHistory((current) => current.map((order) => order.id === activeOrderId ? { ...order, status: nextStatus } : order));
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [activeOrderId, activeOrderStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeroSlideIndex((current) => (current + 1) % customerHeroSlides.length);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [heroSlideIndex]);

  useEffect(() => {
    if (!customerRouteLoading) return;
    const timer = window.setTimeout(() => setCustomerRouteLoading(false), 520);
    return () => window.clearTimeout(timer);
  }, [activeView, customerRouteLoading]);

  useEffect(() => {
    const frame = customerFrameRef.current;
    const routeState = customerRouteMotionRef.current;
    if (!frame || !routeState) return;

    let cleanup: (() => void) | undefined;
    const animationFrame = window.requestAnimationFrame(() => {
      cleanup = prepareCustomerMotion(frame, routeState, customerRouteLoading);
    });
    return () => {
      window.cancelAnimationFrame(animationFrame);
      cleanup?.();
    };
  }, [activeView, customerRouteLoading]);

  useEffect(() => {
    if (!menuDetail) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuDetail(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuDetail]);

  const showNotice = (message: string, duration = 2200) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => current === message ? "" : current), duration);
  };

  const navigate = (view: CustomerView) => {
    if (view !== activeView) setCustomerRouteLoading(true);
    setActiveView(view);
    setCustomerMenuOpen(false);
    setCustomerMenuFilterOpen(false);
    setCustomerNotificationsOpen(false);
    setAccountMenuOpen(false);
    if (document.documentElement.classList.contains("lenis")) {
      window.dispatchEvent(new Event("customer-scroll-to-top"));
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  const scrollToCustomerTarget = (target: string, offset = -18) => {
    if (document.documentElement.classList.contains("lenis")) {
      window.dispatchEvent(new CustomEvent("customer-scroll-to-target", { detail: { target, offset } }));
      return;
    }

    const element = document.querySelector<HTMLElement>(target);
    if (!element) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, element.getBoundingClientRect().top + window.scrollY + offset), behavior: reducedMotion ? "auto" : "smooth" });
  };

  const resetMenuFilters = () => {
    setSearch("");
    setCategory("Semua");
    setCustomerMenuAvailableOnly(false);
    setCustomerMenuSort("featured");
    setCustomerMenuFilterOpen(false);
  };

  const addToCart = (product: CustomerPortalProduct) => {
    if (product.stock <= 0) {
      showNotice(`${product.name} sedang habis.`);
      return;
    }
    const existingItem = cart.find((item) => String(item.id) === String(product.id));
    if (existingItem && existingItem.quantity >= product.stock) {
      showNotice(`Stok ${product.name} sudah maksimal.`);
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => String(item.id) === String(product.id));
      if (existing && existing.quantity >= product.stock) return current;
      return existing
        ? current.map((item) => String(item.id) === String(product.id) ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, { ...product, quantity: 1 }];
    });
    showNotice(`${product.name} ditambahkan ke pesanan.`);
  };

  const updateQty = (id: number | string, delta: number) => setCart((current) => current.map((item) => {
    if (String(item.id) !== String(id)) return item;
    const nextQuantity = item.quantity + delta;
    if (delta > 0 && item.stock > 0 && nextQuantity > item.stock) return item;
    return { ...item, quantity: nextQuantity };
  }).filter((item) => item.quantity > 0));

  const toggleFavorite = (product: CustomerPortalProduct) => {
    const id = String(product.id);
    const isFavorite = favoriteIdSet.has(id);
    setFavorites((current) => isFavorite ? current.filter((favoriteId) => favoriteId !== id) : [...current, id]);
    showNotice(isFavorite ? `${product.name} dihapus dari favorit.` : `${product.name} disimpan ke favorit.`);
  };

  const submitOrder = () => {
    if (!cart.length) return;
    if (isSupabaseConfigured) {
      showNotice("Pemesanan online belum aktif. Keranjang tetap tersimpan sampai modul order diaktifkan.", 3200);
      return;
    }
    const queueNumber = Math.max(0, ...orderHistory.map((order) => order.queueNumber)) + 1;
    const newOrder: CustomerOrder = {
      id: createCustomerOrderId(),
      queueNumber,
      createdAt: new Date().toISOString(),
      pickupSlot,
      status: "received",
      items: cart.map((item) => ({ ...item })),
      total: cartTotal,
      paymentMethod,
      paymentProof: paymentMethod === "cash" ? undefined : paymentProof ?? undefined,
    };
    setOrderHistory((current) => [newOrder, ...current]);
    setActiveOrderId(newOrder.id);
    setCart([]);
    navigate("order");
    showNotice(`Pesanan diterima. Nomor antrean kamu #${queueNumber}.`, 3600);
  };

  const openPaymentApp = (method: CustomerPaymentMethod) => {
    if (!method.appUrl || typeof window === "undefined") return;
    showNotice(`Membuka ${method.label}. Selesaikan di aplikasi, lalu kembali ke CanteenOS.`, 4200);

    // Custom URL schemes are frequently blocked when opened through window.open.
    // A same-tab anchor lets the mobile OS handle the deep-link directly while
    // keeping the browser page intact when the app is not installed.
    const cleanup = () => {
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") cleanup();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    const fallbackTimer = window.setTimeout(() => {
      cleanup();
      if (document.visibilityState === "visible") {
        showNotice(`Aplikasi ${method.label} belum terbuka. Pastikan aplikasinya sudah terpasang di perangkat ini.`, 5200);
      }
    }, 1400);

    try {
      const appLink = document.createElement("a");
      appLink.href = method.appUrl;
      appLink.target = "_self";
      appLink.rel = "noreferrer";
      appLink.hidden = true;
      document.body.appendChild(appLink);
      appLink.click();
      appLink.remove();
    } catch {
      cleanup();
      showNotice(`Aplikasi ${method.label} belum bisa dibuka dari perangkat ini.`, 5200);
    }
  };

  const handlePaymentProofChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPaymentProofError("");
    try {
      const nextProof = await readCustomerPaymentProof(file);
      setPaymentProof(nextProof);
      showNotice("Bukti pembayaran siap dikirim bersama pesanan.", 2600);
    } catch (error) {
      setPaymentProof(null);
      setPaymentProofError(error instanceof Error ? error.message : "Gambar belum bisa digunakan.");
    }
  };

  const clearPaymentProof = () => {
    setPaymentProof(null);
    setPaymentProofError("");
  };

  const handleCheckoutAction = () => {
    if (!cart.length) return;
    if (selectedPaymentMethod.id === "cash" || paymentProof) {
      submitOrder();
      return;
    }
    openPaymentApp(selectedPaymentMethod);
  };

  const completeActiveOrder = () => {
    if (!activeOrder) return;
    setOrderHistory((current) => current.map((order) => order.id === activeOrder.id ? { ...order, status: "completed" } : order));
    setActiveOrderId(null);
    showNotice("Pesanan ditandai selesai. Semoga makanannya enak!", 3000);
  };

  const reorder = (order: CustomerOrder) => {
    const availableItems = order.items.map((item) => {
      const currentProduct = catalog.find((product) => String(product.id) === String(item.id));
      if (!currentProduct || currentProduct.stock <= 0) return null;
      return { ...currentProduct, quantity: Math.min(item.quantity, currentProduct.stock) };
    }).filter((item): item is CartItem => item !== null);
    if (!availableItems.length) {
      showNotice("Menu di pesanan ini sedang habis.");
      return;
    }
    setCart((current) => availableItems.reduce<CartItem[]>((next, item) => {
      const existing = next.find((cartItem) => String(cartItem.id) === String(item.id));
      if (!existing) return [...next, item];
      return next.map((cartItem) => String(cartItem.id) === String(item.id) ? { ...cartItem, quantity: Math.min(cartItem.quantity + item.quantity, cartItem.stock) } : cartItem);
    }, [...current]));
    setCategory("Semua");
    setSearch("");
    navigate("order");
    showNotice("Pesanan lama dimasukkan ke keranjang.");
  };

  const renderCategories = () => {
    const categories = [
      { value: "Semua", label: "Semua", product: catalog[0] },
      { value: "Makanan", label: "Makanan", product: catalog.find((item) => item.category === "Makanan") },
      { value: "Minuman", label: "Minuman", product: catalog.find((item) => item.category === "Minuman") },
      { value: "Camilan", label: "Camilan", product: catalog.find((item) => item.category === "Camilan") },
      { value: "Favorit", label: "Favorit", product: catalog.find((item) => favoriteIdSet.has(String(item.id))) },
    ];
    const selectCategory = (value: string) => {
      setCategory(value);
      if (activeView !== "menu") navigate("menu");
    };
    const renderCategoryItems = (interactive: boolean) => categories.map((item) => {
      const categoryContent = <><span className="customer-app-category-art">{item.product ? <CustomerProductVisual product={item.product} size={25} /> : <UiIcon name="tag" size={20} />}</span><strong>{item.label}</strong></>;
      if (!interactive) return <button type="button" tabIndex={-1} aria-hidden="true" className={`customer-app-category ${category === item.value ? "is-active" : ""}`} key={item.value} onClick={() => selectCategory(item.value)}>{categoryContent}</button>;
      return <button type="button" role="tab" aria-selected={category === item.value} className={`customer-app-category ${category === item.value ? "is-active" : ""}`} key={item.value} onClick={() => selectCategory(item.value)}>{categoryContent}</button>;
    });
    const categoryScroller = <div className="customer-app-category-scroller" role="tablist" aria-label="Kategori menu pelanggan">{renderCategoryItems(true)}</div>;
    if (activeView !== "home") return categoryScroller;
    return <div className="customer-app-category-viewport" data-lenis-prevent><div className="customer-app-category-marquee">{categoryScroller}<div className="customer-app-category-scroller customer-app-category-scroller-duplicate" aria-hidden="true">{renderCategoryItems(false)}</div></div></div>;
  };

  const renderProductCard = (product: CustomerPortalProduct, variant: "popular" | "menu" = "menu") => {
    const isFavorite = favoriteIdSet.has(String(product.id));
    return <article className={`customer-app-product-card ${variant === "popular" ? "is-popular" : ""} ${product.stock <= 0 ? "is-sold-out" : ""}`} key={product.id}>
      <div className="customer-app-product-media">
        {variant === "popular" && <span className="customer-app-product-badge">{product.stock < 15 ? "Favorit" : "Terlaris"}</span>}
        <button type="button" className={`customer-app-favorite ${isFavorite ? "is-active" : ""}`} aria-pressed={isFavorite} aria-label={isFavorite ? `Hapus ${product.name} dari favorit` : `Simpan ${product.name} ke favorit`} onClick={() => toggleFavorite(product)}><UiIcon name="tag" size={16} /></button>
        <button type="button" className="customer-app-product-image-button" onClick={() => setMenuDetail(product)} aria-label={`Detail menu ${product.name}`}><CustomerProductVisual product={product} size={42} /></button>
      </div>
      <div className="customer-app-product-copy"><span>{product.category}</span><h3>{product.name}</h3><small>{product.stock > 0 ? `${product.stock} tersedia` : "Menu habis"}</small><div className="customer-app-product-footer"><strong>{formatCurrency(product.price)}</strong><button type="button" className="customer-app-add-button" disabled={product.stock <= 0} onClick={() => addToCart(product)} aria-label={`Tambah ${product.name}`}><UiIcon name="plus" size={17} /></button></div></div>
    </article>;
  };

  const renderActiveOrder = (compact = false) => {
    if (!activeOrder) return null;
    return <section className={`customer-app-active-order ${compact ? "is-compact" : ""}`} aria-labelledby="customer-active-order-title">
      <div className="customer-app-active-order-head"><div><span className="customer-app-eyebrow">PESANAN AKTIF</span><h2 id="customer-active-order-title">Antrean <strong>#{String(activeOrder.queueNumber).padStart(2, "0")}</strong></h2><p>{customerOrderStatusCopy[activeOrder.status]} · ambil {activeOrder.pickupSlot}</p></div><span className={`customer-app-order-status status-${activeOrder.status}`}><UiIcon name={activeOrder.status === "ready" ? "packageCheck" : activeOrder.status === "preparing" ? "clock" : "circleCheck"} size={14} />{customerOrderStatusCopy[activeOrder.status]}</span></div>
      <div className="customer-app-progress" aria-label="Status pesanan">{customerOrderSteps.map((step, index) => <div className={`customer-app-progress-step ${index <= activeOrderStepIndex ? "is-complete" : ""} ${step.status === activeOrder.status ? "is-current" : ""}`} aria-label={`${step.label}: ${step.description}`} key={step.status}><span><UiIcon name={step.icon} size={14} /></span><strong>{step.label}</strong></div>)}</div>
      {compact && <div className="customer-app-active-order-insight"><span><UiIcon name={activeOrder.status === "ready" ? "packageCheck" : "clock"} size={14} /><strong>{activeOrder.status === "ready" ? "Siap diambil sekarang" : activeOrder.pickupSlot === "Sekarang" ? "Estimasi 10–15 menit" : `Ambil ${activeOrder.pickupSlot}`}</strong></span><button type="button" onClick={() => navigate("order")}>Lihat detail <UiIcon name="arrowRight" size={13} /></button></div>}
      {!compact && <div className="customer-app-active-order-footer"><span>{activeOrder.items.length} menu · {formatCurrency(activeOrder.total)} · {customerPaymentMethodLabel(activeOrder.paymentMethod)}{activeOrder.paymentProof ? " · Bukti terlampir" : ""}</span>{activeOrder.status === "ready" ? <button type="button" onClick={completeActiveOrder}>Sudah diambil <UiIcon name="check" size={14} /></button> : <small><UiIcon name="clock" size={13} />Status demo diperbarui otomatis.</small>}</div>}
    </section>;
  };

  const renderOrderItems = () => <div className="customer-app-order-items">{cart.map((item) => <article className="customer-app-order-item" key={item.id}><CustomerProductVisual product={item} size={22} /><div><strong>{item.name}</strong><small>{formatCurrency(item.price)} · {item.stock} tersedia</small></div><span className="customer-app-quantity"><button type="button" onClick={() => updateQty(item.id, -1)} aria-label={`Kurangi ${item.name}`}><UiIcon name="minus" size={12} /></button><b>{item.quantity}</b><button type="button" onClick={() => updateQty(item.id, 1)} aria-label={`Tambah ${item.name}`} disabled={item.stock > 0 && item.quantity >= item.stock}><UiIcon name="plus" size={12} /></button></span></article>)}</div>;

  return (
    <main className={`customer-portal customer-app${customerRouteLoading ? " is-route-loading" : ""}`} aria-busy={customerRouteLoading}>
      <CustomerLenisScroll />
      <div className="customer-app-frame" ref={customerFrameRef}>
        <header className={`customer-app-header${customerRouteLoading ? " is-route-loading" : " is-route-ready"}`}>
          <button className="customer-app-icon-button customer-app-menu-button" type="button" aria-label={customerMenuOpen ? "Tutup menu pelanggan" : "Buka menu pelanggan"} aria-expanded={customerMenuOpen} onClick={() => { setCustomerNotificationsOpen(false); setCustomerMenuOpen((current) => !current); }}><UiIcon name={customerMenuOpen ? "chevronDown" : "menu"} className="customer-app-menu-toggle-icon" size={20} /></button>
          <button className="customer-app-brand" type="button" onClick={() => navigate("home")} aria-label="Kembali ke beranda pelanggan"><span className="brand-mark"><CanteenOSMark size={42} /></span><span><strong>Canteen<span>OS</span></strong><small>Hey, {customerFirstName}!</small></span></button>
          <div className="customer-app-header-meta"><span className={`customer-app-live-status realtime-${realtimeStatus}`}><i />{realtimeStatusCopy[realtimeStatus]}</span><span className="customer-app-outlet-label">Outlet Utama · 07.00–15.00</span></div>
          <div className="customer-app-header-actions">
            <button className={`customer-app-icon-button customer-app-notification-button ${customerNotificationsOpen ? "is-active" : ""}`} type="button" aria-label="Notifikasi" aria-expanded={customerNotificationsOpen} onClick={() => { setCustomerMenuOpen(false); setAccountMenuOpen(false); setCustomerNotificationsOpen((current) => !current); }}><UiIcon name="circleAlert" size={19} /><b>{customerNotifications.length}</b></button>
            <button className="customer-app-icon-button" type="button" aria-label={`Buka pesanan, ${cartCount} item`} onClick={() => navigate("order")}><UiIcon name="shoppingBag" size={19} />{cartCount > 0 && <b>{cartCount}</b>}</button>
            <div className="customer-app-profile-menu">
              <button className="customer-app-avatar-button" type="button" aria-label="Buka profil pelanggan" aria-expanded={accountMenuOpen} onClick={() => { setCustomerNotificationsOpen(false); setAccountMenuOpen((current) => !current); }}><span className="customer-app-avatar">{profileInitials(profile)}</span><UiIcon name="chevronDown" size={13} /></button>
              {accountMenuOpen && <div className="customer-app-profile-popover"><span><small>Masuk sebagai</small><strong>{profile.fullName || "Pelanggan"}</strong></span><button type="button" onClick={() => navigate("profile")}><UiIcon name="user" size={14} />Profil saya</button><button type="button" onClick={onLogout}><UiIcon name="arrowLeft" size={14} />Keluar dari portal</button></div>}
            </div>
          </div>
        </header>

        <nav className="customer-app-desktop-nav" aria-label="Navigasi desktop pelanggan">
          {customerNavigationItems.map((item) => <button
            className={`customer-app-desktop-nav-item nav-${item.view}${activeView === item.view ? " is-active" : ""}`}
            type="button"
            key={item.view}
            aria-current={activeView === item.view ? "page" : undefined}
            onClick={() => navigate(item.view)}
          >
            <span className="customer-app-desktop-nav-icon"><UiIcon name={item.icon} size={18} /></span>
            <span className="customer-app-desktop-nav-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
            {item.view === "order" && cartCount > 0 && <b>{cartCount}</b>}
          </button>)}
        </nav>

        {customerNotificationsOpen && <section className="customer-app-notification-panel" data-lenis-prevent role="dialog" aria-label="Notifikasi pelanggan">
          <header><div><span className="customer-app-eyebrow">UPDATE PESANAN</span><strong>Notifikasi kamu</strong></div><button type="button" aria-label="Tutup notifikasi" onClick={() => setCustomerNotificationsOpen(false)}><UiIcon name="arrowLeft" size={15} /></button></header>
          <div className="customer-app-notification-list">{customerNotifications.map((item) => <button type="button" key={item.id} onClick={() => navigate(item.target)}><span className="customer-app-notification-icon"><UiIcon name={item.icon} size={16} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><UiIcon name="arrowRight" size={13} /></button>)}</div>
          <footer><UiIcon name="info" size={13} />Notifikasi akan ikut berubah saat status pesanan diperbarui.</footer>
        </section>}

        {customerMenuOpen && <>
          <button className="customer-app-menu-scrim" type="button" aria-label="Tutup menu pelanggan di luar panel" onClick={() => setCustomerMenuOpen(false)} />
          <nav className="customer-app-menu-drawer" data-lenis-prevent aria-label="Navigasi pelanggan">
            <header className="customer-app-menu-drawer-header customer-app-menu-command-header">
              <button className="customer-app-menu-drawer-brand" type="button" onClick={() => navigate("home")} aria-label="Kembali ke beranda pelanggan">
                <span className="customer-app-menu-drawer-brand-mark"><CanteenOSMark size={48} /></span>
                <span className="customer-app-menu-drawer-brand-copy"><strong>Canteen<span>OS</span></strong><small>COMMAND DRAWER</small></span>
              </button>
              <button className="customer-app-menu-drawer-close" type="button" aria-label="Tutup panel menu pelanggan" onClick={() => setCustomerMenuOpen(false)}><UiIcon name="arrowLeft" size={20} /></button>
            </header>
            <div className="customer-app-menu-outlet-card">
              <span className="customer-app-menu-outlet-icon"><UiIcon name="store" size={23} /></span>
              <span className="customer-app-menu-outlet-copy"><small>OUTLET UTAMA</small><strong>Siap melayani pesananmu</strong></span>
              <span className={`customer-app-menu-outlet-live realtime-${realtimeStatus}`}><i />LIVE</span>
            </div>
            <div className="customer-app-menu-section-heading"><span className="customer-app-eyebrow">NAVIGASI</span><small>Jelajahi CanteenOS</small></div>
            <div className="customer-app-menu-drawer-items">
              {customerNavigationItems.map((item) => <button className={`customer-app-menu-drawer-item menu-${item.view}${activeView === item.view ? " is-active" : ""}`} type="button" key={item.view} aria-current={activeView === item.view ? "page" : undefined} onClick={() => navigate(item.view)}>
                <span className="customer-app-menu-icon"><UiIcon name={item.icon} size={17} /></span>
                <span className="customer-app-menu-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                <span className="customer-app-menu-arrow"><UiIcon name="arrowRight" size={14} /></span>
                {item.view === "order" && cartCount > 0 && <b>{cartCount}</b>}
              </button>)}
            </div>
            <div className="customer-app-menu-utilities" aria-label="Aksi tambahan pelanggan">
              <button className="customer-app-menu-utility-item" type="button" onClick={() => { setCustomerMenuOpen(false); setCustomerNotificationsOpen(true); }}>
                <span className="customer-app-menu-utility-icon"><UiIcon name="circleAlert" size={17} /></span>
                <span><strong>Notifikasi</strong><small>Update pesanan terbaru</small></span>
                {customerNotifications.length > 0 && <b>{customerNotifications.length}</b>}
                <UiIcon name="arrowRight" size={14} />
              </button>
              <button className="customer-app-menu-utility-item" type="button" onClick={() => navigate("profile")}>
                <span className="customer-app-menu-utility-icon"><UiIcon name="settings" size={17} /></span>
                <span><strong>Preferensi akun</strong><small>Kelola profil pelanggan</small></span>
                <UiIcon name="arrowRight" size={14} />
              </button>
            </div>
            <button className="customer-app-menu-logout" type="button" onClick={onLogout}><span><UiIcon name="arrowLeft" size={15} />Keluar dari portal</span><UiIcon name="arrowRight" size={14} /></button>
            <div className="customer-app-menu-footer">
              <span className="customer-app-menu-footer-icon"><UiIcon name={cartCount > 0 ? "shoppingBag" : "store"} size={16} /></span>
              <span><small>{cartCount > 0 ? "PESANAN AKTIF" : "OUTLET UTAMA"}</small><strong>{cartCount > 0 ? `${cartCount} menu di keranjang` : "Siap melayani pesananmu"}</strong></span>
              <UiIcon name="chevronRight" size={14} />
            </div>
          </nav>
        </>}

        <AnimatePresence initial={false}>
          {customerRouteLoading && <motion.div
            className="customer-app-route-progress"
            key={`customer-progress-${activeView}`}
            role="progressbar"
            aria-label="Memuat halaman pelanggan"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: .46, ease: [0.22, 1, 0.36, 1] }}
          />}
        </AnimatePresence>

        <div className={`customer-app-content customer-app-content-${activeView}`} aria-busy={customerRouteLoading}>
            {customerRouteLoading ? <div
              ref={customerRouteMotionRef}
              className="customer-app-route-state customer-route-content-loading"
              key={`customer-skeleton-${activeView}`}
            >
              <CustomerPageSkeleton view={activeView} />
            </div> : <div
              ref={customerRouteMotionRef}
              className="customer-app-route-state customer-route-content-ready"
              key={`customer-content-${activeView}`}
            >
          {activeView === "home" && <div className="customer-app-home-layout">
            <section className="customer-app-intro customer-app-intro-motion">
              <div className="customer-app-intro-copy">
                <span className="customer-app-eyebrow">PORTAL PELANGGAN</span>
                <h1>Hai, {customerFirstName}!</h1>
                <p>Pesan makanan favoritmu, lalu ambil saat sudah siap.</p>
              </div>
              <div className="customer-app-intro-art" aria-hidden="true"><img src="/customer-assets/es-teh-manis.png" alt="" /></div>
              <span className="customer-app-service-pill"><i />Outlet Utama <small>07.00–15.00</small></span>
            </section>

            <form className="customer-app-search-row" onSubmit={(event) => { event.preventDefault(); navigate("menu"); }}>
              <label><UiIcon name="search" size={19} /><input aria-label="Cari menu favorit" placeholder="Cari makanan favoritmu..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              <button type="button" aria-label="Buka filter menu" onClick={() => navigate("menu")}><UiIcon name="settings" size={20} /></button>
            </form>

            <section className="customer-app-hero" aria-label={`Promo ${heroSlideIndex + 1} dari ${customerHeroSlides.length}`} aria-roledescription="carousel" onTouchStart={(event) => { heroTouchStartX.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => { const startX = heroTouchStartX.current; heroTouchStartX.current = null; if (startX === null) return; const deltaX = event.changedTouches[0]?.clientX - startX; if (Math.abs(deltaX) < 38) return; setHeroSlideIndex((current) => (current + (deltaX < 0 ? 1 : -1) + customerHeroSlides.length) % customerHeroSlides.length); }} onTouchCancel={() => { heroTouchStartX.current = null; }}>
              {customerHeroSlides.map((slide, index) => <img key={slide.image} className={index === heroSlideIndex ? "is-active" : ""} src={slide.image} alt={slide.alt} aria-hidden={index !== heroSlideIndex} role={index === heroSlideIndex ? "button" : undefined} tabIndex={index === heroSlideIndex ? 0 : -1} aria-label={index === heroSlideIndex ? "Klik untuk promo berikutnya" : undefined} onClick={index === heroSlideIndex ? () => setHeroSlideIndex((current) => (current + 1) % customerHeroSlides.length) : undefined} onKeyDown={index === heroSlideIndex ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setHeroSlideIndex((current) => (current + 1) % customerHeroSlides.length); } } : undefined} />)}
              <div className="customer-app-hero-copy" key={heroSlideIndex}><span>{customerHeroSlides[heroSlideIndex].eyebrow}</span><h2>{customerHeroSlides[heroSlideIndex].title}<br /><em>{customerHeroSlides[heroSlideIndex].highlight}</em></h2><p>{customerHeroSlides[heroSlideIndex].description}</p><button type="button" onClick={() => navigate("menu")}>{customerHeroSlides[heroSlideIndex].cta} <UiIcon name="arrowRight" size={15} /></button></div>
              <button type="button" className="customer-app-hero-arrow is-prev" aria-label="Promo sebelumnya" onClick={() => setHeroSlideIndex((current) => (current - 1 + customerHeroSlides.length) % customerHeroSlides.length)}><UiIcon name="arrowLeft" size={15} /></button>
              <button type="button" className="customer-app-hero-arrow is-next" aria-label="Promo berikutnya" onClick={() => setHeroSlideIndex((current) => (current + 1) % customerHeroSlides.length)}><UiIcon name="arrowRight" size={15} /></button>
              <div className="customer-app-hero-controls"><span className="customer-app-hero-slide-count" aria-live="polite">{heroSlideIndex + 1} / {customerHeroSlides.length}</span><div className="customer-app-hero-dots" aria-label="Pilih promo">
                {customerHeroSlides.map((slide, index) => <button type="button" key={slide.image} className={index === heroSlideIndex ? "is-active" : ""} aria-label={`Tampilkan promo ${index + 1}`} aria-current={index === heroSlideIndex} onClick={() => setHeroSlideIndex(index)} />)}
              </div></div>
            </section>

            <section className="customer-app-home-utility" aria-label="Info outlet dan aksi cepat">
              <div className="customer-app-home-status-card">
                <div className="customer-app-home-status-copy">
                  <span className="customer-app-eyebrow">STATUS OUTLET</span>
                  <strong><i className="customer-app-home-live-dot" />Outlet Utama <em>sedang buka</em></strong>
                  <small>Pesanan siap dalam 10–15 menit selama jam layanan.</small>
                </div>
                <div className="customer-app-home-status-metrics">
                  <span><UiIcon name="clock" size={16} /><strong>07.00–15.00</strong><small>Jam layanan</small></span>
                  <span><UiIcon name="users" size={16} /><strong>Antrean normal</strong><small>Siap melayani</small></span>
                </div>
              </div>
              <div className="customer-app-home-actions" aria-label="Aksi cepat">
                <button type="button" className="customer-app-home-action is-primary" onClick={() => navigate("menu")}>
                  <span className="customer-app-home-action-icon"><UiIcon name="utensils" size={18} /></span>
                  <span><strong>Pesan sekarang</strong><small>Pilih menu favorit</small></span>
                  <UiIcon name="arrowRight" size={14} />
                </button>
                <button type="button" className="customer-app-home-action is-gold" onClick={() => { setCategory(favorites.length ? "Favorit" : "Semua"); navigate("menu"); }}>
                  <span className="customer-app-home-action-icon"><UiIcon name="tag" size={18} /></span>
                  <span><strong>{favorites.length ? "Menu favorit" : "Pilih favorit"}</strong><small>{favoriteProducts.length ? `${favoriteProducts.length} tersedia` : favorites.length ? `${favorites.length} tersimpan` : "Simpan menu pilihanmu"}</small></span>
                  <UiIcon name="arrowRight" size={14} />
                </button>
                <button type="button" className="customer-app-home-action is-plum" onClick={() => { if (recentOrders[0]) reorder(recentOrders[0]); else navigate("order"); }}>
                  <span className="customer-app-home-action-icon"><UiIcon name="receipt" size={18} /></span>
                  <span><strong>Pesan lagi</strong><small>{recentOrders.length ? "Dari pesanan terakhir" : "Mulai susun order"}</small></span>
                  <UiIcon name="arrowRight" size={14} />
                </button>
              </div>
            </section>

            <section className="customer-app-categories"><div className="customer-app-section-heading"><div><span className="customer-app-eyebrow">JELAJAHI MENU</span><h2>Mau makan apa hari ini?</h2></div><button type="button" onClick={() => navigate("menu")}>Lihat semua <UiIcon name="arrowRight" size={14} /></button></div>{renderCategories()}</section>
            {activeOrder && renderActiveOrder(true)}

            <section className="customer-app-home-reorder" aria-labelledby="customer-home-reorder-title">
              <div className="customer-app-section-heading">
                <div><span className="customer-app-eyebrow">PESAN LAGI</span><h2 id="customer-home-reorder-title">{recentOrders.length ? "Pesanan favorit, satu klik lagi" : "Siapkan pesanan pertamamu"}</h2><p>{recentOrders.length ? "Ulangi pesanan terakhir tanpa menyusun dari awal." : "Setelah order selesai, pesananmu akan muncul di sini untuk dipesan ulang."}</p></div>
                <button type="button" onClick={() => navigate(recentOrders.length ? "order" : "menu")}>{recentOrders.length ? "Lihat riwayat" : "Pilih menu"} <UiIcon name="arrowRight" size={14} /></button>
              </div>
              {recentOrders.length > 0 ? <div className="customer-app-home-reorder-list">
                {recentOrders.map((order) => {
                  const firstItem = order.items[0];
                  const previewProduct = firstItem ? catalog.find((product) => String(product.id) === String(firstItem.id)) ?? firstItem : featuredProduct;
                  if (!previewProduct) return null;
                  return <article className="customer-app-home-reorder-card" key={order.id}>
                    <span className="customer-app-home-reorder-visual"><CustomerProductVisual product={previewProduct} size={38} /></span>
                    <span className="customer-app-home-reorder-copy"><strong>{previewProduct.name}{order.items.length > 1 ? ` + ${order.items.length - 1} menu` : ""}</strong><small>{formatCurrency(order.total)} · {formatCustomerOrderDate(order.createdAt)}</small></span>
                    <button type="button" aria-label={`Pesan lagi ${previewProduct.name}`} onClick={() => reorder(order)}>Pesan lagi <UiIcon name="arrowRight" size={13} /></button>
                  </article>;
                })}
              </div> : <div className="customer-app-home-reorder-empty">
                <span className="customer-app-home-reorder-empty-icon"><UiIcon name="receipt" size={20} /></span>
                <div><strong>Belum ada pesanan selesai</strong><small>Pilih menu pertama kamu, lalu semua pesanan berikutnya bisa diulang dari sini.</small></div>
                <button type="button" onClick={() => navigate("menu")}>Mulai pesan <UiIcon name="arrowRight" size={13} /></button>
              </div>}
            </section>

            <section className="customer-app-popular"><div className="customer-app-section-heading"><div><span className="customer-app-eyebrow">PILIHAN POPULER</span><h2>Favorit teman-teman</h2></div><button type="button" onClick={() => navigate("menu")}>Lihat semua <UiIcon name="arrowRight" size={14} /></button></div><div className="customer-app-popular-grid">{popularProducts.length ? popularProducts.map((product) => renderProductCard(product, "popular")) : <div className="customer-app-empty-state">Menu sedang disiapkan.</div>}</div></section>
            {homeDiscoveryProducts.length > 0 && <section className="customer-app-home-discovery" aria-labelledby="customer-home-discovery-title">
              <div className="customer-app-section-heading">
                <div><span className="customer-app-eyebrow">COBA MENU LAINNYA</span><h2 id="customer-home-discovery-title">Biar nggak makan itu-itu saja</h2><p>Temukan pilihan lain yang masih siap diambil hari ini.</p></div>
                <button type="button" onClick={() => navigate("menu")}>Buka semua menu <UiIcon name="arrowRight" size={14} /></button>
              </div>
              <div className="customer-app-home-discovery-list">
                {homeDiscoveryProducts.map((product) => <article className="customer-app-home-discovery-item" key={product.id}>
                  <button type="button" className="customer-app-home-discovery-image" onClick={() => setMenuDetail(product)} aria-label={`Detail menu ${product.name}`}><CustomerProductVisual product={product} size={34} /></button>
                  <div className="customer-app-home-discovery-copy"><small>{product.category}</small><strong>{product.name}</strong><span>{formatCurrency(product.price)} · {product.stock} tersedia</span></div>
                  <button type="button" className="customer-app-home-discovery-add" disabled={product.stock <= 0} onClick={() => addToCart(product)}>Tambah</button>
                </article>)}
              </div>
            </section>}
            <section id="customer-offers" className="customer-app-offer-banner"><div><span className="customer-app-eyebrow">PENAWARAN HARI INI</span><h2>Paket hemat,<br /><strong>mood meningkat.</strong></h2><p>Gabungkan menu makan dan minum dari offers hari ini.</p><button type="button" onClick={() => navigate("offers")}>Lihat offers <UiIcon name="arrowRight" size={14} /></button></div><div className="customer-app-offer-art"><CustomerProductVisual product={featuredProduct ?? catalog[0]} size={54} /></div><span className="customer-app-offer-sticker">10%<small>hemat</small></span></section>
            <section className="customer-app-home-outlet-info" aria-labelledby="customer-home-outlet-title">
              <div className="customer-app-home-outlet-intro"><span className="customer-app-eyebrow">INFO OUTLET</span><h2 id="customer-home-outlet-title">Sebelum berangkat, cek detailnya.</h2><p>Semua order diambil di Outlet Utama supaya kamu bisa langsung melanjutkan aktivitas.</p></div>
              <div className="customer-app-home-outlet-details">
                <div><span className="customer-app-home-outlet-icon"><UiIcon name="clock" size={17} /></span><span><strong>Jam layanan</strong><small>07.00–15.00</small></span></div>
                <div><span className="customer-app-home-outlet-icon"><UiIcon name="store" size={17} /></span><span><strong>Tempat ambil</strong><small>Outlet Utama</small></span></div>
                <div><span className="customer-app-home-outlet-icon"><UiIcon name="wallet" size={17} /></span><span><strong>Pembayaran</strong><small>Cash & aplikasi pilihan</small></span></div>
              </div>
              <button type="button" className="customer-app-home-outlet-action" onClick={() => navigate("order")}>Lihat pesanan <UiIcon name="arrowRight" size={14} /></button>
            </section>
          </div>}

          {activeView === "home" && cartCount > 0 && <button type="button" className="customer-app-home-cart-bar" onClick={() => navigate("order")} aria-label={`Buka keranjang, ${cartCount} menu, total ${formatCurrency(cartTotal)}`}>
            <span className="customer-app-home-cart-icon"><UiIcon name="shoppingBag" size={18} /></span>
            <span><strong>{cartCount} menu di keranjang</strong><small>{formatCurrency(cartTotal)} · siap dilanjutkan</small></span>
            <span className="customer-app-home-cart-action">Lihat order <UiIcon name="arrowRight" size={14} /></span>
          </button>}

          {activeView === "menu" && <section id="customer-menu" className="customer-app-page">
            <div className="customer-app-page-heading customer-app-page-heading-menu"><div><span className="customer-app-eyebrow">MENU HARI INI</span><h1>Pilih menu favoritmu</h1><p>Semua menu tersedia di Outlet Utama. Tambahkan satu per satu ke order.</p></div><span className="customer-app-menu-count"><strong>{filteredProducts.length}</strong><small>pilihan</small></span></div>
            <div className="customer-app-search-row">
              <label><UiIcon name="search" size={19} /><input aria-label="Cari menu" placeholder="Cari makanan favoritmu..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              <button
                type="button"
                className={`customer-app-menu-filter-button${customerMenuFilterOpen ? " is-active" : ""}`}
                aria-label="Buka filter menu"
                aria-expanded={customerMenuFilterOpen}
                aria-controls="customer-menu-filter-panel"
                onClick={() => setCustomerMenuFilterOpen((current) => !current)}
              >
                <UiIcon name="settings" size={20} />
                {activeMenuFilterCount > 0 && <b aria-label={`${activeMenuFilterCount} filter aktif`}>{activeMenuFilterCount}</b>}
              </button>
            </div>
            {customerMenuFilterOpen && <section id="customer-menu-filter-panel" className="customer-app-menu-filter-panel" aria-label="Filter menu">
              <div className="customer-app-menu-filter-head">
                <div><span className="customer-app-eyebrow">FILTER MENU</span><strong>Atur menu yang ingin dilihat</strong></div>
                <button type="button" className="customer-app-menu-filter-close" aria-label="Tutup filter menu" onClick={() => setCustomerMenuFilterOpen(false)}><UiIcon name="arrowLeft" size={17} /></button>
              </div>
              <div className="customer-app-menu-filter-group">
                <span className="customer-app-menu-filter-label">Kategori menu</span>
                <div className="customer-app-menu-filter-options" role="group" aria-label="Filter kategori menu">
                  {["Semua", "Makanan", "Minuman", "Camilan", "Favorit"].map((filterCategory) => <button type="button" className={`customer-app-menu-filter-option${category === filterCategory ? " is-active" : ""}`} aria-pressed={category === filterCategory} key={filterCategory} onClick={() => setCategory(filterCategory)}>{filterCategory}</button>)}
                </div>
              </div>
              <div className="customer-app-menu-filter-controls">
                <label className="customer-app-menu-filter-availability" htmlFor="customer-menu-availability">
                  <span className="customer-app-menu-filter-checkbox"><input id="customer-menu-availability" type="checkbox" aria-label="Hanya menu tersedia" checked={customerMenuAvailableOnly} onChange={(event) => setCustomerMenuAvailableOnly(event.target.checked)} /><i aria-hidden="true"><UiIcon name="check" size={12} /></i></span>
                  <span><strong>Hanya menu tersedia</strong><small>Sembunyikan menu yang sedang habis</small></span>
                </label>
                <label className="customer-app-menu-filter-sort"><span><strong>Urutkan menu</strong><small>Pilih susunan yang paling nyaman</small></span><select aria-label="Urutkan menu" value={customerMenuSort} onChange={(event) => setCustomerMenuSort(event.target.value as CustomerMenuSortOption)}><option value="featured">Rekomendasi</option><option value="priceAsc">Harga terendah</option><option value="priceDesc">Harga tertinggi</option></select></label>
              </div>
              <button type="button" className="customer-app-menu-filter-reset" onClick={resetMenuFilters}>Reset semua filter</button>
            </section>}
            {renderCategories()}
            {filteredProducts.length > 0 ? <div className="customer-app-menu-grid">{filteredProducts.map((product) => renderProductCard(product))}</div> : <div className="customer-app-empty-state"><UiIcon name="search" size={24} /><strong>{category === "Favorit" ? "Belum ada menu favorit" : "Menu tidak ditemukan"}</strong><small>{category === "Favorit" ? "Simpan menu yang sering kamu pesan supaya gampang ditemukan." : "Coba kata kunci atau kategori lain."}</small><button type="button" onClick={resetMenuFilters}>Reset filter</button></div>}
          </section>}

          {activeView === "order" && <section id="customer-orders" className="customer-app-page">
            <div className="customer-app-page-heading customer-app-page-heading-order"><div><span className="customer-app-eyebrow">ORDER</span><h1>Pesananmu</h1><p>Atur isi pesanan dan pilih waktu ambil yang paling nyaman.</p></div><span className="customer-app-order-count"><UiIcon name="shoppingBag" size={19} /><strong>{cartCount}</strong></span></div>
            {activeOrder && renderActiveOrder()}
            <div className="customer-app-order-layout">
              <section className="customer-app-order-card">
                <div className="customer-app-card-heading"><div><span className="customer-app-eyebrow">KERANJANG</span><h2>{cart.length ? `${cartCount} menu dipilih` : "Belum ada menu"}</h2></div>{cart.length > 0 && <button type="button" onClick={() => setCart([])}>Kosongkan</button>}</div>
                {cart.length > 0 ? renderOrderItems() : <div className="customer-app-empty-order"><span><UiIcon name="shoppingBag" size={25} /></span><strong>Keranjang masih kosong</strong><small>Pilih menu dari halaman Home atau Menu untuk mulai menyusun pesanan.</small><button type="button" onClick={() => navigate("menu")}>Lihat menu <UiIcon name="arrowRight" size={14} /></button></div>}
              </section>
              <aside className="customer-app-checkout-card">
                <span className="customer-app-eyebrow">RINGKASAN ORDER</span>
                <h2>Siap dikirim ke kasir?</h2>
                <label className="customer-app-pickup-field"><span><strong>Pilih waktu ambil</strong><small>{selectedPickupOption.helper}</small></span><select aria-label="Pilih waktu ambil" value={pickupSlot} onChange={(event) => setPickupSlot(event.target.value)}>{customerPickupOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
                <section className="customer-app-payment-methods" aria-labelledby="customer-payment-method-title">
                  <div className="customer-app-payment-heading"><div><span className="customer-app-eyebrow">METODE PEMBAYARAN</span><h3 id="customer-payment-method-title">Pilih cara bayar</h3><p>Cash di kasir atau lanjutkan ke aplikasi pilihanmu.</p></div><span className="customer-app-payment-secure"><UiIcon name="circleCheck" size={13} />Aman</span></div>
                  <div className="customer-app-payment-grid">
                    {customerPaymentMethods.map((method) => {
                      const isSelected = paymentMethod === method.id;
                      return <button type="button" className={`customer-app-payment-option ${isSelected ? "is-selected" : ""}`} aria-label={`${method.label}: ${method.description}`} aria-pressed={isSelected} key={method.id} onClick={() => { if (paymentMethod !== method.id) clearPaymentProof(); setPaymentMethod(method.id); }}><span className={`customer-app-payment-icon is-${method.id}`}><CustomerPaymentLogo method={method} /></span><span className="customer-app-payment-option-copy"><strong>{method.label}</strong><small>{method.description}</small></span><span className="customer-app-payment-check">{isSelected && <UiIcon name="check" size={13} />}</span></button>;
                    })}
                  </div>
                  <small className="customer-app-payment-note"><UiIcon name="info" size={13} />{selectedPaymentMethod.id === "cash" ? "Bayar langsung di kasir saat pesanan dikonfirmasi." : paymentProof ? "Bukti siap. Periksa kembali sebelum mengirim pesanan." : `Bayar di ${selectedPaymentMethod.label}, lalu unggah screenshot bukti di bawah.`}</small>
                </section>
                {selectedPaymentMethod.id !== "cash" && <section className="customer-app-payment-proof" aria-labelledby="customer-payment-proof-title">
                  <div className="customer-app-payment-proof-heading"><div><span className="customer-app-eyebrow">BUKTI PEMBAYARAN</span><h3 id="customer-payment-proof-title">Tambahkan screenshot</h3><p>Unggah bukti dari aplikasi setelah pembayaran selesai.</p></div>{paymentProof && <span className="customer-app-payment-proof-ready"><UiIcon name="circleCheck" size={12} />Siap</span>}</div>
                  <input ref={paymentProofInputRef} className="customer-app-payment-proof-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePaymentProofChange} aria-label="Pilih gambar bukti pembayaran" />
                  {paymentProof ? <div className="customer-app-payment-proof-preview"><div className="customer-app-payment-proof-preview-main"><Image className="customer-app-payment-proof-preview-image" src={paymentProof.dataUrl} alt={`Pratinjau bukti pembayaran ${paymentProof.fileName}`} width={104} height={76} unoptimized /><div><strong>{paymentProof.fileName}</strong><small>Gambar sudah diperkecil agar aman disimpan.</small></div></div><div className="customer-app-payment-proof-actions"><button type="button" onClick={() => paymentProofInputRef.current?.click()}>Ganti gambar</button><button type="button" onClick={clearPaymentProof}>Hapus</button></div></div> : <button type="button" className="customer-app-payment-proof-upload" onClick={() => paymentProofInputRef.current?.click()}><span className="customer-app-payment-proof-upload-icon"><UiIcon name="fileText" size={18} /></span><span><strong>Pilih gambar bukti pembayaran</strong><small>JPG, PNG, atau WEBP · maksimal 5 MB</small></span><UiIcon name="plus" size={16} /></button>}
                  {paymentProofError && <small className="customer-app-payment-proof-error" role="alert"><UiIcon name="circleAlert" size={13} />{paymentProofError}</small>}
                </section>}
                <div className="customer-app-checkout-total"><span>Total sementara</span><strong>{formatCurrency(cartTotal)}</strong></div>
                <button type="button" className="customer-app-checkout-button" disabled={!cart.length} onClick={handleCheckoutAction}>{!cart.length ? "Pilih menu dulu" : selectedPaymentMethod.id === "cash" ? "Kirim pesanan" : paymentProof ? "Kirim bukti pembayaran" : `Buka ${selectedPaymentMethod.label}`} <UiIcon name="arrowRight" size={16} /></button>
                <small>{!cart.length ? "Tambahkan menu ke keranjang sebelum memilih pembayaran." : selectedPaymentMethod.id === "cash" ? "Pembayaran dilakukan saat pesanan dikonfirmasi di kasir." : paymentProof ? "Bukti pembayaran akan dilampirkan ke order ini." : `Tombol ini membuka ${selectedPaymentMethod.label}; setelah membayar, kembali untuk mengunggah buktinya.`}</small>
              </aside>
            </div>
            <section className="customer-app-history-panel"><div className="customer-app-section-heading"><div><span className="customer-app-eyebrow">RIWAYAT</span><h2>Pesan lagi tanpa cari ulang</h2></div><span>{completedOrders.length} pesanan</span></div>{completedOrders.length > 0 ? <div className="customer-app-history-list">{completedOrders.slice(0, 4).map((order) => <article key={order.id}><UiIcon name="receipt" size={18} /><div><strong>{order.items[0]?.name ?? "Pesanan kantin"}{order.items.length > 1 ? ` + ${order.items.length - 1} menu` : ""}</strong><small>{formatCustomerOrderDate(order.createdAt)} · ambil {order.pickupSlot}</small></div><button type="button" onClick={() => reorder(order)}>Pesan lagi</button></article>)}</div> : <p>Riwayat pesananmu akan muncul setelah order selesai.</p>}</section>
          </section>}

          {activeView === "offers" && <section id="customer-offers" className="customer-app-page"><div className="customer-app-page-heading customer-app-page-heading-offers"><div><span className="customer-app-eyebrow">OFFERS</span><h1>Penawaran buat kamu</h1><p>Tambah sedikit keseruan di jam istirahat tanpa bikin dompet berat.</p></div></div><div className="customer-app-offer-grid"><article className="customer-app-offer-card is-purple"><div><span>COMBO HARI INI</span><h2>Nasi + Es Teh</h2><p>Lebih hemat untuk menu makan siang.</p><button type="button" onClick={() => { if (catalog[0]) addToCart(catalog[0]); if (catalog[1]) addToCart(catalog[1]); navigate("order"); }}>Ambil combo <UiIcon name="arrowRight" size={14} /></button></div><CustomerProductVisual product={catalog[0] ?? featuredProduct!} size={42} /></article><article className="customer-app-offer-card is-peach"><div><span>WAKTU SANTAI</span><h2>Minuman favorit</h2><p>Tambahkan Es Teh Manis ke setiap order.</p><button type="button" onClick={() => { const drink = catalog.find((item) => item.category === "Minuman"); if (drink) addToCart(drink); navigate("order"); }}>Tambah minuman <UiIcon name="arrowRight" size={14} /></button></div><CustomerProductVisual product={catalog.find((item) => item.category === "Minuman") ?? featuredProduct!} size={42} /></article></div><section className="customer-app-offer-note"><UiIcon name="info" size={18} /><div><strong>Bayar saat ambil</strong><p>Pilih waktu pengambilan, lalu kasir akan mengonfirmasi totalnya sebelum pembayaran.</p></div></section></section>}

          {activeView === "profile" && <section id="customer-profile" className="customer-app-page customer-profile-page">
            <div className="customer-profile-hero">
              <div className="customer-profile-cover">
                <button type="button" className="customer-profile-back" aria-label="Kembali ke beranda" onClick={() => navigate("home")}><UiIcon name="arrowLeft" size={17} /></button>
                  <button type="button" className="customer-profile-settings-trigger" aria-label="Buka pengaturan pesanan" onClick={() => scrollToCustomerTarget("#customer-profile-preferences")}><UiIcon name="settings" size={18} /></button>
                <div className="customer-profile-cover-brand"><span className="brand-mark"><CanteenOSMark size={36} /></span><span><strong>Canteen<span>OS</span></strong><small>Digital school canteen</small></span></div>
              </div>
              <div className="customer-profile-avatar-stage"><ProfileAvatar profile={profile} className="customer-profile-avatar" fallbackImageSrc="/customer-assets/customer-profile-avatar.png" /></div>
              <div className="customer-profile-identity">
                <div className="customer-profile-identity-copy"><span className="customer-app-eyebrow">AKUN PELANGGAN</span><h1>{profile.fullName || "Pelanggan Demo"}</h1><p>Pesan lebih cepat dengan menu favorit dan riwayat order tersimpan.</p></div>
                <div className="customer-profile-identity-actions"><button type="button" className="customer-profile-primary-action" onClick={() => navigate("menu")}>Pesan sekarang <UiIcon name="arrowRight" size={14} /></button><button type="button" className="customer-profile-logout" aria-label="Keluar dari akun pelanggan" onClick={onLogout}><UiIcon name="arrowLeft" size={14} />Keluar</button></div>
              </div>
            </div>

            <div className="customer-profile-quick-actions" aria-label="Aksi cepat akun pelanggan">
              <div className="customer-profile-quick-actions-heading"><span className="customer-app-eyebrow">AKSI CEPAT</span><strong>Pusat akun pelanggan</strong><small>Akses singkat ke aktivitasmu.</small></div>
              <button type="button" aria-label="Buka menu favorit" onClick={() => { setCategory("Favorit"); navigate("menu"); }}><span className="customer-profile-quick-action-icon"><UiIcon name="tag" size={18} /></span><span className="customer-profile-quick-action-copy"><strong>Menu favorit</strong><small>Menu yang kamu simpan</small></span><UiIcon name="chevronRight" size={15} /></button>
              <button type="button" aria-label="Buka riwayat order" onClick={() => navigate("order")}><span className="customer-profile-quick-action-icon"><UiIcon name="receipt" size={18} /></span><span className="customer-profile-quick-action-copy"><strong>Riwayat order</strong><small>Lihat dan pesan ulang</small></span><UiIcon name="chevronRight" size={15} /></button>
              <button type="button" aria-label="Buka notifikasi order" onClick={() => { setCustomerNotificationsOpen(true); setAccountMenuOpen(false); }}><span className="customer-profile-quick-action-icon"><UiIcon name="bell" size={18} /></span><span className="customer-profile-quick-action-copy"><strong>Notifikasi</strong><small>Status pesanan terbaru</small></span><UiIcon name="chevronRight" size={15} /></button>
            </div>

            <div className="customer-profile-stats" aria-label="Ringkasan akun pelanggan">
              <button type="button" className="customer-profile-stat is-favorite" onClick={() => { setCategory("Favorit"); navigate("menu"); }}><span className="customer-profile-stat-icon"><UiIcon name="tag" size={18} /></span><span className="customer-profile-stat-copy"><strong>{favorites.length}</strong><small>Menu favorit</small></span><span className="customer-profile-stat-action">Lihat <UiIcon name="chevronRight" size={13} /></span></button>
              <button type="button" className="customer-profile-stat is-orders" onClick={() => navigate("order")}><span className="customer-profile-stat-icon"><UiIcon name="receipt" size={18} /></span><span className="customer-profile-stat-copy"><strong>{orderHistory.length}</strong><small>Total order</small></span><span className="customer-profile-stat-action">Riwayat <UiIcon name="chevronRight" size={13} /></span></button>
              <button type="button" className="customer-profile-stat is-outlet" onClick={() => showNotice("Outlet utama aktif untuk akun demo.")}><span className="customer-profile-stat-icon"><UiIcon name="store" size={18} /></span><span className="customer-profile-stat-copy"><strong>Outlet Utama</strong><small>Tempat ambil default</small></span><span className="customer-profile-stat-action">Info <UiIcon name="chevronRight" size={13} /></span></button>
            </div>

            <section id="customer-profile-preferences" className="customer-profile-preferences" aria-labelledby="customer-profile-preferences-title">
              <header><span className="customer-app-eyebrow">PREFERENSI</span><h2 id="customer-profile-preferences-title">Pengaturan pesanan</h2><p>Atur kebiasaan kecil supaya antrean makan siang terasa lebih ringan.</p></header>
              <div className="customer-profile-settings-list">
                <button type="button" className="customer-profile-setting-row" onClick={() => navigate("order")}><span className="customer-profile-setting-icon"><UiIcon name="clock" size={17} /></span><span className="customer-profile-setting-copy"><strong>Waktu ambil default</strong><small>{selectedPickupOption.helper}</small></span><span className="customer-profile-setting-value">{pickupSlot}</span><UiIcon name="chevronRight" size={15} /></button>
                <button type="button" className="customer-profile-setting-row" onClick={() => { setCustomerNotificationsOpen(true); setAccountMenuOpen(false); }}><span className="customer-profile-setting-icon"><UiIcon name="bell" size={17} /></span><span className="customer-profile-setting-copy"><strong>Notifikasi order</strong><small>Status pesanan dan jam layanan</small></span><span className="customer-profile-setting-value is-on">Aktif</span><UiIcon name="chevronRight" size={15} /></button>
                <button type="button" className="customer-profile-setting-row is-danger" onClick={onLogout}><span className="customer-profile-setting-icon"><UiIcon name="arrowLeft" size={17} /></span><span className="customer-profile-setting-copy"><strong>Keluar dari portal</strong><small>Akhiri sesi akun pelanggan di perangkat ini</small></span><UiIcon name="chevronRight" size={15} /></button>
              </div>
            </section>
          </section>}
            </div>}
        </div>

        <nav className={`customer-app-bottom-nav${customerRouteLoading ? " is-route-loading" : " is-route-ready"}`} aria-label="Navigasi pelanggan"><button type="button" className={activeView === "home" ? "is-active" : ""} onClick={() => navigate("home")}><span className="customer-app-nav-icon"><UiIcon name="home" size={19} /></span><span>Home</span></button><button type="button" className={activeView === "menu" ? "is-active" : ""} onClick={() => navigate("menu")}><span className="customer-app-nav-icon"><UiIcon name="utensils" size={19} /></span><span>Menu</span></button><button type="button" className={`customer-app-order-tab ${activeView === "order" ? "is-active" : ""}`} onClick={() => navigate("order")}><span className="customer-app-nav-icon"><UiIcon name="shoppingBag" size={21} />{cartCount > 0 && <b>{cartCount}</b>}</span><span>Order</span></button><button type="button" className={activeView === "offers" ? "is-active" : ""} onClick={() => navigate("offers")}><span className="customer-app-nav-icon"><UiIcon name="tag" size={19} /></span><span>Offers</span></button><button type="button" className={activeView === "profile" ? "is-active" : ""} onClick={() => navigate("profile")}><span className="customer-app-nav-icon"><UiIcon name="user" size={19} /></span><span>Profil</span></button></nav>
      </div>

      {notice && <div className="customer-notice" role="status"><UiIcon name="circleCheck" size={16} />{notice}</div>}
        {menuDetail && <div className="customer-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMenuDetail(null); }}><section className="customer-detail-sheet" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="customer-detail-title"><header className="customer-detail-head"><div><span className="section-kicker">Detail menu</span><small>{menuDetail.category}</small></div><button type="button" className="customer-detail-close" aria-label="Tutup detail menu" onClick={() => setMenuDetail(null)}><UiIcon name="arrowLeft" size={17} /></button></header><div className="customer-detail-body"><CustomerProductVisual product={menuDetail} size={46} /><div><h2 id="customer-detail-title">{menuDetail.name}</h2><p>Menu ini tersedia di outlet hari ini. Tambahkan ke order untuk mengatur jumlah dan waktu ambilnya.</p><div className="customer-detail-meta"><span><small>Harga</small><strong>{formatCurrency(menuDetail.price)}</strong></span><span><small>Ketersediaan</small><strong>{menuDetail.stock > 0 ? `${menuDetail.stock} tersedia` : "Habis"}</strong></span></div></div></div><footer className="customer-detail-actions"><button type="button" className={`customer-detail-secondary ${favoriteIdSet.has(String(menuDetail.id)) ? "active" : ""}`} onClick={() => toggleFavorite(menuDetail)}><UiIcon name="tag" size={14} />{favoriteIdSet.has(String(menuDetail.id)) ? "Tersimpan" : "Simpan ke favorit"}</button><button type="button" className="customer-order-button customer-detail-order-button" disabled={menuDetail.stock <= 0} onClick={() => { addToCart(menuDetail); setMenuDetail(null); navigate("order"); }}>{menuDetail.stock > 0 ? "Tambah ke order" : "Menu habis"}<UiIcon name="arrowRight" size={16} /></button></footer></section></div>}
    </main>
  );
}
