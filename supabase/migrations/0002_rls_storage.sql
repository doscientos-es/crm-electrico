create or replace function public.current_org_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$ select organization_id from public.profiles where id = auth.uid() $$;

create or replace function public.current_role()
returns app_role
language sql
security definer
set search_path = public
stable
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.has_role(roles app_role[])
returns boolean
language sql
security definer
set search_path = public
stable
as $$ select public.current_role() = any(roles) $$;

-- Helpers used by the contracts, documents and incidents policies introduced
-- in subsequent migrations. Keep these as invoker functions: current_role()
-- already performs the privileged profile lookup needed by RLS.
create or replace function public.is_authenticated()
returns boolean
language sql
security invoker
stable
as $$ select (select auth.uid()) is not null $$;

create or replace function public.get_my_role()
returns app_role
language sql
security invoker
stable
as $$ select public.current_role() $$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.customers enable row level security;
alter table public.customer_energy_profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.saving_simulations enable row level security;
alter table public.proposals enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.contracts enable row level security;
alter table public.installations enable row level security;
alter table public.installation_visits enable row level security;
alter table public.activity_logs enable row level security;

create policy "organizations select own org" on public.organizations for select using (id = public.current_org_id());
create policy "organizations update owner admin" on public.organizations for update using (id = public.current_org_id() and public.has_role(array['owner','admin']::app_role[])) with check (id = public.current_org_id());

create policy "profiles select own org" on public.profiles for select using (organization_id = public.current_org_id() or id = auth.uid());
create policy "profiles update self or admin" on public.profiles for update using (organization_id = public.current_org_id() and (id = auth.uid() or public.has_role(array['owner','admin']::app_role[]))) with check (organization_id = public.current_org_id());

create policy "leads select own org" on public.leads for select using (organization_id = public.current_org_id());
create policy "leads insert permitted roles" on public.leads for insert with check (organization_id = public.current_org_id() and public.has_role(array['owner','admin','sales']::app_role[]));
create policy "leads update permitted roles" on public.leads for update using (organization_id = public.current_org_id() and public.has_role(array['owner','admin','sales']::app_role[])) with check (organization_id = public.current_org_id());
create policy "leads delete owner admin only" on public.leads for delete using (organization_id = public.current_org_id() and public.has_role(array['owner','admin']::app_role[]));

create policy "customers select own org" on public.customers for select using (organization_id = public.current_org_id());
create policy "customers insert permitted roles" on public.customers for insert with check (organization_id = public.current_org_id() and public.has_role(array['owner','admin','sales']::app_role[]));
create policy "customers update permitted roles" on public.customers for update using (organization_id = public.current_org_id() and public.has_role(array['owner','admin','sales']::app_role[])) with check (organization_id = public.current_org_id());
create policy "customers delete owner admin only" on public.customers for delete using (organization_id = public.current_org_id() and public.has_role(array['owner','admin']::app_role[]));

create policy "pipeline stages select own org" on public.pipeline_stages for select using (organization_id = public.current_org_id());
create policy "pipeline stages write admin" on public.pipeline_stages for all using (organization_id = public.current_org_id() and public.has_role(array['owner','admin']::app_role[])) with check (organization_id = public.current_org_id());

create policy "activity logs select own org" on public.activity_logs for select using (organization_id = public.current_org_id());
create policy "activity logs insert permitted roles" on public.activity_logs for insert with check (organization_id = public.current_org_id() and public.has_role(array['owner','admin','sales','technician']::app_role[]));

create policy "tasks select own org" on public.tasks for select using (organization_id = public.current_org_id());
create policy "tasks insert permitted roles" on public.tasks for insert with check (organization_id = public.current_org_id() and public.has_role(array['owner','admin','sales','technician']::app_role[]));
create policy "tasks update permitted roles" on public.tasks for update using (organization_id = public.current_org_id() and (public.has_role(array['owner','admin','sales']::app_role[]) or assigned_to = auth.uid())) with check (organization_id = public.current_org_id());
create policy "tasks delete owner admin only" on public.tasks for delete using (organization_id = public.current_org_id() and public.has_role(array['owner','admin']::app_role[]));

create policy "installation visits select own org" on public.installation_visits for select using (organization_id = public.current_org_id());
create policy "installation visits insert permitted roles" on public.installation_visits for insert with check (organization_id = public.current_org_id() and public.has_role(array['owner','admin','technician']::app_role[]));
create policy "installation visits update tech assigned or admin" on public.installation_visits for update using (organization_id = public.current_org_id() and (public.has_role(array['owner','admin']::app_role[]) or technician_id = auth.uid())) with check (organization_id = public.current_org_id());
create policy "installation visits delete owner admin only" on public.installation_visits for delete using (organization_id = public.current_org_id() and public.has_role(array['owner','admin']::app_role[]));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'customer_energy_profiles','invoices','saving_simulations','proposals','deals','documents','contracts','installations'
  ]
  loop
    execute format('create policy "%I select own org" on public.%I for select using (organization_id = public.current_org_id())', table_name, table_name);
    execute format('create policy "%I insert permitted roles" on public.%I for insert with check (organization_id = public.current_org_id() and public.has_role(array[''owner'',''admin'',''sales'',''technician'']::app_role[]))', table_name, table_name);
    execute format('create policy "%I update permitted roles" on public.%I for update using (organization_id = public.current_org_id() and public.has_role(array[''owner'',''admin'',''sales'',''technician'']::app_role[])) with check (organization_id = public.current_org_id())', table_name, table_name);
    execute format('create policy "%I delete owner admin only" on public.%I for delete using (organization_id = public.current_org_id() and public.has_role(array[''owner'',''admin'']::app_role[]))', table_name, table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('invoices', 'invoices', false, 10485760, array['application/pdf']),
  ('proposals', 'proposals', false, 10485760, array['application/pdf']),
  ('contracts', 'contracts', false, 15728640, array['application/pdf']),
  ('customer-documents', 'customer-documents', false, 15728640, array['application/pdf','image/jpeg','image/png','image/webp']),
  ('installation-photos', 'installation-photos', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "storage select own org prefix" on storage.objects for select
using (bucket_id in ('invoices','proposals','contracts','customer-documents','installation-photos') and split_part(name, '/', 1)::uuid = public.current_org_id());

create policy "storage insert own org prefix" on storage.objects for insert
with check (
  bucket_id in ('invoices','proposals','contracts','customer-documents','installation-photos')
  and split_part(name, '/', 1)::uuid = public.current_org_id()
  and public.has_role(array['owner','admin','sales','technician']::app_role[])
);

create policy "storage update owner admin" on storage.objects for update
using (
  bucket_id in ('invoices','proposals','contracts','customer-documents','installation-photos')
  and split_part(name, '/', 1)::uuid = public.current_org_id()
  and public.has_role(array['owner','admin']::app_role[])
)
with check (split_part(name, '/', 1)::uuid = public.current_org_id());

create policy "storage delete owner admin" on storage.objects for delete
using (
  bucket_id in ('invoices','proposals','contracts','customer-documents','installation-photos')
  and split_part(name, '/', 1)::uuid = public.current_org_id()
  and public.has_role(array['owner','admin']::app_role[])
);
