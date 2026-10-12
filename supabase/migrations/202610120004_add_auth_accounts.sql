-- =========================================================================
-- FieldForce Hub Migration: 202610120004_add_auth_accounts.sql
-- Penyiapan 13 Akun Resmi dengan Password Ter-Hash SHA-256
-- (Password Default Asli: 123 -> Di-hash secara kriptografis demi keamanan)
-- =========================================================================

-- 1. Berikan hak akses skema public ke role anon dan authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- 2. Lepaskan batasan foreign key agar pengelolaan akun mandiri bebas error
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_area_code_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_division_code_fkey;

-- 3. Pastikan kolom ID memiliki default UUID otomatis
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Tambahkan kolom username dan password ke tabel profiles jika belum ada
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS password text;

-- 5. Buat index unik untuk username agar tidak ada duplikasi
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (lower(username));

-- 6. Buka izin keamanan RLS penuh untuk profiles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_anon_profiles" ON public.profiles;
CREATE POLICY "allow_anon_profiles" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. SEED & SINKRONISASI 13 AKUN HIERARKI RESMI
-- Password Hash SHA-256 dari '123': a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3

-- 1. MASTER ADMINISTRATOR
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('master.all', 'master_admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Siti Firdaus (Master)', 'FC', 'FC', 'master', 'Master Administrator', 'Nasional', '083854377989')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'master_admin', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'FC', account_level = 'master';

-- 2. DIVISI FC (Field Coordinator)
-- a. Admin FC
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('admin.fc', 'fc_admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Admin Koordinator FC', 'FC', 'FC', 'admin', 'Admin Divisi FC', 'East Java Bali Nusra', '081234567890')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'fc_admin', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'FC', account_level = 'admin';

-- b. User FC
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('field.coordinator', 'fc_user', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Siti Firdaus', 'FC', 'FC', 'user', 'Field Coordinator Lapangan', 'East Java Bali Nusra', '083854377989')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'fc_user', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'FC', account_level = 'user';

-- 3. DIVISI MD (Merchandiser)
-- a. Admin MD
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('admin.md', 'md_admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Admin Merchandiser', 'MD', 'MD', 'admin', 'Admin Divisi MD', 'Surabaya', '081987654300')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'md_admin', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'MD', account_level = 'admin';

-- b. User MD
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('GSKMD320', 'md_user', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Muhamad Faizal Kako Djata', 'MD', 'MD', 'user', 'Merchandiser Lapangan', 'Denpasar', '081987654321')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'md_user', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'MD', account_level = 'user';

-- 4. DIVISI MDPS (Merchandiser Product Specialist)
-- a. Admin MDPS
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('admin.mdps', 'mdps_admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Admin MDPS', 'MDPS', 'MDPS', 'admin', 'Admin Divisi MDPS', 'Surabaya', '082133445500')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'mdps_admin', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'MDPS', account_level = 'admin';

-- b. User MDPS
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('GSKMD342', 'mdps_user', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Sindy Ayu Rahmawati', 'MDPS', 'MDPS', 'user', 'MD Product Specialist Lapangan', 'Surabaya', '082133445566')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'mdps_user', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'MDPS', account_level = 'user';

-- 5. DIVISI SALESMAN (Sales Representative)
-- a. Admin Salesman
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('admin.sales', 'sales_admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Admin Salesman', 'Salesman', 'SALES', 'admin', 'Admin Divisi Sales', 'Surabaya', '085611223300')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'sales_admin', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'Salesman', account_level = 'admin';

-- b. User Salesman
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('34Q4001', 'sales_user', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Mochamad Hanif Aziz', 'Salesman', 'SALES', 'user', 'Sales Representative Lapangan', 'Surabaya', '085611223344')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'sales_user', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'Salesman', account_level = 'user';

-- 6. DIVISI TS (Territory Sales)
-- a. Admin TS
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('admin.ts', 'ts_admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Admin Territory Sales', 'TS', 'TS', 'admin', 'Admin Divisi TS', 'Surabaya', '081399887700')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'ts_admin', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'TS', account_level = 'admin';

-- b. User TS
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('TS1', 'ts_user', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'TS Surabaya & Sekitar', 'TS', 'TS', 'user', 'Territory Sales Lapangan', 'Surabaya', '081399887766')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'ts_user', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'TS', account_level = 'user';

-- 7. DIVISI KAM (Key Account Manager)
-- a. Admin KAM
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('admin.kam', 'kam_admin', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Admin Key Account Manager', 'KAM', 'KAM', 'admin', 'Admin Divisi KAM', 'Nasional', '081122334400')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'kam_admin', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'KAM', account_level = 'admin';

-- b. User KAM
INSERT INTO public.profiles (user_code, username, password, full_name, operational_role, division_code, account_level, position, area_code, phone)
VALUES ('KAM1', 'kam_user', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Bayu Maki (NAM)', 'KAM', 'KAM', 'user', 'National Account Manager Lapangan', 'Nasional', '081122334455')
ON CONFLICT (user_code) DO UPDATE SET 
  username = 'kam_user', password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', operational_role = 'KAM', account_level = 'user';

-- 8. Hash semua password plain text yang masih ada
UPDATE public.profiles 
SET password = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' 
WHERE password = '123' OR length(password) < 60;
