-- Approved Sagunto Padel Cup calendar. Run only in local/staging, after the
-- capacity migrations. No start times or venues are invented here.
begin;

do $$
begin
    if not exists (select 1 from public.categories where nivel_orden = 1 and active) then
        insert into public.categories (nombre, nivel_orden, gender, active)
        values ('1ª', 1, 'mixto', true);
    end if;
    if not exists (select 1 from public.categories where nivel_orden = 2 and active) then
        insert into public.categories (nombre, nivel_orden, gender, active)
        values ('2ª', 2, 'mixto', true);
    end if;
    if not exists (select 1 from public.categories where nivel_orden = 3 and active) then
        insert into public.categories (nombre, nivel_orden, gender, active)
        values ('3ª', 3, 'mixto', true);
    end if;
    if not exists (select 1 from public.categories where nivel_orden = 4 and active) then
        insert into public.categories (nombre, nivel_orden, gender, active)
        values ('4ª / Iniciación', 4, 'mixto', true);
    end if;
end;
$$;

insert into public.seasons (name, slug, start_date, end_date, status, rollover_percentage)
values (
    'Temporada 2026/2027',
    '2026-2027',
    '2026-09-12',
    '2027-12-12',
    'activa',
    30
)
on conflict (slug) do nothing;

with season as (
    select id from public.seasons where slug = '2026-2027'
), official_events(nombre, slug, fecha_inicio, fecha_fin, estado, tournament_type) as (
    values
        ('1ª Prueba', 'prueba-1-2026', date '2026-09-12', date '2026-09-13', 'finalizado', 'regular'),
        ('2ª Prueba', 'prueba-2-2026', date '2026-11-14', date '2026-11-15', 'publicado', 'regular'),
        ('3ª Prueba', 'prueba-3-2027', date '2027-01-23', date '2027-01-24', 'publicado', 'regular'),
        ('4ª Prueba', 'prueba-4-2027', date '2027-03-27', date '2027-03-28', 'publicado', 'regular'),
        ('5ª Prueba', 'prueba-5-2027', date '2027-05-15', date '2027-05-16', 'publicado', 'regular'),
        ('6ª Prueba', 'prueba-6-2027', date '2027-09-11', date '2027-09-12', 'publicado', 'regular'),
        ('Master Final', 'master-final-2027', date '2027-12-11', date '2027-12-12', 'publicado', 'master')
)
insert into public.tournaments (
    nombre,
    slug,
    fecha_inicio,
    fecha_fin,
    estado,
    season_id,
    tournament_type,
    settings
)
select
    event.nombre,
    event.slug,
    event.fecha_inicio,
    event.fecha_fin,
    event.estado,
    season.id,
    event.tournament_type::public.tournament_type,
    jsonb_build_object('calendarSource', 'approved-owner-calendar')
from official_events event
cross join season
on conflict (slug) do nothing;

insert into public.tournament_categories (
    tournament_id,
    categoria_id,
    cupo_minimo,
    cupo_maximo,
    enabled
)
select
    tournament.id,
    category.id,
    null,
    null,
    true
from public.tournaments tournament
join public.seasons season on season.id = tournament.season_id
join public.categories category
  on category.active
 and category.nivel_orden between 1 and 4
where season.slug = '2026-2027'
  and tournament.slug in (
      'prueba-1-2026',
      'prueba-2-2026',
      'prueba-3-2027',
      'prueba-4-2027',
      'prueba-5-2027',
      'prueba-6-2027',
      'master-final-2027'
  )
on conflict (tournament_id, categoria_id) do nothing;

commit;
