-- ============================================================
-- Audit-log triggers: auto-log all meaningful changes to
-- customers, contracts and incidents into activity_logs.
-- actor_id is filled by the existing trg_activity_log_actor trigger.
-- organization_id is filled by the existing column DEFAULT (current_org_id()).
-- ============================================================

-- ── CUSTOMERS ────────────────────────────────────────────────
create or replace function public.log_customer_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := '{}'::jsonb;
begin
  if TG_OP = 'INSERT' then
    insert into public.activity_logs(entity_type, entity_id, action, metadata)
    values('customer', NEW.id, 'customer_created', jsonb_build_object(
      'name',   NEW.name,
      'status', NEW.status,
      'type',   NEW.type
    ));

  elsif TG_OP = 'UPDATE' then
    if OLD.status     is distinct from NEW.status     then v_meta := v_meta || jsonb_build_object('old_status',      OLD.status,      'new_status',      NEW.status);      end if;
    if OLD.name       is distinct from NEW.name       then v_meta := v_meta || jsonb_build_object('old_name',        OLD.name,        'new_name',        NEW.name);        end if;
    if OLD.assigned_to is distinct from NEW.assigned_to then v_meta := v_meta || jsonb_build_object('old_assigned_to', OLD.assigned_to, 'new_assigned_to', NEW.assigned_to); end if;
    if OLD.email      is distinct from NEW.email      then v_meta := v_meta || jsonb_build_object('field', 'email');                                                        end if;
    if OLD.phone      is distinct from NEW.phone      then v_meta := v_meta || jsonb_build_object('field', 'phone');                                                        end if;

    insert into public.activity_logs(entity_type, entity_id, action, metadata)
    values('customer', NEW.id, 'customer_updated', v_meta);
  end if;

  return null;
end;
$$;

drop trigger if exists trg_log_customer_change on public.customers;
create trigger trg_log_customer_change
  after insert or update on public.customers
  for each row execute function public.log_customer_change();

-- ── CONTRACTS ────────────────────────────────────────────────
create or replace function public.log_contract_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta      jsonb;
  v_cid       uuid;
begin
  v_cid := coalesce(NEW.customer_id, OLD.customer_id);

  if TG_OP = 'INSERT' then
    insert into public.activity_logs(entity_type, entity_id, action, metadata)
    values('customer', v_cid, 'contract_created', jsonb_build_object(
      'contract_id', NEW.id,
      'provider',    NEW.provider,
      'status',      NEW.status,
      'starts_at',   NEW.starts_at,
      'ends_at',     NEW.ends_at
    ));

  elsif TG_OP = 'UPDATE' then
    v_meta := jsonb_build_object('contract_id', NEW.id);
    if OLD.status   is distinct from NEW.status   then v_meta := v_meta || jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status); end if;
    if OLD.provider is distinct from NEW.provider then v_meta := v_meta || jsonb_build_object('provider', NEW.provider);                           end if;
    if OLD.ends_at  is distinct from NEW.ends_at  then v_meta := v_meta || jsonb_build_object('old_ends_at', OLD.ends_at, 'new_ends_at', NEW.ends_at); end if;

    insert into public.activity_logs(entity_type, entity_id, action, metadata)
    values('customer', v_cid, 'contract_updated', v_meta);

  elsif TG_OP = 'DELETE' then
    insert into public.activity_logs(entity_type, entity_id, action, metadata)
    values('customer', v_cid, 'contract_deleted', jsonb_build_object(
      'contract_id', OLD.id,
      'provider',    OLD.provider,
      'status',      OLD.status
    ));
  end if;

  return null;
end;
$$;

drop trigger if exists trg_log_contract_change on public.contracts;
create trigger trg_log_contract_change
  after insert or update or delete on public.contracts
  for each row execute function public.log_contract_change();

-- ── INCIDENTS ────────────────────────────────────────────────
create or replace function public.log_incident_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta  jsonb;
  v_cid   uuid;
begin
  v_cid := coalesce(NEW.customer_id, OLD.customer_id);

  if TG_OP = 'INSERT' then
    insert into public.activity_logs(entity_type, entity_id, action, metadata)
    values('customer', v_cid, 'incident_created', jsonb_build_object(
      'incident_id', NEW.id,
      'title',       NEW.title,
      'priority',    NEW.priority,
      'status',      NEW.status
    ));

  elsif TG_OP = 'UPDATE' then
    v_meta := jsonb_build_object('incident_id', NEW.id, 'title', NEW.title);
    if OLD.status   is distinct from NEW.status   then v_meta := v_meta || jsonb_build_object('old_status',   OLD.status,   'new_status',   NEW.status);   end if;
    if OLD.priority is distinct from NEW.priority then v_meta := v_meta || jsonb_build_object('old_priority', OLD.priority, 'new_priority', NEW.priority); end if;
    if OLD.title    is distinct from NEW.title    then v_meta := v_meta || jsonb_build_object('old_title',    OLD.title);                                   end if;

    insert into public.activity_logs(entity_type, entity_id, action, metadata)
    values('customer', v_cid, 'incident_updated', v_meta);

  elsif TG_OP = 'DELETE' then
    insert into public.activity_logs(entity_type, entity_id, action, metadata)
    values('customer', v_cid, 'incident_deleted', jsonb_build_object(
      'incident_id', OLD.id,
      'title',       OLD.title
    ));
  end if;

  return null;
end;
$$;

drop trigger if exists trg_log_incident_change on public.incidents;
create trigger trg_log_incident_change
  after insert or update or delete on public.incidents
  for each row execute function public.log_incident_change();
