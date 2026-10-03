-- Close direct-table write paths that could bypass registration RPCs, and
-- make the owner cancellation policy enforce the same invariants as the admin
-- cancellation flow while keeping payment fields unchanged.

drop policy if exists pairs_self_insert on public.pairs;
drop policy if exists pairs_self_update on public.pairs;
drop policy if exists registrations_self_insert on public.registrations;

-- These RPCs are intentionally authenticated-admin operations. A service
-- role call would fail is_admin() anyway, so do not grant it unnecessarily.
revoke all on function public.admin_cancel_registration(uuid) from service_role;
revoke all on function public.admin_promote_waiting_registration(uuid) from service_role;
revoke all on function public.admin_confirm_registration(uuid) from service_role;
revoke all on function public.admin_move_registration_to_waiting_list(uuid) from service_role;

-- A participant can edit profile fields, but not assign their own category,
-- account state, role, auth identity, or internal onboarding fields.
create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
    if auth.role() = 'service_role' then
        return new;
    end if;

    if new.role is distinct from old.role then
        raise exception 'El cambio de rol requiere una operacion de sistema autorizada.'
            using errcode = '42501';
    end if;

    if public.is_admin() then
        return new;
    end if;

    if new.estado is distinct from old.estado
       or new.categoria_actual_id is distinct from old.categoria_actual_id
       or new.auth_user_id is distinct from old.auth_user_id
       or new.email is distinct from old.email
       or new.fecha_alta is distinct from old.fecha_alta
       or new.onboarding_completado is distinct from old.onboarding_completado
       or new.metadata is distinct from old.metadata then
        raise exception 'Los campos operativos del perfil requieren administracion.'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

create or replace function public.protect_registration_owner_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_tournament_state text;
begin
    if auth.role() = 'service_role' or public.is_admin() then
        return new;
    end if;

    if new.pair_id is distinct from old.pair_id
       or new.tournament_id is distinct from old.tournament_id
       or new.metodo_pago is distinct from old.metodo_pago
       or new.fecha_pago is distinct from old.fecha_pago
       or new.importe is distinct from old.importe
       or new.qr_code is distinct from old.qr_code
       or new.checked_in is distinct from old.checked_in
       or new.checked_in_at is distinct from old.checked_in_at
       or new.categoria_id is distinct from old.categoria_id
       or new.payment_status is distinct from old.payment_status
       or new.notes is distinct from old.notes
       or (new.estado is distinct from old.estado and new.estado <> 'cancelada') then
        raise exception 'Los cambios de pago y operacion de una inscripcion requieren administracion.'
            using errcode = '42501';
    end if;

    if new.estado is distinct from old.estado and new.estado = 'cancelada' then
        if old.checked_in then
            raise exception 'Una inscripcion con check-in no se puede cancelar desde este flujo.'
                using errcode = 'P0001';
        end if;

        select t.estado into v_tournament_state
          from public.tournaments t
         where t.id = old.tournament_id;
        if v_tournament_state is null
           or v_tournament_state not in ('publicado', 'inscripciones_abiertas') then
            raise exception 'La inscripcion no se puede cancelar en el estado actual del torneo.'
                using errcode = 'P0001';
        end if;

        if exists (
            select 1 from public.matches m
             where m.tournament_id = old.tournament_id
               and (m.pair_1_id = old.pair_id or m.pair_2_id = old.pair_id)
        ) then
            raise exception 'La pareja ya tiene partidos y no se puede cancelar desde este flujo.'
                using errcode = 'P0001';
        end if;
    end if;

    return new;
end;
$$;

create or replace function public.sync_cancelled_registration_pair()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
    v_pair public.pairs%rowtype;
    v_category_id uuid;
begin
    if new.estado is distinct from old.estado and new.estado = 'cancelada' then
        select * into v_pair
          from public.pairs p
         where p.id = new.pair_id
         for update;
        if found then
            v_category_id := coalesce(new.categoria_id, v_pair.categoria_id);
            update public.pairs
               set estado = 'incompleta', updated_at = now()
             where id = v_pair.id;
            delete from public.partner_pool pp
             where pp.tournament_id = new.tournament_id
               and pp.categoria_id = v_category_id
               and pp.player_id in (v_pair.player_1_id, v_pair.player_2_id);
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists sync_cancelled_registration_pair on public.registrations;
create trigger sync_cancelled_registration_pair
    after update of estado on public.registrations
    for each row
    execute function public.sync_cancelled_registration_pair();
