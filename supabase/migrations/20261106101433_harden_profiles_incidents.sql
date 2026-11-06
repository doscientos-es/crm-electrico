-- A user may update their own profile, but not grant themselves a different role.
create function public.guard_profile_role() returns trigger
language plpgsql set search_path = public as $$
begin
  if auth.role() = 'authenticated'
     and coalesce(public.get_my_role()::text, '') not in ('owner', 'admin') then
    if (tg_op = 'INSERT' and new.role::text is distinct from 'sales')
       or (tg_op = 'UPDATE' and new.role is distinct from old.role) then
      raise exception 'Solo los administradores pueden modificar roles' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_role
  before insert or update on public.profiles
  for each row execute function public.guard_profile_role();

-- Incident access follows customer RLS, including the sales portfolio restriction.
-- Separate policies prevent a write policy from also granting SELECT access.
drop policy if exists incidents_select on public.incidents;
drop policy if exists incidents_write on public.incidents;

create policy incidents_select on public.incidents for select
  using (public.is_authenticated() and exists (
    select 1 from public.customers c where c.id = incidents.customer_id
  ));

create policy incidents_insert on public.incidents for insert
  with check (public.get_my_role() = any (array['owner','admin','sales']::public.app_role[])
    and exists (select 1 from public.customers c where c.id = incidents.customer_id));

create policy incidents_update on public.incidents for update
  using (public.get_my_role() = any (array['owner','admin','sales']::public.app_role[])
    and exists (select 1 from public.customers c where c.id = incidents.customer_id))
  with check (public.get_my_role() = any (array['owner','admin','sales']::public.app_role[])
    and exists (select 1 from public.customers c where c.id = incidents.customer_id));

create policy incidents_delete on public.incidents for delete
  using (public.get_my_role() = any (array['owner','admin','sales']::public.app_role[])
    and exists (select 1 from public.customers c where c.id = incidents.customer_id));