-- Follow-up is chosen manually and does not change the contract's lifecycle.
-- Existing contracts remain unclassified until a user chooses a status.
alter table public.contracts
  add column renewal_followup_status text,
  add constraint contracts_renewal_followup_status_check
    check (renewal_followup_status is null or renewal_followup_status in ('pending', 'paused'));