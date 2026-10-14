-- =========================================================================
-- FieldForce Hub Migration: 202610120005_add_attendance_settings.sql
-- Master Pengaturan Parameter Status Kehadiran (Attendance Settings & Thresholds)
-- =========================================================================

-- 1. Berikan hak akses skema public
grant usage on schema public to anon, authenticated;

-- 2. Buat tabel master attendance_settings untuk konfigurasi status level master
create table if not exists public.attendance_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text unique not null default 'DEFAULT',
  setting_name text not null default 'Pengaturan Jam Masuk & Toleransi Lapangan',
  work_start_time time without time zone not null default '08:00:00',
  safe_grace_minutes integer not null default 2,          -- Toleransi aman (menit) setelah jam masuk (<= 2 mnt -> Safe)
  alert_threshold_minutes integer not null default 2,     -- Melebihi menit ini dianggap Terlambat (Alert)
  warning_threshold_minutes integer not null default 30,  -- Melebihi menit ini (misal > 30 mnt / setengah jam) dianggap Warning (Sangat Terlambat)
  is_active boolean not null default true,
  description text default 'Aturan hitung otomatis status presensi: Great (<= 08:00), Safe (<= +2 menit), Alert (> 2 menit), Warning (> 30 menit).',
  updated_by text default 'master.all',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Berikan izin tabel ke role anon dan authenticated
grant all on public.attendance_settings to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

-- 4. Aktifkan Row Level Security (RLS)
alter table public.attendance_settings enable row level security;

drop policy if exists "attendance_settings allow all access" on public.attendance_settings;
create policy "attendance_settings allow all access" on public.attendance_settings
  for all to anon, authenticated
  using (true)
  with check (true);

-- 5. Tambahkan tabel ke Supabase Realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'attendance_settings'
  ) then
    alter publication supabase_realtime add table public.attendance_settings;
  end if;
end;
$$;

-- 6. Seed Data Awal Pengaturan Master Status Kehadiran
insert into public.attendance_settings (
  setting_key,
  setting_name,
  work_start_time,
  safe_grace_minutes,
  alert_threshold_minutes,
  warning_threshold_minutes,
  is_active,
  description
) values (
  'DEFAULT',
  'Master Aturan Jam Masuk & Toleransi Lapangan',
  '08:00:00',
  2,   -- <= 2 menit setelah 08:00 = Safe (Toleransi)
  2,   -- > 2 menit setelah 08:00 = Alert (Terlambat)
  30,  -- > 30 menit setelah 08:00 (setengah jam) = Warning (Sangat Terlambat)
  true,
  'Aturan otomatis: Great (<= 08:00 WIB), Safe (08:01 - 08:02 WIB), Alert (> 2 menit s/d 30 menit WIB), Warning (> 30 menit WIB).'
)
on conflict (setting_key) do update set
  work_start_time = excluded.work_start_time,
  safe_grace_minutes = excluded.safe_grace_minutes,
  alert_threshold_minutes = excluded.alert_threshold_minutes,
  warning_threshold_minutes = excluded.warning_threshold_minutes,
  description = excluded.description,
  updated_at = now();
