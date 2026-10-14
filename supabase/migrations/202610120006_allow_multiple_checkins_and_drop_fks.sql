-- =========================================================================
-- FieldForce Hub Migration: 202610120006_allow_multiple_checkins_and_drop_fks.sql
-- Izinkan Presensi Berkali-kali dalam Sehari & Lepas Batasan Foreign Key Area/Divisi
-- =========================================================================

-- 1. Lepas Foreign Key constraint pada attendance_records agar nama area dan divisi bebas diisi
alter table if exists public.attendance_records drop constraint if exists attendance_records_area_code_fkey;
alter table if exists public.attendance_records drop constraint if exists attendance_records_division_code_fkey;

-- 2. Lepas Unique Constraint (user_id, work_date) / (user_code, work_date) agar bisa check-in berkali-kali sehari
alter table if exists public.attendance_records drop constraint if exists attendance_records_user_id_work_date_key;
alter table if exists public.attendance_records drop constraint if exists attendance_records_user_id_work_date_unique;
alter table if exists public.attendance_records drop constraint if exists attendance_records_user_code_work_date_key;

-- 3. Pastikan kolom user_code, user_name, user_role tersedia
alter table if exists public.attendance_records 
  add column if not exists user_code text,
  add column if not exists user_name text,
  add column if not exists user_role text;

-- 4. Berikan hak akses penuh ke role anon & authenticated
grant all on public.attendance_records to anon, authenticated;

-- 5. Aktifkan RLS dengan policy akses terbuka
alter table public.attendance_records enable row level security;
drop policy if exists "attendance allow all access" on public.attendance_records;
create policy "attendance allow all access" on public.attendance_records
  for all to anon, authenticated
  using (true)
  with check (true);

-- 6. Tautkan user_id dari profiles untuk semua data yang masih NULL
update public.attendance_records a
set user_id = p.id
from public.profiles p
where a.user_id is null and (a.user_code = p.user_code or a.user_name = p.full_name);

-- 7. Buat Trigger otomatis agar setiap INSERT baru langsung terisi user_id-nya dari profiles
create or replace function public.auto_link_attendance_user_id()
returns trigger as $$
begin
  if new.user_id is null and new.user_code is not null then
    select id into new.user_id
    from public.profiles
    where user_code = new.user_code or full_name = new.user_name
    limit 1;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_link_attendance_user_id on public.attendance_records;
create trigger trg_link_attendance_user_id
  before insert or update on public.attendance_records
  for each row
  execute function public.auto_link_attendance_user_id();

