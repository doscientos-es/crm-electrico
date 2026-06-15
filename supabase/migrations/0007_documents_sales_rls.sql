-- Fix: sales users should only see (and write) documents for customers
-- assigned to them. owners, admins, technicians and viewers keep full visibility.
-- Documents can be linked via customer_id, deal_id or installation_id;
-- the customer link is the canonical one used for access control.

-- 1) SELECT ------------------------------------------------------------------
drop policy if exists "documents select own org" on public.documents;

create policy documents_select on public.documents
  for select using (
    organization_id = public.current_org_id()
    and (
      -- privileged roles see all documents in the org
      public.get_my_role() = any(array['owner', 'admin', 'technician', 'viewer']::app_role[])
      or
      -- sales users only see documents whose customer is assigned to them
      (
        public.get_my_role() = 'sales'::app_role
        and (
          -- document linked directly to an assigned customer
          (customer_id is not null and exists (
            select 1 from public.customers c
            where c.id = documents.customer_id
              and c.assigned_to = auth.uid()
          ))
          or
          -- document linked via a deal whose customer is assigned to them
          (customer_id is null and deal_id is not null and exists (
            select 1 from public.deals d
            join public.customers c on c.id = d.customer_id
            where d.id = documents.deal_id
              and c.assigned_to = auth.uid()
          ))
          or
          -- document uploaded by the sales user themselves (e.g. no customer yet)
          uploaded_by = auth.uid()
        )
      )
    )
  );

-- 2) INSERT ------------------------------------------------------------------
drop policy if exists "documents insert permitted roles" on public.documents;

create policy documents_insert on public.documents
  for insert with check (
    organization_id = public.current_org_id()
    and (
      public.get_my_role() = any(array['owner', 'admin', 'technician']::app_role[])
      or (
        public.get_my_role() = 'sales'::app_role
        and (
          customer_id is null
          or exists (
            select 1 from public.customers c
            where c.id = customer_id
              and c.assigned_to = auth.uid()
          )
        )
      )
    )
  );

-- 3) UPDATE ------------------------------------------------------------------
drop policy if exists "documents update permitted roles" on public.documents;

create policy documents_update on public.documents
  for update
  using (
    organization_id = public.current_org_id()
    and (
      public.get_my_role() = any(array['owner', 'admin']::app_role[])
      or (
        public.get_my_role() = 'sales'::app_role
        and exists (
          select 1 from public.customers c
          where c.id = documents.customer_id
            and c.assigned_to = auth.uid()
        )
      )
    )
  )
  with check (organization_id = public.current_org_id());

-- 4) DELETE ------------------------------------------------------------------
drop policy if exists "documents delete owner admin only" on public.documents;

create policy documents_delete on public.documents
  for delete using (
    organization_id = public.current_org_id()
    and public.get_my_role() = any(array['owner', 'admin']::app_role[])
  );
