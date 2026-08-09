-- Seed demo base para Supabase.
-- Nota: los perfiles referencian auth.users. En un proyecto remoto, crea primero
-- los usuarios demo desde Supabase Auth y sustituye los UUID de profiles si hace falta.

insert into public.organizations (
  id, name, legal_name, tax_id, email, phone, address, city, province, postal_code
) values (
  '11111111-1111-1111-1111-111111111111',
  'Energiza Gestion Demo S.L.',
  'Energiza Gestion Demo S.L.',
  'B72845193',
  'demo@energiza.local',
  '+34 960 123 456',
  'Av. de Aragon 30',
  'Valencia',
  'Valencia',
  '46021'
) on conflict (id) do nothing;

insert into public.customers (
  organization_id, type, name, legal_name, tax_id, contact_name, email, phone, address, city, province, postal_code, latitude, longitude, notes
) values
  ('11111111-1111-1111-1111-111111111111','business','Bar Mediterraneo','Bar Mediterraneo S.L.','B46100001','Pablo Serra','cliente1@demo.local','+34 650 210 001','Calle Energia 1','Valencia','Valencia','46100',39.4699,-0.3763,'Cliente con propuesta solar viable.'),
  ('11111111-1111-1111-1111-111111111111','residential','Vivienda Unifamiliar Godella','Vivienda Unifamiliar Godella','B46100002','Lucia Moreno','cliente2@demo.local','+34 650 210 002','Calle Energia 2','Godella','Valencia','46101',39.4709,-0.3773,'Cubierta apta para autoconsumo.'),
  ('11111111-1111-1111-1111-111111111111','community','Comunidad Garbi','Comunidad Garbi','B46100003','Jose Ferran','cliente3@demo.local','+34 650 210 003','Calle Energia 3','Valencia','Valencia','46102',39.4719,-0.3783,'Servicios comunes con consumo alto.');
