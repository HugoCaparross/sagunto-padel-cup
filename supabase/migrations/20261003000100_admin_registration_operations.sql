-- Transactional administrative cancellation and explicit, manual wait-list
-- promotion. No migration is applied automatically by the application.

create or replace function public.admin_cancel_registration(
    p_registration_id uuid
)
returns table(previous_status text, pair_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_registration public.registrations%rowtype;
    v_pair public.pairs%rowtype;
    v_category_id uuid;
    v_tournament_state text;
begin
    if not public.is_admin() then
        raise exception 'Administrator access required.' using errcode = '42501';
    end if;

    select * into v_registration
      from public.registrations
     where id = p_registration_id
     for update;
    if not found then
        raise exception 'Registration does not exist.' using errcode = 'P0002';
    end if;
    if v_registration.estado = 'cancelada' then
        raise exception 'Registration is already cancelled.' using errcode = 'P0001';
    end if;
    if v_registration.checked_in then
        raise exception 'A checked-in registration cannot be cancelled from this flow.' using errcode = 'P0001';
    end if;

    select * into v_pair
      from public.pairs
     where id = v_registration.pair_id
     for update;
    if not found then
        raise exception 'Registration pair does not exist.' using errcode = 'P0002';
    end if;

    select t.estado into v_tournament_state
      from public.tournaments t
     where t.id = v_registration.tournament_id;
    if v_tournament_state not in ('publicado', 'inscripciones_abiertas') then
        raise exception 'Registration cannot be cancelled after the tournament starts or closes.' using errcode = 'P0001';
    end if;

    if exists (
        select 1 from public.matches m
         where m.tournament_id = v_registration.tournament_id
           and (m.pair_1_id = v_pair.id or m.pair_2_id = v_pair.id)
    ) then
        raise exception 'The pair already has a scheduled match; cancellation is blocked.' using errcode = 'P0001';
    end if;

    v_category_id := coalesce(v_registration.categoria_id, v_pair.categoria_id);
    perform 1 from public.tournament_categories tc
     where tc.tournament_id = v_registration.tournament_id
       and tc.categoria_id = v_category_id
     for update;

    update public.registrations
       set estado = 'cancelada', checked_in = false, checked_in_at = null,
           updated_at = now()
     where id = p_registration_id;

    update public.pairs
       set estado = 'incompleta', updated_at = now()
     where id = v_pair.id;

    delete from public.partner_pool pp
     where pp.tournament_id = v_registration.tournament_id
       and pp.categoria_id = v_category_id
       and pp.player_id in (v_pair.player_1_id, v_pair.player_2_id);

    return query select v_registration.estado, v_pair.id;
end;
$$;

create or replace function public.admin_promote_waiting_registration(
    p_registration_id uuid
)
returns table(previous_status text, pair_id uuid, available_after integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_registration public.registrations%rowtype;
    v_pair public.pairs%rowtype;
    v_category public.tournament_categories%rowtype;
    v_tournament_state text;
    v_occupied integer;
begin
    if not public.is_admin() then
        raise exception 'Administrator access required.' using errcode = '42501';
    end if;

    select * into v_registration
      from public.registrations
     where id = p_registration_id
     for update;
    if not found then
        raise exception 'Registration does not exist.' using errcode = 'P0002';
    end if;
    if v_registration.estado <> 'lista_espera' then
        raise exception 'Registration is not on the waiting list.' using errcode = 'P0001';
    end if;

    select * into v_pair
      from public.pairs
     where id = v_registration.pair_id
     for update;
    if not found or v_pair.player_1_id is null or v_pair.player_2_id is null then
        raise exception 'Only complete pairs can be promoted.' using errcode = 'P0001';
    end if;

    select t.estado into v_tournament_state
      from public.tournaments t
     where t.id = v_registration.tournament_id;
    if v_tournament_state <> 'inscripciones_abiertas' then
        raise exception 'Tournament registrations are not open.' using errcode = 'P0001';
    end if;

    select * into v_category
      from public.tournament_categories tc
     where tc.tournament_id = v_registration.tournament_id
       and tc.categoria_id = coalesce(v_registration.categoria_id, v_pair.categoria_id)
     for update;
    if not found or not v_category.enabled then
        raise exception 'Tournament category is not open for registration.' using errcode = 'P0001';
    end if;

    if exists (
        select 1 from public.matches m
         where m.tournament_id = v_registration.tournament_id
           and m.categoria_id = v_category.categoria_id
    ) then
        raise exception 'The category already has matches; promotion is blocked.' using errcode = 'P0001';
    end if;

    select count(*) into v_occupied
      from public.registrations r
      join public.pairs p on p.id = r.pair_id
     where r.tournament_id = v_registration.tournament_id
       and coalesce(r.categoria_id, p.categoria_id) = v_category.categoria_id
       and r.estado in ('confirmada', 'pendiente_pago')
       and p.estado in ('confirmada', 'pendiente_pago')
       and p.player_1_id is not null
       and p.player_2_id is not null;

    if v_category.cupo_maximo is not null and v_occupied >= v_category.cupo_maximo then
        raise exception 'No seats are currently available in this category.' using errcode = 'P0001';
    end if;

    update public.registrations
       set estado = 'pendiente_pago', updated_at = now()
     where id = p_registration_id;
    update public.pairs
       set estado = 'pendiente_pago', updated_at = now()
     where id = v_pair.id;

    return query select v_registration.estado, v_pair.id,
        case when v_category.cupo_maximo is null then null
             else greatest(v_category.cupo_maximo - v_occupied - 1, 0) end;
end;
$$;

create or replace function public.admin_confirm_registration(
    p_registration_id uuid
)
returns table(previous_status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_registration public.registrations%rowtype;
    v_pair public.pairs%rowtype;
    v_category public.tournament_categories%rowtype;
    v_category_id uuid;
    v_tournament_state text;
begin
    if not public.is_admin() then
        raise exception 'Administrator access required.' using errcode = '42501';
    end if;
    select * into v_registration from public.registrations where id = p_registration_id for update;
    if not found then raise exception 'Registration does not exist.' using errcode = 'P0002'; end if;
    if v_registration.estado <> 'pendiente_pago' then
        raise exception 'Only a payment-pending registration can be confirmed.' using errcode = 'P0001';
    end if;
    if v_registration.payment_status not in ('verificado', 'no_aplicable') then
        raise exception 'Payment must be verified before confirmation.' using errcode = 'P0001';
    end if;
    select t.estado into v_tournament_state from public.tournaments t where t.id = v_registration.tournament_id;
    if v_tournament_state <> 'inscripciones_abiertas' then
        raise exception 'Tournament registrations are not open.' using errcode = 'P0001';
    end if;
    select * into v_pair from public.pairs where id = v_registration.pair_id for update;
    if not found or v_pair.player_1_id is null or v_pair.player_2_id is null then
        raise exception 'A complete pair is required.' using errcode = 'P0001';
    end if;
    v_category_id := coalesce(v_registration.categoria_id, v_pair.categoria_id);
    select * into v_category
      from public.tournament_categories tc
     where tc.tournament_id = v_registration.tournament_id
       and tc.categoria_id = v_category_id
     for update;
    if not found or not v_category.enabled then
        raise exception 'Tournament category is not open for registration.' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.matches m where m.tournament_id = v_registration.tournament_id and m.categoria_id = v_category_id) then
        raise exception 'The category draw already exists; confirmation is blocked.' using errcode = 'P0001';
    end if;
    update public.registrations set estado = 'confirmada', updated_at = now() where id = p_registration_id;
    update public.pairs set estado = 'confirmada', updated_at = now() where id = v_pair.id;
    return query select v_registration.estado;
end;
$$;

create or replace function public.admin_move_registration_to_waiting_list(
    p_registration_id uuid
)
returns table(previous_status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_registration public.registrations%rowtype;
    v_pair public.pairs%rowtype;
    v_tournament_state text;
    v_category_id uuid;
begin
    if not public.is_admin() then
        raise exception 'Administrator access required.' using errcode = '42501';
    end if;
    select * into v_registration from public.registrations where id = p_registration_id for update;
    if not found then raise exception 'Registration does not exist.' using errcode = 'P0002'; end if;
    if v_registration.estado not in ('pendiente_pago', 'confirmada') then
        raise exception 'This registration cannot be moved to the waiting list.' using errcode = 'P0001';
    end if;
    if v_registration.checked_in then raise exception 'A checked-in registration cannot be moved.' using errcode = 'P0001'; end if;
    select * into v_pair from public.pairs where id = v_registration.pair_id for update;
    if not found then raise exception 'Registration pair does not exist.' using errcode = 'P0002'; end if;
    select t.estado into v_tournament_state from public.tournaments t where t.id = v_registration.tournament_id;
    if v_tournament_state <> 'inscripciones_abiertas' then raise exception 'Tournament registrations are not open.' using errcode = 'P0001'; end if;
    v_category_id := coalesce(v_registration.categoria_id, v_pair.categoria_id);
    perform 1 from public.tournament_categories tc where tc.tournament_id = v_registration.tournament_id and tc.categoria_id = v_category_id for update;
    if exists (select 1 from public.matches m where m.tournament_id = v_registration.tournament_id and (m.pair_1_id = v_pair.id or m.pair_2_id = v_pair.id)) then
        raise exception 'The pair already has matches; moving it is blocked.' using errcode = 'P0001';
    end if;
    update public.registrations set estado = 'lista_espera', checked_in = false, checked_in_at = null, updated_at = now() where id = p_registration_id;
    update public.pairs set estado = 'lista_espera', updated_at = now() where id = v_pair.id;
    return query select v_registration.estado;
end;
$$;

revoke all on function public.admin_cancel_registration(uuid) from public, anon;
revoke all on function public.admin_promote_waiting_registration(uuid) from public, anon;
revoke all on function public.admin_confirm_registration(uuid) from public, anon;
revoke all on function public.admin_move_registration_to_waiting_list(uuid) from public, anon;
grant execute on function public.admin_cancel_registration(uuid) to authenticated, service_role;
grant execute on function public.admin_promote_waiting_registration(uuid) to authenticated, service_role;
grant execute on function public.admin_confirm_registration(uuid) to authenticated, service_role;
grant execute on function public.admin_move_registration_to_waiting_list(uuid) to authenticated, service_role;

-- The legacy function had SECURITY DEFINER and was granted to anon. The
-- application no longer calls it; remove that unauthenticated mutation path.
revoke all on function public.cancelar_inscripcion(uuid) from public, anon, authenticated;
grant execute on function public.cancelar_inscripcion(uuid) to service_role;
