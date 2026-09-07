import type { Metadata } from "next";
import "./globals.css";
import "./system-ui.css";
import "./ui-reset.css";

export const metadata: Metadata = {
  title: "CanteenOS — Sistem Kantin Digital Sekolah",
  description: "Workspace operasional untuk POS, inventori, pembelian, laporan, dan audit kantin sekolah.",
  icons: {
    icon: "/canteenos-mark-j-v3.png",
    shortcut: "/canteenos-mark-j-v3.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" data-theme="light"><body>{children}</body></html>;
}
