-- Pistas por prueba. Solo añade tabla, validación y permisos; no modifica datos existentes.

create table if not exists public.event_courts (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events(id) on delete cascade,
    name text not null check (length(trim(name)) between 1 and 40),
    position smallint not null default 1 check (position > 0),
    created_at timestamptz not null default now(),
    unique (event_id, name)
);

alter table public.event_courts enable row level security;

drop policy if exists event_courts_admin_all on public.event_courts;
create policy event_courts_admin_all on public.event_courts
for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists event_courts_public_select on public.event_courts;
create policy event_courts_public_select on public.event_courts
for select to anon, authenticated
using (
    exists (
        select 1 from public.events e
        where e.id = event_courts.event_id
          and e.status in ('published', 'registration_open', 'registration_closed',
                           'in_progress', 'completed', 'postponed')
    )
);

grant select on public.event_courts to anon, authenticated;
grant insert, update, delete on public.event_courts to authenticated;

-- Una pista asignada a un partido debe existir en la prueba de ese partido
create or replace function public.check_match_court()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    v_event uuid;
begin
    if new.court_name is null then
        return new;
    end if;

    select ec.event_id into v_event
    from public.competition_stages cs
    join public.event_categories ec on ec.id = cs.event_category_id
    where cs.id = new.stage_id;

    if v_event is null then
        return new;
    end if;

    if not exists (
        select 1 from public.event_courts c
        where c.event_id = v_event and c.name = new.court_name
    ) then
        raise exception 'La pista % no existe en esta prueba', new.court_name;
    end if;

    return new;
end;
$$;

drop trigger if exists trg_check_match_court on public.matches;
create trigger trg_check_match_court
before insert or update of court_name on public.matches
for each row execute function public.check_match_court();