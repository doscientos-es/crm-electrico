-- Add customer status for customers with contracts pending recovery.

alter type public.customer_status
  add value if not exists 'pending_recovery' before 'inactive';
