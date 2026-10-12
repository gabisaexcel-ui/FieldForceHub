-- FieldForce Hub Migration: 202610120002_add_profile_fields.sql
-- Penambahan kolom identitas manpower sesuai flow CSV & Data Role:
-- Nama, posisi, area, gender, alamat, lokasi/maps, tanggal bergabung

alter table public.profiles 
  add column if not exists position text,
  add column if not exists gender text check (gender in ('Laki-laki', 'Perempuan')),
  add column if not exists maps_url text,
  add column if not exists join_date date;

-- RLS: Pengguna dapat mengupdate data profil diri sendiri (nama, telepon, alamat, maps, gender, dll.)
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'profiles' 
      and policyname = 'profiles self update'
  ) then
    create policy "profiles self update" on public.profiles
      for update to authenticated
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end $$;

-- RLS: Pengguna dapat menginsert profil sendiri jika belum ada
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'profiles' 
      and policyname = 'profiles self insert'
  ) then
    create policy "profiles self insert" on public.profiles
      for insert to authenticated
      with check (id = auth.uid());
  end if;
end $$;

-- RLS: Master & Admin dapat mengupdate profil seluruh user dalam scope
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'profiles' 
      and policyname = 'profiles admin update'
  ) then
    create policy "profiles admin update" on public.profiles
      for update to authenticated
      using (
        exists (
          select 1 from public.current_profile() me 
          where me.account_level in ('master', 'admin')
        )
      );
  end if;
end $$;

comment on column public.profiles.gender is 'Jenis kelamin manpower (Laki-laki / Perempuan)';
comment on column public.profiles.maps_url is 'Tautan Google Maps atau koordinat pin lokasi tempat tinggal/base';
comment on column public.profiles.position is 'Nama posisi operasional (cth: Field Coordinator, MD, MDPS, Salesman, TS, NAM)';
comment on column public.profiles.join_date is 'Tanggal bergabung manpower sesuai database master';
