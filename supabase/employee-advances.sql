create sequence if not exists public.employee_advance_reference_seq;

create table if not exists public.employee_advances (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique,
  employee_id uuid not null references public.employees(id) on delete cascade,
  project_id uuid references public.site_projects(id) on delete set null,
  project_name text not null,
  order_no text,
  amount numeric(12, 2) not null check (amount > 0),
  advance_date date not null default current_date,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'bank transfer', 'payroll adjustment', 'other')),
  reason text,
  admin_notes text,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Paid', 'Cancelled')),
  requested_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  paid_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employee_advances
alter column reference_no drop default;

create or replace function public.set_employee_advance_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reference_no is null or btrim(new.reference_no) = '' then
    new.reference_no := 'ADV-' || lpad(nextval('public.employee_advance_reference_seq')::text, 6, '0');
  end if;

  return new;
end;
$$;

revoke execute on function public.set_employee_advance_reference() from public, anon, authenticated;

drop trigger if exists set_employee_advance_reference on public.employee_advances;
create trigger set_employee_advance_reference
before insert on public.employee_advances
for each row
execute function public.set_employee_advance_reference();

drop function if exists public.next_employee_advance_reference();

create table if not exists public.advance_deductions (
  id uuid primary key default gen_random_uuid(),
  advance_id uuid not null references public.employee_advances(id) on delete cascade,
  allowance_id uuid not null references public.site_allowances(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  deducted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (advance_id, allowance_id)
);

create index if not exists employee_advances_employee_id_idx on public.employee_advances(employee_id);
create index if not exists employee_advances_project_id_idx on public.employee_advances(project_id);
create index if not exists employee_advances_requested_by_idx on public.employee_advances(requested_by);
create index if not exists employee_advances_created_by_idx on public.employee_advances(created_by);
create index if not exists employee_advances_approved_by_idx on public.employee_advances(approved_by);
create index if not exists employee_advances_paid_by_idx on public.employee_advances(paid_by);
create index if not exists employee_advances_status_idx on public.employee_advances(status);
create index if not exists employee_advances_advance_date_idx on public.employee_advances(advance_date desc);
create index if not exists advance_deductions_advance_id_idx on public.advance_deductions(advance_id);
create index if not exists advance_deductions_allowance_id_idx on public.advance_deductions(allowance_id);
create index if not exists advance_deductions_employee_id_idx on public.advance_deductions(employee_id);

alter table public.employee_advances enable row level security;
alter table public.advance_deductions enable row level security;

drop policy if exists "Admins manage employee advances" on public.employee_advances;
drop policy if exists "Employees read own advances" on public.employee_advances;
drop policy if exists "Employees create own pending advances" on public.employee_advances;
drop policy if exists "Employees update own pending advances" on public.employee_advances;
drop policy if exists "Employees delete own pending advances" on public.employee_advances;
drop policy if exists "Advances are selectable by admins and owners" on public.employee_advances;
create policy "Advances are selectable by admins and owners"
on public.employee_advances
for select
to authenticated
using (public.is_admin_user() or public.is_own_employee(employee_id));

drop policy if exists "Advances are insertable by admins and owners" on public.employee_advances;
create policy "Advances are insertable by admins and owners"
on public.employee_advances
for insert
to authenticated
with check (
  public.is_admin_user()
  or (
    public.is_own_employee(employee_id)
    and requested_by = (select auth.uid())
    and created_by = (select auth.uid())
    and status = 'Pending'
  )
);

drop policy if exists "Advances are updatable by admins and pending owners" on public.employee_advances;
create policy "Advances are updatable by admins and pending owners"
on public.employee_advances
for update
to authenticated
using (public.is_admin_user() or (public.is_own_employee(employee_id) and status = 'Pending'))
with check (
  public.is_admin_user()
  or (
    public.is_own_employee(employee_id)
    and requested_by = (select auth.uid())
    and created_by = (select auth.uid())
    and status = 'Pending'
  )
);

drop policy if exists "Advances are deletable by admins and pending owners" on public.employee_advances;
create policy "Advances are deletable by admins and pending owners"
on public.employee_advances
for delete
to authenticated
using (public.is_admin_user() or (public.is_own_employee(employee_id) and status = 'Pending'));

drop policy if exists "Admins manage advance deductions" on public.advance_deductions;
drop policy if exists "Employees read own advance deductions" on public.advance_deductions;
drop policy if exists "Advance deductions are selectable by admins and owners" on public.advance_deductions;
create policy "Advance deductions are selectable by admins and owners"
on public.advance_deductions
for select
to authenticated
using (public.is_admin_user() or public.is_own_employee(employee_id));

drop policy if exists "Admins insert advance deductions" on public.advance_deductions;
create policy "Admins insert advance deductions"
on public.advance_deductions
for insert
to authenticated
with check (public.is_admin_user());

drop policy if exists "Employees insert own pending allowance deductions" on public.advance_deductions;
create policy "Employees insert own pending allowance deductions"
on public.advance_deductions
for insert
to authenticated
with check (
  public.is_own_employee(employee_id)
  and exists (
    select 1
    from public.site_allowances
    where site_allowances.id = advance_deductions.allowance_id
      and site_allowances.employee_id = advance_deductions.employee_id
      and site_allowances.status = 'Pending'
  )
  and exists (
    select 1
    from public.employee_advances
    where employee_advances.id = advance_deductions.advance_id
      and employee_advances.employee_id = advance_deductions.employee_id
      and employee_advances.status = 'Paid'
  )
);

drop policy if exists "Admins update advance deductions" on public.advance_deductions;
create policy "Admins update advance deductions"
on public.advance_deductions
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins delete advance deductions" on public.advance_deductions;
create policy "Admins delete advance deductions"
on public.advance_deductions
for delete
to authenticated
using (public.is_admin_user());

drop policy if exists "Employees delete own pending allowance deductions" on public.advance_deductions;
create policy "Employees delete own pending allowance deductions"
on public.advance_deductions
for delete
to authenticated
using (
  public.is_own_employee(employee_id)
  and exists (
    select 1
    from public.site_allowances
    where site_allowances.id = advance_deductions.allowance_id
      and site_allowances.employee_id = advance_deductions.employee_id
      and site_allowances.status = 'Pending'
  )
);
