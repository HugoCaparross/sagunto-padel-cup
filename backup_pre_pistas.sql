


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'player',
    'admin'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."content_status" AS ENUM (
    'draft',
    'scheduled',
    'published',
    'archived'
);


ALTER TYPE "public"."content_status" OWNER TO "postgres";


CREATE TYPE "public"."event_status" AS ENUM (
    'draft',
    'published',
    'registration_open',
    'registration_closed',
    'in_progress',
    'completed',
    'postponed',
    'cancelled',
    'archived'
);


ALTER TYPE "public"."event_status" OWNER TO "postgres";


CREATE TYPE "public"."event_type" AS ENUM (
    'regular',
    'master_final'
);


ALTER TYPE "public"."event_type" OWNER TO "postgres";


CREATE TYPE "public"."match_kind" AS ENUM (
    'oficial',
    'walkover',
    'exhibicion'
);


ALTER TYPE "public"."match_kind" OWNER TO "postgres";


CREATE TYPE "public"."match_stage" AS ENUM (
    'grupo',
    'semi',
    'final'
);


ALTER TYPE "public"."match_stage" OWNER TO "postgres";


CREATE TYPE "public"."match_status" AS ENUM (
    'scheduled',
    'in_progress',
    'finished_pending_validation',
    'validated',
    'suspended',
    'not_played',
    'walkover',
    'cancelled'
);


ALTER TYPE "public"."match_status" OWNER TO "postgres";


CREATE TYPE "public"."registration_status" AS ENUM (
    'pending',
    'confirmed',
    'waitlist',
    'cancelled',
    'rejected'
);


ALTER TYPE "public"."registration_status" OWNER TO "postgres";


CREATE TYPE "public"."season_status" AS ENUM (
    'draft',
    'active',
    'closed',
    'archived'
);


