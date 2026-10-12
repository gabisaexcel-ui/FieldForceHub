-- FieldForce Hub initial schema
-- HO is intentionally NOT an application role. HO signatures are represented as
-- manual workflow states and uploaded documents only.

create extension if not exists pgcrypto;

create type public.account_level as enum ('master', 'admin', 'user');
create type public.operational_role as enum ('FC', 'MD', 'MDPS', 'Salesman', 'TS', 'KAM');
create type public.request_status as enum (
  'draft',
  'submitted',
  'fc_review',
  'fc_approved',
  'exported',
  'awaiting_ho_signature',
  'uploaded',
  'final_approved',
  'rejected',
  'cancelled'
);

create table public.divisions (
  code text primary key,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.areas (
  code text primary key,
  name text not null,
  region text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_code text unique not null,
  full_name text not null,
  account_level public.account_level not null default 'user',
  operational_role public.operational_role not null,
  division_code text references public.divisions(code),
  area_code text references public.areas(code),
  phone text,
  address text,
  avatar_path text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  key text primary key,
  description text not null
);

create table public.role_permissions (
  account_level public.account_level not null,
  operational_role public.operational_role not null,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (account_level, operational_role, permission_key)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  work_date date not null,
  check_in_at timestamptz,
  latitude numeric(10,7),
  longitude numeric(10,7),
  selfie_path text,
  status text not null check (status in ('great','safe','alert','warning','off','leave','sick')),
  notes text,
  division_code text references public.divisions(code),
  area_code text references public.areas(code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, work_date)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique not null,
  user_id uuid not null references public.profiles(id),
  request_type text not null check (request_type in ('annual_leave','sick','off_swap','adjustment','cancellation')),
  start_date date not null,
  end_date date not null,
  reason text not null,
  evidence_path text,
  status public.request_status not null default 'submitted',
  fc_approver_id uuid references public.profiles(id),
  fc_signature_path text,
  exported_document_path text,
  ho_signed_document_path text,
  final_document_path text,
  division_code text references public.divisions(code),
  area_code text references public.areas(code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

comment on column public.leave_requests.ho_signed_document_path is
  'Document signed manually by HO outside the system and uploaded by an authorized existing user.';

create table public.skp_documents (
  id uuid primary key default gen_random_uuid(),
  skp_number text unique not null,
  store_name text not null,
  city text not null,
  program_type text not null,
  ta_number text,
  mechanism text,
  period_start date not null,
  period_end date not null,
  budget_number text,
  budget_amount numeric(14,2),
  ts_user_id uuid references public.profiles(id),
  salesman_user_id uuid references public.profiles(id),
  status text not null default 'draft_fc',
  document_path text,
  signed_document_path text,
  division_code text references public.divisions(code),
  area_code text references public.areas(code),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skp_products (
  skp_id uuid not null references public.skp_documents(id) on delete cascade,
  barcode text not null,
  item_name text not null,
  primary key (skp_id, barcode)
);

create table public.program_updates (
  id uuid primary key default gen_random_uuid(),
  skp_id uuid not null references public.skp_documents(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id),
  program_status text not null check (program_status in ('running','not_running')),
  reason text,
  claim_status text check (claim_status in ('pending','claimed','not_claimed')),
  claim_amount numeric(14,2),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check (program_status <> 'not_running' or reason is not null)
);

create table public.program_photos (
  id uuid primary key default gen_random_uuid(),
  program_update_id uuid not null references public.program_updates(id) on delete cascade,
  file_path text not null,
  caption text not null,
  created_at timestamptz not null default now()
);

create table public.expense_claims (
  id uuid primary key default gen_random_uuid(),
  claim_number text unique not null,
  user_id uuid not null references public.profiles(id),
  receipt_date date not null,
  claim_type text not null check (claim_type in ('ATK','Parkir')),
  amount numeric(14,2) not null check (amount > 0),
  receipt_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','processing','completed')),
  reviewed_by uuid references public.profiles(id),
  transfer_evidence_path text,
  division_code text references public.divisions(code),
  area_code text references public.areas(code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.violations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  violation_date date not null,
  category text not null check (category in ('attendance','leave','program','work_rule')),
  description text not null,
  evidence_path text,
  recorded_by uuid not null references public.profiles(id),
  division_code text references public.divisions(code),
  area_code text references public.areas(code),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_table text not null,
  entity_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index attendance_user_date_idx on public.attendance_records(user_id, work_date desc);
create index leave_scope_status_idx on public.leave_requests(division_code, area_code, status);
create index skp_scope_status_idx on public.skp_documents(division_code, area_code, status);
create index expense_scope_status_idx on public.expense_claims(division_code, area_code, status);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);

create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$ select * from public.profiles where id = auth.uid() and active = true limit 1 $$;

create or replace function public.can_access_scope(target_user uuid, target_division text, target_area text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare me public.profiles;
begin
  select * into me from public.current_profile();
  return case
    when me.account_level = 'master' then true
    when me.account_level = 'admin' then me.division_code = target_division and (me.area_code is null or me.area_code = target_area)
    else me.id = target_user
  end;
end;
$$;

grant execute on function public.current_profile() to authenticated;
grant execute on function public.can_access_scope(uuid, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.attendance_records enable row level security;
alter table public.leave_requests enable row level security;
alter table public.skp_documents enable row level security;
alter table public.program_updates enable row level security;
alter table public.program_photos enable row level security;
alter table public.expense_claims enable row level security;
alter table public.violations enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles scoped read" on public.profiles for select to authenticated
using (public.can_access_scope(id, division_code, area_code));

create policy "attendance scoped read" on public.attendance_records for select to authenticated
using (public.can_access_scope(user_id, division_code, area_code));
create policy "attendance self insert" on public.attendance_records for insert to authenticated
with check (user_id = auth.uid());
create policy "attendance scoped update" on public.attendance_records for update to authenticated
using (public.can_access_scope(user_id, division_code, area_code));

create policy "leave scoped read" on public.leave_requests for select to authenticated
using (public.can_access_scope(user_id, division_code, area_code));
create policy "leave self insert" on public.leave_requests for insert to authenticated
with check (user_id = auth.uid());
create policy "leave scoped update" on public.leave_requests for update to authenticated
using (public.can_access_scope(user_id, division_code, area_code));

create policy "skp scoped read" on public.skp_documents for select to authenticated
using (public.can_access_scope(coalesce(salesman_user_id, created_by), division_code, area_code) or ts_user_id = auth.uid());
create policy "program update scoped read" on public.program_updates for select to authenticated
using (submitted_by = auth.uid() or exists (
  select 1 from public.skp_documents s
  where s.id = skp_id and public.can_access_scope(coalesce(s.salesman_user_id, s.created_by), s.division_code, s.area_code)
));
create policy "program photo scoped read" on public.program_photos for select to authenticated
using (exists (
  select 1 from public.program_updates u
  join public.skp_documents s on s.id = u.skp_id
  where u.id = program_update_id
    and (u.submitted_by = auth.uid() or public.can_access_scope(coalesce(s.salesman_user_id, s.created_by), s.division_code, s.area_code))
));

create policy "expense scoped read" on public.expense_claims for select to authenticated
using (public.can_access_scope(user_id, division_code, area_code));
create policy "expense self insert" on public.expense_claims for insert to authenticated
with check (user_id = auth.uid());
create policy "expense scoped update" on public.expense_claims for update to authenticated
using (public.can_access_scope(user_id, division_code, area_code));

create policy "violation scoped read" on public.violations for select to authenticated
using (public.can_access_scope(user_id, division_code, area_code));
create policy "notification self read" on public.notifications for select to authenticated
using (user_id = auth.uid());
create policy "notification self update" on public.notifications for update to authenticated
using (user_id = auth.uid());
create policy "audit master read" on public.audit_logs for select to authenticated
using ((public.current_profile()).account_level = 'master');

-- Private bucket policies should be added after creating buckets:
-- attendance-selfies, leave-documents, skp-documents, program-photos,
-- expense-receipts, transfer-evidence, violation-evidence.

insert into public.permissions (key, description) values
  ('users.manage', 'Create and manage accounts inside the permitted scope'),
  ('attendance.review', 'Review attendance and adjustments'),
  ('leave.approve', 'Approve leave within scope'),
  ('skp.generate', 'Generate and revise SKP documents'),
  ('skp.sign_ts', 'Sign assigned SKP as TS'),
  ('program.verify', 'Verify program updates'),
  ('expense.approve', 'Approve expense claims'),
  ('reports.export', 'Export scoped reports'),
  ('settings.manage', 'Manage global system settings')
on conflict do nothing;

insert into public.divisions (code, name) values
  ('FC', 'Field Coordinator'),
  ('MD', 'Merchandiser'),
  ('MDPS', 'Merchandiser Product Specialist'),
  ('SALES', 'Salesman'),
  ('TS', 'Territory Sales'),
  ('KAM', 'Key Account Manager')
on conflict do nothing;
