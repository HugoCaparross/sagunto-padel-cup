-- Patrocinadores confirmados para las dos primeras pruebas del circuito.
do $$
begin
  if not exists (select 1 from public.pruebas where slug = 'prueba-1-2026') then
    raise exception 'No existe la Prueba 1 (prueba-1-2026) para asociar sus patrocinadores';
  end if;

  if not exists (select 1 from public.pruebas where slug = 'prueba-2-2026') then
    raise exception 'No existe la Prueba 2 (prueba-2-2026) para asociar sus patrocinadores';
  end if;
end
$$;

with datos (nombre, logo_url, tipo) as (
  values
    ('Restaurante Torres Torres', '/images/patrocinadores/restaurante-torres-torres.jpg', 'comercial'),
    ('Talleres Juan Sánchez', '/images/patrocinadores/talleres-sanchez-husqvarna.jpg', 'comercial'),
    ('El Bravero', '/images/patrocinadores/el-bravero.jpg', 'comercial'),
    ('Bodymax', '/images/patrocinadores/body-max.jpg', 'comercial'),
    ('Taller Soledad', '/images/patrocinadores/grupo-soledad-continental.jpg', 'comercial'),
    ('Charter', '/images/patrocinadores/charter.jpg', 'comercial'),
    ('La Pícara', '/images/patrocinadores/la-picara.png', 'comercial'),
    ('Aseport', '/images/patrocinadores/aseport.jpg', 'comercial'),
    ('Quattre', '/images/patrocinadores/quattre.png', 'comercial'),
    ('Peluquería Toni Rodrigo', '/images/patrocinadores/toni-rodrigo.jpg', 'comercial'),
    ('VN Tartes', '/images/patrocinadores/vicente-tartas-de-queso.jpg', 'comercial'),
    ('Samos', '/images/patrocinadores/samos.png', 'comercial'),
    ('Hamburguesería Paréntesis', '/images/patrocinadores/parentesis.jpg', 'comercial'),
    ('Bonrasa Reformas', '/images/patrocinadores/bonrasa.jpg', 'comercial'),
    ('Ayuntamiento de Sagunto', '/images/patrocinadores/activitat-fisica-sagunt.png', 'institucional'),
    ('Concejalía de Deportes Sagunto', '/images/patrocinadores/esport-sagunt.jpg', 'institucional'),
    ('Sport Padel Sagunt', '/images/patrocinadores/sport-padel-sagunt.png', 'comercial'),
    ('TTM', '/images/patrocinadores/ttm.jpg', 'comercial'),
    ('Gasolinera Sendra Solbes', '/images/patrocinadores/sendra.jpg', 'comercial')
)
insert into public.patrocinadores (nombre, logo_url, tipo)
select d.nombre, d.logo_url, d.tipo
from datos d
where not exists (
  select 1
  from public.patrocinadores p
  where lower(p.nombre) = lower(d.nombre)
);

with asociaciones (slug, nombre) as (
  values
    ('prueba-1-2026', 'Restaurante Torres Torres'),
    ('prueba-1-2026', 'Talleres Juan Sánchez'),
    ('prueba-1-2026', 'El Bravero'),
    ('prueba-1-2026', 'Bodymax'),
    ('prueba-1-2026', 'Taller Soledad'),
    ('prueba-1-2026', 'Charter'),
    ('prueba-1-2026', 'La Pícara'),
    ('prueba-1-2026', 'Aseport'),
    ('prueba-1-2026', 'Quattre'),
    ('prueba-1-2026', 'Peluquería Toni Rodrigo'),
    ('prueba-1-2026', 'VN Tartes'),
    ('prueba-1-2026', 'Samos'),
    ('prueba-1-2026', 'Hamburguesería Paréntesis'),
    ('prueba-1-2026', 'Bonrasa Reformas'),
    ('prueba-1-2026', 'Ayuntamiento de Sagunto'),
    ('prueba-1-2026', 'Concejalía de Deportes Sagunto'),
    ('prueba-1-2026', 'Sport Padel Sagunt'),
    ('prueba-1-2026', 'TTM'),
    ('prueba-2-2026', 'Sport Padel Sagunt'),
    ('prueba-2-2026', 'TTM'),
    ('prueba-2-2026', 'Restaurante Torres Torres'),
    ('prueba-2-2026', 'La Pícara'),
    ('prueba-2-2026', 'Quattre'),
    ('prueba-2-2026', 'VN Tartes'),
    ('prueba-2-2026', 'El Bravero'),
    ('prueba-2-2026', 'Gasolinera Sendra Solbes'),
    ('prueba-2-2026', 'Ayuntamiento de Sagunto'),
    ('prueba-2-2026', 'Concejalía de Deportes Sagunto')
)
insert into public.prueba_patrocinadores (prueba_id, patrocinador_id)
select prueba.id, patrocinador.id
from asociaciones a
join public.pruebas prueba on prueba.slug = a.slug
join public.patrocinadores patrocinador
  on lower(patrocinador.nombre) = lower(a.nombre)
on conflict (prueba_id, patrocinador_id) do nothing;

do $$
declare
  prueba_uno uuid;
  prueba_dos uuid;
  patrocinadores_uno integer;
  patrocinadores_dos integer;
begin
  select id into prueba_uno from public.pruebas where slug = 'prueba-1-2026';
  select id into prueba_dos from public.pruebas where slug = 'prueba-2-2026';

  select count(*) into patrocinadores_uno
  from public.prueba_patrocinadores
  where prueba_id = prueba_uno;

  select count(*) into patrocinadores_dos
  from public.prueba_patrocinadores
  where prueba_id = prueba_dos;

  if patrocinadores_uno < 18 or patrocinadores_dos < 10 then
    raise exception 'Asociaciones incompletas: prueba 1 = %, prueba 2 = %',
      patrocinadores_uno, patrocinadores_dos;
  end if;
end
$$;
