-- Modelo de competición: fase, tipo de partido, presencia y reglas de marcador.
-- Solo añade columnas y funciones; no modifica datos existentes.

create type public.match_stage as enum ('grupo', 'semi', 'final');
create type public.match_kind as enum ('oficial', 'walkover', 'exhibicion');

alter table public.matches
    add column if not exists match_stage public.match_stage,
    add column if not exists match_kind public.match_kind not null default 'oficial',
    add column if not exists subgroup_id uuid references public.subgroups(id) on delete restrict,
    add column if not exists court_assigned_at timestamptz;

create index if not exists matches_stage_subgroup_idx
    on public.matches (match_stage, subgroup_id);

alter table public.registrations
    add column if not exists presented_at timestamptz,
    add column if not exists presented_by uuid references auth.users(id) on delete set null;

alter table public.match_sets
    add column if not exists is_super_tiebreak boolean not null default false;

-- Reglas de marcador por fase (Sistema de Juego 2026)
-- Grupos: 1 set a 6 (7-6 con tie-break). Semifinales: 1 set a 9 (9-8 con tie-break).
-- Finales: 2 sets a 6 (7-6 con tie-break) y super tie-break a 10 como tercer set con diferencia mínima de 2.
create or replace function public.check_set_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
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

drop trigger if exists trg_check_set_rules on public.match_sets;
create trigger trg_check_set_rules
before insert or update on public.match_sets
for each row execute function public.check_set_rules();

-- Marca la hora de asignación cuando cambia la pista
create or replace function public.stamp_court_assignment()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.court_name is distinct from old.court_name then
        new.court_assigned_at := now();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_stamp_court_assignment on public.matches;
create trigger trg_stamp_court_assignment
before update of court_name on public.matches
for each row execute function public.stamp_court_assignment();

-- Presentación de una pareja: solo la organización, registrada una vez
create or replace function public.mark_presence(p_registration uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
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

revoke all on function public.mark_presence(uuid) from public, anon;
grant execute on function public.mark_presence(uuid) to authenticated;