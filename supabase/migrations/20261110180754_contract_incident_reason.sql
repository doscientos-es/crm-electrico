-- Existing incidents remain untouched: customer incidents cannot be reliably
-- assigned to a contract, and existing contract reasons may be unknown.
alter table public.contracts add column if not exists incident_reason text;