-- P0 read-only audit for Supabase registration integrity.
-- Run in the Supabase SQL editor using a read-only inspection session.
-- This script contains only catalog/data SELECTs and cannot write application data.

begin transaction read only;

-- 1. Migration history. Expected versions are the six deployed migrations.
select version
from supabase_migrations.schema_migrations
where version in (
    '20261001000100',
    '20261001000200',
    '20261003000100',
    '20261003000200',
    '20261003000300',
    '20261003000400'
)
order by version;

-- 2. Payment enum labels.
select e.enumlabel as payment_status
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public' and t.typname = 'payment_status'
order by e.enumsortorder;

-- 3. RLS enabled/forced state for registration-related tables.
select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('registrations', 'players', 'pairs', 'categories', 'tournament_categories', 'partner_pool')
order by c.relname;

-- 3b. Effective table privileges, independent of RLS policy predicates.
select
    c.relname as table_name,
    has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
    has_table_privilege('anon', c.oid, 'INSERT') as anon_insert,
    has_table_privilege('anon', c.oid, 'UPDATE') as anon_update,
    has_table_privilege('anon', c.oid, 'DELETE') as anon_delete,
    has_table_privilege('authenticated', c.oid, 'SELECT') as authenticated_select,
    has_table_privilege('authenticated', c.oid, 'INSERT') as authenticated_insert,
    has_table_privilege('authenticated', c.oid, 'UPDATE') as authenticated_update,
    has_table_privilege('authenticated', c.oid, 'DELETE') as authenticated_delete
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('registrations', 'players', 'pairs', 'categories', 'tournament_categories', 'partner_pool')
order by c.relname;

-- Public profile view should expose only its approved columns and opt-in filter.
select c.relname as view_name, c.reloptions, pg_get_viewdef(c.oid, true) as definition
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'public_player_profiles' and c.relkind = 'v';

-- 4. Actual policies and their predicates.
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('registrations', 'players', 'pairs', 'categories', 'tournament_categories', 'partner_pool')
order by tablename, policyname;

-- 5. RPC signatures, SECURITY DEFINER, fixed search_path, and effective EXECUTE grants.
select
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    p.prosecdef as security_definer,
    p.proconfig as function_settings,
    has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
    has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
      'registrar_pareja',
      'admin_cancel_registration',
      'admin_promote_waiting_registration',
      'admin_confirm_registration',
      'admin_move_registration_to_waiting_list',
      'cancelar_inscripcion',
      'protect_registration_owner_changes',
      'sync_cancelled_registration_pair',
      'prevent_self_role_escalation',
      'is_admin',
      'current_player_id'
  )
order by p.proname, arguments;

-- 6. Non-internal triggers on relevant tables.
select
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid, true) as trigger_definition,
    t.tgenabled as enabled_state,
    p.proname as function_name,
    p.prosecdef as function_is_security_definer,
    p.proconfig as function_settings
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where n.nspname = 'public'
  and not t.tgisinternal
  and c.relname in ('registrations', 'players', 'pairs')
order by c.relname, t.tgname;

-- 7. Related constraints and indexes.
select
    c.relname as table_name,
    con.conname as constraint_name,
    pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('registrations', 'players', 'pairs', 'tournament_categories')
order by c.relname, con.conname;

select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('registrations', 'players', 'pairs', 'tournament_categories')
order by tablename, indexname;

-- 8. Data-quality counts only; no names, contact data, or row identifiers.
with candidate_complete_pairs as (
    select
        p.id,
        p.tournament_id,
        p.categoria_id,
        p.estado as pair_state,
        p.player_1_id,
        p.player_2_id,
        r.id as registration_id,
        r.estado as registration_state
    from public.pairs p
    join public.registrations r
      on r.pair_id = p.id
     and r.tournament_id = p.tournament_id
    where p.player_1_id is not null
      and p.player_2_id is not null
      and p.estado in ('confirmada', 'pendiente_pago', 'lista_espera')
      and r.estado in ('confirmada', 'pendiente_pago', 'lista_espera')
),
active_complete_pairs as (
    select *
    from candidate_complete_pairs
    where registration_state in ('confirmada', 'pendiente_pago')
      and pair_state in ('confirmada', 'pendiente_pago')
),
pair_players as (
    select tournament_id, categoria_id, player_1_id as player_id, id as pair_id
    from candidate_complete_pairs
    union all
    select tournament_id, categoria_id, player_2_id as player_id, id as pair_id
    from candidate_complete_pairs
),
duplicate_players as (
    select tournament_id, categoria_id, player_id
    from pair_players
    group by tournament_id, categoria_id, player_id
    having count(distinct pair_id) > 1
),
duplicate_players_tournament_wide as (
    select tournament_id, player_id
    from pair_players
    group by tournament_id, player_id
    having count(distinct pair_id) > 1
),
category_occupancy as (
    select
        tc.tournament_id,
        tc.categoria_id,
        tc.cupo_maximo,
        count(distinct ap.id) as occupied
    from public.tournament_categories tc
    left join active_complete_pairs ap
      on ap.tournament_id = tc.tournament_id
     and ap.categoria_id = tc.categoria_id
    group by tc.tournament_id, tc.categoria_id, tc.cupo_maximo
)
select
    (select count(*) from duplicate_players) as players_in_multiple_active_pairs,
    (select count(*) from duplicate_players_tournament_wide) as players_in_multiple_active_pairs_across_tournament,
    (select count(*) from category_occupancy where cupo_maximo is not null and occupied > cupo_maximo) as categories_over_capacity,
    (select count(*) from public.registrations r
      join public.pairs p on p.id = r.pair_id
     where r.tournament_id <> p.tournament_id
        or (r.categoria_id is not null and r.categoria_id <> p.categoria_id)) as registration_pair_scope_mismatches,
    (select count(*) from public.registrations r
      join public.pairs p on p.id = r.pair_id
     where r.estado = 'cancelada' and p.estado in ('confirmada', 'pendiente_pago')) as cancelled_registration_active_pair_rows,
    (select count(*) from public.registrations
     where checked_in and estado <> 'confirmada') as checked_in_non_confirmed,
    (select count(*) from public.registrations
     where estado = 'cancelada' and payment_status = 'verificado'
       and fecha_pago is null) as cancelled_verified_payment_without_payment_date;

rollback;
