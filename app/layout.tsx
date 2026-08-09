import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KantinKita — Sistem Kantin Digital Sekolah",
  description: "Workspace operasional untuk POS, inventori, pembelian, laporan, dan audit kantin sekolah.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
