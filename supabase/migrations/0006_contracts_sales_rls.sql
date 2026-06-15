-- Fix: sales users should only see contracts for customers assigned to them.
-- owners, admins, technicians and viewers keep full org-wide visibility.

drop policy if exists "contracts select own org" on public.contracts;

create policy "contracts select own org" on public.contracts
  for select using (
    organization_id = public.current_org_id()
    and (
      -- privileged roles see everything in their org
      public.has_role(array['owner', 'admin', 'technician', 'viewer']::app_role[])
      or
      -- sales users only see contracts whose customer is assigned to them
      exists (
        select 1
        from public.customers c
        where c.id = contracts.customer_id
          and c.assigned_to = auth.uid()
      )
    )
  );
