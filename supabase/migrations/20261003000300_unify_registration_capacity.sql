-- Keep public registration and manual wait-list promotion on the same seat
-- reservation rule. The category row lock serializes both RPC paths.
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
set search_path = public, pg_temp
as $$
declare
    v_cupo_maximo integer;
    v_ocupadas integer;
    v_estado text;
    v_pair_id uuid;
begin
    if p_player_1_id is null or p_player_1_id = p_player_2_id then
        raise exception 'Invalid player selection.' using errcode = '22023';
    end if;

    if auth.role() not in ('service_role', 'postgres')
       and not public.is_admin()
       and public.current_player_id() is distinct from p_player_1_id then
        raise exception 'A player can only register themselves.' using errcode = '42501';
    end if;

    if not exists (
        select 1 from public.tournaments t
         where t.id = p_tournament_id
           and t.estado = 'inscripciones_abiertas'
    ) then
        raise exception 'Tournament registrations are not open.' using errcode = 'P0001';
    end if;

    select tc.cupo_maximo into v_cupo_maximo
      from public.tournament_categories tc
     where tc.tournament_id = p_tournament_id
       and tc.categoria_id = p_categoria_id
       and tc.enabled = true
     for update;
    if not found then
        raise exception 'Tournament category is not open for registration.' using errcode = 'P0002';
    end if;

    if exists (
        select 1 from public.pairs p
         where p.tournament_id = p_tournament_id
           and p.categoria_id = p_categoria_id
           and p.estado in ('confirmada', 'lista_espera', 'pendiente_pago')
           and (
               p.player_1_id in (p_player_1_id, p_player_2_id)
               or p.player_2_id in (p_player_1_id, p_player_2_id)
           )
    ) then
        raise exception 'A selected player already has an active pair in this category.' using errcode = '23505';
    end if;

    select count(*) into v_ocupadas
      from public.pairs p
      join public.registrations r
        on r.pair_id = p.id
       and r.tournament_id = p_tournament_id
     where p.tournament_id = p_tournament_id
       and p.categoria_id = p_categoria_id
       and p.estado in ('confirmada', 'pendiente_pago')
       and r.estado in ('confirmada', 'pendiente_pago')
       and p.player_1_id is not null
       and p.player_2_id is not null;

    if v_cupo_maximo is null or v_ocupadas < v_cupo_maximo then
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
