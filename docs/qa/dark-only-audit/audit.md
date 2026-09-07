# Dark-only UI QA

Tanggal: 11 Agustus 2026
Preview: `http://localhost:3003/`

## Ringkasan

Audit dilakukan dalam tiga putaran pada bundle terakhir. Semua putaran memakai satu tema gelap; tidak ada toggle tema atau selector light yang tersisa di runtime.

## Putaran 1 — invariant tema

- Source/layout: `data-theme="dark"` aktif; boot script, localStorage tema, dan komponen toggle sudah tidak dipakai.
- Server HTML/CSS: HTTP 200, markup dark terdeteksi, markup light/toggle tidak terdeteksi.
- Runtime DOM: `colorScheme=dark`, tombol tema `0`, node toggle `0`, dan `overflow-x=false`.

**Status: PASS**

## Putaran 2 — desktop dan alur utama

- Dashboard: 5 KPI, kartu penjualan, rasio pendapatan, character slot, dan tombol upload tampil.
- POS: produk, `Cek keranjang`, `Bayar`, keranjang, dan transisi ke metode pembayaran aktif.
- Laporan: KPI, rasio/donut, tren harian, dan ekspor tampil.
- Administrasi: daftar pengguna, audit log, dan role tampil.
- Profil: menu profil, pengaturan foto/nama, pengaturan password, dan logout dapat dibuka.
- Tidak ada overflow horizontal pada halaman yang diuji.

**Status: PASS**

## Putaran 3 — mobile/responsive

Viewport diuji pada `390x844` untuk POS payment, dashboard, laporan, dan pengaturan profil.

- Bottom navigation berisi 5 item dan tetap terbaca.
- POS payment action memiliki lebar penuh yang sesuai viewport.
- Dashboard dan laporan tidak menyebabkan overflow horizontal.
- Pengaturan profil tetap terbaca dan tombol tutup memakai ikon `arrow-left` dengan label aksesibilitas `Tutup pengaturan`.

**Status: PASS**

## Optimasi yang diterapkan

- Tombol tutup pengaturan profil diubah dari ikon `X` menjadi `arrow-left`; fungsi close dan `aria-label` tetap dipertahankan.
- Tidak mengubah kontrak data, alur autentikasi, atau sistem operasional yang sudah ada.

## Verifikasi teknis

- `npm.cmd test`: 7 passed, 0 failed.
- `npm.cmd run lint`: 0 errors; 1 warning lama pada `<img>` di `app/page.tsx`.
- Build Next.js berhasil.
- Preview terakhir merespons HTTP 200.

## Evidence

- `01-dashboard-desktop.png`
- `02-pos-desktop.png`
- `03-reports-desktop.png`
- `04-admin-desktop.png`
- `05-pos-mobile-payment.png`
- `06-dashboard-mobile.png`
- `07-reports-mobile.png`
- `08-profile-settings-mobile-optimized.png`

Catatan: audit ini memverifikasi UI, routing, interaksi lokal, build, dan render preview. Upload file nyata, persistence backend, dan koneksi realtime Supabase tidak disimulasikan sebagai bagian dari audit visual ini.
