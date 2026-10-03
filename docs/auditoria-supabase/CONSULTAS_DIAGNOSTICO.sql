-- Diagnóstico remoto de solo lectura. Ejecutar en SQL Editor conectado a STAGING.
-- Ejecuta un bloque cada vez; no incluye DDL, DML, RPC de escritura ni transacciones.
-- Bloques 1-8 consultan catálogo. Bloque 9 agrega datos y puede escanear tablas grandes.
-- No compartas resultados sin revisarlos: las definiciones de funciones/policies son código.

-- BLOQUE 1 — Identidad del servidor. Confirma el proyecto manualmente en el Dashboard;
-- current_database no identifica de forma única el proyecto Supabase.
select current_database() as database_name,
       current_user as execution_role,
       current_setting('server_version') as postgres_version;

-- BLOQUE 2 — Historial de migraciones (opcional).
-- Si `supabase_migrations.schema_migrations` no existe o el rol no tiene SELECT,
-- registra esa limitación y continúa con el bloque 3. El historial no prueba el catálogo real.
select version
from supabase_migrations.schema_migrations
where version in (
    '20261001000100', '20261001000200', '20261003000100',
    '20261003000200', '20261003000300', '20261003000400',
    '20261003000500', '20261003000600'
)
order by version;

-- BLOQUE 3 — Relaciones públicas y flags RLS.
select n.nspname as schema_name,
       c.relname as object_name,
       c.relkind,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced,
       pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm', 'f')
order by c.relkind, c.relname;

-- BLOQUE 4 — Todas las políticas de public y Storage.
-- La existencia/policy predicate no equivale a la prueba efectiva de RLS.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- BLOQUE 5A — Privilegios efectivos de relación para los roles Supabase habituales.
-- has_table_privilege incluye privilegios heredados; service_role/postgres son privilegiados.
select n.nspname as schema_name,
       c.relname as object_name,
       c.relkind,
       r.rolname,
       has_table_privilege(r.rolname, c.oid, 'SELECT') as can_select,
       has_table_privilege(r.rolname, c.oid, 'INSERT') as can_insert,
       has_table_privilege(r.rolname, c.oid, 'UPDATE') as can_update,
       has_table_privilege(r.rolname, c.oid, 'DELETE') as can_delete,
       has_table_privilege(r.rolname, c.oid, 'TRUNCATE') as can_truncate,
       has_table_privilege(r.rolname, c.oid, 'REFERENCES') as can_references,
       has_table_privilege(r.rolname, c.oid, 'TRIGGER') as can_trigger
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
cross join pg_roles r
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm', 'S')
  and r.rolname in ('anon', 'authenticated', 'service_role', 'postgres')
order by c.relname, r.rolname;

-- BLOQUE 5B — Privilegios de columna declarados para tablas sensibles.
-- Complementa 5A; no reemplaza grants/herencia/ownership ni comportamiento RLS.
select table_name, column_name, grantee, privilege_type, is_grantable
from information_schema.column_privileges
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role', 'postgres')
  and table_name in ('players', 'registrations', 'pairs', 'notifications',
                     'ranking_points', 'seasons', 'gallery_items')
order by table_name, column_name, grantee, privilege_type;

-- BLOQUE 5C — Privilegios de esquema y ACL por defecto.
select n.nspname as schema_name,
       r.rolname,
       has_schema_privilege(r.rolname, n.oid, 'USAGE') as can_use,
       has_schema_privilege(r.rolname, n.oid, 'CREATE') as can_create
from pg_namespace n
cross join pg_roles r
where n.nspname in ('public', 'storage')
  and r.rolname in ('anon', 'authenticated', 'service_role', 'postgres')
order by n.nspname, r.rolname;

select defaclnamespace::regnamespace as schema_name,
       defaclobjtype as object_type,
       defaclacl as default_acl
from pg_default_acl
where defaclnamespace = 'public'::regnamespace;

-- BLOQUE 6 — Funciones/procedimientos públicos y EXECUTE efectivo.
-- Definiciones pueden contener lógica interna: revisar antes de compartir resultados.
select p.oid::regprocedure as signature,
       pg_get_userbyid(p.proowner) as owner,
       p.prokind as object_kind,
       p.prosecdef as security_definer,
       p.provolatile as volatility,
       p.proconfig as function_settings,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
       pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind in ('f', 'p')
order by p.proname, p.oid::regprocedure::text;

-- BLOQUE 7 — Triggers y sus funciones en esquemas relevantes.
select n.nspname as schema_name,
       c.relname as table_name,
       t.tgname,
       t.tgenabled,
       pg_get_triggerdef(t.oid, true) as trigger_definition,
       p.oid::regprocedure as function_signature,
       p.prosecdef as function_security_definer,
       p.proconfig as function_settings
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal
  and n.nspname in ('public', 'auth', 'storage')
order by n.nspname, c.relname, t.tgname;

-- BLOQUE 8A — Enums públicos.
select n.nspname as schema_name,
       t.typname as enum_name,
       e.enumsortorder,
       e.enumlabel
from pg_type t
join pg_namespace n on n.oid = t.typnamespace
join pg_enum e on e.enumtypid = t.oid
where n.nspname = 'public'
order by t.typname, e.enumsortorder;

-- BLOQUE 8B — Constraints y claves foráneas públicas.
select n.nspname as schema_name,
       c.relname as table_name,
       con.conname,
       con.contype,
       con.convalidated,
       pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
