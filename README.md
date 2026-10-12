# FieldForce Hub

Satu aplikasi operasional untuk Master, Admin divisi, dan user role (FC, MD, MDPS, Salesman, TS, dan KAM). Tampilan, menu, data, serta aksi otomatis mengikuti hierarki akun dan scope divisi/area.

## Stack

- React + TypeScript + Vite
- TanStack Query
- Supabase PostgreSQL, Auth, Storage, Realtime, dan RLS
- Cloudflare Workers Static Assets
- Lucide icons

## Menjalankan lokal

```bash
npm install
npm run dev
```

Aplikasi otomatis berjalan dalam demo mode ketika variabel Supabase belum diisi. Gunakan pemilih akun di kanan atas untuk mencoba tampilan Master, Admin, FC, MD, Salesman, dan TS.

## Menyambungkan Supabase

1. Buat project Supabase.
2. Jalankan migration di `supabase/migrations/202610120001_initial_schema.sql`.
3. Buat private Storage buckets yang dicantumkan pada bagian akhir migration.
4. Salin `.env.example` menjadi `.env.local`.
5. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`.
6. Buat akun Auth dan row `profiles` yang menggunakan UUID akun tersebut.

Jangan pernah menaruh Supabase secret key di variabel `VITE_*`. Operasi administratif yang membutuhkan secret key harus dijalankan melalui Cloudflare Worker/API terproteksi.

## Workflow cuti

- Cuti FC: Submit → Validation → Input TTD FC → Export/cetak → HO TTD manual → Upload → Final Approved.
- Cuti manpower: Submit → Validation → FC Approval → Export/cetak → HO TTD manual → Upload → Final Approved.

HO sengaja tidak dibuat sebagai role sistem. Database hanya menyimpan status proses serta dokumen hasil tanda tangan manual.

## Deployment Cloudflare

```bash
npm run build
npx wrangler deploy
```

`wrangler.jsonc` sudah dikonfigurasi untuk SPA fallback. Static assets dilayani langsung oleh Cloudflare; endpoint Worker sensitif dapat ditambahkan kemudian di bawah `/api/*`.

## Struktur akses

- `master`: semua divisi, area, akun, data, dan pengaturan.
- `admin`: pengelolaan akun dan data hanya di divisi/area miliknya.
- `user`: fungsi operasional dan data sesuai role/scope.

Keamanan wajib ditegakkan dengan RLS/API. Menyembunyikan menu di UI bukan mekanisme otorisasi.
