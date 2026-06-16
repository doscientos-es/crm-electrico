-- Elimina el número de contrato: ya no se utiliza en la aplicación.
alter table public.contracts drop column if exists contract_number;
