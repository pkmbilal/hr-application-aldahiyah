create table if not exists public.vehicle_accidents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  accident_date date not null,
  location text not null,
  description text not null,
  damage_details text,
  severity text not null default 'Minor' check (severity in ('Minor', 'Moderate', 'Major')),
  police_report_number text,
  repair_status text not null default 'Not Started' check (repair_status in ('Not Started', 'In Progress', 'Completed')),
  estimated_cost numeric(12, 2) check (estimated_cost is null or estimated_cost >= 0),
  notes text,
  attachment_path text unique,
  attachment_file_name text,
  attachment_file_type text,
  attachment_file_size bigint not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists vehicle_accidents_vehicle_id_idx on public.vehicle_accidents(vehicle_id);
create index if not exists vehicle_accidents_employee_id_idx on public.vehicle_accidents(employee_id);
create index if not exists vehicle_accidents_accident_date_idx on public.vehicle_accidents(accident_date desc);
create index if not exists vehicle_accidents_repair_status_idx on public.vehicle_accidents(repair_status);
create index if not exists vehicle_accidents_created_by_idx on public.vehicle_accidents(created_by);

create or replace function public.set_vehicle_accidents_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_vehicle_accidents_updated_at on public.vehicle_accidents;
create trigger set_vehicle_accidents_updated_at
before update on public.vehicle_accidents
for each row execute function public.set_vehicle_accidents_updated_at();

alter table public.vehicle_accidents enable row level security;

grant select, insert, update, delete on public.vehicle_accidents to authenticated;

drop policy if exists "Vehicle accidents are viewable by owner or admin" on public.vehicle_accidents;
create policy "Vehicle accidents are viewable by owner or admin"
on public.vehicle_accidents
for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.employees
    where employees.id = vehicle_accidents.employee_id
      and employees.user_id = (select auth.uid())
  )
);

drop policy if exists "Vehicle accidents are insertable by admin" on public.vehicle_accidents;
create policy "Vehicle accidents are insertable by admin"
on public.vehicle_accidents
for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists "Vehicle accidents are editable by admin" on public.vehicle_accidents;
create policy "Vehicle accidents are editable by admin"
on public.vehicle_accidents
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Vehicle accidents are deletable by admin" on public.vehicle_accidents;
create policy "Vehicle accidents are deletable by admin"
on public.vehicle_accidents
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists "Vehicle accident documents are viewable by linked employee or admin" on storage.objects;
create policy "Vehicle accident documents are viewable by linked employee or admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vehicle-documents'
  and name like 'accidents/%'
  and (
    (select private.is_admin())
    or exists (
      select 1
      from public.vehicle_accidents
      join public.employees on employees.id = vehicle_accidents.employee_id
      where vehicle_accidents.attachment_path = storage.objects.name
        and employees.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Vehicle documents are viewable by authenticated users" on storage.objects;
create policy "Vehicle documents are viewable by authenticated users"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vehicle-documents'
  and name not like 'fines/%'
  and name not like 'accidents/%'
);

alter table public.notifications
drop constraint if exists notifications_entity_type_check;

alter table public.notifications
add constraint notifications_entity_type_check
check (entity_type in ('site_attendance', 'site_allowance', 'vehicle_fine', 'vehicle_accident'));
