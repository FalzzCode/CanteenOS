# KantinKita — Implementation Plan

## Tujuan produk

KantinKita adalah workspace operasional kantin sekolah untuk mempercepat transaksi, menjaga stok, mengontrol kas, dan memberi laporan yang bisa diaudit.

Referensi visual yang dipakai:

- Dashboard analitik dengan sidebar gelap, kartu KPI berwarna, panel rounded, dan grafik yang mudah dipindai.
- Login split-screen dengan aksen hijau, bidang ilustrasi, dan form autentikasi yang sederhana.
- Bahasa antarmuka Indonesia; angka uang memakai IDR.

## Scope MVP

1. Auth dan akses: email/password, Google OAuth, reset password, profile approval, role, dan outlet membership.
2. POS: katalog, pencarian, cart, pembayaran Tunai/QRIS/Lainnya, idempotency key, dan pengurangan stok atomic.
3. Master data: kategori, produk, harga jual, harga pokok, barcode/SKU, dan status aktif.
4. Inventori: minimum stock, movement, receiving, opname, adjustment, dan alert reorder.
5. Pembelian: supplier, purchase order, detail item, status penerimaan, dan histori biaya.
6. Shift dan kas: opening cash, cash in/out, expected cash, closing, variance, dan catatan rekonsiliasi.
7. Pengeluaran dan refund: approval status, actor, timestamp, bukti, dan audit trail.
8. Laporan: omzet, transaksi, gross profit estimasi, tren harian, top product, dan rasio penjualan.

## Definisi metrik utama

### Rasio penjualan

Untuk outlet dan rentang waktu tertentu:

`rasio kategori = omzet line item kategori / total omzet line item periode × 100%`

MVP hanya menghitung transaksi berstatus `paid`. Transaksi void tidak dihitung. Dukungan alokasi refund per item menjadi tahap berikutnya agar transaksi partial refund dapat mengurangi kategori secara presisi.

### Gross profit estimasi

`total penjualan - total harga pokok snapshot item`

Harga pokok diambil dari snapshot saat transaksi, bukan harga master terbaru.

## Role dan batas akses

KantinKita memakai dua lapisan role:

| Lapisan | Nilai | Fungsi |
| --- | --- | --- |
| Account role | `admin` / `customer` | Memisahkan portal operasional sekolah dari portal pelanggan. |
| Operational role | `super_admin`, `manager`, `cashier`, `stock`, `finance`, `viewer` | Menentukan izin di dalam workspace admin. |

Admin tidak dapat mendaftar sendiri. Login admin hanya diterima bila email sudah terverifikasi, profile berstatus `active`, `employee_code` terisi, `default_outlet_id` tersedia, dan `admin_approved_at` sudah diisi oleh administrator. Role operasional tetap disimpan di `profiles.role` dan seluruh akses bisnis dilindungi RLS.

Pendaftaran mandiri selalu membuat `account_role = 'customer'`, walaupun browser mengirim metadata role lain. Customer hanya membaca outlet, kategori aktif, dan produk aktif; POS, shift, stok, laporan, approval, dan administrasi tidak tersedia di portal customer.

| Role | Akses utama |
| --- | --- |
| Super admin | Semua outlet dan konfigurasi global |
| Manager | Master data, approval, laporan, dan operasional outlet |
| Cashier | Shift, kas, dan transaksi POS |
| Stock | Inventori, supplier, purchase order, dan receiving |
| Finance | Laporan, expenses, refund review, dan rekonsiliasi |
| Viewer | Baca laporan/audit sesuai scope |

Semua tabel bisnis memakai RLS. Authorization berasal dari profile/membership yang tersimpan, bukan dari metadata user yang dikirim dari browser.

## Status pekerjaan

- [x] UI dashboard dan login mengikuti referensi.
- [x] Rasio penjualan tampil di dashboard dan modul Laporan.
- [x] Demo workflows untuk transaksi, produk, inventori, pembelian, shift/kas, laporan, dan administrasi.
- [x] Supabase Auth client, session gate, open-shift lookup, RLS, atomic POS RPC, dan sales-mix RPC.
- [x] Data contract supplier, purchase order, expenses, refund request, dan policy role.
- [x] Account role `admin/customer`, admin access gate, customer signup, dan portal pelanggan.
- [x] Lint, production build, rendered UI test, dan migration contract test.
- [ ] Buat/Hubungkan project Supabase khusus KantinKita.
- [ ] Apply migration dan seed outlet, kategori, user manager, serta membership pertama.
- [ ] Uji transaksi live dengan akun cashier dan shift open.
- [ ] Publish Sites setelah ada persetujuan eksplisit untuk mengekspor source.

## Setup live

Salin `.env.example` menjadi `.env.local`, lalu isi:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_DEFAULT_OUTLET_ID=<outlet-uuid>
```

Migration yang harus diterapkan hanya pada project Supabase khusus KantinKita, berurutan:

`supabase/migrations/20260809100000_kantinkita_mvp.sql`

`supabase/migrations/20260809140000_account_roles.sql`

Setelah migration, seed data awal yang aman untuk outlet demo tersedia di:

`supabase/seed.sql`

## Acceptance criteria MVP

- User pending tidak dapat masuk workspace operasional.
- Admin tanpa email terverifikasi, employee code, outlet default, status aktif, atau approval tidak dapat masuk workspace.
- Self-registration selalu menghasilkan customer dan tidak dapat menaikkan privilege lewat metadata browser.
- Customer tidak dapat melihat navigasi atau data workspace operasional admin.
- Cashier hanya dapat menjual pada outlet membership dan shift miliknya yang sedang open.
- Harga dan total transaksi dihitung server-side; request yang sama tidak menggandakan transaksi.
- Penjualan mengurangi stok secara atomic dan gagal jika stok tidak cukup.
- Manager/finance dapat meninjau refund dan expenses sesuai scope outlet.
- Rasio penjualan konsisten dengan transaksi `paid` pada outlet dan periode yang dipilih.
- Setiap aksi sensitif memiliki actor dan timestamp pada audit log.
- `npm.cmd test` dan lint harus hijau sebelum publish.
