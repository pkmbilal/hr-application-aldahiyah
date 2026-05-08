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
  attendance_ids uuid[] not null default '{}',
  day_count integer not null default 0,
  per_day_charge numeric(12, 2) not null default 60,
  total_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.site_allowance_items
add column if not exists attendance_ids uuid[] not null default '{}';

create table if not exists public.site_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  order_no text not null,
  details text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  project_id uuid references public.site_projects(id) on delete set null,
  project_name text not null,
  order_no text not null,
  attendance_date date not null,
  enter_time time not null,
  exit_time time not null,
  type text not null check (type in ('Safety', 'Idle', 'Job')),
  notes text,
  allowance_id uuid references public.site_allowances(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_allowances_employee_id_idx on public.site_allowances(employee_id);
create index if not exists site_allowances_claim_month_idx on public.site_allowances(claim_month desc);
create index if not exists site_allowance_items_allowance_id_idx on public.site_allowance_items(allowance_id);
create index if not exists site_projects_is_active_idx on public.site_projects(is_active);
create index if not exists site_attendance_employee_date_idx on public.site_attendance(employee_id, attendance_date desc);
create index if not exists site_attendance_allowance_id_idx on public.site_attendance(allowance_id);
create index if not exists site_attendance_type_idx on public.site_attendance(type);

alter table public.site_allowances enable row level security;
alter table public.site_allowance_items enable row level security;
alter table public.site_projects enable row level security;
alter table public.site_attendance enable row level security;

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

drop policy if exists "Admins manage site projects" on public.site_projects;
create policy "Admins manage site projects"
on public.site_projects
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Employees read active site projects" on public.site_projects;
create policy "Employees read active site projects"
on public.site_projects
for select
to authenticated
using (is_active or public.is_admin_user());

drop policy if exists "Admins manage site attendance" on public.site_attendance;
create policy "Admins manage site attendance"
on public.site_attendance
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Employees read own site attendance" on public.site_attendance;
create policy "Employees read own site attendance"
on public.site_attendance
for select
to authenticated
using (public.is_own_employee(employee_id));

drop policy if exists "Employees create own site attendance" on public.site_attendance;
create policy "Employees create own site attendance"
on public.site_attendance
for insert
to authenticated
with check (
  public.is_own_employee(employee_id)
  and created_by = auth.uid()
  and allowance_id is null
);

drop policy if exists "Employees update unlocked own site attendance" on public.site_attendance;
create policy "Employees update unlocked own site attendance"
on public.site_attendance
for update
to authenticated
using (public.is_own_employee(employee_id) and allowance_id is null)
with check (public.is_own_employee(employee_id) and allowance_id is null);

drop policy if exists "Employees delete unlocked own site attendance" on public.site_attendance;
create policy "Employees delete unlocked own site attendance"
on public.site_attendance
for delete
to authenticated
using (public.is_own_employee(employee_id) and allowance_id is null);

create or replace function public.lock_site_allowance_attendance(
  p_allowance_id uuid,
  p_attendance_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowance record;
  v_is_admin boolean;
  v_attendance_ids uuid[] := coalesce(p_attendance_ids, '{}'::uuid[]);
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id, employee_id, status
  into v_allowance
  from public.site_allowances
  where id = p_allowance_id;

  if not found then
    raise exception 'Allowance not found';
  end if;

  v_is_admin := public.is_admin_user();

  if not v_is_admin and (
    not public.is_own_employee(v_allowance.employee_id)
    or v_allowance.status <> 'Pending'
  ) then
    raise exception 'Not authorized to lock attendance for this allowance';
  end if;

  if exists (
    select 1
    from unnest(v_attendance_ids) as selected_attendance(id)
    left join public.site_attendance on site_attendance.id = selected_attendance.id
    where site_attendance.id is null
      or site_attendance.employee_id <> v_allowance.employee_id
      or site_attendance.type <> 'Job'
      or (
        site_attendance.allowance_id is not null
        and site_attendance.allowance_id <> p_allowance_id
      )
  ) then
    raise exception 'One or more attendance rows cannot be linked to this allowance';
  end if;

  update public.site_attendance
  set allowance_id = p_allowance_id,
      updated_at = now()
  where id = any(v_attendance_ids)
    and employee_id = v_allowance.employee_id;
end;
$$;

create or replace function public.unlock_site_allowance_attendance(p_allowance_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allowance record;
  v_is_admin boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select id, employee_id, status
  into v_allowance
  from public.site_allowances
  where id = p_allowance_id;

  if not found then
    raise exception 'Allowance not found';
  end if;

  v_is_admin := public.is_admin_user();

  if not v_is_admin and (
    not public.is_own_employee(v_allowance.employee_id)
    or v_allowance.status <> 'Pending'
  ) then
    raise exception 'Not authorized to unlock attendance for this allowance';
  end if;

  update public.site_attendance
  set allowance_id = null,
      updated_at = now()
  where allowance_id = p_allowance_id
    and employee_id = v_allowance.employee_id;
end;
$$;

grant execute on function public.lock_site_allowance_attendance(uuid, uuid[]) to authenticated;
grant execute on function public.unlock_site_allowance_attendance(uuid) to authenticated;
