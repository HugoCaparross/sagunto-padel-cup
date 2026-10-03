-- PROPUESTA — Migración de revisión para H-03; no aplicar directamente.
-- Basada en el esquema base versionado y en la decisión ya aprobada de usar
-- `archivada` como terminal y rollover del 30 %. Comparar antes con el catálogo
-- remoto y con cualquier migración 20261003000600 ya desplegada.
-- No borra puntos ni snapshots. Falla de forma explícita ante duplicados legacy.

do $preflight$
begin
    if to_regclass('public.seasons') is null
       or to_regclass('public.ranking_points') is null
       or to_regclass('public.ranking_snapshots') is null then
        raise exception 'Preflight H-03: faltan tablas de temporada/ranking del esquema esperado.';
    end if;

    if to_regtype('public.season_status') is null
       or to_regprocedure('public.is_admin()') is null
       or to_regprocedure('public.calculate_rollover_points(numeric)') is null then
        raise exception 'Preflight H-03: falta un tipo/función requerida; comparar primero el baseline remoto.';
    end if;

    if exists (
        select 1
        from (values
            ('seasons', 'name'), ('seasons', 'slug'),
            ('seasons', 'start_date'), ('seasons', 'end_date'),
            ('seasons', 'status'), ('seasons', 'rollover_percentage'),
            ('seasons', 'settings'), ('seasons', 'updated_at'),
            ('ranking_points', 'player_id'), ('ranking_points', 'tournament_id'),
            ('ranking_points', 'categoria_id'), ('ranking_points', 'puntos_obtenidos'),
            ('ranking_points', 'ronda_alcanzada'), ('ranking_points', 'fecha'),
            ('ranking_points', 'season_id'), ('ranking_points', 'source'),
            ('ranking_points', 'metadata'), ('ranking_snapshots', 'player_id'),
            ('ranking_snapshots', 'temporada'), ('ranking_snapshots', 'season_id'),
            ('ranking_snapshots', 'fecha_snapshot'), ('ranking_snapshots', 'posicion'),
            ('ranking_snapshots', 'puntos')
        ) as required(table_name, column_name)
        where not exists (
            select 1 from information_schema.columns c
            where c.table_schema = 'public'
              and c.table_name = required.table_name
              and c.column_name = required.column_name
        )
    ) then
        raise exception 'Preflight H-03: faltan columnas requeridas en el esquema; consultar la lista del preflight.';
    end if;

    if not exists (
        select 1 from pg_type t
        join pg_namespace n on n.oid = t.typnamespace
        join pg_enum e on e.enumtypid = t.oid
        where n.nspname = 'public'
          and t.typname = 'season_status'
          and e.enumlabel = 'archivada'
    ) then
        raise exception 'Preflight H-03: season_status no contiene archivada.';
    end if;

    if exists (
        select 1
        from public.seasons
        where status::text not in ('planificada', 'activa', 'cerrada', 'archivada')
    ) then
        raise exception 'H-03: hay temporadas con estados heredados fuera de la máquina aprobada; reconciliarlas antes de reemplazar las funciones.';
    end if;

    if exists (
        select 1 from public.seasons where status::text = 'cerrada'
    ) then
        raise exception 'H-03: hay temporadas cerradas que requieren snapshot/reconciliación manual antes de establecer archivada como terminal.';
    end if;

    if exists (
        select 1
        from public.ranking_points
        where source = 'rollover'
           or (source = 'season_operation' and metadata ->> 'operation' = 'rollover')
        group by season_id, player_id, categoria_id
        having count(*) > 1
    ) then
        raise exception 'H-03: hay rollovers duplicados; reconciliarlos manualmente antes de crear el índice único.';
    end if;

    if exists (
        select settings ->> 'created_from_season_id'
        from public.seasons
        where settings ? 'created_from_season_id'
        group by settings ->> 'created_from_season_id'
        having count(*) > 1
    ) then
        raise exception 'H-03: varias temporadas derivan del mismo origen; reconciliarlas antes de crear el índice único.';
    end if;

    if exists (
        select 1 from public.ranking_points
        where (source = 'rollover' or source = 'season_operation')
          and season_id is null
    ) then
        raise exception 'H-03: existen puntos de operación sin season_id; reconciliarlos antes de continuar.';
    end if;

    if exists (
        select 1 from public.ranking_points
        where tournament_id is null
          and source not in ('rollover', 'season_operation')
    ) then
        raise exception 'H-03: hay puntos sin torneo cuyo source no es una operación de temporada.';
    end if;

    if exists (
        select 1 from public.ranking_snapshots
        group by player_id, temporada, fecha_snapshot
        having count(*) > 1
    ) then
        raise exception 'H-03: hay snapshots duplicados; reconciliarlos antes de asegurar el índice de idempotencia.';
    end if;
