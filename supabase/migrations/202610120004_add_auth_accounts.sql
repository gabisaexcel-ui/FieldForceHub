-- =========================================================================
-- FieldForce Hub Migration: 202610120004_add_auth_accounts.sql
-- Penambahan Kolom Akun (Username & Password) untuk Setiap Orang / Manpower
-- =========================================================================

-- 1. Berikan hak akses skema public ke role anon dan authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- 2. Lepaskan batasan foreign key agar pembuatan akun mandiri bebas tanpa error 409
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_area_code_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_division_code_fkey;

-- 3. Pastikan kolom ID memiliki default UUID otomatis
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Tambahkan kolom username dan password ke tabel profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS password text;

-- 5. Buat index unik untuk username agar tidak ada duplikasi nama pengguna
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (lower(username));

-- 6. Buka izin RLS (Row Level Security) penuh untuk tabel profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_anon_profiles" ON public.profiles;
CREATE POLICY "allow_anon_profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. Isi Username & Password Mandiri untuk Masing-Masing Orang yang Sudah Ada (Default Password: 123)

-- a. Siti Firdaus (Field Coordinator Lapangan)
UPDATE public.profiles 
  SET username = 'fc_user', password = '123' 
  WHERE user_code = 'field.coordinator' OR lower(full_name) LIKE '%siti firdaus%' AND account_level = 'user';

-- b. Admin Koordinator Wilayah (Admin FC)
UPDATE public.profiles 
  SET username = 'fc_admin', password = '123' 
  WHERE user_code = 'admin.fc' OR lower(full_name) LIKE '%admin koordinator%';

-- c. Muhamad Faizal Kako Djata (Merchandiser)
UPDATE public.profiles 
  SET username = 'md_user', password = '123' 
  WHERE user_code = 'GSKMD320' OR lower(full_name) LIKE '%faizal%';

-- d. Sindy Ayu Rahmawati (MD Product Specialist)
UPDATE public.profiles 
  SET username = 'mdps_user', password = '123' 
  WHERE user_code = 'GSKMD342' OR lower(full_name) LIKE '%sindy ayu%';

-- e. Mochamad Hanif Aziz (Salesman)
UPDATE public.profiles 
  SET username = 'sales_user', password = '123' 
  WHERE user_code = '34Q4001' OR lower(full_name) LIKE '%hanif%';

-- f. TS Surabaya & Sekitar (Territory Sales)
UPDATE public.profiles 
  SET username = 'ts_user', password = '123' 
  WHERE user_code = 'TS1' OR lower(full_name) LIKE '%ts surabaya%';

-- g. Bayu Maki (Key Account Manager / NAM)
UPDATE public.profiles 
  SET username = 'kam_user', password = '123' 
  WHERE user_code = 'KAM1' OR lower(full_name) LIKE '%bayu maki%';

-- h. Master Administrator (Siti Firdaus Master)
UPDATE public.profiles 
  SET username = 'master_admin', password = '123' 
  WHERE user_code = 'master.all' OR account_level = 'master';

-- i. Berikan password '123' dan username default untuk semua personil lainnya yang belum terisi
UPDATE public.profiles 
  SET username = lower(user_code) 
  WHERE (username IS NULL OR username = '') AND user_code IS NOT NULL;

UPDATE public.profiles 
  SET password = '123' 
  WHERE password IS NULL OR password = '';