ALTER TYPE "public"."season_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_points_adjustment"("p_player_id" "uuid", "p_season_id" "uuid", "p_points" numeric, "p_reason" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_id uuid;
    v_status text;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_points is null or p_points = 0 then
        raise exception 'Indica una cantidad de puntos distinta de cero';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Escribe un motivo claro para el ajuste';
    end if;

    select status into v_status from public.seasons where id = p_season_id;
    if v_status is null then
        raise exception 'Temporada no encontrada';
    end if;
    if v_status in ('closed', 'archived') then
        raise exception 'La temporada está cerrada: no se pueden añadir ajustes';
    end if;

    insert into public.point_transactions (
        player_id, season_id, transaction_type, points, idempotency_key, reason, created_by
    )
    values (
        p_player_id, p_season_id, 'manual_adjustment', p_points,
        'adjust:' || gen_random_uuid(), trim(p_reason), (select auth.uid())
    )
    returning id into v_id;

    perform public.log_audit(
        'points.adjusted', 'point_transactions', v_id::text,
        null,
        jsonb_build_object('player_id', p_player_id, 'season_id', p_season_id, 'points', p_points),
        trim(p_reason)
    );

    return v_id;
end;
$$;


ALTER FUNCTION "public"."add_points_adjustment"("p_player_id" "uuid", "p_season_id" "uuid", "p_points" numeric, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_bracket_results"("p_stage" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    bs public.bracket_stages%rowtype;
    v_status text;
    v_rows integer := 0;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into bs from public.bracket_stages where stage_id = p_stage;
    if not found then
        raise exception 'Cuadro no encontrado';
    end if;

    select status into v_status from public.competition_stages where id = p_stage;
    if v_status <> 'completed' then
        raise exception 'El cuadro aún no ha terminado';
    end if;

    if exists (
        select 1 from public.event_point_batches
        where event_id = bs.event_id and status = 'active'
    ) then
        raise exception 'La prueba tiene puntos asignados. Revierte la asignación antes de aplicar el cuadro.';
    end if;

    insert into public.registration_results (registration_id, event_id, subgroup_id, placement, set_by, set_at)
    select
        be.registration_id,
        bs.event_id,
        bs.subgroup_id,
        case
            when m.winner_registration_id = be.registration_id then 1
            else case bm.teams
                when 2 then 2
                when 4 then 3
                when 8 then 5
                when 16 then 9
                else 17
            end
        end,
        (select auth.uid()),
        now()
    from public.bracket_entries be
    join public.matches m
        on m.stage_id = p_stage
       and (m.registration_a_id = be.registration_id or m.registration_b_id = be.registration_id)
    join public.bracket_matches bm on bm.match_id = m.id
    where be.stage_id = p_stage
      and m.winner_registration_id is not null
      and (m.winner_registration_id <> be.registration_id or bm.teams = 2)
    on conflict (registration_id) do update
        set event_id = excluded.event_id,
            subgroup_id = excluded.subgroup_id,
            placement = excluded.placement,
            set_by = excluded.set_by,
            set_at = excluded.set_at;

    get diagnostics v_rows = row_count;

    perform public.log_audit(
        'bracket.results_applied', 'competition_stages', p_stage::text,
        null, jsonb_build_object('registrations', v_rows), null
    );

    return v_rows;
end;
$$;


ALTER FUNCTION "public"."apply_bracket_results"("p_stage" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_player_category"("p_player" "uuid", "p_category" "uuid", "p_subgroup" "uuid", "p_valid_from" "date", "p_reason" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    cur public.player_category_history%rowtype;
    v_active boolean;
    v_id bigint;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Escribe un motivo claro para el cambio de categoría';
    end if;
    if p_valid_from is null then
        raise exception 'Indica la fecha de inicio de la vigencia';
    end if;
    if not exists (select 1 from public.players where id = p_player) then
        raise exception 'Jugador no encontrado';
    end if;

    select is_active into v_active from public.categories where id = p_category;
    if not found or not v_active then
        raise exception 'La categoría no existe o está desactivada';
    end if;

    if p_subgroup is not null then
        select is_active into v_active from public.subgroups where id = p_subgroup;
        if not found or not v_active then
            raise exception 'El subgrupo no existe o está desactivado';
        end if;
    end if;

    select * into cur
    from public.player_category_history
    where player_id = p_player and valid_to is null
    order by valid_from desc
    limit 1
    for update;

    if found then
        if cur.category_id = p_category and cur.subgroup_id is not distinct from p_subgroup then
            raise exception 'El jugador ya está en esa categoría y subgrupo';
        end if;
        if p_valid_from <= cur.valid_from then
            raise exception 'La fecha debe ser posterior a %', cur.valid_from;
        end if;

        update public.player_category_history
        set valid_to = p_valid_from - 1
        where id = cur.id;
    end if;

    insert into public.player_category_history (
        player_id, category_id, subgroup_id, valid_from, valid_to, reason, created_by
    )
    values (
        p_player, p_category, p_subgroup, p_valid_from, null, trim(p_reason), (select auth.uid())
    )
    returning id into v_id;

    perform public.log_audit(
        'player.category_assigned', 'player_category_history', v_id::text,
        null,
        jsonb_build_object('player_id', p_player, 'category_id', p_category,
                           'subgroup_id', p_subgroup, 'valid_from', p_valid_from),
        trim(p_reason)
    );

    return v_id;
end;
$$;


ALTER FUNCTION "public"."assign_player_category"("p_player" "uuid", "p_category" "uuid", "p_subgroup" "uuid", "p_valid_from" "date", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_event_points"("p_event_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_rule_set uuid;
    v_season uuid;
    v_season_status text;
    v_batch uuid;
    v_version integer;
    v_total integer := 0;
    v_n integer;
    r record;
    p record;
    v_rule record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select e.season_id, s.status into v_season, v_season_status
    from public.events e
    join public.seasons s on s.id = e.season_id
    where e.id = p_event_id;

    if v_season is null then
        raise exception 'Prueba no encontrada';
    end if;
    if v_season_status in ('closed', 'archived') then
        raise exception 'La temporada está cerrada: no se pueden modificar sus puntos';
    end if;
    if exists (
        select 1 from public.event_point_batches
        where event_id = p_event_id and status = 'active'
    ) then
        raise exception 'La prueba ya tiene puntos asignados. Revierte la asignación antes de volver a asignar.';
    end if;

    select id into v_rule_set
    from public.scoring_rule_sets
    where status = 'published'
    order by effective_from desc nulls last, created_at desc
    limit 1;
    if v_rule_set is null then
        raise exception 'No hay reglas de puntuación publicadas';
    end if;

    select coalesce(max(version), 0) + 1 into v_version
    from public.event_point_batches where event_id = p_event_id;

    insert into public.event_point_batches (event_id, version, status, created_by)
    values (p_event_id, v_version, 'active', (select auth.uid()))
    returning id into v_batch;

    for r in
        select rr.registration_id, rr.subgroup_id, rr.placement, ec.category_id
        from public.registration_results rr
        join public.registrations reg on reg.id = rr.registration_id
        join public.event_categories ec on ec.id = reg.event_category_id
        where rr.event_id = p_event_id
          and reg.status = 'confirmed'
    loop
        select sr.id, sr.points into v_rule
        from public.scoring_rules sr
        where sr.rule_set_id = v_rule_set
          and sr.category_id = r.category_id
          and sr.subgroup_id = r.subgroup_id
          and sr.placement = r.placement;

        if v_rule.id is null then
            raise exception 'Sin regla de puntuación para esa categoría, subgrupo y posición';
        end if;

        for p in
            select rp.player_id
            from public.registration_players rp
            where rp.registration_id = r.registration_id
        loop
            insert into public.point_transactions (
                player_id, season_id, event_id, registration_id, scoring_rule_id,
                transaction_type, points, idempotency_key, reason, metadata, created_by
            )
            values (
                p.player_id, v_season, p_event_id, r.registration_id, v_rule.id,
                'match_award', v_rule.points,
                'award:' || v_batch || ':' || r.registration_id || ':' || p.player_id,
                'Resultado final de la prueba (v' || v_version || ')',
                jsonb_build_object('batch', v_batch),
                (select auth.uid())
            )
            on conflict (idempotency_key) do nothing;

            get diagnostics v_n = row_count;
            v_total := v_total + v_n;
        end loop;
    end loop;

    if v_total = 0 then
        raise exception 'No hay resultados finales confirmados para asignar';
    end if;

    perform public.log_audit(
        'event.points_awarded', 'events', p_event_id::text,
        null, jsonb_build_object('batch', v_batch, 'version', v_version, 'movements', v_total), null
    );

    return v_total;
end;
$$;


ALTER FUNCTION "public"."award_event_points"("p_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bracket_clear_winner"("p_match" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    bm public.bracket_matches%rowtype;
    v_next uuid;
    v_status text;
begin
    select * into bm from public.bracket_matches where match_id = p_match;
    if not found then
        return;
    end if;

    update public.competition_stages set status = 'in_progress' where id = bm.stage_id;

    if bm.teams = 2 then
        return;
    end if;

    select match_id into v_next
    from public.bracket_matches
    where stage_id = bm.stage_id
      and round_no = bm.round_no + 1
      and pos = (bm.pos + 1) / 2;

    if v_next is null then
        return;
    end if;

    select status into v_status from public.matches where id = v_next;
    if v_status <> 'scheduled' then
        raise exception 'No se puede revertir: el siguiente partido del cuadro ya ha comenzado';
    end if;

    if bm.pos % 2 = 1 then
        update public.matches set registration_a_id = null where id = v_next;
    else
        update public.matches set registration_b_id = null where id = v_next;
    end if;
end;
$$;


ALTER FUNCTION "public"."bracket_clear_winner"("p_match" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bracket_place_winner"("p_match" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    bm public.bracket_matches%rowtype;
    w uuid;
    v_next uuid;
begin
    select * into bm from public.bracket_matches where match_id = p_match;
    if not found then
        return;
    end if;

    select winner_registration_id into w from public.matches where id = p_match;
    if w is null then
        return;
    end if;

    if bm.teams = 2 then
        update public.competition_stages set status = 'completed' where id = bm.stage_id;
        return;
    end if;

    select match_id into v_next
    from public.bracket_matches
    where stage_id = bm.stage_id
      and round_no = bm.round_no + 1
      and pos = (bm.pos + 1) / 2;

    if v_next is null then
        return;
    end if;

    if bm.pos % 2 = 1 then
        update public.matches set registration_a_id = w where id = v_next;
    else
        update public.matches set registration_b_id = w where id = v_next;
    end if;
end;
$$;


ALTER FUNCTION "public"."bracket_place_winner"("p_match" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_master_registration_player"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_type public.event_type;
    v_event uuid;
begin
    select e.event_type, e.id into v_type, v_event
    from public.registrations reg
    join public.events e on e.id = reg.event_id
    where reg.id = new.registration_id;

    if v_type = 'master_final' then
        if not exists (
            select 1 from public.master_final_qualifications q
            where q.event_id = v_event
              and q.player_id = new.player_id
              and q.eligibility_status = 'confirmed'
        ) then
            raise exception 'Solo pueden inscribirse jugadores confirmados para el Máster Final';
        end if;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."check_master_registration_player"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_pinned_news"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if new.is_pinned and new.status in ('published', 'scheduled') then
        if (
            select count(*) from public.news n
            where n.is_pinned
              and n.status in ('published', 'scheduled')
              and n.id <> new.id
        ) >= 3 then
            raise exception 'Solo puedes fijar hasta 3 noticias a la vez';
        end if;
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."check_pinned_news"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_set_rules"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
    m record;
    hi integer := greatest(new.score_a, new.score_b);
    lo integer := least(new.score_a, new.score_b);
    ok boolean;
begin
    select match_stage into m from public.matches where id = new.match_id;

    -- Partidos antiguos sin fase: no se validan aquí
    if m.match_stage is null then
        return new;
    end if;

    if new.is_super_tiebreak then
        if m.match_stage <> 'final' or new.set_number <> 3 then
            raise exception 'El super tie-break solo puede ser el tercer set de una final';
        end if;
        if not (hi >= 10 and hi - lo >= 2) then
            raise exception 'Super tie-break no válido: 10 puntos con diferencia mínima de 2';
        end if;
        return new;
    end if;

    if m.match_stage = 'grupo' then
        if new.set_number <> 1 then
            raise exception 'La fase de grupos se juega a un set';
        end if;
        ok := (hi = 6 and lo <= 4) or (hi = 7 and lo = 6);
    elsif m.match_stage = 'semi' then
        if new.set_number <> 1 then
            raise exception 'Las semifinales se juegan a un set';
        end if;
        ok := (hi = 9 and lo <= 7) or (hi = 9 and lo = 8);
    else
        if new.set_number > 2 then
            raise exception 'Las finales se juegan a dos sets y, si es necesario, super tie-break';
        end if;
        ok := (hi = 6 and lo <= 4) or (hi = 7 and lo = 6);
    end if;

    if not ok then
        raise exception 'Marcador no válido para una fase de tipo %', m.match_stage;
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."check_set_rules"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clone_rule_set"("p_source" "uuid", "p_version" "text", "p_description" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_name text;
    v_new uuid;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_version is null or length(trim(p_version)) = 0 then
        raise exception 'Indica el nombre de la versión';
    end if;

    select name into v_name from public.scoring_rule_sets where id = p_source;
    if v_name is null then
        raise exception 'Versión origen no encontrada';
    end if;

    insert into public.scoring_rule_sets (name, version, description, status, created_by)
    values (v_name, trim(p_version), coalesce(p_description, 'Nueva versión'), 'draft', (select auth.uid()))
    returning id into v_new;

    insert into public.scoring_rules (rule_set_id, category_id, subgroup_id, placement, points)
    select v_new, category_id, subgroup_id, placement, points
    from public.scoring_rules
    where rule_set_id = p_source;

    perform public.log_audit(
        'rules.cloned', 'scoring_rule_sets', v_new::text,
        null, jsonb_build_object('from', p_source, 'version', trim(p_version)), null
    );

    return v_new;
end;
$$;


ALTER FUNCTION "public"."clone_rule_set"("p_source" "uuid", "p_version" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."close_season"("p_season_id" "uuid", "p_next_season_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    s public.seasons%rowtype;
    v_closure uuid;
    v_snapshot uuid;
    v_rev integer;
    v_pos integer := 0;
    r record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_next_season_id = p_season_id then
        raise exception 'La temporada siguiente no puede ser la misma';
    end if;

    select * into s from public.seasons where id = p_season_id for update;
    if not found then
        raise exception 'Temporada no encontrada';
    end if;
    if s.status in ('closed', 'archived') then
        raise exception 'La temporada ya está cerrada';
    end if;
    if exists (
        select 1 from public.season_closures
        where season_id = p_season_id and status = 'completed'
    ) then
        raise exception 'Esta temporada ya tiene un cierre completado';
    end if;

    select coalesce(max(revision_number), 0) + 1 into v_rev
    from public.season_closures where season_id = p_season_id;

    insert into public.season_closures (
        season_id, revision_number, status, carryover_percentage, discarded_percentage,
        rounding_method, started_at, executed_by
    )
    values (
        p_season_id, v_rev, 'processing', s.carryover_percentage, s.discarded_percentage,
        s.rounding_method, now(), (select auth.uid())
    )
    returning id into v_closure;

    insert into public.ranking_snapshots (season_id, snapshot_type, is_public, metadata, created_by)
    values (p_season_id, 'pre_close', false, jsonb_build_object('closure_id', v_closure), (select auth.uid()))
    returning id into v_snapshot;

    for r in select * from public.preview_season_closure(p_season_id) loop
        v_pos := v_pos + 1;

        insert into public.ranking_snapshot_entries (
            snapshot_id, player_id, position, points, points_before_close, points_carried
        )
        values (v_snapshot, r.player_id, v_pos, r.points_before, r.points_before, r.points_carried);

        insert into public.season_closure_entries (
            closure_id, player_id, points_before, points_carried, points_discarded, points_after, calculation
        )
        values (
            v_closure, r.player_id, r.points_before, r.points_carried, r.points_discarded, r.points_after,
            jsonb_build_object('carryover_percentage', s.carryover_percentage, 'rounding', s.rounding_method)
        );

        insert into public.point_transactions (
            player_id, season_id, transaction_type, points, idempotency_key, reason, created_by
        )
        values (
            r.player_id, p_season_id, 'season_carryover', -r.points_discarded,
            'closure:' || v_closure || ':discard:' || r.player_id,
            'Cierre 70/30: puntos eliminados', (select auth.uid())
        );

        if p_next_season_id is not null and r.points_carried > 0 then
            insert into public.point_transactions (
                player_id, season_id, transaction_type, points, idempotency_key, reason, created_by
            )
            values (
                r.player_id, p_next_season_id, 'season_carryover', r.points_carried,
                'closure:' || v_closure || ':carry:' || r.player_id,
                'Arrastre del 30 % de la temporada anterior', (select auth.uid())
            );
        end if;
    end loop;

    update public.season_closures
    set status = 'completed', pre_close_snapshot_id = v_snapshot, completed_at = now()
    where id = v_closure;

    update public.seasons set status = 'closed' where id = p_season_id;

    perform public.log_audit(
        'season.closed', 'seasons', p_season_id::text,
        jsonb_build_object('status', s.status),
        jsonb_build_object('status', 'closed', 'closure_id', v_closure, 'next_season_id', p_next_season_id),
        null
    );

    return v_closure;
end;
$$;


ALTER FUNCTION "public"."close_season"("p_season_id" "uuid", "p_next_season_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."closure_discrepancies"("p_season_id" "uuid") RETURNS TABLE("player_id" "uuid", "display_name" "text", "expected" numeric, "actual" numeric, "diff" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    -- Sin cierre completado no hay nada que comparar
    if not exists (
        select 1 from public.season_closures
        where season_id = p_season_id and status = 'completed'
    ) then
        return;
    end if;

    return query
    with last_closure as (
        select sc.id
        from public.season_closures sc
        where sc.season_id = p_season_id and sc.status = 'completed'
        order by sc.revision_number desc
        limit 1
    ),
    expected_pts as (
        select sce.player_id as pid, sce.points_after as exp
        from public.season_closure_entries sce
        join last_closure lc on lc.id = sce.closure_id
    ),
    actual_pts as (
        select pt.player_id as pid, sum(pt.points) as act
        from public.point_transactions pt
        where pt.season_id = p_season_id
        group by pt.player_id
    ),
    merged as (
        select
            coalesce(e.pid, a.pid) as pid,
            coalesce(e.exp, 0) as exp,
            coalesce(a.act, 0) as act
        from expected_pts e
        full join actual_pts a on a.pid = e.pid
    )
    select
        m.pid,
        pl.display_name::text,
        m.exp,
        m.act,
        m.act - m.exp
    from merged m
    join public.players pl on pl.id = m.pid
    where m.act - m.exp <> 0
    order by abs(m.act - m.exp) desc;
end;
$$;


ALTER FUNCTION "public"."closure_discrepancies"("p_season_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compare_rule_sets"("p_a" "uuid", "p_b" "uuid") RETURNS TABLE("cat_name" "text", "sub_name" "text", "pos" integer, "old_points" numeric, "new_points" numeric, "delta" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    return query
    select
        c.name::text,
        sg.name::text,
        a.placement,
        a.points,
        b.points,
        b.points - a.points
    from public.scoring_rules a
    join public.scoring_rules b
        on b.rule_set_id = p_b
       and b.category_id = a.category_id
       and b.subgroup_id = a.subgroup_id
       and b.placement = a.placement
    join public.categories c on c.id = a.category_id
    join public.subgroups sg on sg.id = a.subgroup_id
    where a.rule_set_id = p_a
      and b.points <> a.points
    order by c.display_order, sg.display_order, a.placement;
end;
$$;


ALTER FUNCTION "public"."compare_rule_sets"("p_a" "uuid", "p_b" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."compute_master_candidates"("p_event_id" "uuid", "p_places" integer DEFAULT 6, "p_min_events" integer DEFAULT 1) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_season uuid;
    v_type public.event_type;
    v_status public.event_status;
    v_total integer := 0;
    v_pos integer;
    v_new text;
    c record;
    rk record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_places < 1 or p_min_events < 0 then
        raise exception 'Parámetros no válidos';
    end if;

    select e.season_id, e.event_type, e.status
    into v_season, v_type, v_status
    from public.events e
    where e.id = p_event_id;

    if not found then
        raise exception 'Prueba no encontrada';
    end if;
    if v_type <> 'master_final' then
        raise exception 'La prueba no es el Máster Final';
    end if;
    if v_status in ('in_progress', 'completed', 'archived', 'cancelled') then
        raise exception 'La lista ya está cerrada y no se puede recalcular';
    end if;

    for c in
        select id, name from public.categories where is_active order by display_order
    loop
        v_pos := 0;

        for rk in
            select
                pl.id as pid,
                pl.display_name,
                coalesce(sum(pt.points), 0) as pts,
                count(distinct pt.event_id) filter (
                    where pt.event_id is not null and pt.transaction_type = 'match_award'
                ) as evs
            from public.players pl
            join public.player_category_history h
                 on h.player_id = pl.id and h.valid_to is null and h.category_id = c.id
            left join public.point_transactions pt
                 on pt.player_id = pl.id and pt.season_id = v_season
            where pl.status = 'active'
            group by pl.id, pl.display_name
            order by pts desc, evs desc, pl.display_name
        loop
            if rk.evs < p_min_events then
                v_new := 'ineligible';
            else
                v_pos := v_pos + 1;
                v_new := case when v_pos <= p_places then 'eligible' else 'candidate' end;
            end if;

            insert into public.master_final_qualifications (
                season_id, event_id, player_id, ranking_position, eligibility_status, qualification_reason
            )
            values (
                v_season, p_event_id, rk.pid,
                case when v_new = 'ineligible' then null else v_pos end,
                v_new,
                c.name || ' · ' || rk.pts::text || ' pts · ' || rk.evs::text || ' prueba(s)'
            )
            on conflict (event_id, player_id) do update
            set ranking_position = excluded.ranking_position,
                qualification_reason = excluded.qualification_reason,
                eligibility_status = case
                    when public.master_final_qualifications.eligibility_status in ('confirmed', 'declined', 'waitlist')
                        then public.master_final_qualifications.eligibility_status
                    else excluded.eligibility_status
                end;

            v_total := v_total + 1;
        end loop;
    end loop;

    perform public.log_audit(
        'master.candidates_calculated', 'events', p_event_id::text,
        null,
        jsonb_build_object('places', p_places, 'min_events', p_min_events, 'evaluated', v_total),
        null
    );

    return v_total;
end;
$$;


ALTER FUNCTION "public"."compute_master_candidates"("p_event_id" "uuid", "p_places" integer, "p_min_events" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_ranking_snapshot"("p_season_id" "uuid", "p_type" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_snap uuid;
    r record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_type not in ('live', 'published') then
        raise exception 'Tipo de snapshot no válido';
    end if;
    if not exists (select 1 from public.seasons where id = p_season_id) then
        raise exception 'Temporada no encontrada';
    end if;

    -- Solo un ranking publicado a la vez por temporada
    if p_type = 'published' then
        update public.ranking_snapshots
        set is_public = false
        where season_id = p_season_id
          and snapshot_type = 'published'
          and is_public;
    end if;

    insert into public.ranking_snapshots (season_id, snapshot_type, as_of, is_public, metadata, created_by)
    values (
        p_season_id, p_type, now(), p_type = 'published',
        jsonb_build_object('source', 'get_ranking_live'),
        (select auth.uid())
    )
    returning id into v_snap;

    for r in select * from public.get_ranking_live(p_season_id) loop
        insert into public.ranking_snapshot_entries (snapshot_id, player_id, position, points, events_played)
        values (v_snap, r.player_id, r.rank_position, r.points, r.events_played);
    end loop;

    perform public.log_audit(
        'ranking.snapshot_created', 'ranking_snapshots', v_snap::text,
        null, jsonb_build_object('type', p_type, 'season_id', p_season_id), null
    );

    return v_snap;
end;
$$;


ALTER FUNCTION "public"."create_ranking_snapshot"("p_season_id" "uuid", "p_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_bracket"("p_stage" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    bs public.bracket_stages%rowtype;
    cs public.competition_stages%rowtype;
    v_n integer;
    v_bad integer;
    v_size integer := 2;
    v_rounds integer := 0;
    v_t integer;
    v_order integer[] := array[1];
    v_m integer;
    v_new integer[];
    v_teams integer;
    v_name text;
    v_mid uuid;
    v_ra uuid;
    v_rb uuid;
    v_created integer := 0;
    v_seed_a integer;
    v_seed_b integer;
    b record;
    r integer;
    p integer;
    i integer;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into bs from public.bracket_stages where stage_id = p_stage;
    if not found then
        raise exception 'Este estado no es un cuadro';
    end if;

    select * into cs from public.competition_stages where id = p_stage for update;
    if cs.status <> 'draft' then
        raise exception 'El cuadro ya está generado o en juego';
    end if;
    if exists (select 1 from public.matches where stage_id = p_stage) then
        raise exception 'El cuadro ya tiene partidos';
    end if;

    select count(*) into v_n from public.bracket_entries where stage_id = p_stage;
    if v_n < 2 then
        raise exception 'Necesitas al menos dos parejas en el cuadro';
    end if;

    select count(*) into v_bad
    from public.bracket_entries be
    join public.registrations reg on reg.id = be.registration_id
    where be.stage_id = p_stage
      and (reg.event_id <> bs.event_id
           or reg.status <> 'confirmed'
           or not exists (
                select 1 from public.event_categories ec
                where ec.id = reg.event_category_id
                  and ec.category_id = bs.category_id));

    if v_bad > 0 then
        raise exception 'Hay parejas que no están confirmadas o no pertenecen a esta categoría';
    end if;

    while v_size < v_n loop
        v_size := v_size * 2;
    end loop;

    v_t := v_size;
    while v_t > 1 loop
        v_t := v_t / 2;
        v_rounds := v_rounds + 1;
    end loop;

    -- Orden estándar de cruces
    while array_length(v_order, 1) < v_size loop
        v_m := array_length(v_order, 1) * 2;
        v_new := '{}';
        for i in 1 .. array_length(v_order, 1) loop
            v_new := v_new || array[v_order[i], v_m + 1 - v_order[i]];
        end loop;
        v_order := v_new;
    end loop;

    for r in 1 .. v_rounds loop
        v_teams := v_size >> (r - 1);
        v_name := case v_teams
            when 2 then 'Final'
            when 4 then 'Semifinal'
            when 8 then 'Cuartos'
            when 16 then 'Octavos'
            when 32 then 'Dieciseisavos'
            else 'Ronda de ' || v_teams
        end;

        for p in 1 .. (v_teams / 2) loop
            v_ra := null;
            v_rb := null;

            if r = 1 then
                v_seed_a := v_order[2 * p - 1];
                v_seed_b := v_order[2 * p];
                select registration_id into v_ra
                from public.bracket_entries where stage_id = p_stage and seed = v_seed_a;
                select registration_id into v_rb
                from public.bracket_entries where stage_id = p_stage and seed = v_seed_b;
            end if;

            insert into public.matches (
                stage_id, match_number, round_name, registration_a_id, registration_b_id, status, created_by
            )
            values (
                p_stage, 'R' || r || '-' || p, v_name, v_ra, v_rb, 'scheduled', (select auth.uid())
            )
            returning id into v_mid;

            insert into public.bracket_matches (match_id, stage_id, round_no, pos, teams)
            values (v_mid, p_stage, r, p, v_teams);

            v_created := v_created + 1;
        end loop;
    end loop;

    -- Byes: la pareja sin rival pasa automáticamente (el disparador la coloca en la siguiente ronda)
    for b in
        select m.id, m.registration_a_id, m.registration_b_id
        from public.matches m
        join public.bracket_matches bm on bm.match_id = m.id
        where bm.stage_id = p_stage
          and bm.round_no = 1
          and (m.registration_a_id is null) <> (m.registration_b_id is null)
    loop
        update public.matches
        set status = 'walkover',
            winner_registration_id = coalesce(b.registration_a_id, b.registration_b_id)
        where id = b.id;
    end loop;

    update public.competition_stages set status = 'in_progress' where id = p_stage;
    update public.bracket_stages set size = v_size, generated_at = now() where stage_id = p_stage;

    perform public.log_audit(
        'bracket.generated', 'competition_stages', p_stage::text,
        null, jsonb_build_object('size', v_size, 'entries', v_n, 'matches', v_created), null
    );

    return v_created;
end;
$$;


ALTER FUNCTION "public"."generate_bracket"("p_stage" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ranking_live"("p_season_id" "uuid") RETURNS TABLE("player_id" "uuid", "display_name" "text", "points" numeric, "events_played" integer, "category_name" "text", "subgroup_name" "text", "rank_position" integer)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    return query
    with totals as (
        select
            pt.player_id as pid,
            sum(pt.points) as pts,
            count(distinct pt.event_id) filter (
                where pt.event_id is not null and pt.transaction_type = 'match_award'
            ) as evs
        from public.point_transactions pt
        where pt.season_id = p_season_id
        group by pt.player_id
    ),
    ranked as (
        select
            t.pid,
            t.pts,
            t.evs,
            pl.display_name::text as dname,
            cat.name::text as cname,
            sg.name::text as sname
        from totals t
        join public.players pl on pl.id = t.pid
        left join lateral (
            select h.category_id, h.subgroup_id
            from public.player_category_history h
            where h.player_id = t.pid and h.valid_to is null
            limit 1
        ) cur on true
        left join public.categories cat on cat.id = cur.category_id
        left join public.subgroups sg on sg.id = cur.subgroup_id
    )
    select
        r.pid,
        r.dname,
        r.pts,
        r.evs::integer,
        r.cname,
        r.sname,
        (row_number() over (order by r.pts desc, r.evs desc, r.dname))::integer
    from ranked r
    order by 7;
end;
$$;


ALTER FUNCTION "public"."get_ranking_live"("p_season_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_admin_role"("p_email" "text", "p_reason" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_user uuid;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Indica el motivo para conceder el rol';
    end if;

    select id into v_user from auth.users where lower(email) = lower(trim(p_email));
    if v_user is null then
        raise exception 'Esa cuenta no existe. La persona debe registrarse antes.';
    end if;

    insert into public.user_roles (user_id, role, created_by)
    values (v_user, 'admin', (select auth.uid()))
    on conflict (user_id, role) do nothing;

    perform public.log_audit(
        'admin.granted', 'user_roles', v_user::text,
        null, jsonb_build_object('email', trim(p_email)), trim(p_reason)
    );

    return v_user;
end;
$$;


ALTER FUNCTION "public"."grant_admin_role"("p_email" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_scoring_rule_edit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_set uuid;
    v_status public.content_status;
begin
    if tg_op = 'DELETE' then
        v_set := old.rule_set_id;
    else
        v_set := new.rule_set_id;
    end if;

    select status into v_status from public.scoring_rule_sets where id = v_set;

    if v_status is distinct from 'draft' then
        raise exception 'Solo se pueden modificar reglas de una versión en borrador';
    end if;

    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."guard_scoring_rule_edit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(
      pg_catalog.btrim(
        coalesce(new.raw_user_meta_data ->> 'display_name', '')
      ),
      ''
    )
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'player'::public.app_role)
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("requested_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = requested_role
  );
$$;


ALTER FUNCTION "public"."has_role"("requested_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select public.has_role('admin'::public.app_role);
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_admins"() RETURNS TABLE("user_id" "uuid", "email" "text", "granted_at" timestamp with time zone, "is_me" boolean)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    return query
    select ur.user_id, u.email::text, ur.created_at, (ur.user_id = (select auth.uid()))
    from public.user_roles ur
    join auth.users u on u.id = ur.user_id
    where ur.role = 'admin'
    order by ur.created_at;
end;
$$;


ALTER FUNCTION "public"."list_admins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."list_audit_log"("p_action" "text" DEFAULT NULL::"text", "p_table" "text" DEFAULT NULL::"text", "p_from" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_to" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_limit" integer DEFAULT 200, "p_before" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("id" bigint, "created_at" timestamp with time zone, "action" "text", "entity_table" "text", "entity_id" "text", "actor_email" "text", "reason" "text", "old_values" "jsonb", "new_values" "jsonb")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    return query
    select
        a.id,
        a.created_at,
        a.action,
        a.entity_table,
        a.entity_id,
        u.email::text,
        a.reason,
        a.old_values,
        a.new_values
    from public.audit_logs a
    left join auth.users u on u.id = a.actor_user_id
    where (p_action is null or a.action like p_action || '%')
      and (p_table is null or a.entity_table = p_table)
      and (p_from is null or a.created_at >= p_from)
      and (p_to is null or a.created_at <= p_to)
      and (p_before is null or a.created_at < p_before)
    order by a.created_at desc
    limit least(greatest(p_limit, 1), 500);
end;
$$;


ALTER FUNCTION "public"."list_audit_log"("p_action" "text", "p_table" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer, "p_before" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_audit"("p_action" "text", "p_entity_table" "text", "p_entity_id" "text", "p_old" "jsonb" DEFAULT NULL::"jsonb", "p_new" "jsonb" DEFAULT NULL::"jsonb", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    insert into public.audit_logs (actor_user_id, action, entity_table, entity_id, old_values, new_values, reason)
    values ((select auth.uid()), p_action, p_entity_table, p_entity_id, p_old, p_new, p_reason);
end;
$$;


ALTER FUNCTION "public"."log_audit"("p_action" "text", "p_entity_table" "text", "p_entity_id" "text", "p_old" "jsonb", "p_new" "jsonb", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_presence"("p_registration" "uuid") RETURNS timestamp with time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_at timestamptz;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    update public.registrations
    set presented_at = coalesce(presented_at, now()),
        presented_by = coalesce(presented_by, (select auth.uid()))
    where id = p_registration
    returning presented_at into v_at;

    if v_at is null then
        raise exception 'Inscripción no encontrada';
    end if;

    perform public.log_audit(
        'registration.presented', 'registrations', p_registration::text,
        null, jsonb_build_object('presented_at', v_at), null
    );

    return v_at;
end;
$$;


ALTER FUNCTION "public"."mark_presence"("p_registration" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_category"("p_id" "uuid", "p_direction" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    me public.categories%rowtype;
    other public.categories%rowtype;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_direction not in ('up', 'down') then
        raise exception 'Dirección no válida';
    end if;

    select * into me from public.categories where id = p_id for update;
    if not found then
        raise exception 'Categoría no encontrada';
    end if;

    if p_direction = 'up' then
        select * into other from public.categories
        where display_order < me.display_order
        order by display_order desc limit 1 for update;
    else
        select * into other from public.categories
        where display_order > me.display_order
        order by display_order asc limit 1 for update;
    end if;

    if not found then
        return;
    end if;

    -- Intercambio en tres pasos para no chocar con la restricción de orden único
    update public.categories set display_order = -1 where id = me.id;
    update public.categories set display_order = me.display_order where id = other.id;
    update public.categories set display_order = other.display_order where id = me.id;

    perform public.log_audit(
        'category.reordered', 'categories', p_id::text,
        jsonb_build_object('display_order', me.display_order),
        jsonb_build_object('display_order', other.display_order), null
    );
end;
$$;


ALTER FUNCTION "public"."move_category"("p_id" "uuid", "p_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."move_subgroup"("p_id" "uuid", "p_direction" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    me public.subgroups%rowtype;
    other public.subgroups%rowtype;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_direction not in ('up', 'down') then
        raise exception 'Dirección no válida';
    end if;

    select * into me from public.subgroups where id = p_id for update;
    if not found then
        raise exception 'Subgrupo no encontrado';
    end if;

    if p_direction = 'up' then
        select * into other from public.subgroups
        where display_order < me.display_order
        order by display_order desc limit 1 for update;
    else
        select * into other from public.subgroups
        where display_order > me.display_order
        order by display_order asc limit 1 for update;
    end if;

    if not found then
        return;
    end if;

    update public.subgroups set display_order = -1 where id = me.id;
    update public.subgroups set display_order = me.display_order where id = other.id;
    update public.subgroups set display_order = other.display_order where id = me.id;

    perform public.log_audit(
        'subgroup.reordered', 'subgroups', p_id::text,
        jsonb_build_object('display_order', me.display_order),
        jsonb_build_object('display_order', other.display_order), null
    );
end;
$$;


ALTER FUNCTION "public"."move_subgroup"("p_id" "uuid", "p_direction" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."preview_season_closure"("p_season_id" "uuid") RETURNS TABLE("player_id" "uuid", "display_name" "text", "points_before" numeric, "points_carried" numeric, "points_discarded" numeric, "points_after" numeric)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    s public.seasons%rowtype;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into s from public.seasons where id = p_season_id;
    if not found then
        raise exception 'Temporada no encontrada';
    end if;

    return query
    with totals as (
        select pt.player_id as pid, sum(pt.points) as before_total
        from public.point_transactions pt
        where pt.season_id = p_season_id
        group by pt.player_id
    ),
    calc as (
        select
            t.pid,
            greatest(t.before_total, 0) as before_pts,
            case s.rounding_method
                when 'floor' then floor(greatest(t.before_total, 0) * s.carryover_percentage / 100)
                when 'ceiling' then ceiling(greatest(t.before_total, 0) * s.carryover_percentage / 100)
                else round(greatest(t.before_total, 0) * s.carryover_percentage / 100)
            end as carried_pts
        from totals t
    )
    select
        c.pid,
        pl.display_name::text,
        c.before_pts,
        c.carried_pts,
        c.before_pts - c.carried_pts,
        c.carried_pts
    from calc c
    join public.players pl on pl.id = c.pid
    where c.before_pts > 0
    order by c.before_pts desc;
end;
$$;


ALTER FUNCTION "public"."preview_season_closure"("p_season_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."publish_due_news"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    n integer;
begin
    update public.news
    set status = 'published',
        published_at = coalesce(scheduled_at, now())
    where status = 'scheduled'
      and scheduled_at <= now();

    get diagnostics n = row_count;
    return n;
end;
$$;


ALTER FUNCTION "public"."publish_due_news"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."publish_rule_set"("p_rule_set" "uuid", "p_effective_from" "date") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_set public.scoring_rule_sets%rowtype;
    v_prev record;
    v_errors integer;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into v_set from public.scoring_rule_sets where id = p_rule_set for update;
    if not found then
        raise exception 'Versión no encontrada';
    end if;
    if v_set.status <> 'draft' then
        raise exception 'Solo se publican versiones en borrador';
    end if;
    if p_effective_from is null then
        raise exception 'Indica la fecha de entrada en vigor';
    end if;

    select count(*) into v_errors
    from public.validate_rule_set(p_rule_set)
    where severity = 'error';

    if v_errors > 0 then
        raise exception 'La versión tiene errores de validación. Corrígelos antes de publicar.';
    end if;

    for v_prev in
        select id, effective_from
        from public.scoring_rule_sets
        where status = 'published' and id <> p_rule_set
    loop
        if v_prev.effective_from is not null and p_effective_from <= v_prev.effective_from then
            raise exception 'La fecha debe ser posterior a la entrada en vigor de la versión actual';
        end if;

        update public.scoring_rule_sets
        set status = 'archived', effective_to = p_effective_from - 1
        where id = v_prev.id;
    end loop;

    update public.scoring_rule_sets
    set status = 'published', effective_from = p_effective_from
    where id = p_rule_set;

    perform public.log_audit(
        'rules.published', 'scoring_rule_sets', p_rule_set::text,
        jsonb_build_object('status', 'draft'),
        jsonb_build_object('status', 'published', 'effective_from', p_effective_from),
        null
    );

    return p_rule_set;
end;
$$;


ALTER FUNCTION "public"."publish_rule_set"("p_rule_set" "uuid", "p_effective_from" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revert_event_points"("p_event_id" "uuid", "p_reason" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_batch record;
    v_status text;
    t record;
    v_n integer := 0;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Indica un motivo claro para la reversión';
    end if;

    select s.status into v_status
    from public.events e join public.seasons s on s.id = e.season_id
    where e.id = p_event_id;

    if v_status in ('closed', 'archived') then
        raise exception 'La temporada está cerrada: no se pueden revertir sus puntos';
    end if;

    select * into v_batch
    from public.event_point_batches
    where event_id = p_event_id and status = 'active'
    for update;

    if not found then
        raise exception 'La prueba no tiene puntos asignados activos';
    end if;

    for t in
        select * from public.point_transactions
        where event_id = p_event_id
          and transaction_type = 'match_award'
          and metadata->>'batch' = v_batch.id::text
    loop
        insert into public.point_transactions (
            player_id, season_id, event_id, registration_id, scoring_rule_id,
            transaction_type, points, idempotency_key, reverses_transaction_id, reason, metadata, created_by
        )
        values (
            t.player_id, t.season_id, t.event_id, t.registration_id, t.scoring_rule_id,
            'reversal', -t.points, 'reversal:' || t.id, t.id,
            trim(p_reason), jsonb_build_object('batch', v_batch.id), (select auth.uid())
        );
        v_n := v_n + 1;
    end loop;

    update public.event_point_batches
    set status = 'reverted', reverted_at = now(),
        reverted_by = (select auth.uid()), reverted_reason = trim(p_reason)
    where id = v_batch.id;

    perform public.log_audit(
        'event.points_reverted', 'events', p_event_id::text,
        jsonb_build_object('version', v_batch.version),
        jsonb_build_object('movements', v_n), trim(p_reason)
    );

    return v_n;
end;
$$;


ALTER FUNCTION "public"."revert_event_points"("p_event_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revert_match"("p_match_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    m public.matches%rowtype;
    t record;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_reason is null or length(trim(p_reason)) = 0 then
        raise exception 'Indica el motivo de la reversión';
    end if;

    select * into m from public.matches where id = p_match_id for update;
    if not found or m.status <> 'validated' then
        raise exception 'Solo se pueden revertir partidos validados';
    end if;

    for t in
        select * from public.point_transactions
        where match_id = p_match_id and transaction_type = 'match_award'
    loop
        insert into public.point_transactions (
            player_id, season_id, event_id, registration_id, match_id,
            transaction_type, points, idempotency_key, reverses_transaction_id, reason, created_by
        )
        values (
            t.player_id, t.season_id, t.event_id, t.registration_id, p_match_id,
            'reversal', -t.points, 'reversal:' || t.id, t.id, p_reason, (select auth.uid())
        );
    end loop;

    update public.matches
    set status = 'finished_pending_validation',
        winner_registration_id = null,
        validated_at = null,
        validated_by = null
    where id = p_match_id;

    insert into public.match_result_revisions (
        match_id, revision_number, previous_result, new_result, reason, changed_by
    )
    values (
        p_match_id,
        (select coalesce(max(revision_number), 0) + 1 from public.match_result_revisions where match_id = p_match_id),
        jsonb_build_object('status', 'validated', 'winner', m.winner_registration_id),
        jsonb_build_object('status', 'finished_pending_validation'),
        p_reason,
        (select auth.uid())
    );

    perform public.log_audit(
        'match.reverted', 'matches', p_match_id::text,
        jsonb_build_object('status', 'validated'),
        jsonb_build_object('status', 'finished_pending_validation'),
        p_reason
    );
end;
$$;


ALTER FUNCTION "public"."revert_match"("p_match_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_admin_role"("p_user" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_admins integer;
    v_email text;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;
    if p_user = (select auth.uid()) then
        raise exception 'No puedes retirarte tu propio rol de administrador';
    end if;
    if p_reason is null or length(trim(p_reason)) < 5 then
        raise exception 'Indica el motivo para retirar el rol';
    end if;

    select count(*) into v_admins from public.user_roles where role = 'admin';
    if v_admins <= 1 then
        raise exception 'Debe quedar al menos un administrador';
    end if;

    select email::text into v_email from auth.users where id = p_user;

    delete from public.user_roles where user_id = p_user and role = 'admin';
    if not found then
        raise exception 'Ese usuario no es administrador';
    end if;

    perform public.log_audit(
        'admin.revoked', 'user_roles', p_user::text,
        jsonb_build_object('email', v_email), null, trim(p_reason)
    );
end;
$$;


ALTER FUNCTION "public"."revoke_admin_role"("p_user" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_app_setting"("p_key" "text", "p_value" "jsonb", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_old jsonb;
    v_valid boolean;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    if p_key = 'maintenance_mode' then
        v_valid := jsonb_typeof(p_value) = 'boolean';
        if p_reason is null or length(trim(p_reason)) < 5 then
            raise exception 'Indica un motivo para cambiar el modo mantenimiento';
        end if;
    elsif p_key in ('site_name', 'contact_email', 'contact_phone') then
        v_valid := jsonb_typeof(p_value) = 'string' and length(p_value #>> '{}') <= 200;
    else
        raise exception 'Ajuste no permitido: %', p_key;
    end if;

    if not v_valid then
        raise exception 'Valor no válido para %', p_key;
    end if;

    select value into v_old from public.app_settings where key = p_key;

    insert into public.app_settings (key, value, updated_at, updated_by)
    values (p_key, p_value, now(), (select auth.uid()))
    on conflict (key) do update
        set value = excluded.value,
            updated_at = now(),
            updated_by = excluded.updated_by;

    perform public.log_audit(
        'setting.updated', 'app_settings', p_key,
        jsonb_build_object('value', v_old),
        jsonb_build_object('value', p_value),
        p_reason
    );
end;
$$;


ALTER FUNCTION "public"."set_app_setting"("p_key" "text", "p_value" "jsonb", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."stamp_court_assignment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
    if new.court_name is distinct from old.court_name then
        new.court_assigned_at := now();
    end if;
    return new;
end;
$$;


ALTER FUNCTION "public"."stamp_court_assignment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_bracket_advance"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
    if new.status in ('validated', 'walkover')
       and old.status not in ('validated', 'walkover')
       and new.winner_registration_id is not null then
        perform public.bracket_place_winner(new.id);
    elsif old.status = 'validated' and new.status <> 'validated' then
        perform public.bracket_clear_winner(new.id);
    end if;

    return new;
end;
$$;


ALTER FUNCTION "public"."trg_bracket_advance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_match"("p_match_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    m public.matches%rowtype;
    v_sets_a integer;
    v_sets_b integer;
    v_winner uuid;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select * into m from public.matches where id = p_match_id for update;
    if not found then
        raise exception 'Partido no encontrado';
    end if;
    if m.status <> 'finished_pending_validation' then
        raise exception 'Solo se validan partidos finalizados pendientes de validación';
    end if;
    if m.registration_a_id is null or m.registration_b_id is null then
        raise exception 'Faltan las dos parejas';
    end if;

    select
        count(*) filter (where ms.score_a > ms.score_b
            or (ms.score_a = ms.score_b and coalesce(ms.tie_break_a, 0) > coalesce(ms.tie_break_b, 0))),
        count(*) filter (where ms.score_b > ms.score_a
            or (ms.score_a = ms.score_b and coalesce(ms.tie_break_b, 0) > coalesce(ms.tie_break_a, 0)))
    into v_sets_a, v_sets_b
    from public.match_sets ms
    where ms.match_id = p_match_id;

    if v_sets_a = v_sets_b then
        raise exception 'El resultado no tiene un ganador claro';
    end if;

    v_winner := case when v_sets_a > v_sets_b then m.registration_a_id else m.registration_b_id end;

    update public.matches
    set status = 'validated',
        winner_registration_id = v_winner,
        validated_at = now(),
        validated_by = (select auth.uid())
    where id = p_match_id;

    perform public.log_audit(
        'match.validated', 'matches', p_match_id::text,
        jsonb_build_object('status', m.status),
        jsonb_build_object('status', 'validated', 'winner', v_winner),
        null
    );
end;
$$;


ALTER FUNCTION "public"."validate_match"("p_match_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_registration_category"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if not exists (
    select 1
    from public.event_categories ec
    where ec.id = new.event_category_id
      and ec.event_id = new.event_id
  ) then
    raise exception 'La categoría seleccionada no pertenece a esta prueba.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."validate_registration_category"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_rule_set"("p_rule_set" "uuid") RETURNS TABLE("severity" "text", "detail" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
    v_expected integer;
    v_actual integer;
begin
    if not public.is_admin() then
        raise exception 'Acceso no autorizado';
    end if;

    select count(*) into v_expected
    from public.categories c
    cross join public.subgroups s
    cross join (values (1), (2), (3), (5), (9), (17), (33)) as p(x)
    where c.is_active and s.is_active;

    select count(*) into v_actual
    from public.scoring_rules sr
    where sr.rule_set_id = p_rule_set;

    if v_actual < v_expected then
        return query select 'error'::text,
            ('Faltan ' || (v_expected - v_actual) || ' puntuaciones por definir')::text;
    end if;

    if exists (
        select 1 from public.scoring_rules sr
        where sr.rule_set_id = p_rule_set and sr.points < 0
    ) then
        return query select 'error'::text, 'Hay puntuaciones negativas'::text;
    end if;

    -- Una posición peor nunca puede puntuar más que una mejor en la misma categoría y subgrupo
    if exists (
        with ordered as (
            select
                sr.points,
                lead(sr.points) over (
                    partition by sr.category_id, sr.subgroup_id order by sr.placement
                ) as next_points
            from public.scoring_rules sr
            where sr.rule_set_id = p_rule_set
        )
        select 1 from ordered where next_points > points
    ) then
        return query select 'error'::text,
            'Una posición peor puntúa más que una mejor en la misma categoría y subgrupo'::text;
    end if;

    -- Aviso: un subgrupo inferior no debería puntuar más que uno superior
    if exists (
        with x as (
            select sr.category_id, sr.placement, sr.points, sg.display_order as so
            from public.scoring_rules sr
            join public.subgroups sg on sg.id = sr.subgroup_id
            where sr.rule_set_id = p_rule_set
        )
        select 1
        from x a
        join x b on b.category_id = a.category_id and b.placement = a.placement
        where a.so < b.so and b.points > a.points
    ) then
        return query select 'warning'::text,
            'Un subgrupo inferior puntúa más que uno superior en la misma posición'::text;
    end if;
end;
$$;


ALTER FUNCTION "public"."validate_rule_set"("p_rule_set" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "app_settings_key_check" CHECK (("key" ~ '^[a-z_]+$'::"text"))
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" bigint NOT NULL,
    "actor_user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_table" "text" NOT NULL,
    "entity_id" "text",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


ALTER TABLE "public"."audit_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bracket_entries" (
    "registration_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "seed" integer NOT NULL,
    CONSTRAINT "bracket_entries_seed_check" CHECK (("seed" > 0))
);


ALTER TABLE "public"."bracket_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bracket_matches" (
    "match_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "round_no" integer NOT NULL,
    "pos" integer NOT NULL,
    "teams" integer NOT NULL,
    CONSTRAINT "bracket_matches_pos_check" CHECK (("pos" > 0)),
    CONSTRAINT "bracket_matches_round_no_check" CHECK (("round_no" > 0)),
    CONSTRAINT "bracket_matches_teams_check" CHECK (("teams" >= 2))
);


ALTER TABLE "public"."bracket_matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bracket_stages" (
    "stage_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "subgroup_id" "uuid" NOT NULL,
    "size" integer,
    "generated_at" timestamp with time zone
);


ALTER TABLE "public"."bracket_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "display_order" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clubs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "website_url" "text",
    "address" "text",
    "city" "text",
    "is_organizer" boolean DEFAULT false NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."clubs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competition_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."competition_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competition_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "stage_type" "text" DEFAULT 'other'::"text" NOT NULL,
    "stage_order" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "rules_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "competition_stages_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."competition_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "subject" "text",
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "internal_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contact_messages_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'in_progress'::"text", 'answered'::"text", 'closed'::"text", 'spam'::"text"])))
);


ALTER TABLE "public"."contact_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "subgroup_id" "uuid",
    "capacity" integer,
    CONSTRAINT "event_categories_capacity_check" CHECK ((("capacity" IS NULL) OR ("capacity" > 0)))
);


ALTER TABLE "public"."event_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_organizers" (
    "event_id" "uuid" NOT NULL,
    "club_id" "uuid" NOT NULL,
    "organizer_role" "text" DEFAULT 'organizer'::"text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "event_organizers_organizer_role_check" CHECK (("organizer_role" = ANY (ARRAY['main_organizer'::"text", 'organizer'::"text", 'venue'::"text", 'collaborator'::"text"])))
);


ALTER TABLE "public"."event_organizers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_point_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "reverted_at" timestamp with time zone,
    "reverted_by" "uuid",
    "reverted_reason" "text",
    CONSTRAINT "event_point_batches_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'reverted'::"text"]))),
    CONSTRAINT "event_point_batches_version_check" CHECK (("version" > 0))
);


ALTER TABLE "public"."event_point_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_scoring_rules" (
    "event_category_id" "uuid" NOT NULL,
    "rule_set_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by" "uuid"
);


ALTER TABLE "public"."event_scoring_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_sponsors" (
    "event_id" "uuid" NOT NULL,
    "sponsor_id" "uuid" NOT NULL,
    "placement" "text",
    "display_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."event_sponsors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_venues" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "city" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_venues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "event_number" smallint,
    "event_type" "public"."event_type" DEFAULT 'regular'::"public"."event_type" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "venue_id" "uuid",
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "registration_opens_at" timestamp with time zone,
    "registration_closes_at" timestamp with time zone,
    "status" "public"."event_status" DEFAULT 'draft'::"public"."event_status" NOT NULL,
    "registration_capacity" integer,
    "waitlist_enabled" boolean DEFAULT true NOT NULL,
    "prizes_description" "text",
    "practical_information" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "events_check" CHECK ((("ends_at" IS NULL) OR ("starts_at" IS NULL) OR ("ends_at" >= "starts_at"))),
    CONSTRAINT "events_check1" CHECK ((("registration_closes_at" IS NULL) OR ("registration_opens_at" IS NULL) OR ("registration_closes_at" >= "registration_opens_at"))),
    CONSTRAINT "events_check2" CHECK (((("event_type" = 'regular'::"public"."event_type") AND ("event_number" IS NOT NULL)) OR (("event_type" = 'master_final'::"public"."event_type") AND ("event_number" IS NULL)))),
    CONSTRAINT "events_event_number_check" CHECK ((("event_number" IS NULL) OR (("event_number" >= 1) AND ("event_number" <= 6)))),
    CONSTRAINT "events_registration_capacity_check" CHECK ((("registration_capacity" IS NULL) OR ("registration_capacity" > 0)))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."faqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text",
    "question" "text" NOT NULL,
    "answer_markdown" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."faqs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_entries" (
    "id" bigint NOT NULL,
    "group_id" "uuid" NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "seed_number" integer,
    CONSTRAINT "group_entries_seed_number_check" CHECK ((("seed_number" IS NULL) OR ("seed_number" > 0)))
);


ALTER TABLE "public"."group_entries" OWNER TO "postgres";


ALTER TABLE "public"."group_entries" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."group_entries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."incidents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "severity" "text" DEFAULT 'medium'::"text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "resolution_note" "text",
    CONSTRAINT "incidents_check" CHECK ((("status" <> 'resolved'::"text") OR (("resolved_at" IS NOT NULL) AND ("resolution_note" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "resolution_note")) >= 5)))),
    CONSTRAINT "incidents_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text"]))),
    CONSTRAINT "incidents_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text"]))),
    CONSTRAINT "incidents_title_check" CHECK ((("length"("title") >= 5) AND ("length"("title") <= 140)))
);


ALTER TABLE "public"."incidents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_final_qualifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "ranking_position" integer,
    "eligibility_status" "text" DEFAULT 'candidate'::"text" NOT NULL,
    "qualification_reason" "text",
    "confirmed_by" "uuid",
    "confirmed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "master_final_qualifications_eligibility_status_check" CHECK (("eligibility_status" = ANY (ARRAY['candidate'::"text", 'eligible'::"text", 'confirmed'::"text", 'declined'::"text", 'ineligible'::"text", 'waitlist'::"text"])))
);


ALTER TABLE "public"."master_final_qualifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."master_final_results" (
    "registration_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "placement" integer NOT NULL,
    "set_by" "uuid",
    "set_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "master_final_results_placement_check" CHECK (("placement" = ANY (ARRAY[1, 2, 3, 5, 9, 17])))
);


ALTER TABLE "public"."master_final_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."match_result_revisions" (
    "id" bigint NOT NULL,
    "match_id" "uuid" NOT NULL,
    "revision_number" integer NOT NULL,
    "previous_result" "jsonb",
    "new_result" "jsonb" NOT NULL,
    "reason" "text" NOT NULL,
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."match_result_revisions" OWNER TO "postgres";


ALTER TABLE "public"."match_result_revisions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."match_result_revisions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."match_sets" (
    "id" bigint NOT NULL,
    "match_id" "uuid" NOT NULL,
    "set_number" smallint NOT NULL,
    "score_a" smallint NOT NULL,
    "score_b" smallint NOT NULL,
    "tie_break_a" smallint,
    "tie_break_b" smallint,
    "is_super_tiebreak" boolean DEFAULT false NOT NULL,
    CONSTRAINT "match_sets_check" CHECK (((("tie_break_a" IS NULL) AND ("tie_break_b" IS NULL)) OR (("tie_break_a" IS NOT NULL) AND ("tie_break_b" IS NOT NULL) AND ("tie_break_a" >= 0) AND ("tie_break_b" >= 0)))),
    CONSTRAINT "match_sets_score_a_check" CHECK (("score_a" >= 0)),
    CONSTRAINT "match_sets_score_b_check" CHECK (("score_b" >= 0)),
    CONSTRAINT "match_sets_set_number_check" CHECK ((("set_number" >= 1) AND ("set_number" <= 5)))
);


ALTER TABLE "public"."match_sets" OWNER TO "postgres";


ALTER TABLE "public"."match_sets" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."match_sets_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "group_id" "uuid",
    "match_number" "text",
    "round_name" "text",
    "registration_a_id" "uuid",
    "registration_b_id" "uuid",
    "scheduled_at" timestamp with time zone,
    "venue_id" "uuid",
    "court_name" "text",
    "status" "public"."match_status" DEFAULT 'scheduled'::"public"."match_status" NOT NULL,
    "winner_registration_id" "uuid",
    "validated_at" timestamp with time zone,
    "validated_by" "uuid",
    "public_notes" "text",
    "internal_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "match_stage" "public"."match_stage",
    "match_kind" "public"."match_kind" DEFAULT 'oficial'::"public"."match_kind" NOT NULL,
    "subgroup_id" "uuid",
    "court_assigned_at" timestamp with time zone,
    CONSTRAINT "matches_check" CHECK ((("registration_a_id" IS NULL) OR ("registration_b_id" IS NULL) OR ("registration_a_id" <> "registration_b_id"))),
    CONSTRAINT "matches_check1" CHECK ((("winner_registration_id" IS NULL) OR ("winner_registration_id" = "registration_a_id") OR ("winner_registration_id" = "registration_b_id")))
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."news" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "body_markdown" "text" NOT NULL,
    "cover_image_url" "text",
    "status" "public"."content_status" DEFAULT 'draft'::"public"."content_status" NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "event_id" "uuid",
    "published_at" timestamp with time zone,
    "scheduled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid"
);


ALTER TABLE "public"."news" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "notification_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "target_url" "text",
    "deduplication_key" "text",
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pair_members" (
    "id" bigint NOT NULL,
    "pair_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "valid_from" "date" DEFAULT CURRENT_DATE NOT NULL,
    "valid_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pair_members_check" CHECK ((("valid_to" IS NULL) OR ("valid_to" >= "valid_from")))
);


ALTER TABLE "public"."pair_members" OWNER TO "postgres";


ALTER TABLE "public"."pair_members" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."pair_members_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."pairs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "display_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."pairs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_category_history" (
    "id" bigint NOT NULL,
    "player_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "subgroup_id" "uuid",
    "valid_from" "date" NOT NULL,
    "valid_to" "date",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "player_category_history_check" CHECK ((("valid_to" IS NULL) OR ("valid_to" >= "valid_from")))
);


ALTER TABLE "public"."player_category_history" OWNER TO "postgres";


ALTER TABLE "public"."player_category_history" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."player_category_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "player_code" "text",
    "display_name" "text" NOT NULL,
    "public_photo_url" "text",
    "public_bio" "text",
    "public_profile" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "players_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'retired'::"text"])))
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "season_id" "uuid" NOT NULL,
    "points" numeric(10,2) NOT NULL,
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "requested_by" "uuid",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "transaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "point_adjustments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'reversed'::"text"])))
);


ALTER TABLE "public"."point_adjustments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "season_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "registration_id" "uuid",
    "match_id" "uuid",
    "scoring_rule_id" "uuid",
    "transaction_type" "text" NOT NULL,
    "points" numeric(10,2) NOT NULL,
    "idempotency_key" "text",
    "reverses_transaction_id" "uuid",
    "reason" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "point_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['match_award'::"text", 'manual_adjustment'::"text", 'season_carryover'::"text", 'reversal'::"text", 'correction'::"text"])))
);


ALTER TABLE "public"."point_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "bio" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ranking_snapshot_entries" (
    "id" bigint NOT NULL,
    "snapshot_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "position" integer,
    "points" numeric(10,2) DEFAULT 0 NOT NULL,
    "category_id" "uuid",
    "subgroup_id" "uuid",
    "events_played" integer DEFAULT 0 NOT NULL,
    "wins" integer DEFAULT 0 NOT NULL,
    "losses" integer DEFAULT 0 NOT NULL,
    "points_before_close" numeric(10,2),
    "points_carried" numeric(10,2),
    CONSTRAINT "ranking_snapshot_entries_events_played_check" CHECK (("events_played" >= 0)),
    CONSTRAINT "ranking_snapshot_entries_losses_check" CHECK (("losses" >= 0)),
    CONSTRAINT "ranking_snapshot_entries_position_check" CHECK ((("position" IS NULL) OR ("position" > 0))),
    CONSTRAINT "ranking_snapshot_entries_wins_check" CHECK (("wins" >= 0))
);


ALTER TABLE "public"."ranking_snapshot_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ranking_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "snapshot_type" "text" NOT NULL,
    "as_of" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "ranking_snapshots_snapshot_type_check" CHECK (("snapshot_type" = ANY (ARRAY['live'::"text", 'pre_close'::"text", 'post_close'::"text", 'master_final'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."ranking_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "public"."season_status" DEFAULT 'draft'::"public"."season_status" NOT NULL,
    "carryover_percentage" numeric(5,2) DEFAULT 30 NOT NULL,
    "discarded_percentage" numeric(5,2) DEFAULT 70 NOT NULL,
    "rounding_method" "text" DEFAULT 'nearest_integer'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "seasons_carryover_percentage_check" CHECK ((("carryover_percentage" >= (0)::numeric) AND ("carryover_percentage" <= (100)::numeric))),
    CONSTRAINT "seasons_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "seasons_check1" CHECK ((("carryover_percentage" + "discarded_percentage") = (100)::numeric)),
    CONSTRAINT "seasons_discarded_percentage_check" CHECK ((("discarded_percentage" >= (0)::numeric) AND ("discarded_percentage" <= (100)::numeric))),
    CONSTRAINT "seasons_rounding_method_check" CHECK (("rounding_method" = ANY (ARRAY['nearest_integer'::"text", 'floor'::"text", 'ceiling'::"text"])))
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."public_ranking_preview" WITH ("security_barrier"='true') AS
 WITH "current_season" AS (
         SELECT "s"."id"
           FROM "public"."seasons" "s"
          WHERE (("s"."status" = 'active'::"public"."season_status") AND (CURRENT_DATE >= "s"."start_date") AND (("s"."end_date" IS NULL) OR (CURRENT_DATE <= "s"."end_date")))
          ORDER BY "s"."start_date" DESC
         LIMIT 1
        ), "latest_public_snapshot" AS (
         SELECT "rs"."id",
            "rs"."season_id"
           FROM ("public"."ranking_snapshots" "rs"
             JOIN "current_season" "cs" ON (("cs"."id" = "rs"."season_id")))
          WHERE ("rs"."is_public" = true)
          ORDER BY "rs"."as_of" DESC NULLS LAST
         LIMIT 1
        )
 SELECT "rse"."player_id",
    "p"."display_name",
    "rse"."position",
    "rse"."points" AS "total_points",
    COALESCE("rse"."events_played", 0) AS "event_count"
   FROM (("latest_public_snapshot" "snapshot"
     JOIN "public"."ranking_snapshot_entries" "rse" ON (("rse"."snapshot_id" = "snapshot"."id")))
     JOIN "public"."players" "p" ON (("p"."id" = "rse"."player_id")))
  WHERE (("p"."status" = 'active'::"text") AND ("p"."public_profile" = true));


ALTER VIEW "public"."public_ranking_preview" OWNER TO "postgres";


ALTER TABLE "public"."ranking_snapshot_entries" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."ranking_snapshot_entries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."registration_players" (
    "id" bigint NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "player_order" smallint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "registration_players_player_order_check" CHECK (("player_order" = ANY (ARRAY[1, 2])))
);


ALTER TABLE "public"."registration_players" OWNER TO "postgres";


ALTER TABLE "public"."registration_players" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."registration_players_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."registration_results" (
    "registration_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "subgroup_id" "uuid" NOT NULL,
    "placement" integer NOT NULL,
    "set_by" "uuid",
    "set_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "registration_results_placement_check" CHECK (("placement" = ANY (ARRAY[1, 2, 3, 5, 9, 17, 33])))
);


ALTER TABLE "public"."registration_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registration_status_history" (
    "id" bigint NOT NULL,
    "registration_id" "uuid" NOT NULL,
    "old_status" "public"."registration_status",
    "new_status" "public"."registration_status" NOT NULL,
    "notes" "text",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."registration_status_history" OWNER TO "postgres";


ALTER TABLE "public"."registration_status_history" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."registration_status_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "event_category_id" "uuid" NOT NULL,
    "pair_id" "uuid",
    "status" "public"."registration_status" DEFAULT 'pending'::"public"."registration_status" NOT NULL,
    "submitted_by" "uuid",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "cancellation_reason" "text",
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "presented_at" timestamp with time zone,
    "presented_by" "uuid"
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scoring_rule_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "version" "text" NOT NULL,
    "description" "text",
    "status" "public"."content_status" DEFAULT 'draft'::"public"."content_status" NOT NULL,
    "effective_from" "date",
    "effective_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "scoring_rule_sets_check" CHECK ((("effective_to" IS NULL) OR ("effective_from" IS NULL) OR ("effective_to" >= "effective_from")))
);


ALTER TABLE "public"."scoring_rule_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scoring_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_set_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "subgroup_id" "uuid",
    "placement" integer NOT NULL,
    "points" numeric(10,2) NOT NULL,
    CONSTRAINT "scoring_rules_placement_check" CHECK (("placement" > 0)),
    CONSTRAINT "scoring_rules_points_check" CHECK (("points" >= (0)::numeric))
);


ALTER TABLE "public"."scoring_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."season_closure_entries" (
    "id" bigint NOT NULL,
    "closure_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "points_before" numeric(10,2) NOT NULL,
    "points_carried" numeric(10,2) NOT NULL,
    "points_discarded" numeric(10,2) NOT NULL,
    "points_after" numeric(10,2) NOT NULL,
    "calculation" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."season_closure_entries" OWNER TO "postgres";


ALTER TABLE "public"."season_closure_entries" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."season_closure_entries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."season_closures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "season_id" "uuid" NOT NULL,
    "revision_number" integer DEFAULT 1 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "carryover_percentage" numeric(5,2) NOT NULL,
    "discarded_percentage" numeric(5,2) NOT NULL,
    "rounding_method" "text" NOT NULL,
    "pre_close_snapshot_id" "uuid",
    "post_close_snapshot_id" "uuid",
    "supersedes_closure_id" "uuid",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "executed_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "season_closures_carryover_percentage_check" CHECK ((("carryover_percentage" >= (0)::numeric) AND ("carryover_percentage" <= (100)::numeric))),
    CONSTRAINT "season_closures_check" CHECK ((("carryover_percentage" + "discarded_percentage") = (100)::numeric)),
    CONSTRAINT "season_closures_discarded_percentage_check" CHECK ((("discarded_percentage" >= (0)::numeric) AND ("discarded_percentage" <= (100)::numeric))),
    CONSTRAINT "season_closures_revision_number_check" CHECK (("revision_number" > 0)),
    CONSTRAINT "season_closures_rounding_method_check" CHECK (("rounding_method" = ANY (ARRAY['nearest_integer'::"text", 'floor'::"text", 'ceiling'::"text"]))),
    CONSTRAINT "season_closures_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'processing'::"text", 'completed'::"text", 'superseded'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."season_closures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sponsors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "logo_url" "text",
    "website_url" "text",
    "sponsor_type" "text" DEFAULT 'sponsor'::"text" NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sponsors_sponsor_type_check" CHECK (("sponsor_type" = ANY (ARRAY['sponsor'::"text", 'collaborator'::"text", 'organizer'::"text", 'club'::"text"])))
);


ALTER TABLE "public"."sponsors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subgroups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "display_order" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."subgroups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'player'::"public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


ALTER TABLE "public"."user_roles" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bracket_entries"
    ADD CONSTRAINT "bracket_entries_pkey" PRIMARY KEY ("registration_id");



ALTER TABLE ONLY "public"."bracket_entries"
    ADD CONSTRAINT "bracket_entries_stage_id_seed_key" UNIQUE ("stage_id", "seed");



ALTER TABLE ONLY "public"."bracket_matches"
    ADD CONSTRAINT "bracket_matches_pkey" PRIMARY KEY ("match_id");



ALTER TABLE ONLY "public"."bracket_matches"
    ADD CONSTRAINT "bracket_matches_stage_id_round_no_pos_key" UNIQUE ("stage_id", "round_no", "pos");



ALTER TABLE ONLY "public"."bracket_stages"
    ADD CONSTRAINT "bracket_stages_event_id_category_id_subgroup_id_key" UNIQUE ("event_id", "category_id", "subgroup_id");



ALTER TABLE ONLY "public"."bracket_stages"
    ADD CONSTRAINT "bracket_stages_pkey" PRIMARY KEY ("stage_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."competition_groups"
    ADD CONSTRAINT "competition_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."competition_groups"
    ADD CONSTRAINT "competition_groups_stage_id_name_key" UNIQUE ("stage_id", "name");



ALTER TABLE ONLY "public"."competition_stages"
    ADD CONSTRAINT "competition_stages_event_category_id_stage_order_key" UNIQUE ("event_category_id", "stage_order");



ALTER TABLE ONLY "public"."competition_stages"
    ADD CONSTRAINT "competition_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_messages"
    ADD CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_event_id_category_id_subgroup_id_key" UNIQUE ("event_id", "category_id", "subgroup_id");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_organizers"
    ADD CONSTRAINT "event_organizers_pkey" PRIMARY KEY ("event_id", "club_id");



ALTER TABLE ONLY "public"."event_point_batches"
    ADD CONSTRAINT "event_point_batches_event_id_version_key" UNIQUE ("event_id", "version");



ALTER TABLE ONLY "public"."event_point_batches"
    ADD CONSTRAINT "event_point_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_scoring_rules"
    ADD CONSTRAINT "event_scoring_rules_pkey" PRIMARY KEY ("event_category_id");



ALTER TABLE ONLY "public"."event_sponsors"
    ADD CONSTRAINT "event_sponsors_pkey" PRIMARY KEY ("event_id", "sponsor_id");



ALTER TABLE ONLY "public"."event_venues"
    ADD CONSTRAINT "event_venues_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."faqs"
    ADD CONSTRAINT "faqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_entries"
    ADD CONSTRAINT "group_entries_group_id_registration_id_key" UNIQUE ("group_id", "registration_id");



ALTER TABLE ONLY "public"."group_entries"
    ADD CONSTRAINT "group_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_final_qualifications"
    ADD CONSTRAINT "master_final_qualifications_event_id_player_id_key" UNIQUE ("event_id", "player_id");



ALTER TABLE ONLY "public"."master_final_qualifications"
    ADD CONSTRAINT "master_final_qualifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."master_final_results"
    ADD CONSTRAINT "master_final_results_pkey" PRIMARY KEY ("registration_id");



ALTER TABLE ONLY "public"."match_result_revisions"
    ADD CONSTRAINT "match_result_revisions_match_id_revision_number_key" UNIQUE ("match_id", "revision_number");



ALTER TABLE ONLY "public"."match_result_revisions"
    ADD CONSTRAINT "match_result_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_sets"
    ADD CONSTRAINT "match_sets_match_id_set_number_key" UNIQUE ("match_id", "set_number");



ALTER TABLE ONLY "public"."match_sets"
    ADD CONSTRAINT "match_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_stage_id_match_number_key" UNIQUE ("stage_id", "match_number");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_deduplication_key_key" UNIQUE ("user_id", "deduplication_key");



ALTER TABLE ONLY "public"."pair_members"
    ADD CONSTRAINT "pair_members_pair_id_player_id_valid_from_key" UNIQUE ("pair_id", "player_id", "valid_from");



ALTER TABLE ONLY "public"."pair_members"
    ADD CONSTRAINT "pair_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pairs"
    ADD CONSTRAINT "pairs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_category_history"
    ADD CONSTRAINT "player_category_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_player_code_key" UNIQUE ("player_code");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."point_adjustments"
    ADD CONSTRAINT "point_adjustments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_idempotency_key_key" UNIQUE ("idempotency_key");



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ranking_snapshot_entries"
    ADD CONSTRAINT "ranking_snapshot_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ranking_snapshot_entries"
    ADD CONSTRAINT "ranking_snapshot_entries_snapshot_id_player_id_key" UNIQUE ("snapshot_id", "player_id");



ALTER TABLE ONLY "public"."ranking_snapshots"
    ADD CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registration_players"
    ADD CONSTRAINT "registration_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registration_players"
    ADD CONSTRAINT "registration_players_registration_id_player_id_key" UNIQUE ("registration_id", "player_id");



ALTER TABLE ONLY "public"."registration_players"
    ADD CONSTRAINT "registration_players_registration_id_player_order_key" UNIQUE ("registration_id", "player_order");



ALTER TABLE ONLY "public"."registration_results"
    ADD CONSTRAINT "registration_results_pkey" PRIMARY KEY ("registration_id");



ALTER TABLE ONLY "public"."registration_status_history"
    ADD CONSTRAINT "registration_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_rule_sets"
    ADD CONSTRAINT "scoring_rule_sets_name_version_key" UNIQUE ("name", "version");



ALTER TABLE ONLY "public"."scoring_rule_sets"
    ADD CONSTRAINT "scoring_rule_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_rule_set_id_category_id_subgroup_id_placement_key" UNIQUE ("rule_set_id", "category_id", "subgroup_id", "placement");



ALTER TABLE ONLY "public"."season_closure_entries"
    ADD CONSTRAINT "season_closure_entries_closure_id_player_id_key" UNIQUE ("closure_id", "player_id");



ALTER TABLE ONLY "public"."season_closure_entries"
    ADD CONSTRAINT "season_closure_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_closures"
    ADD CONSTRAINT "season_closures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_closures"
    ADD CONSTRAINT "season_closures_season_id_revision_number_key" UNIQUE ("season_id", "revision_number");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."sponsors"
    ADD CONSTRAINT "sponsors_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."sponsors"
    ADD CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sponsors"
    ADD CONSTRAINT "sponsors_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."subgroups"
    ADD CONSTRAINT "subgroups_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."subgroups"
    ADD CONSTRAINT "subgroups_display_order_key" UNIQUE ("display_order");



ALTER TABLE ONLY "public"."subgroups"
    ADD CONSTRAINT "subgroups_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."subgroups"
    ADD CONSTRAINT "subgroups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



CREATE UNIQUE INDEX "event_organizers_one_main" ON "public"."event_organizers" USING "btree" ("event_id") WHERE ("organizer_role" = 'main_organizer'::"text");



CREATE UNIQUE INDEX "event_point_batches_one_active" ON "public"."event_point_batches" USING "btree" ("event_id") WHERE ("status" = 'active'::"text");



CREATE UNIQUE INDEX "events_master_final_unique" ON "public"."events" USING "btree" ("season_id") WHERE ("event_type" = 'master_final'::"public"."event_type");



CREATE UNIQUE INDEX "events_regular_number_unique" ON "public"."events" USING "btree" ("season_id", "event_number") WHERE ("event_type" = 'regular'::"public"."event_type");



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_table", "entity_id", "created_at" DESC);



CREATE INDEX "idx_events_season_status" ON "public"."events" USING "btree" ("season_id", "status");



CREATE INDEX "idx_events_starts_at" ON "public"."events" USING "btree" ("starts_at");



CREATE INDEX "idx_matches_scheduled_at" ON "public"."matches" USING "btree" ("scheduled_at");



CREATE INDEX "idx_matches_stage_status" ON "public"."matches" USING "btree" ("stage_id", "status");



CREATE INDEX "idx_notifications_user_created" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_point_transactions_player_season" ON "public"."point_transactions" USING "btree" ("player_id", "season_id");



CREATE INDEX "idx_ranking_entries_player" ON "public"."ranking_snapshot_entries" USING "btree" ("player_id");



CREATE INDEX "idx_ranking_snapshots_season_date" ON "public"."ranking_snapshots" USING "btree" ("season_id", "as_of" DESC);



CREATE INDEX "idx_registration_players_player" ON "public"."registration_players" USING "btree" ("player_id");



CREATE INDEX "idx_registrations_event_status" ON "public"."registrations" USING "btree" ("event_id", "status");



CREATE INDEX "idx_registrations_submitted_by" ON "public"."registrations" USING "btree" ("submitted_by");



CREATE UNIQUE INDEX "matches_court_slot_unique" ON "public"."matches" USING "btree" ("court_name", "scheduled_at") WHERE (("court_name" IS NOT NULL) AND ("scheduled_at" IS NOT NULL) AND ("status" <> 'cancelled'::"public"."match_status"));



CREATE INDEX "matches_stage_subgroup_idx" ON "public"."matches" USING "btree" ("match_stage", "subgroup_id");



CREATE UNIQUE INDEX "registrations_unique_active_pair" ON "public"."registrations" USING "btree" ("event_id", "event_category_id", "pair_id") WHERE (("pair_id" IS NOT NULL) AND ("status" <> 'cancelled'::"public"."registration_status"));



CREATE OR REPLACE TRIGGER "trg_bracket_advance" AFTER UPDATE OF "status" ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."trg_bracket_advance"();



CREATE OR REPLACE TRIGGER "trg_check_master_registration_player" BEFORE INSERT OR UPDATE OF "player_id" ON "public"."registration_players" FOR EACH ROW EXECUTE FUNCTION "public"."check_master_registration_player"();



CREATE OR REPLACE TRIGGER "trg_check_pinned_news" BEFORE INSERT OR UPDATE ON "public"."news" FOR EACH ROW EXECUTE FUNCTION "public"."check_pinned_news"();



CREATE OR REPLACE TRIGGER "trg_check_set_rules" BEFORE INSERT OR UPDATE ON "public"."match_sets" FOR EACH ROW EXECUTE FUNCTION "public"."check_set_rules"();



CREATE OR REPLACE TRIGGER "trg_events_updated_at" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_guard_scoring_rule_edit" BEFORE INSERT OR DELETE OR UPDATE ON "public"."scoring_rules" FOR EACH ROW EXECUTE FUNCTION "public"."guard_scoring_rule_edit"();



CREATE OR REPLACE TRIGGER "trg_matches_updated_at" BEFORE UPDATE ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_news_updated_at" BEFORE UPDATE ON "public"."news" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_players_updated_at" BEFORE UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_registrations_updated_at" BEFORE UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_seasons_updated_at" BEFORE UPDATE ON "public"."seasons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_stamp_court_assignment" BEFORE UPDATE OF "court_name" ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."stamp_court_assignment"();



CREATE OR REPLACE TRIGGER "trg_validate_registration_category" BEFORE INSERT OR UPDATE OF "event_id", "event_category_id" ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."validate_registration_category"();



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bracket_entries"
    ADD CONSTRAINT "bracket_entries_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bracket_entries"
    ADD CONSTRAINT "bracket_entries_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bracket_matches"
    ADD CONSTRAINT "bracket_matches_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bracket_matches"
    ADD CONSTRAINT "bracket_matches_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bracket_stages"
    ADD CONSTRAINT "bracket_stages_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bracket_stages"
    ADD CONSTRAINT "bracket_stages_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."bracket_stages"
    ADD CONSTRAINT "bracket_stages_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bracket_stages"
    ADD CONSTRAINT "bracket_stages_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "public"."subgroups"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."competition_groups"
    ADD CONSTRAINT "competition_groups_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."competition_stages"
    ADD CONSTRAINT "competition_stages_event_category_id_fkey" FOREIGN KEY ("event_category_id") REFERENCES "public"."event_categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "public"."subgroups"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."event_organizers"
    ADD CONSTRAINT "event_organizers_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."event_organizers"
    ADD CONSTRAINT "event_organizers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_point_batches"
    ADD CONSTRAINT "event_point_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_point_batches"
    ADD CONSTRAINT "event_point_batches_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."event_point_batches"
    ADD CONSTRAINT "event_point_batches_reverted_by_fkey" FOREIGN KEY ("reverted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_scoring_rules"
    ADD CONSTRAINT "event_scoring_rules_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_scoring_rules"
    ADD CONSTRAINT "event_scoring_rules_event_category_id_fkey" FOREIGN KEY ("event_category_id") REFERENCES "public"."event_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_scoring_rules"
    ADD CONSTRAINT "event_scoring_rules_rule_set_id_fkey" FOREIGN KEY ("rule_set_id") REFERENCES "public"."scoring_rule_sets"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."event_sponsors"
    ADD CONSTRAINT "event_sponsors_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_sponsors"
    ADD CONSTRAINT "event_sponsors_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."event_venues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."group_entries"
    ADD CONSTRAINT "group_entries_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."competition_groups"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."group_entries"
    ADD CONSTRAINT "group_entries_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."master_final_qualifications"
    ADD CONSTRAINT "master_final_qualifications_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."master_final_qualifications"
    ADD CONSTRAINT "master_final_qualifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."master_final_qualifications"
    ADD CONSTRAINT "master_final_qualifications_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."master_final_qualifications"
    ADD CONSTRAINT "master_final_qualifications_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."master_final_results"
    ADD CONSTRAINT "master_final_results_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."master_final_results"
    ADD CONSTRAINT "master_final_results_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."master_final_results"
    ADD CONSTRAINT "master_final_results_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."match_result_revisions"
    ADD CONSTRAINT "match_result_revisions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."match_result_revisions"
    ADD CONSTRAINT "match_result_revisions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."match_sets"
    ADD CONSTRAINT "match_sets_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."competition_groups"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_registration_a_id_fkey" FOREIGN KEY ("registration_a_id") REFERENCES "public"."registrations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_registration_b_id_fkey" FOREIGN KEY ("registration_b_id") REFERENCES "public"."registrations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."competition_stages"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "public"."subgroups"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "public"."event_venues"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_winner_registration_id_fkey" FOREIGN KEY ("winner_registration_id") REFERENCES "public"."registrations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."news"
    ADD CONSTRAINT "news_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pair_members"
    ADD CONSTRAINT "pair_members_pair_id_fkey" FOREIGN KEY ("pair_id") REFERENCES "public"."pairs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pair_members"
    ADD CONSTRAINT "pair_members_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."pairs"
    ADD CONSTRAINT "pairs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."player_category_history"
    ADD CONSTRAINT "player_category_history_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."player_category_history"
    ADD CONSTRAINT "player_category_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."player_category_history"
    ADD CONSTRAINT "player_category_history_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."player_category_history"
    ADD CONSTRAINT "player_category_history_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "public"."subgroups"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."point_adjustments"
    ADD CONSTRAINT "point_adjustments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."point_adjustments"
    ADD CONSTRAINT "point_adjustments_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."point_adjustments"
    ADD CONSTRAINT "point_adjustments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."point_adjustments"
    ADD CONSTRAINT "point_adjustments_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."point_adjustments"
    ADD CONSTRAINT "point_adjustments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."point_transactions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_reverses_transaction_id_fkey" FOREIGN KEY ("reverses_transaction_id") REFERENCES "public"."point_transactions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_scoring_rule_id_fkey" FOREIGN KEY ("scoring_rule_id") REFERENCES "public"."scoring_rules"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."point_transactions"
    ADD CONSTRAINT "point_transactions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ranking_snapshot_entries"
    ADD CONSTRAINT "ranking_snapshot_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ranking_snapshot_entries"
    ADD CONSTRAINT "ranking_snapshot_entries_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ranking_snapshot_entries"
    ADD CONSTRAINT "ranking_snapshot_entries_snapshot_id_fkey" FOREIGN KEY ("snapshot_id") REFERENCES "public"."ranking_snapshots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ranking_snapshot_entries"
    ADD CONSTRAINT "ranking_snapshot_entries_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "public"."subgroups"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."ranking_snapshots"
    ADD CONSTRAINT "ranking_snapshots_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ranking_snapshots"
    ADD CONSTRAINT "ranking_snapshots_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registration_players"
    ADD CONSTRAINT "registration_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registration_players"
    ADD CONSTRAINT "registration_players_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_results"
    ADD CONSTRAINT "registration_results_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registration_results"
    ADD CONSTRAINT "registration_results_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registration_results"
    ADD CONSTRAINT "registration_results_set_by_fkey" FOREIGN KEY ("set_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."registration_results"
    ADD CONSTRAINT "registration_results_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "public"."subgroups"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registration_status_history"
    ADD CONSTRAINT "registration_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."registration_status_history"
    ADD CONSTRAINT "registration_status_history_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_event_category_id_fkey" FOREIGN KEY ("event_category_id") REFERENCES "public"."event_categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pair_id_fkey" FOREIGN KEY ("pair_id") REFERENCES "public"."pairs"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_presented_by_fkey" FOREIGN KEY ("presented_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scoring_rule_sets"
    ADD CONSTRAINT "scoring_rule_sets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_rule_set_id_fkey" FOREIGN KEY ("rule_set_id") REFERENCES "public"."scoring_rule_sets"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."scoring_rules"
    ADD CONSTRAINT "scoring_rules_subgroup_id_fkey" FOREIGN KEY ("subgroup_id") REFERENCES "public"."subgroups"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."season_closure_entries"
    ADD CONSTRAINT "season_closure_entries_closure_id_fkey" FOREIGN KEY ("closure_id") REFERENCES "public"."season_closures"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."season_closure_entries"
    ADD CONSTRAINT "season_closure_entries_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."season_closures"
    ADD CONSTRAINT "season_closures_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."season_closures"
    ADD CONSTRAINT "season_closures_post_close_snapshot_id_fkey" FOREIGN KEY ("post_close_snapshot_id") REFERENCES "public"."ranking_snapshots"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."season_closures"
    ADD CONSTRAINT "season_closures_pre_close_snapshot_id_fkey" FOREIGN KEY ("pre_close_snapshot_id") REFERENCES "public"."ranking_snapshots"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."season_closures"
    ADD CONSTRAINT "season_closures_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."season_closures"
    ADD CONSTRAINT "season_closures_supersedes_closure_id_fkey" FOREIGN KEY ("supersedes_closure_id") REFERENCES "public"."season_closures"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "adjustments_admin_all" ON "public"."point_adjustments" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "adjustments_select_own_or_admin" ON "public"."point_adjustments" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."players" "p"
  WHERE (("p"."id" = "point_adjustments"."player_id") AND ("p"."profile_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_settings_admin_all" ON "public"."app_settings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "app_settings_public_select" ON "public"."app_settings" FOR SELECT TO "authenticated", "anon" USING (("key" = ANY (ARRAY['site_name'::"text", 'contact_email'::"text", 'contact_phone'::"text", 'maintenance_mode'::"text"])));



CREATE POLICY "audit_admin_insert" ON "public"."audit_logs" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "audit_admin_select" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bracket_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bracket_entries_admin_all" ON "public"."bracket_entries" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."bracket_matches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bracket_matches_admin_all" ON "public"."bracket_matches" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."bracket_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bracket_stages_admin_all" ON "public"."bracket_stages" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_admin_all" ON "public"."categories" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "categories_public_select" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING ("is_active");



CREATE POLICY "closure_entries_admin_all" ON "public"."season_closure_entries" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "closures_admin_all" ON "public"."season_closures" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."clubs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clubs_admin_all" ON "public"."clubs" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "clubs_public_select" ON "public"."clubs" FOR SELECT TO "authenticated", "anon" USING ("is_published");



ALTER TABLE "public"."competition_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."competition_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contact_admin_delete" ON "public"."contact_messages" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "contact_admin_select" ON "public"."contact_messages" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "contact_admin_update" ON "public"."contact_messages" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."contact_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contact_public_insert" ON "public"."contact_messages" FOR INSERT TO "authenticated", "anon" WITH CHECK ((("status" = 'new'::"text") AND ("internal_notes" IS NULL)));



ALTER TABLE "public"."event_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_categories_admin_all" ON "public"."event_categories" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "event_categories_public_select" ON "public"."event_categories" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_categories"."event_id") AND ("e"."status" = ANY (ARRAY['published'::"public"."event_status", 'registration_open'::"public"."event_status", 'registration_closed'::"public"."event_status", 'in_progress'::"public"."event_status", 'completed'::"public"."event_status", 'postponed'::"public"."event_status"]))))));



ALTER TABLE "public"."event_organizers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_organizers_admin_all" ON "public"."event_organizers" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "event_organizers_public_select" ON "public"."event_organizers" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_organizers"."event_id") AND ("e"."status" = ANY (ARRAY['published'::"public"."event_status", 'registration_open'::"public"."event_status", 'registration_closed'::"public"."event_status", 'in_progress'::"public"."event_status", 'completed'::"public"."event_status", 'postponed'::"public"."event_status"]))))));



ALTER TABLE "public"."event_point_batches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_point_batches_admin_all" ON "public"."event_point_batches" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "event_scoring_admin_all" ON "public"."event_scoring_rules" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."event_scoring_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_sponsors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_sponsors_admin_all" ON "public"."event_sponsors" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "event_sponsors_public_select" ON "public"."event_sponsors" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "event_sponsors"."event_id") AND ("e"."status" = ANY (ARRAY['published'::"public"."event_status", 'registration_open'::"public"."event_status", 'registration_closed'::"public"."event_status", 'in_progress'::"public"."event_status", 'completed'::"public"."event_status", 'postponed'::"public"."event_status"]))))));



ALTER TABLE "public"."event_venues" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events_admin_all" ON "public"."events" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "events_public_select" ON "public"."events" FOR SELECT TO "authenticated", "anon" USING (("status" = ANY (ARRAY['published'::"public"."event_status", 'registration_open'::"public"."event_status", 'registration_closed'::"public"."event_status", 'in_progress'::"public"."event_status", 'completed'::"public"."event_status", 'postponed'::"public"."event_status"])));



ALTER TABLE "public"."faqs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "faqs_admin_all" ON "public"."faqs" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "faqs_public_select" ON "public"."faqs" FOR SELECT TO "authenticated", "anon" USING ("is_published");



ALTER TABLE "public"."group_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "group_entries_admin_all" ON "public"."group_entries" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "groups_admin_all" ON "public"."competition_groups" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."incidents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "incidents_admin_all" ON "public"."incidents" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."master_final_qualifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."master_final_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "master_qualifications_admin_all" ON "public"."master_final_qualifications" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "master_qualifications_public_select" ON "public"."master_final_qualifications" FOR SELECT TO "authenticated", "anon" USING (("eligibility_status" = 'confirmed'::"text"));



CREATE POLICY "master_results_admin_all" ON "public"."master_final_results" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "master_results_public_select" ON "public"."master_final_results" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "master_final_results"."event_id") AND ("e"."status" = 'completed'::"public"."event_status")))));



ALTER TABLE "public"."match_result_revisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_sets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "match_sets_admin_all" ON "public"."match_sets" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "match_sets_public_select" ON "public"."match_sets" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM ((("public"."matches" "m"
     JOIN "public"."competition_stages" "cs" ON (("cs"."id" = "m"."stage_id")))
     JOIN "public"."event_categories" "ec" ON (("ec"."id" = "cs"."event_category_id")))
     JOIN "public"."events" "e" ON (("e"."id" = "ec"."event_id")))
  WHERE (("m"."id" = "match_sets"."match_id") AND ("m"."status" = 'validated'::"public"."match_status") AND ("e"."status" = ANY (ARRAY['published'::"public"."event_status", 'registration_open'::"public"."event_status", 'registration_closed'::"public"."event_status", 'in_progress'::"public"."event_status", 'completed'::"public"."event_status", 'postponed'::"public"."event_status"]))))));



ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "matches_admin_all" ON "public"."matches" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "matches_public_select" ON "public"."matches" FOR SELECT TO "authenticated", "anon" USING ((("status" = 'validated'::"public"."match_status") AND (EXISTS ( SELECT 1
   FROM (("public"."competition_stages" "cs"
     JOIN "public"."event_categories" "ec" ON (("ec"."id" = "cs"."event_category_id")))
     JOIN "public"."events" "e" ON (("e"."id" = "ec"."event_id")))
  WHERE (("cs"."id" = "matches"."stage_id") AND ("e"."status" = ANY (ARRAY['published'::"public"."event_status", 'registration_open'::"public"."event_status", 'registration_closed'::"public"."event_status", 'in_progress'::"public"."event_status", 'completed'::"public"."event_status", 'postponed'::"public"."event_status"])))))));



ALTER TABLE "public"."news" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "news_admin_all" ON "public"."news" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "news_public_select" ON "public"."news" FOR SELECT TO "authenticated", "anon" USING ((("status" = 'published'::"public"."content_status") AND ("published_at" IS NOT NULL) AND ("published_at" <= "now"())));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_admin_all" ON "public"."notifications" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "notifications_select_own" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



CREATE POLICY "notifications_update_own" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."pair_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pairs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_categories_admin_all" ON "public"."player_category_history" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "player_categories_own_select" ON "public"."player_category_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."players" "p"
  WHERE (("p"."id" = "player_category_history"."player_id") AND ("p"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."player_category_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "players_admin_all" ON "public"."players" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "players_public_select" ON "public"."players" FOR SELECT TO "authenticated", "anon" USING (("public_profile" AND ("status" = 'active'::"text")));



CREATE POLICY "players_select_own_or_admin" ON "public"."players" FOR SELECT TO "authenticated" USING ((("profile_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



ALTER TABLE "public"."point_adjustments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "points_admin_all" ON "public"."point_transactions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "points_select_own_or_admin" ON "public"."point_transactions" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."players" "p"
  WHERE (("p"."id" = "point_transactions"."player_id") AND ("p"."profile_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_admin_all" ON "public"."profiles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "ranking_entries_admin_all" ON "public"."ranking_snapshot_entries" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "ranking_entries_public_select" ON "public"."ranking_snapshot_entries" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."ranking_snapshots" "rs"
  WHERE (("rs"."id" = "ranking_snapshot_entries"."snapshot_id") AND "rs"."is_public"))));



ALTER TABLE "public"."ranking_snapshot_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ranking_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ranking_snapshots_admin_all" ON "public"."ranking_snapshots" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "ranking_snapshots_public_select" ON "public"."ranking_snapshots" FOR SELECT TO "authenticated", "anon" USING ("is_public");



CREATE POLICY "registration_history_admin_all" ON "public"."registration_status_history" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."registration_players" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registration_players_admin_all" ON "public"."registration_players" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "registration_players_select_own_or_admin" ON "public"."registration_players" FOR SELECT TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."players" "p"
  WHERE (("p"."id" = "registration_players"."player_id") AND ("p"."profile_id" = ( SELECT "auth"."uid"() AS "uid")))))));



ALTER TABLE "public"."registration_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registration_results_admin_all" ON "public"."registration_results" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "registration_results_own_select" ON "public"."registration_results" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."registration_players" "rp"
     JOIN "public"."players" "p" ON (("p"."id" = "rp"."player_id")))
  WHERE (("rp"."registration_id" = "registration_results"."registration_id") AND ("p"."profile_id" = ( SELECT "auth"."uid"() AS "uid"))))));



