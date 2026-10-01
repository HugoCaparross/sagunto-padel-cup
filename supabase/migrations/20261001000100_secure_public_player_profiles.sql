-- Restrict public player discovery to explicit profile opt-in and public fields.
-- Apply through the normal reviewed migration process; this file does not run it.

drop policy if exists "lectura publica de perfiles" on public.players;
drop policy if exists "players_public_select" on public.players;

-- A view keeps public directory queries available without granting access to
-- the base table's email, phone, auth ID, role, or internal metadata columns.
create or replace view public.public_player_profiles
with (security_barrier = true)
as
select
    id,
    nombre,
    apellidos,
    case when visibilidad_json ->> 'foto_url' = 'false' then null else foto_url end as foto_url,
    categoria_actual_id,
    mano_dominante,
    pala,
    ciudad,
    case when visibilidad_json ->> 'instagram' = 'false' then null else instagram end as instagram,
    visibilidad_json,
    estado,
    updated_at
from public.players
where estado = 'activo'
  and visibilidad_json ->> 'profile' = 'true';

revoke all on public.players from anon;
grant select on public.public_player_profiles to anon, authenticated;

-- The partner pool is a signed-in feature. Its notes and partner preferences
-- must not be exposed to anonymous visitors by the legacy permissive policy.
drop policy if exists "lectura publica bolsa de pareja" on public.partner_pool;

-- Public tournament pages only need confirmed pairs. The legacy policy named
-- "confirmed" allowed every state because it used USING (true).
drop policy if exists "lectura publica de parejas confirmadas" on public.pairs;
drop policy if exists "pairs_public_confirmed_select" on public.pairs;
create policy "pairs_public_confirmed_select"
    on public.pairs
    for select
    to anon, authenticated
    using (estado = 'confirmada');

-- Players can cancel their own registration or adjust their shirt size, but
-- payment verification, check-in, price and registration ownership stay under
-- administrator control.
create or replace function public.protect_registration_owner_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
        raise exception 'Los cambios de pago y operación de una inscripción requieren administración.'
            using errcode = '42501';
    end if;

    return new;
end;
$$;

drop trigger if exists protect_registration_owner_changes on public.registrations;
create trigger protect_registration_owner_changes
    before update on public.registrations
    for each row
    execute function public.protect_registration_owner_changes();
