# Renovaciones CRM MVP

Demo SPA para una empresa comercializadora/gestora que trabaja una cartera existente de clientes y necesita controlar renovaciones anuales.

El producto esta recortado al MVP real del cliente:

- base centralizada de clientes
- contratos y fechas de renovacion
- avisos automaticos a los 10 meses
- filtros y busqueda
- acceso por comercial
- documentos por cliente
- exportacion y backups

## Stack

- React 19 + TypeScript
- Vite SPA
- Tailwind CSS + componentes base
- Supabase preparado para auth, RLS y storage
- PWA con `vite-plugin-pwa`

## Ejecutar en local

```bash
npm install
npm run dev
```

La app funciona en modo demo local si no hay variables de Supabase. Los datos demo se guardan en `localStorage`.

## Variables Supabase

Copia `.env.example` a `.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Comandos

```bash
npm run dev
npm run build
npm run preview
```

## Accesos demo

La demo arranca con login obligatorio. Hay exactamente 4 accesos:

- `Carlos Rivas` · `admin`
- `Marta Soler` · `sales`
- `Diego Paredes` · `sales`
- `Nuria Campos` · `sales`

Regla de permisos:

- `admin` ve toda la cartera
- cada `sales` solo ve sus clientes

## Datos demo

La demo trae una cartera creible para poder probar el negocio sin inventar registros a mano:

- 1 empresa
- 1 admin
- 3 comerciales
- 12 clientes
- mezcla de estados: `active`, `renewal_due`, `renewed`, `inactive`, `lost`
- contratos y renovaciones anuales repartidos entre comerciales
- documentos por cliente:
  - contrato
  - DNI o CIF
- backups automaticos en cada cambio

Ejemplos utiles en la demo:

- `Lucia Moreno`, `Comunidad Garbi`, `Casa Rural La Safor` y `Frutas Navarro` ya estan en ventana de renovacion
- `Residencial Turia 24` esta en baja
- `Clinica Nova Salut` esta perdida
- `Talleres Ferrer` y `Supermercado Alzira` aparecen como renovados

## Demo paso a paso

### 1. Probar login y permisos

1. Abre `/login`.
2. Entra como `Carlos Rivas`.
3. Ve a `/customers`.
4. Comprueba que ves toda la cartera.
5. Cierra sesion.
6. Entra como `Marta Soler`.
7. Vuelve a `/customers`.
8. Comprueba que solo ves sus clientes asignados.
9. Repite con `Diego Paredes` y `Nuria Campos`.

Resultado esperado:

- el admin ve todos los clientes
- cada comercial ve solo su cartera

### 2. Probar la cola de renovaciones

1. Entra como `Carlos Rivas`.
2. Abre `/renewals`.
3. Revisa los clientes pendientes.
4. Filtra por `Urgentes` o `Para contactar`.
5. Abre la ficha de `Lucia Moreno`.

Resultado esperado:

- la lista muestra clientes cuya renovacion ya esta en ventana de aviso
- en la ficha ves fecha de contrato, fecha de renovacion y fecha de aviso automatico

### 3. Probar filtros y busqueda de clientes

1. Ve a `/customers`.
2. Busca `Frutas`.
3. Filtra por `Renovacion pendiente`.
4. Filtra por un comercial concreto.

Resultado esperado:

- la tabla responde por nombre, DNI, empresa, telefono o email
- puedes aislar rapidamente activos, pendientes, renovados o perdidos

### 4. Probar alta manual de cliente

1. Desde `/customers`, pulsa `Nuevo cliente`.
2. Crea un cliente con:
   - nombre
   - empresa o particular
   - estado
   - fecha de contrato
   - fecha de renovacion
   - comercial
   - productos/servicios
3. Guarda.

Resultado esperado:

- el cliente aparece en la tabla
- queda asignado al comercial elegido
- el cambio genera backup automatico

### 5. Probar documentos

1. Abre `/documents`.
2. Selecciona un cliente.
3. Registra un `Contrato` o `DNI`.
4. Vuelve a la ficha del cliente.

Resultado esperado:

- el documento aparece en el listado general
- tambien aparece dentro de la ficha del cliente

### 6. Probar exportacion y backups

1. Entra en `/settings`.
2. Pulsa `Exportar CSV`.
3. Pulsa `Backup JSON`.
4. Revisa la tabla de backups recientes.

Resultado esperado:

- se descargan los ficheros de exportacion
- la tabla muestra snapshots automaticos con fecha y numero de clientes

### 7. Probar restauracion de demo

1. Crea o modifica algun cliente.
2. Ve a `/settings`.
3. Pulsa `Restaurar demo`.

Resultado esperado:

- la cartera vuelve al estado inicial
- el login sigue activo como punto de entrada

## Supabase

Migraciones disponibles:

```bash
supabase db push
```

Archivos:

- `supabase/migrations/0001_initial_schema.sql`: esquema base original
- `supabase/migrations/0002_rls_storage.sql`: RLS y buckets privados
- `supabase/migrations/0003_customer_renewal_mvp.sql`: columnas y vista del MVP de renovaciones

Buckets privados previstos:

- `contracts`
- `customer-documents`

## Estado actual

La app compila y la demo ya refleja el flujo real de negocio: cartera cerrada, seguimiento de renovaciones y control por comercial. El siguiente paso natural, si se quiere salir de demo, es conectar estas mismas vistas a Supabase Auth + tablas reales + notificaciones backend.
