# Realtime KantinKita

Workspace operasional memakai Supabase Postgres Changes untuk menyegarkan data per outlet tanpa polling. Mode demo tetap berjalan lokal dan selalu ditandai sebagai `Demo lokal`; aplikasi tidak menampilkan status palsu seolah sudah tersambung.

## Alur data

1. Setelah sesi dan profil terverifikasi, klien membuka satu channel unik untuk outlet aktif.
2. Event dari `sales`, `inventory_items`, `products`, `shifts`, `purchase_orders`, `refund_requests`, `stock_movements`, dan `expenses` difilter dengan `outlet_id`.
3. Mutasi kas difilter dengan `shift_id`, sedangkan perubahan profil pengguna aktif difilter dengan `id` pengguna.
4. Event yang datang digabung selama 140 ms lalu query sumber dijalankan ulang. Dashboard, transaksi, produk, inventori, pembelian, laporan, katalog POS, shift, dan mutasi kas membaca snapshot terbaru dari database.
5. Saat browser kembali online atau tab kembali aktif, aplikasi meminta resync penuh untuk menutup kemungkinan event yang terlewat.

RLS tetap menjadi batas otorisasi utama. Filter channel mengurangi event yang tidak relevan, tetapi bukan pengganti policy database.

## Status koneksi

- `Demo lokal`: variabel Supabase belum diisi atau outlet demo dipakai.
- `Menghubungkan realtime`: channel sedang melakukan handshake.
- `Realtime aktif`: subscription menerima status `SUBSCRIBED`.
- `Menyambung ulang`: browser offline atau channel ditutup saat jaringan tersedia.
- `Sinkronisasi terganggu`: channel error atau timeout. Snapshot terakhir tetap ditampilkan.

## Aktivasi backend

1. Isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, dan `VITE_DEFAULT_OUTLET_ID` dari project KantinKita.
2. Terapkan semua migration secara berurutan, termasuk `20260810180451_enable_operational_realtime.sql`.
3. Pastikan pengguna mempunyai profil aktif dan membership outlet yang sesuai. Jangan memakai project database lain untuk pengujian.
4. Jalankan web, login sebagai admin yang sah, lalu buka outlet yang sama di dua tab.

## Pengujian lokal

Project sudah memiliki `supabase/config.toml`. Pada mesin ini port bawaan Supabase termasuk dalam reserved port range Windows, sehingga local stack memakai API `55421`, database `55422`, dan service pendukung pada range `55420–55429`.

```powershell
npm install
npx supabase start --exclude imgproxy,studio,edge-runtime,logflare,vector,supavisor,mailpit,postgres-meta
npx supabase db reset --local
npx supabase db lint --local --schema public --level warning --fail-on error
npx supabase db advisors --local --type security --level info --fail-on error
```

Verifier lintas klien membutuhkan tiga environment variable sementara dari output `supabase status --output json`:

- `SUPABASE_TEST_URL`
- `SUPABASE_TEST_PUBLISHABLE_KEY`
- `SUPABASE_TEST_SECRET_KEY`

Setelah itu jalankan `npm run test:realtime`. Script membuat user uji terkonfirmasi, memprovisikan admin melalui service role lokal, menyelesaikan transaksi atomik dari klien pertama, dan menunggu event `sales`, `inventory_items`, serta `products` di klien kedua. Script juga memastikan akun pelanggan tidak dapat menaikkan role sendiri atau membaca baris penjualan.

## Verifikasi dua tab

1. Tab A membuka Dashboard atau Laporan; Tab B membuka POS.
2. Selesaikan transaksi di Tab B.
3. Tanpa reload manual, pastikan omzet, transaksi, grafik laporan, stok, dan katalog di Tab A menyegarkan.
4. Ubah status produk pada halaman Produk & Menu dan pastikan POS pada tab lain ikut berubah.
5. Putuskan jaringan sebentar. Badge harus berpindah ke `Menyambung ulang`, lalu kembali ke `Realtime aktif` dan melakukan resync setelah jaringan pulih.

Test statis menjaga publication, filter outlet, cleanup channel, status koneksi, dan wiring refresh tetap ada. Bukti akhir realtime tetap harus dilakukan terhadap project Supabase KantinKita yang sebenarnya.
