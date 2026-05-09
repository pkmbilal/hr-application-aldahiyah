create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('company-documents', 'company-documents', false)
on conflict (id) do update set public = false;

create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  storage_path text not null unique,
  file_name text not null,
  file_type text,
  file_size bigint not null default 0,
  share_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  is_active boolean not null default true,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_documents_active_created_idx on public.company_documents(is_active, created_at desc);
create index if not exists company_documents_share_token_idx on public.company_documents(share_token);

alter table public.company_documents enable row level security;

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

drop policy if exists "Admins manage company documents" on public.company_documents;
create policy "Admins manage company documents"
on public.company_documents
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Employees read active company documents" on public.company_documents;
create policy "Employees read active company documents"
on public.company_documents
for select
to authenticated
using (is_active or public.is_admin_user());

create or replace function public.get_company_document_by_share_token(p_share_token text)
returns table (
  id uuid,
  title text,
  category text,
  description text,
  storage_path text,
  file_name text,
  file_type text,
  file_size bigint,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    company_documents.id,
    company_documents.title,
    company_documents.category,
    company_documents.description,
    company_documents.storage_path,
    company_documents.file_name,
    company_documents.file_type,
    company_documents.file_size,
    company_documents.created_at
  from public.company_documents
  where company_documents.share_token = p_share_token
    and company_documents.is_active = true
  limit 1;
$$;

grant execute on function public.get_company_document_by_share_token(text) to anon, authenticated;

drop policy if exists "Admins manage company document files" on storage.objects;
create policy "Admins manage company document files"
on storage.objects
for all
to authenticated
using (bucket_id = 'company-documents' and public.is_admin_user())
with check (bucket_id = 'company-documents' and public.is_admin_user());

drop policy if exists "Active company document files can be signed" on storage.objects;
create policy "Active company document files can be signed"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'company-documents'
  and exists (
    select 1
    from public.company_documents
    where company_documents.storage_path = storage.objects.name
      and company_documents.is_active = true
  )
);
