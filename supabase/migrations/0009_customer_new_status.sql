-- Add 'new' as a valid customer status and make it the default
-- 'new' represents customers added before they become active

-- 1) Add 'new' to the customer_status enum, positioned before 'active'.
--    A newly added enum value cannot be used in the same transaction that
--    creates it, so the SET DEFAULT below is committed separately.
alter type public.customer_status add value if not exists 'new' before 'active';

-- 2) Change the default to 'new'
alter table public.customers alter column status set default 'new'::public.customer_status;
