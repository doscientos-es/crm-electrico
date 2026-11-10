-- Preserve legacy follow-up values; only new expired follow-ups require a date.
alter table public.contracts add column renewal_ends_at date;
alter table public.contracts drop constraint contracts_renewal_followup_status_check;
alter table public.contracts add constraint contracts_renewal_followup_status_check
  check (renewal_followup_status is null or renewal_followup_status in ('pending', 'paused', 'expired'));
alter table public.contracts add constraint contracts_expired_renewal_date_check
  check (renewal_followup_status is distinct from 'expired' or renewal_ends_at is not null);