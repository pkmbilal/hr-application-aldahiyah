create table if not exists public.vehicle_fines (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  fine_date date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  reason text not null,
  authority text,
  reference_number text,
  location text,
  notes text,
  attachment_path text unique,
  attachment_file_name text,
  attachment_file_type text,
  attachment_file_size bigint not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists vehicle_fines_vehicle_id_idx on public.vehicle_fines(vehicle_id);
create index if not exists vehicle_fines_employee_id_idx on public.vehicle_fines(employee_id);
create index if not exists vehicle_fines_fine_date_idx on public.vehicle_fines(fine_date desc);

create or replace function public.set_vehicle_fines_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_vehicle_fines_updated_at on public.vehicle_fines;
create trigger set_vehicle_fines_updated_at
before update on public.vehicle_fines
for each row execute function public.set_vehicle_fines_updated_at();

alter table public.vehicle_fines enable row level security;

grant select, insert, update, delete on public.vehicle_fines to authenticated;

drop policy if exists "Vehicle fines are viewable by owner or admin" on public.vehicle_fines;
create policy "Vehicle fines are viewable by owner or admin"
on public.vehicle_fines
for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.employees
    where employees.id = vehicle_fines.employee_id
      and employees.user_id = (select auth.uid())
  )
);

drop policy if exists "Vehicle fines are insertable by admin" on public.vehicle_fines;
create policy "Vehicle fines are insertable by admin"
on public.vehicle_fines
for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists "Vehicle fines are editable by admin" on public.vehicle_fines;
create policy "Vehicle fines are editable by admin"
on public.vehicle_fines
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Vehicle fines are deletable by admin" on public.vehicle_fines;
create policy "Vehicle fines are deletable by admin"
on public.vehicle_fines
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists "Vehicle documents are viewable by authenticated users" on storage.objects;
create policy "Vehicle documents are viewable by authenticated users"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vehicle-documents'
  and name not like 'fines/%'
);

drop policy if exists "Vehicle fine documents are viewable by linked employee or admin" on storage.objects;
create policy "Vehicle fine documents are viewable by linked employee or admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vehicle-documents'
  and name like 'fines/%'
  and (
    (select private.is_admin())
    or exists (
      select 1
      from public.vehicle_fines
      join public.employees on employees.id = vehicle_fines.employee_id
      where vehicle_fines.attachment_path = storage.objects.name
        and employees.user_id = (select auth.uid())
    )
  )
);