ALTER TABLE "public"."registration_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "registrations_admin_all" ON "public"."registrations" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "registrations_select_own_or_admin" ON "public"."registrations" FOR SELECT TO "authenticated" USING ((("submitted_by" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM ("public"."registration_players" "rp"
     JOIN "public"."players" "p" ON (("p"."id" = "rp"."player_id")))
  WHERE (("rp"."registration_id" = "registrations"."id") AND ("p"."profile_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "result_revisions_admin_all" ON "public"."match_result_revisions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "roles_admin_all" ON "public"."user_roles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "roles_select_own" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR "public"."is_admin"()));



ALTER TABLE "public"."scoring_rule_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scoring_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scoring_rules_admin_all" ON "public"."scoring_rules" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "scoring_sets_admin_all" ON "public"."scoring_rule_sets" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "scoring_sets_public_select" ON "public"."scoring_rule_sets" FOR SELECT TO "authenticated", "anon" USING (("status" = 'published'::"public"."content_status"));



ALTER TABLE "public"."season_closure_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."season_closures" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "seasons_admin_all" ON "public"."seasons" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "seasons_public_select" ON "public"."seasons" FOR SELECT TO "authenticated", "anon" USING (("status" = ANY (ARRAY['active'::"public"."season_status", 'closed'::"public"."season_status", 'archived'::"public"."season_status"])));



ALTER TABLE "public"."sponsors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sponsors_admin_all" ON "public"."sponsors" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "sponsors_public_select" ON "public"."sponsors" FOR SELECT TO "authenticated", "anon" USING ("is_published");



CREATE POLICY "stages_admin_all" ON "public"."competition_stages" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."subgroups" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subgroups_admin_all" ON "public"."subgroups" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "subgroups_public_select" ON "public"."subgroups" FOR SELECT TO "authenticated", "anon" USING ("is_active");



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "venues_admin_all" ON "public"."event_venues" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "venues_public_select" ON "public"."event_venues" FOR SELECT TO "authenticated", "anon" USING ("is_active");





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."add_points_adjustment"("p_player_id" "uuid", "p_season_id" "uuid", "p_points" numeric, "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."add_points_adjustment"("p_player_id" "uuid", "p_season_id" "uuid", "p_points" numeric, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_points_adjustment"("p_player_id" "uuid", "p_season_id" "uuid", "p_points" numeric, "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."apply_bracket_results"("p_stage" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."apply_bracket_results"("p_stage" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_bracket_results"("p_stage" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."assign_player_category"("p_player" "uuid", "p_category" "uuid", "p_subgroup" "uuid", "p_valid_from" "date", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."assign_player_category"("p_player" "uuid", "p_category" "uuid", "p_subgroup" "uuid", "p_valid_from" "date", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_player_category"("p_player" "uuid", "p_category" "uuid", "p_subgroup" "uuid", "p_valid_from" "date", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."award_event_points"("p_event_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."award_event_points"("p_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_event_points"("p_event_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."bracket_clear_winner"("p_match" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."bracket_clear_winner"("p_match" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bracket_clear_winner"("p_match" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."bracket_place_winner"("p_match" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."bracket_place_winner"("p_match" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bracket_place_winner"("p_match" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_master_registration_player"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_master_registration_player"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_master_registration_player"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_pinned_news"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_pinned_news"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_pinned_news"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_set_rules"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_set_rules"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_set_rules"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."clone_rule_set"("p_source" "uuid", "p_version" "text", "p_description" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."clone_rule_set"("p_source" "uuid", "p_version" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clone_rule_set"("p_source" "uuid", "p_version" "text", "p_description" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."close_season"("p_season_id" "uuid", "p_next_season_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."close_season"("p_season_id" "uuid", "p_next_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."close_season"("p_season_id" "uuid", "p_next_season_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."closure_discrepancies"("p_season_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."closure_discrepancies"("p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."closure_discrepancies"("p_season_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."compare_rule_sets"("p_a" "uuid", "p_b" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."compare_rule_sets"("p_a" "uuid", "p_b" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."compare_rule_sets"("p_a" "uuid", "p_b" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."compute_master_candidates"("p_event_id" "uuid", "p_places" integer, "p_min_events" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."compute_master_candidates"("p_event_id" "uuid", "p_places" integer, "p_min_events" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."compute_master_candidates"("p_event_id" "uuid", "p_places" integer, "p_min_events" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_ranking_snapshot"("p_season_id" "uuid", "p_type" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_ranking_snapshot"("p_season_id" "uuid", "p_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_ranking_snapshot"("p_season_id" "uuid", "p_type" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."generate_bracket"("p_stage" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."generate_bracket"("p_stage" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_bracket"("p_stage" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_ranking_live"("p_season_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_ranking_live"("p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ranking_live"("p_season_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."grant_admin_role"("p_email" "text", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."grant_admin_role"("p_email" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_admin_role"("p_email" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_scoring_rule_edit"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_scoring_rule_edit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_scoring_rule_edit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("requested_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("requested_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("requested_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_admins"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_admins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_admins"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."list_audit_log"("p_action" "text", "p_table" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer, "p_before" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."list_audit_log"("p_action" "text", "p_table" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer, "p_before" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."list_audit_log"("p_action" "text", "p_table" "text", "p_from" timestamp with time zone, "p_to" timestamp with time zone, "p_limit" integer, "p_before" timestamp with time zone) TO "service_role";



REVOKE ALL ON FUNCTION "public"."log_audit"("p_action" "text", "p_entity_table" "text", "p_entity_id" "text", "p_old" "jsonb", "p_new" "jsonb", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."log_audit"("p_action" "text", "p_entity_table" "text", "p_entity_id" "text", "p_old" "jsonb", "p_new" "jsonb", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_audit"("p_action" "text", "p_entity_table" "text", "p_entity_id" "text", "p_old" "jsonb", "p_new" "jsonb", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."mark_presence"("p_registration" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."mark_presence"("p_registration" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_presence"("p_registration" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."move_category"("p_id" "uuid", "p_direction" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."move_category"("p_id" "uuid", "p_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."move_category"("p_id" "uuid", "p_direction" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."move_subgroup"("p_id" "uuid", "p_direction" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."move_subgroup"("p_id" "uuid", "p_direction" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."move_subgroup"("p_id" "uuid", "p_direction" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."preview_season_closure"("p_season_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."preview_season_closure"("p_season_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."preview_season_closure"("p_season_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."publish_due_news"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."publish_due_news"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."publish_due_news"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."publish_rule_set"("p_rule_set" "uuid", "p_effective_from" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."publish_rule_set"("p_rule_set" "uuid", "p_effective_from" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."publish_rule_set"("p_rule_set" "uuid", "p_effective_from" "date") TO "service_role";



REVOKE ALL ON FUNCTION "public"."revert_event_points"("p_event_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revert_event_points"("p_event_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_event_points"("p_event_id" "uuid", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."revert_match"("p_match_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revert_match"("p_match_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_match"("p_match_id" "uuid", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."revoke_admin_role"("p_user" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."revoke_admin_role"("p_user" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_admin_role"("p_user" "uuid", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."set_app_setting"("p_key" "text", "p_value" "jsonb", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."set_app_setting"("p_key" "text", "p_value" "jsonb", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_app_setting"("p_key" "text", "p_value" "jsonb", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."stamp_court_assignment"() TO "anon";
GRANT ALL ON FUNCTION "public"."stamp_court_assignment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."stamp_court_assignment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_bracket_advance"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_bracket_advance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_bracket_advance"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_match"("p_match_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_match"("p_match_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_match"("p_match_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_registration_category"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_registration_category"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_registration_category"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."validate_rule_set"("p_rule_set" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."validate_rule_set"("p_rule_set" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_rule_set"("p_rule_set" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."audit_logs" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."bracket_entries" TO "anon";
GRANT ALL ON TABLE "public"."bracket_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."bracket_entries" TO "service_role";



GRANT ALL ON TABLE "public"."bracket_matches" TO "anon";
GRANT ALL ON TABLE "public"."bracket_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."bracket_matches" TO "service_role";



GRANT ALL ON TABLE "public"."bracket_stages" TO "anon";
GRANT ALL ON TABLE "public"."bracket_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."bracket_stages" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."clubs" TO "anon";
GRANT ALL ON TABLE "public"."clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."clubs" TO "service_role";



GRANT ALL ON TABLE "public"."competition_groups" TO "anon";
GRANT ALL ON TABLE "public"."competition_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."competition_groups" TO "service_role";



GRANT ALL ON TABLE "public"."competition_stages" TO "anon";
GRANT ALL ON TABLE "public"."competition_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."competition_stages" TO "service_role";



GRANT ALL ON TABLE "public"."contact_messages" TO "anon";
GRANT ALL ON TABLE "public"."contact_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_messages" TO "service_role";



GRANT ALL ON TABLE "public"."event_categories" TO "anon";
GRANT ALL ON TABLE "public"."event_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."event_categories" TO "service_role";



GRANT ALL ON TABLE "public"."event_organizers" TO "anon";
GRANT ALL ON TABLE "public"."event_organizers" TO "authenticated";
GRANT ALL ON TABLE "public"."event_organizers" TO "service_role";



GRANT ALL ON TABLE "public"."event_point_batches" TO "anon";
GRANT ALL ON TABLE "public"."event_point_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."event_point_batches" TO "service_role";



GRANT ALL ON TABLE "public"."event_scoring_rules" TO "anon";
GRANT ALL ON TABLE "public"."event_scoring_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."event_scoring_rules" TO "service_role";



GRANT ALL ON TABLE "public"."event_sponsors" TO "anon";
GRANT ALL ON TABLE "public"."event_sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."event_sponsors" TO "service_role";



GRANT ALL ON TABLE "public"."event_venues" TO "anon";
GRANT ALL ON TABLE "public"."event_venues" TO "authenticated";
GRANT ALL ON TABLE "public"."event_venues" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."faqs" TO "anon";
GRANT ALL ON TABLE "public"."faqs" TO "authenticated";
GRANT ALL ON TABLE "public"."faqs" TO "service_role";



GRANT ALL ON TABLE "public"."group_entries" TO "anon";
GRANT ALL ON TABLE "public"."group_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."group_entries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."group_entries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."group_entries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."incidents" TO "anon";
GRANT ALL ON TABLE "public"."incidents" TO "authenticated";
GRANT ALL ON TABLE "public"."incidents" TO "service_role";



GRANT ALL ON TABLE "public"."master_final_qualifications" TO "anon";
GRANT ALL ON TABLE "public"."master_final_qualifications" TO "authenticated";
GRANT ALL ON TABLE "public"."master_final_qualifications" TO "service_role";



GRANT ALL ON TABLE "public"."master_final_results" TO "anon";
GRANT ALL ON TABLE "public"."master_final_results" TO "authenticated";
GRANT ALL ON TABLE "public"."master_final_results" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."match_result_revisions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."match_result_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."match_result_revisions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."match_result_revisions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."match_result_revisions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."match_sets" TO "anon";
GRANT ALL ON TABLE "public"."match_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."match_sets" TO "service_role";



GRANT ALL ON SEQUENCE "public"."match_sets_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."match_sets_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."news" TO "anon";
GRANT ALL ON TABLE "public"."news" TO "authenticated";
GRANT ALL ON TABLE "public"."news" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT UPDATE("read_at") ON TABLE "public"."notifications" TO "authenticated";



GRANT ALL ON TABLE "public"."pair_members" TO "anon";
GRANT ALL ON TABLE "public"."pair_members" TO "authenticated";
GRANT ALL ON TABLE "public"."pair_members" TO "service_role";



GRANT ALL ON SEQUENCE "public"."pair_members_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."pair_members_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."pairs" TO "anon";
GRANT ALL ON TABLE "public"."pairs" TO "authenticated";
GRANT ALL ON TABLE "public"."pairs" TO "service_role";



GRANT ALL ON TABLE "public"."player_category_history" TO "anon";
GRANT ALL ON TABLE "public"."player_category_history" TO "authenticated";
GRANT ALL ON TABLE "public"."player_category_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_category_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_category_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."point_adjustments" TO "anon";
GRANT ALL ON TABLE "public"."point_adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."point_adjustments" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."point_transactions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."point_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."point_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("display_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("bio") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("is_public") ON TABLE "public"."profiles" TO "authenticated";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."ranking_snapshot_entries" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."ranking_snapshot_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking_snapshot_entries" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."ranking_snapshots" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."ranking_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



GRANT ALL ON TABLE "public"."public_ranking_preview" TO "anon";
GRANT ALL ON TABLE "public"."public_ranking_preview" TO "authenticated";
GRANT ALL ON TABLE "public"."public_ranking_preview" TO "service_role";



GRANT ALL ON SEQUENCE "public"."ranking_snapshot_entries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."ranking_snapshot_entries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."registration_players" TO "anon";
GRANT ALL ON TABLE "public"."registration_players" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_players" TO "service_role";



GRANT ALL ON SEQUENCE "public"."registration_players_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."registration_players_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."registration_results" TO "anon";
GRANT ALL ON TABLE "public"."registration_results" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_results" TO "service_role";



GRANT ALL ON TABLE "public"."registration_status_history" TO "anon";
GRANT ALL ON TABLE "public"."registration_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."registration_status_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."registration_status_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."registration_status_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_rule_sets" TO "anon";
GRANT ALL ON TABLE "public"."scoring_rule_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_rule_sets" TO "service_role";



GRANT ALL ON TABLE "public"."scoring_rules" TO "anon";
GRANT ALL ON TABLE "public"."scoring_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."scoring_rules" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."season_closure_entries" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."season_closure_entries" TO "authenticated";
GRANT ALL ON TABLE "public"."season_closure_entries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."season_closure_entries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."season_closure_entries_id_seq" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."season_closures" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."season_closures" TO "authenticated";
GRANT ALL ON TABLE "public"."season_closures" TO "service_role";



GRANT ALL ON TABLE "public"."sponsors" TO "anon";
GRANT ALL ON TABLE "public"."sponsors" TO "authenticated";
GRANT ALL ON TABLE "public"."sponsors" TO "service_role";



GRANT ALL ON TABLE "public"."subgroups" TO "anon";
GRANT ALL ON TABLE "public"."subgroups" TO "authenticated";
GRANT ALL ON TABLE "public"."subgroups" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_roles" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































