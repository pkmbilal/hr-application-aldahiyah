create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_admin_id uuid not null references auth.users(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('created')),
  entity_type text not null check (entity_type in ('site_attendance', 'site_allowance', 'vehicle_fine', 'vehicle_accident', 'employee_advance')),
  entity_id uuid not null,
  title text not null,
  body text,
  href text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_idx
on public.notifications(recipient_admin_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
on public.notifications(recipient_admin_id, created_at desc)
where read_at is null;

create index if not exists notifications_actor_user_id_idx on public.notifications(actor_user_id);

create unique index if not exists notifications_unique_event_recipient_idx
on public.notifications(recipient_admin_id, event_type, entity_type, entity_id);

alter table public.notifications enable row level security;

drop policy if exists "Admins read own notifications" on public.notifications;
create policy "Admins read own notifications"
on public.notifications
for select
to authenticated
using (
  recipient_admin_id = (select auth.uid())
);

drop policy if exists "Admins update own notifications" on public.notifications;
create policy "Admins update own notifications"
on public.notifications
for update
to authenticated
using (
  recipient_admin_id = (select auth.uid())
)
with check (
  recipient_admin_id = (select auth.uid())
);

drop policy if exists "Admins create notifications" on public.notifications;
create policy "Admins create notifications"
on public.notifications
for insert
to authenticated
with check (
  (select public.is_admin_user())
  and actor_user_id = (select auth.uid())
);

create or replace function public.create_admin_notification(
  p_actor_user_id uuid,
  p_event_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_title text,
  p_body text,
  p_href text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_actor_user_id <> auth.uid() then
    raise exception 'Notification actor must match the current user';
  end if;

  if p_event_type <> 'created' then
    raise exception 'Unsupported notification event type';
  end if;

  if p_entity_type not in ('site_attendance', 'site_allowance', 'employee_advance') then
    raise exception 'Unsupported notification entity type';
  end if;

  if p_entity_type = 'site_attendance' and not exists (
    select 1
    from public.site_attendance
    where site_attendance.id = p_entity_id
      and site_attendance.created_by = auth.uid()
  ) then
    raise exception 'Attendance record not found for current user';
  end if;

  if p_entity_type = 'site_allowance' and not exists (
    select 1
    from public.site_allowances
    where site_allowances.id = p_entity_id
      and site_allowances.created_by = auth.uid()
  ) then
    raise exception 'Allowance record not found for current user';
  end if;

  if p_entity_type = 'employee_advance' and not exists (
    select 1
    from public.employee_advances
    where employee_advances.id = p_entity_id
      and employee_advances.created_by = auth.uid()
  ) then
    raise exception 'Advance record not found for current user';
  end if;

  insert into public.notifications (
    recipient_admin_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    title,
    body,
    href
  )
  select
    profiles.id,
    p_actor_user_id,
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_title,
    p_body,
    p_href
  from public.profiles
  where profiles.role = 'admin'
  on conflict (recipient_admin_id, event_type, entity_type, entity_id) do nothing;

  get diagnostics v_inserted_count = row_count;
  return v_inserted_count;
end;
$$;

revoke execute on function public.create_admin_notification(uuid, text, text, uuid, text, text, text) from public;
revoke execute on function public.create_admin_notification(uuid, text, text, uuid, text, text, text) from anon;
grant execute on function public.create_admin_notification(uuid, text, text, uuid, text, text, text) to authenticated;

create or replace function public.create_employee_notification(
  p_employee_id uuid,
  p_actor_user_id uuid,
  p_event_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_title text,
  p_body text,
  p_href text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin_user() then
    raise exception 'Admin access required';
  end if;

  if p_actor_user_id <> auth.uid() then
    raise exception 'Notification actor must match the current user';
  end if;

  if p_event_type <> 'created' then
    raise exception 'Unsupported notification event type';
  end if;

  if p_entity_type not in ('employee_advance', 'site_allowance') then
    raise exception 'Unsupported notification entity type';
  end if;

  select employees.user_id
  into v_employee_user_id
  from public.employees
  where employees.id = p_employee_id;

  if v_employee_user_id is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.employee_advances
    where employee_advances.id = p_entity_id
      and employee_advances.employee_id = p_employee_id
  ) and p_entity_type = 'employee_advance' then
    raise exception 'Advance record not found for employee';
  end if;

  if not exists (
    select 1
    from public.site_allowances
    where site_allowances.id = p_entity_id
      and site_allowances.employee_id = p_employee_id
  ) and p_entity_type = 'site_allowance' then
    raise exception 'Site allowance record not found for employee';
  end if;

  insert into public.notifications (
    recipient_admin_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    title,
    body,
    href,
    read_at,
    updated_at
  )
  values (
    v_employee_user_id,
    p_actor_user_id,
    p_event_type,
    p_entity_type,
    p_entity_id,
    p_title,
    p_body,
    p_href,
    null,
    now()
  )
  on conflict (recipient_admin_id, event_type, entity_type, entity_id)
  do update set
    actor_user_id = excluded.actor_user_id,
    title = excluded.title,
    body = excluded.body,
    href = excluded.href,
    read_at = null,
    updated_at = now();

  return true;
end;
$$;

revoke execute on function public.create_employee_notification(uuid, uuid, text, text, uuid, text, text, text) from public;
revoke execute on function public.create_employee_notification(uuid, uuid, text, text, uuid, text, text, text) from anon;
grant execute on function public.create_employee_notification(uuid, uuid, text, text, uuid, text, text, text) to authenticated;
