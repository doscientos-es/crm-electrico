-- Add ical_uid column to tasks for iCalendar import/export deduplication.
-- A unique index per (organization_id, ical_uid) ensures reimporting the same
-- .ics file does not create duplicates.

alter table public.tasks
  add column if not exists ical_uid text;

create unique index if not exists tasks_ical_uid_idx
  on public.tasks(ical_uid)
  where ical_uid is not null;
