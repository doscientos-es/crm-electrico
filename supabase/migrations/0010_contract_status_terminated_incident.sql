-- Add 'terminated' (baja) and 'incident' (incidencia) to contract status check constraint

alter table public.contracts drop constraint if exists contracts_status_check;

alter table public.contracts
  add constraint contracts_status_check
  check (status in (
    'pending_processing',
    'processing',
    'pending_signature',
    'active',
    'cancelled',
    'terminated',
    'incident'
  ));
