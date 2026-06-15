-- Fix: sales users should only see contracts for customers assigned to them.
-- owners, admins, technicians and viewers keep full visibility.
-- The contracts table has no organization_id; isolation goes through customer_id.

drop policy if exists contracts_select on public.contracts;

create policy contracts_select on public.contracts
  for select using (
    public.is_authenticated()
    and (
      -- privileged roles see all contracts
      public.get_my_role() = any(array['owner', 'admin', 'technician', 'viewer']::app_role[])
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
