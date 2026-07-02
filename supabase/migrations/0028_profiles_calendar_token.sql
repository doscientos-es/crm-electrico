-- Add calendar_token to profiles for webcal subscription feed authentication.
-- Each profile gets a unique token used as the secret in the feed URL.
-- The iPhone calendar app subscribes to webcal://[host]/calendar-feed?token=[uuid]
-- and auto-refreshes periodically without requiring user login.

alter table public.profiles
  add column if not exists calendar_token uuid default gen_random_uuid();

-- Backfill existing profiles that might have null tokens
update public.profiles
  set calendar_token = gen_random_uuid()
  where calendar_token is null;

create unique index if not exists profiles_calendar_token_idx
  on public.profiles(calendar_token)
  where calendar_token is not null;