end;
$preflight$;

alter table public.ranking_points
    alter column tournament_id drop not null;

do $constraint$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.ranking_points'::regclass
          and conname = 'ranking_points_tournament_required_unless_season_operation'
    ) then
        alter table public.ranking_points
            add constraint ranking_points_tournament_required_unless_season_operation
            check (
                tournament_id is not null
                or (source in ('rollover', 'season_operation') and season_id is not null)
            );
    end if;
end;
$constraint$;

create unique index if not exists ranking_points_season_rollover_unique
    on public.ranking_points (season_id, player_id, categoria_id)
    where source = 'rollover'
       or (source = 'season_operation' and metadata ->> 'operation' = 'rollover');

create unique index if not exists seasons_created_from_season_unique
    on public.seasons ((settings ->> 'created_from_season_id'))
    where settings ? 'created_from_season_id';

create unique index if not exists ranking_snapshots_player_season_date
    on public.ranking_snapshots (player_id, temporada, fecha_snapshot);

create or replace function public.close_season(p_season_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
    v_season public.seasons%rowtype;
begin
    if not public.is_admin() then
        raise exception 'Solo un administrador puede cerrar una temporada.'
            using errcode = '42501';
    end if;

    select * into v_season
    from public.seasons
    where id = p_season_id
    for update;

    if not found then
        raise exception 'La temporada indicada no existe.' using errcode = 'P0002';
    end if;

    if v_season.status = 'archivada' then
        return;
    end if;

    if v_season.status <> 'activa' then
        raise exception 'Solo se puede cerrar una temporada activa.' using errcode = 'P0001';
    end if;

    insert into public.ranking_snapshots (
        player_id, temporada, season_id, fecha_snapshot, posicion, puntos
    )
    select rp.player_id,
           v_season.name,
           v_season.id,
           current_date,
           row_number() over (
               order by sum(rp.puntos_obtenidos) desc, rp.player_id
           )::integer,
           sum(rp.puntos_obtenidos)::integer
    from public.ranking_points rp
    where rp.season_id = v_season.id
    group by rp.player_id
    on conflict (player_id, temporada, fecha_snapshot)
    do update set
        season_id = excluded.season_id,
        posicion = excluded.posicion,
        puntos = excluded.puntos;

    update public.seasons
    set settings = coalesce(settings, '{}'::jsonb)
            || jsonb_build_object(
                'closed_at', now(),
                'final_ranking_snapshot_date', current_date,
                'rollover_percentage', v_season.rollover_percentage
            ),
        status = 'archivada',
        updated_at = now()
    where id = v_season.id;
end;
$function$;

create or replace function public.create_season_from_previous(
    p_name text,
    p_slug text,
    p_start_date date,
    p_end_date date
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
    v_previous public.seasons%rowtype;
    v_existing public.seasons%rowtype;
    v_new_season_id uuid;
begin
    if not public.is_admin() then
        raise exception 'Solo un administrador puede crear una temporada.'
            using errcode = '42501';
    end if;

    if nullif(trim(p_name), '') is null
       or nullif(trim(p_slug), '') is null
       or p_start_date is null
       or p_end_date is null
       or p_end_date < p_start_date then
        raise exception 'Los datos de la nueva temporada no son válidos.'
            using errcode = '22023';
    end if;

    select * into v_previous
    from public.seasons
    where status = 'archivada'
    order by end_date desc, id desc
    limit 1
    for update;

    if not found then
        raise exception 'No existe una temporada archivada de la que partir.'
            using errcode = 'P0002';
    end if;

    select * into v_existing
    from public.seasons
    where settings ->> 'created_from_season_id' = v_previous.id::text
    for update;

    if found then
        if v_existing.name = trim(p_name)
           and v_existing.slug = lower(trim(p_slug))
           and v_existing.start_date = p_start_date
           and v_existing.end_date = p_end_date then
            return v_existing.id;
        end if;

        raise exception 'Ya existe una temporada derivada de la anterior con otros datos.'
            using errcode = 'P0001';
    end if;

    insert into public.seasons (
        name, slug, start_date, end_date, status, rollover_percentage, settings
    ) values (
        trim(p_name),
        lower(trim(p_slug)),
        p_start_date,
        p_end_date,
        'planificada',
        30.00,
        jsonb_build_object('created_from_season_id', v_previous.id)
    )
    returning id into v_new_season_id;

    insert into public.ranking_points (
        player_id, tournament_id, categoria_id, puntos_obtenidos,
        ronda_alcanzada, fecha, season_id, source, metadata
    )
    select rp.player_id,
           null,
           rp.categoria_id,
           public.calculate_rollover_points(sum(rp.puntos_obtenidos))::integer,
           'rollover',
           p_start_date,
           v_new_season_id,
           'season_operation',
           jsonb_build_object(
               'operation', 'rollover',
               'previous_season_id', v_previous.id,
               'previous_season_name', v_previous.name,
               'rollover_percentage', 30
           )
    from public.ranking_points rp
    where rp.season_id = v_previous.id
    group by rp.player_id, rp.categoria_id
    having sum(rp.puntos_obtenidos) > 0;

    return v_new_season_id;
end;
$function$;

create or replace function public.guard_archived_season_ranking_points()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
    v_season_id uuid;
    v_status public.season_status;
begin
    -- service_role is the trusted maintenance bypass; it is not used by the app.
    if auth.role() = 'service_role' then
        if tg_op = 'DELETE' then return old; end if;
        return new;
    end if;

    if tg_op = 'UPDATE' and new.season_id is distinct from old.season_id then
        raise exception 'No se puede trasladar un apunte entre temporadas.'
            using errcode = '42501';
    end if;

    v_season_id := case when tg_op = 'DELETE' then old.season_id else new.season_id end;
    if v_season_id is null then
        if tg_op = 'DELETE' then return old; end if;
        return new;
    end if;

    select status into v_status
    from public.seasons
    where id = v_season_id
    for update;

    if not found then
        raise exception 'La temporada del apunte no existe.' using errcode = '23503';
    end if;

    if v_status = 'archivada' then
        raise exception 'No se pueden modificar puntos de una temporada archivada.'
            using errcode = '55000';
    end if;

    if tg_op = 'DELETE' then return old; end if;
    return new;
end;
$function$;

drop trigger if exists guard_archived_season_ranking_points on public.ranking_points;
create trigger guard_archived_season_ranking_points
    before insert or update or delete on public.ranking_points
    for each row execute function public.guard_archived_season_ranking_points();

revoke all on function public.close_season(uuid) from public, anon, service_role;
grant execute on function public.close_season(uuid) to authenticated;
revoke all on function public.create_season_from_previous(text, text, date, date)
    from public, anon, service_role;
grant execute on function public.create_season_from_previous(text, text, date, date)
    to authenticated;
