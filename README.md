# Widitech Invoice

Aplikasi pembuat invoice yang cepat dan simpel: isi klien & item, pilih template, lalu download PDF atau kirim lewat WhatsApp/email.

- Login email + password; semua data tersimpan di **PostgreSQL**
- 18 template bawaan (5 layout header, 3 gaya tabel, 2 gaya total, 6 ornamen) — bisa diedit/ditambah oleh admin
- Branding per pengguna: warna brand, font, ornamen, watermark logo, tanda tangan (gambar langsung / unggah), stempel, teks penutup
- Dokumen invoice dalam Bahasa Indonesia atau English
- Autofill klien & item dari invoice sebelumnya
- Diskon, pajak (PPN), pembayaran bertahap (DP/termin)
- Ekspor PDF A4 dengan pemisah halaman otomatis
- Mobile-first, dark mode
- Panel **master admin**: lihat semua pengguna & invoice mereka, nonaktifkan akun, kelola template

## Setup

1. Buat database kosong di PostgreSQL, misalnya:

   ```sql
   CREATE DATABASE widitech_invoice;
   ```

2. Salin `.env.example` menjadi `.env.local` dan isi `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.

3. Install, buat tabel, dan buat akun admin + template bawaan:

   ```bash
   npm install
   npm run db:setup     # = db:migrate + db:seed
   npm run dev
   ```

4. Buka http://localhost:3000 — login dengan akun admin, atau daftar akun baru.

## Perintah database

| Perintah | Fungsi |
| --- | --- |
| `npm run db:migrate` | Menjalankan migrasi di folder `drizzle/` |
| `npm run db:seed` | Membuat template bawaan & akun admin (aman dijalankan berulang) |
| `npm run db:generate` | Membuat file migrasi baru setelah mengubah `lib/db/schema.ts` |
| `npm run db:studio` | Melihat isi database lewat Drizzle Studio |

## Struktur

- `app/(auth)/` — halaman login & daftar
- `app/(app)/` — aplikasi (wajib login): daftar invoice, buat/edit/detail, pengaturan, `admin/`
- `proxy.ts` — mengarahkan pengunjung tanpa sesi ke halaman login
- `lib/db/schema.ts` — tabel `users`, `sessions`, `user_settings`, `invoices`, `templates`
- `lib/auth.ts` — password (bcrypt), sesi di database, cookie httpOnly
- `lib/actions/` — server actions (auth, data, admin); semua input divalidasi di `lib/validation.ts`
- `lib/store.ts` — state di browser, disinkronkan ke server
- `components/InvoiceEditor.tsx` — form invoice
- `components/InvoiceDocument.tsx` — dokumen invoice (preview & PDF)
- `lib/themes.ts` — definisi template bawaan & registry template dari database