order by c.relname, con.conname;

-- BLOQUE 8C — Índices públicos.
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- BLOQUE 8D — Definición/opciones/propietario de la vista pública de perfiles.
-- Devuelve cero filas si la vista no existe; no referencia columnas opcionales.
select c.relname,
       c.reloptions,
       pg_get_userbyid(c.relowner) as owner,
       pg_get_viewdef(c.oid, true) as view_definition
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'public_player_profiles'
  and c.relkind = 'v';

-- BLOQUE 9A — Conteos agregados y transiciones de inscripción.
-- Requiere las tablas/columnas del esquema objetivo y puede hacer full scans.
select 'players' as table_name, count(*)::bigint as row_count from public.players
union all
select 'registrations', count(*) from public.registrations
union all
select 'pairs', count(*) from public.pairs
union all
select 'gallery_unpublished', count(*) from public.gallery_items where published = false;

select estado, payment_status, count(*)::bigint as registrations
from public.registrations
group by estado, payment_status
order by estado, payment_status;

select status, count(*)::bigint as seasons
from public.seasons
group by status
order by status;

-- BLOQUE 9B — Indicadores de integridad agregados; no devuelve IDs ni PII.
-- Conteo de emparejamientos activos repetidos dentro de una categoría, capacidad,
-- alcance registro/pareja, cancelación, check-in y pago cancelado.
with active_registrations as (
    select p.id as pair_id, p.tournament_id, p.categoria_id,
           p.player_1_id, p.player_2_id
    from public.pairs p
    join public.registrations r
      on r.pair_id = p.id and r.tournament_id = p.tournament_id
    where p.estado in ('confirmada', 'pendiente_pago')
      and r.estado in ('confirmada', 'pendiente_pago')
      and p.player_1_id is not null and p.player_2_id is not null
), players_in_pairs as (
    select tournament_id, categoria_id, player_1_id as player_id, pair_id
    from active_registrations
    union all
    select tournament_id, categoria_id, player_2_id, pair_id
    from active_registrations
), candidate_pairs as (
    select p.id as pair_id, p.tournament_id, p.player_1_id, p.player_2_id
    from public.pairs p
    join public.registrations r
      on r.pair_id = p.id and r.tournament_id = p.tournament_id
    where p.estado in ('confirmada', 'pendiente_pago', 'lista_espera')
      and r.estado in ('confirmada', 'pendiente_pago', 'lista_espera')
), candidate_players as (
    select tournament_id, player_1_id as player_id, pair_id
    from candidate_pairs where player_1_id is not null
    union all
    select tournament_id, player_2_id, pair_id
    from candidate_pairs where player_2_id is not null
), duplicates as (
    select tournament_id, categoria_id, player_id
    from players_in_pairs
    group by tournament_id, categoria_id, player_id
    having count(distinct pair_id) > 1
), tournament_duplicates as (
    select tournament_id, player_id
    from candidate_players
    group by tournament_id, player_id
    having count(distinct pair_id) > 1
), capacity as (
    select tc.tournament_id, tc.categoria_id, tc.cupo_maximo,
           count(distinct a.pair_id) as occupied
    from public.tournament_categories tc
    left join active_registrations a
      on a.tournament_id = tc.tournament_id
     and a.categoria_id = tc.categoria_id
    group by tc.tournament_id, tc.categoria_id, tc.cupo_maximo
)
select
    (select count(*) from duplicates) as duplicate_active_players_same_category,
    (select count(*) from tournament_duplicates) as duplicate_active_players_tournament_wide,
    (select count(*) from capacity
      where cupo_maximo is not null and occupied > cupo_maximo) as categories_over_capacity,
    (select count(*) from public.registrations r
      join public.pairs p on p.id = r.pair_id
      where r.tournament_id <> p.tournament_id
         or (r.categoria_id is not null and r.categoria_id <> p.categoria_id)) as scope_mismatches,
    (select count(*) from public.registrations r
      join public.pairs p on p.id = r.pair_id
      where r.estado = 'cancelada'
        and p.estado in ('confirmada', 'pendiente_pago')) as cancelled_registration_active_pair,
    (select count(*) from public.registrations
      where checked_in and estado <> 'confirmada') as checkin_not_confirmed,
    (select count(*) from public.registrations
      where estado = 'cancelada'
        and payment_status = 'verificado'
        and fecha_pago is null) as cancelled_paid_without_date;

-- RESULTADOS PARA CERRAR HALLAZGOS
-- H-01/H-02 son locales: validar con los tests de aplicación, no con este SQL.
-- H-03: bloques 2, 6, 8A, 8B, 9A; se requieren enum, definición real de ambas RPC,
-- constraints de ranking_points y estados observados.
-- H-04: bloques 3, 4, 5A, 8D y 9A; verificar policy efectiva de galería y borradores.
-- H-05: bloques 5A-5C y 6; obtener grants efectivos, defaults y EXECUTE para cada RPC.
-- H-06: bloques 6-7; la atomicidad requiere después pruebas transaccionales en staging.
-- H-07/H-08/H-09: bloques 4-8 y 9B; los conteos no prueban carreras ni regla deportiva.
-- H-10: local; comprobar guards con pruebas HTTP/acciones de staging.
-- H-11: bloques 3-5, 8D; cerrar unicidad/baja solo después de revisar conteos y requisitos.
-- H-12: inventario Storage/Auth del Dashboard sigue siendo manual; estos bloques no lo certifican.
