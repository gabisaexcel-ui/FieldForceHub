-- =========================================================================
-- FieldForce Hub Migration: 202610120003_connect_attendance_and_profiles.sql
-- Integrasi Fitur Presensi & Data Diri Mandiri ke Supabase
-- =========================================================================

-- 1. Berikan hak akses penuh skema public ke role 'anon' dan 'authenticated'
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

-- 2. Penyesuaian Tabel Profiles (Data Diri)
-- Lepas ketergantungan wajib ke auth.users agar prototype & multi-role simulasi dapat berjalan mulus
alter table if exists public.profiles alter column id set default gen_random_uuid();
alter table if exists public.profiles drop constraint if exists profiles_id_fkey;

alter table if exists public.profiles 
  add column if not exists position text,
  add column if not exists gender text,
  add column if not exists maps_url text,
  add column if not exists join_date text;

-- Aktifkan RLS dan buat policy akses untuk anon & authenticated
alter table public.profiles enable row level security;

drop policy if exists "profiles allow all access" on public.profiles;
create policy "profiles allow all access" on public.profiles
  for all to anon, authenticated
  using (true)
  with check (true);

-- 3. Penyesuaian Tabel Attendance Records (Presensi GPS & Selfie)
alter table if exists public.attendance_records alter column user_id drop not null;
alter table if exists public.attendance_records drop constraint if exists attendance_records_user_id_fkey;

alter table if exists public.attendance_records 
  add column if not exists user_code text,
  add column if not exists user_name text,
  add column if not exists user_role text;

-- Aktifkan RLS dan buat policy akses untuk presensi
alter table public.attendance_records enable row level security;

drop policy if exists "attendance allow all access" on public.attendance_records;
create policy "attendance allow all access" on public.attendance_records
  for all to anon, authenticated
  using (true)
  with check (true);

-- 4. Enable Supabase Realtime untuk tabel profiles & attendance_records
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.attendance_records;

-- 5. Seed Data Awal Manpower / Demo Accounts ke Tabel Profiles
insert into public.profiles (
  user_code, full_name, operational_role, account_level, division_code, area_code,
  phone, position, gender, address, maps_url, join_date
) values
  ('master.all', 'Siti Firdaus (Master)', 'FC', 'master', 'FC', 'Nasional',
   '083854377989', 'Master Administrator', 'Perempuan', 'Jl. Basuki Rahmat No. 12, Surabaya',
   'https://maps.google.com/?q=-7.2654,112.7412', '01/07/2024'),
  ('field.coordinator', 'Siti Firdaus', 'FC', 'user', 'FC', 'East Java Bali Nusra',
   '083854377989', 'Field Coordinator', 'Perempuan', 'Jl. Manyar Kertoarjo No. 45, Surabaya',
   'https://maps.google.com/?q=-7.2798,112.7663', '01/07/2024'),
  ('admin.fc', 'Admin Koordinator Wilayah', 'FC', 'admin', 'FC', 'East Java Bali Nusra',
   '081234567890', 'Admin Divisi', 'Perempuan', 'Jl. Darmo Permai II No. 8, Surabaya',
   'https://maps.google.com/?q=-7.2812,112.6934', '01/01/2023'),
  ('MD1', 'Dedy Permana', 'MD', 'user', 'MD', 'Surabaya',
   '08123456001', 'Merchandiser', 'Laki-laki', 'Jl. Rungkut Madya No. 10, Surabaya',
   'https://maps.google.com/?q=-7.3312,112.7789', '01/06/2023'),
  ('MDPS1', 'Nurul Eka Safitri', 'MDPS', 'user', 'MDPS', 'Surabaya',
   '08123456019', 'Merchandiser Product Specialist', 'Perempuan', 'Jl. Kertajaya Indah No. 22, Surabaya',
   'https://maps.google.com/?q=-7.2845,112.7741', '15/08/2023'),
  ('SALES1', 'Achmad Rional Al Kubri', 'Salesman', 'user', 'SALES', 'Probolinggo',
   '08123456030', 'Sales Representative', 'Laki-laki', 'Jl. Panglima Sudirman No. 5, Probolinggo',
   'https://maps.google.com/?q=-7.7543,113.2159', '10/02/2024'),
  ('TS1', 'Territory Sales Lead', 'TS', 'user', 'TS', 'Surabaya',
   '08123456041', 'Territory Sales Lead', 'Laki-laki', 'Jl. Pemuda No. 1, Surabaya',
   'https://maps.google.com/?q=-7.2638,112.7473', '01/01/2022')
on conflict (user_code) do update set
  full_name = excluded.full_name,
  position = excluded.position,
  area_code = excluded.area_code,
  phone = excluded.phone,
  gender = excluded.gender,
  address = excluded.address,
  maps_url = excluded.maps_url,
  join_date = excluded.join_date;

-- 6. Seed Data Presensi Hari Ini ke Tabel Attendance Records
insert into public.attendance_records (
  work_date, check_in_at, latitude, longitude, status, notes,
  area_code, division_code, user_code, user_name, user_role
) values
  (current_date, (current_date + time '07:54:00'), -7.2575, 112.7521, 'great', 'Tepat waktu (GPS Akurat)', 'Surabaya', 'MD', 'MD1', 'Dedy Permana', 'MD'),
  (current_date, (current_date + time '08:03:00'), -7.2612, 112.7489, 'safe', 'Toleransi 15 menit', 'Surabaya', 'MDPS', 'MDPS2', 'Sindy Ayu Rahmawati', 'MDPS'),
  (current_date, (current_date + time '08:17:00'), -8.6705, 115.2126, 'alert', 'Traffic padat bypass', 'Denpasar', 'MDPS', 'MDPS3', 'Ni Made Nuraeni', 'MDPS'),
  (current_date, (current_date + time '07:49:00'), -8.2192, 114.3692, 'great', 'Check-in toko pertama', 'Banyuwangi', 'MDPS', 'MDPS4', 'Indah Sriwahyu', 'MDPS'),
  (current_date, (current_date + time '07:58:00'), -7.2715, 112.7354, 'great', 'Rute toko barat', 'Surabaya', 'SALES', 'SALES2', 'Mochamad Hanif Aziz', 'Salesman')
on conflict do nothing;
