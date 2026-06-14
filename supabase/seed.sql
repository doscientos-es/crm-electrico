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

insert into public.pipeline_stages (id, organization_id, name, position, color, is_won, is_lost)
values
  ('21111111-1111-1111-1111-111111111111','11111111-1111-1111-1111-111111111111','Nuevo',1,'#0ea5e9',false,false),
  ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Diagnostico',2,'#6366f1',false,false),
  ('23333333-3333-3333-3333-333333333333','11111111-1111-1111-1111-111111111111','Factura recibida',3,'#8b5cf6',false,false),
  ('24444444-4444-4444-4444-444444444444','11111111-1111-1111-1111-111111111111','Simulacion enviada',4,'#06b6d4',false,false),
  ('25555555-5555-5555-5555-555555555555','11111111-1111-1111-1111-111111111111','Propuesta enviada',5,'#f59e0b',false,false),
  ('26666666-6666-6666-6666-666666666666','11111111-1111-1111-1111-111111111111','Negociacion',6,'#f97316',false,false),
  ('27777777-7777-7777-7777-777777777777','11111111-1111-1111-1111-111111111111','Ganado',7,'#059669',true,false),
  ('28888888-8888-8888-8888-888888888888','11111111-1111-1111-1111-111111111111','Perdido',8,'#dc2626',false,true)
on conflict (id) do nothing;

insert into public.leads (
  organization_id, source, status, company_name, contact_name, email, phone, city, province, notes, estimated_monthly_bill
) values
  ('11111111-1111-1111-1111-111111111111','web','new','Restaurante La Marina','Pablo Serra','pablo@demo.local','+34 600 100 001','Valencia','Valencia','Interesado en optimizacion y autoconsumo.',840),
  ('11111111-1111-1111-1111-111111111111','referido','contacted','Comunidad Residencial Azahar','Elena Vidal','elena@demo.local','+34 600 100 002','Castellon','Castellon','Comunidad con factura elevada en servicios comunes.',1950),
  ('11111111-1111-1111-1111-111111111111','llamada','qualified','Talleres Ferrer','Ramon Ferrer','ramon@demo.local','+34 600 100 003','Alicante','Alicante','Quiere revisar potencia contratada.',620),
  ('11111111-1111-1111-1111-111111111111','campana local','contacted','Clinica Dental Benimaclet','Sofia Orts','sofia@demo.local','+34 600 100 004','Valencia','Valencia','Enviar propuesta de auditoria.',410),
  ('11111111-1111-1111-1111-111111111111','feria solar','new','Panaderia Sol','Ines Costa','ines@demo.local','+34 600 100 005','Torrent','Valencia','Interes solar y cambio de tarifa.',530);

insert into public.customers (
  organization_id, type, name, legal_name, tax_id, contact_name, email, phone, address, city, province, postal_code, latitude, longitude, notes
) values
  ('11111111-1111-1111-1111-111111111111','SME','Bar Mediterraneo','Bar Mediterraneo S.L.','B46100001','Pablo Serra','cliente1@demo.local','+34 650 210 001','Calle Energia 1','Valencia','Valencia','46100',39.4699,-0.3763,'Cliente con propuesta solar viable.'),
  ('11111111-1111-1111-1111-111111111111','RESIDENTIAL','Vivienda Unifamiliar Godella',null,'25443321X','Lucia Moreno','cliente2@demo.local','+34 650 210 002','Calle Energia 2','Godella','Valencia','46101',39.4709,-0.3773,'Cubierta apta para autoconsumo.'),
  ('11111111-1111-1111-1111-111111111111','SME','Comunidad Garbi','Comunidad Garbi','B46100003','Jose Ferran','cliente3@demo.local','+34 650 210 003','Calle Energia 3','Valencia','Valencia','46102',39.4719,-0.3783,'Servicios comunes con consumo alto.');
