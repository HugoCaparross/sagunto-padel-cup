-- A NULL category capacity means unlimited. Existing configured capacities are
-- preserved; only the default for future tournament categories becomes NULL.
alter table public.tournament_categories
    alter column cupo_minimo drop not null,
    alter column cupo_minimo drop default,
    alter column cupo_maximo drop not null,
    alter column cupo_maximo drop default;

alter table public.tournament_categories
    drop constraint if exists tournament_categories_cupos_check;

alter table public.tournament_categories
    add constraint tournament_categories_cupos_check
    check (
        (cupo_minimo is null or cupo_minimo > 0)
        and (
            cupo_maximo is null
            or cupo_minimo is null
            or cupo_maximo >= cupo_minimo
        )
    );

create or replace function public.registrar_pareja(
    p_tournament_id uuid,
    p_categoria_id uuid,
    p_player_1_id uuid,
    p_player_2_id uuid,
    p_talla_camiseta text
)
returns table(pair_id uuid, estado_final text)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_cupo_maximo integer;
    v_confirmadas integer;
    v_estado text;
    v_pair_id uuid;
begin
    if p_player_1_id is null
       or p_player_1_id = p_player_2_id then
        raise exception 'Invalid player selection.' using errcode = '22023';
    end if;

    if auth.role() not in ('service_role', 'postgres')
       and not public.is_admin()
       and public.current_player_id() is distinct from p_player_1_id then
        raise exception 'A player can only register themselves.' using errcode = '42501';
    end if;

    select tc.cupo_maximo
      into v_cupo_maximo
      from public.tournament_categories tc
     where tc.tournament_id = p_tournament_id
       and tc.categoria_id = p_categoria_id
       and tc.enabled = true
     for update;

    if not found then
        raise exception 'Tournament category is not open for registration.' using errcode = 'P0002';
    end if;

    select count(*)
      into v_confirmadas
      from public.pairs p
     where p.tournament_id = p_tournament_id
       and p.categoria_id = p_categoria_id
       and p.estado = 'confirmada';

    if v_cupo_maximo is null or v_confirmadas < v_cupo_maximo then
        v_estado := case when p_player_2_id is not null then 'confirmada' else 'incompleta' end;
    else
        v_estado := 'lista_espera';
    end if;

    insert into public.pairs (tournament_id, categoria_id, player_1_id, player_2_id, estado)
    values (p_tournament_id, p_categoria_id, p_player_1_id, p_player_2_id, v_estado)
    returning id into v_pair_id;

    insert into public.registrations (pair_id, tournament_id, estado, talla_camiseta)
    values (
        v_pair_id,
        p_tournament_id,
        case when v_estado = 'lista_espera' then 'lista_espera' else 'confirmada' end,
        p_talla_camiseta
    );

    return query select v_pair_id, v_estado;
end;
$$;

revoke all on function public.registrar_pareja(uuid, uuid, uuid, uuid, text) from public, anon;
grant execute on function public.registrar_pareja(uuid, uuid, uuid, uuid, text) to authenticated, service_role;
