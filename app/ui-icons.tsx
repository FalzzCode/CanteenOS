import Image from "next/image";
import type { CSSProperties } from "react";

type CanteenOSMarkProps = {
  size?: number;
  className?: string;
};

const iconMap = {
  arrowDown: "arrow-down.svg",
  arrowLeft: "arrow-left.svg",
  arrowRight: "arrow-right.svg",
  arrowUpRight: "arrow-up-right.svg",
  banknote: "banknote-1.svg",
  bell: "bell.svg",
  boxes: "box-2.svg",
  briefcase: "suitcase-work.svg",
  calendar: "calendar-days.svg",
  chartLine: "line-chart-1.svg",
  chartPie: "pie-chart-1.svg",
  chevronDown: "chevron-down-medium.svg",
  chevronRight: "chevron-right-medium.svg",
  check: "checkmark-1.svg",
  circle: "circle.svg",
  circleAlert: "exclamation-circle.svg",
  circleCheck: "circle-check.svg",
  circleDollar: "currency-dollar.svg",
  circleMinus: "circle-minus.svg",
  clipboard: "clipboard.svg",
  clock: "clock.svg",
  cookie: "cookies.svg",
  cup: "cup-hot.svg",
  creditCard: "credit-card-1.svg",
  droplet: "glass-water.svg",
  eye: "eye-open.svg",
  eyeOff: "eye-slash.svg",
  fileText: "file-text.svg",
  grid: "grid.svg",
  home: "home.svg",
  info: "circle-info.svg",
  menu: "bars-three.svg",
  minus: "minus-medium.svg",
  more: "circle-dots-center-1.svg",
  package: "package.svg",
  packageCheck: "package-ckeck.svg",
  packageOpen: "package-in.svg",
  panelLeft: "sidebar.svg",
  plus: "plus-medium.svg",
  receipt: "receipt-bill.svg",
  rotateCcw: "arrow-rotate-counter-clockwise.svg",
  scanBarcode: "barcode.svg",
  search: "magnifying-glass.svg",
  settings: "settings-gear-1.svg",
  shoppingBag: "shopping-bag-1.svg",
  soup: "toast.svg",
  square: "square-lines.svg",
  store: "store-4.svg",
  tag: "tag.svg",
  trendingUp: "trending-1.svg",
  truck: "truck.svg",
  undo: "arrow-undo-up.svg",
  user: "user.svg",
  users: "user-group.svg",
  utensils: "fork-knife.svg",
  wallet: "wallet-2.svg",
  walletMinimal: "wallet-1.svg",
  x: "x.svg",
} as const;

export type UiIconName = keyof typeof iconMap;

type UiIconStyle = CSSProperties & { "--ui-icon-source": string };

export function UiIcon({ name, size = 18, className }: { name: UiIconName; size?: number; strokeWidth?: number; className?: string }) {
  const style: UiIconStyle = {
    "--ui-icon-source": `url("/icons/central-fill/${iconMap[name]}")`,
    width: size,
    height: size,
  };

  return <span aria-hidden="true" className={className ? `ui-icon ${className}` : "ui-icon"} style={style} />;
}

/**
 * Keep the J mark as one real asset instead of redrawing it in every brand
 * slot. This prevents subtle differences between login, admin, customer,
 * mobile navigation, and the browser favicon.
 */
export function CanteenOSMark({ size = 34, className }: CanteenOSMarkProps) {
  return (
    <Image
      aria-hidden="true"
      className={className ? `canteenos-mark ${className}` : "canteenos-mark"}
      draggable={false}
      alt=""
      height={size}
      priority={size >= 39}
      src="/canteenos-mark-j-v3.png"
      unoptimized
      width={size}
    />
  );
}

export function ProductIcon({ tone, size = 24 }: { tone?: string; size?: number }) {
  const name: UiIconName = tone === "gold" ? "cookie" : tone === "mint" ? "cup" : tone === "blue" ? "droplet" : tone === "rose" ? "utensils" : tone === "peach" ? "soup" : "utensils";
  return <UiIcon name={name} size={size} />;
}
