create table if not exists public.site_allowances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  claim_month date not null,
  summary_date date not null,
  petrol_amount numeric(12, 2) not null default 0,
  other_bills_amount numeric(12, 2) not null default 0,
  advance_amount numeric(12, 2) not null default 0,
  subtotal_amount numeric(12, 2) not null default 0,
  net_amount numeric(12, 2) not null default 0,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Paid')),
  notes text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_allowance_items (
  id uuid primary key default gen_random_uuid(),
  allowance_id uuid not null references public.site_allowances(id) on delete cascade,
  serial_no integer not null,
  project_details text not null,
  job_dates date[] not null default '{}',
  order_no text,
  day_count integer not null default 0,
  per_day_charge numeric(12, 2) not null default 60,
  total_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists site_allowances_employee_id_idx on public.site_allowances(employee_id);
create index if not exists site_allowances_claim_month_idx on public.site_allowances(claim_month desc);
create index if not exists site_allowance_items_allowance_id_idx on public.site_allowance_items(allowance_id);

alter table public.site_allowances enable row level security;
alter table public.site_allowance_items enable row level security;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  );
$$;

create or replace function public.is_own_employee(employee uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.employees
    where employees.id = employee
      and employees.user_id = auth.uid()
  );
$$;

drop policy if exists "Admins manage site allowances" on public.site_allowances;
create policy "Admins manage site allowances"
on public.site_allowances
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Employees read own site allowances" on public.site_allowances;
create policy "Employees read own site allowances"
on public.site_allowances
for select
to authenticated
using (public.is_own_employee(employee_id));

drop policy if exists "Employees create own site allowances" on public.site_allowances;
create policy "Employees create own site allowances"
on public.site_allowances
for insert
to authenticated
with check (
  public.is_own_employee(employee_id)
  and created_by = auth.uid()
  and status = 'Pending'
);

drop policy if exists "Employees update own pending site allowances" on public.site_allowances;
create policy "Employees update own pending site allowances"
on public.site_allowances
for update
to authenticated
using (public.is_own_employee(employee_id) and status = 'Pending')
with check (public.is_own_employee(employee_id) and status = 'Pending');

drop policy if exists "Employees delete own pending site allowances" on public.site_allowances;
create policy "Employees delete own pending site allowances"
on public.site_allowances
for delete
to authenticated
using (public.is_own_employee(employee_id) and status = 'Pending');

drop policy if exists "Admins manage site allowance items" on public.site_allowance_items;
create policy "Admins manage site allowance items"
on public.site_allowance_items
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Employees read own site allowance items" on public.site_allowance_items;
create policy "Employees read own site allowance items"
on public.site_allowance_items
for select
to authenticated
using (
  exists (
    select 1
    from public.site_allowances
    where site_allowances.id = site_allowance_items.allowance_id
      and public.is_own_employee(site_allowances.employee_id)
  )
);

drop policy if exists "Employees create own pending site allowance items" on public.site_allowance_items;
create policy "Employees create own pending site allowance items"
on public.site_allowance_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.site_allowances
    where site_allowances.id = site_allowance_items.allowance_id
      and site_allowances.status = 'Pending'
      and public.is_own_employee(site_allowances.employee_id)
  )
);

drop policy if exists "Employees update own pending site allowance items" on public.site_allowance_items;
create policy "Employees update own pending site allowance items"
on public.site_allowance_items
for update
to authenticated
using (
  exists (
    select 1
    from public.site_allowances
    where site_allowances.id = site_allowance_items.allowance_id
      and site_allowances.status = 'Pending'
      and public.is_own_employee(site_allowances.employee_id)
  )
)
with check (
  exists (
    select 1
    from public.site_allowances
    where site_allowances.id = site_allowance_items.allowance_id
      and site_allowances.status = 'Pending'
      and public.is_own_employee(site_allowances.employee_id)
  )
);

drop policy if exists "Employees delete own pending site allowance items" on public.site_allowance_items;
create policy "Employees delete own pending site allowance items"
on public.site_allowance_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.site_allowances
    where site_allowances.id = site_allowance_items.allowance_id
      and site_allowances.status = 'Pending'
      and public.is_own_employee(site_allowances.employee_id)
  )
);
