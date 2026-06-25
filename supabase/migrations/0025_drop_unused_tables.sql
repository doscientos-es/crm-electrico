-- ============================================================
-- Drop tables that are not referenced by the application code.
--
-- Verified unused in src/: leads, customer_energy_profiles, invoices,
-- saving_simulations, pipeline_stages, deals, proposals, installations,
-- installation_visits.
--
-- DROP ... CASCADE removes the inbound FK constraints from the active
-- tables (customers, contracts, tasks, documents) but KEEPS their columns,
-- so application queries are unaffected. In particular contracts.deal_id and
-- contracts.proposal_id remain (read by contracts.service.ts) as plain uuids.
-- ============================================================

-- 1) Rewrite documents_select: the "linked via a deal" branch becomes dead
--    once public.deals is removed. Keep the customer + uploaded_by branches.
drop policy if exists documents_select on public.documents;

create policy documents_select on public.documents
  for select using (
    public.is_authenticated()
    and (
      public.get_my_role() = any(array['owner', 'admin', 'technician', 'viewer']::app_role[])
      or
      (
        public.get_my_role() = 'sales'::app_role
        and (
          (customer_id is not null and exists (
            select 1 from public.customers c
            where c.id = documents.customer_id
              and c.assigned_to = auth.uid()
          ))
          or
          uploaded_by = auth.uid()
        )
      )
    )
  );

-- 2) Drop unused tables (child -> parent). CASCADE drops dependent FK
--    constraints from active tables while preserving their columns.
drop table if exists public.installation_visits cascade;
drop table if exists public.proposals cascade;
drop table if exists public.saving_simulations cascade;
drop table if exists public.invoices cascade;
drop table if exists public.customer_energy_profiles cascade;
drop table if exists public.deals cascade;
drop table if exists public.pipeline_stages cascade;
drop table if exists public.installations cascade;
drop table if exists public.leads cascade;
