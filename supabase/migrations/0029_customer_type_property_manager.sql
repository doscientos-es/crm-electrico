do $$
begin
  if exists (
    select 1
    from pg_enum enum
    join pg_type type on type.oid = enum.enumtypid
    join pg_namespace namespace on namespace.oid = type.typnamespace
    where namespace.nspname = 'public'
      and type.typname = 'customer_type'
      and enum.enumlabel = 'industrial'
  ) then
    alter type public.customer_type rename value 'industrial' to 'property_manager';
  end if;
end $$;
