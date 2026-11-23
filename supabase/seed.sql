-- =========================================================
-- SEED: temporada 2026-2027, calendario, categorías y puntos
-- Ejecutar después de todas las migraciones.
-- =========================================================

-- 1. Temporada
insert into public.temporadas (anio, fecha_inicio, fecha_fin, activa)
values ('2026-2027', '2026-09-01', '2027-12-31', true);

-- 2. Pruebas
-- Rellena precio_pareja_centimos en cada fila antes de ejecutar (2500 = 25,00 €).
insert into public.pruebas
  (temporada_id, slug, nombre, fecha_inicio, fecha_fin,
   hora_inicio, hora_fin, sede, precio_pareja_centimos, es_master, estado)
select
  (select id from public.temporadas where anio = '2026-2027'),
  v.slug, v.nombre, v.fecha_inicio, v.fecha_fin,
  '09:00', '13:00', v.sede, v.precio, v.es_master, v.estado
from (values
  ('prueba-1-2026', 'Prueba 1', '2026-09-12'::date, '2026-09-13'::date,
   'Polideportivo René Marigil', 0, false, 'finalizada'),
  ('prueba-2-2026', 'Prueba 2', '2026-11-14'::date, '2026-11-15'::date,
   'Polideportivo René Marigil', 0, false, 'finalizada'),
  ('prueba-3-2027', 'Prueba 3', '2027-01-23'::date, '2027-01-24'::date,
   'Por confirmar', 0, false, 'proxima'),
  ('prueba-4-2027', 'Prueba 4', '2027-03-27'::date, '2027-03-28'::date,
   'Por confirmar', 0, false, 'proxima'),
  ('prueba-5-2027', 'Prueba 5', '2027-05-15'::date, '2027-05-16'::date,
   'Por confirmar', 0, false, 'proxima'),
  ('prueba-6-2027', 'Prueba 6', '2027-09-11'::date, '2027-09-12'::date,
   'Por confirmar', 0, false, 'proxima'),
  ('master-final-2027', 'Máster Final', '2027-12-11'::date, '2027-12-12'::date,
   'Por confirmar', 0, true, 'proxima')
) as v(slug, nombre, fecha_inicio, fecha_fin, sede, precio, es_master, estado);

-- 2.1 Patrocinadores de las pruebas 1 y 2.
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

-- 2.2 Premios Oro de la primera prueba, con categorías normalizadas.
insert into public.premios (prueba_id, categoria, cuadro, descripcion, revelar_at)
select prueba.id, premio.categoria, 'oro', premio.descripcion, null
from public.pruebas prueba
cross join (
  values
    ('primera', 'Campeón: trofeo y comida en Restaurante Torres Torres. Subcampeón: inscripción gratis.'),
    ('segunda', 'Campeón: trofeo y cena en Paréntesis. Subcampeón: trofeo y desayuno para dos en La Pícara.'),
    ('tercera', 'Campeón: trofeo y tres sesiones de prueba por persona en Bodymax. Subcampeón: trofeo, paleteros y tarta de queso.'),
    ('cuarta', 'Premio por confirmar.')
) as premio(categoria, descripcion)
where prueba.slug = 'prueba-1-2026'
on conflict (prueba_id, categoria, cuadro)
do update set descripcion = excluded.descripcion, revelar_at = null;

-- 3. Categorías
-- Prueba 1: las categorías originales se normalizan como 1.ª, 2.ª, 3.ª y 4.ª.
insert into public.prueba_categorias (prueba_id, categoria)
select p.id, c.categoria
from public.pruebas p
cross join (values ('primera'), ('segunda'), ('tercera'), ('cuarta')) as c(categoria)
where p.slug = 'prueba-1-2026'
on conflict (prueba_id, categoria) do nothing;

-- Resto de pruebas: 1.ª, 2.ª, 3.ª y 4.ª
insert into public.prueba_categorias (prueba_id, categoria)
select p.id, c.categoria
from public.pruebas p
cross join (values ('primera'), ('segunda'), ('tercera'), ('cuarta')) as c(categoria)
where p.slug <> 'prueba-1-2026'
on conflict (prueba_id, categoria) do nothing;

-- 4. Escala de puntos (posición por categoría y cuadro)
insert into public.points_scale (categoria, cuadro, ronda, puntos)
select
  v.categoria,
  c.cuadro,
  v.ronda,
  case c.cuadro
    when 'oro'   then v.oro
    when 'plata' then v.plata
    else v.bronce
  end
from (values
  ('campeon',          'primera', 150, 113,  90),
  ('campeon',          'segunda', 125,  94,  75),
  ('campeon',          'tercera', 100,  75,  60),
  ('campeon',          'cuarta',   80,  60,  48),
  ('subcampeon',       'primera', 130,  98,  78),
  ('subcampeon',       'segunda', 108,  81,  65),
  ('subcampeon',       'tercera',  85,  64,  51),
  ('subcampeon',       'cuarta',   68,  51,  41),
  ('semifinalista',    'primera', 115,  86,  69),
  ('semifinalista',    'segunda',  95,  71,  57),
  ('semifinalista',    'tercera',  75,  56,  45),
  ('semifinalista',    'cuarta',   60,  45,  36),
  ('cuartos',          'primera', 100,  75,  60),
  ('cuartos',          'segunda',  85,  64,  51),
  ('cuartos',          'tercera',  65,  49,  39),
  ('cuartos',          'cuarta',   50,  38,  30),
  ('octavos',          'primera',  85,  64,  51),
  ('octavos',          'segunda',  70,  53,  42),
  ('octavos',          'tercera',  55,  41,  33),
  ('octavos',          'cuarta',   40,  30,  24),
  ('dieciseisavos',    'primera',  70,  53,  42),
  ('dieciseisavos',    'segunda',  55,  41,  33),
  ('dieciseisavos',    'tercera',  40,  30,  24),
  ('dieciseisavos',    'cuarta',   30,  23,  18),
  ('participacion',    'primera',  20,  15,  12),
  ('participacion',    'segunda',  18,  14,  11),
  ('participacion',    'tercera',  15,  11,   9),
  ('participacion',    'cuarta',   12,   9,   7)
) as v(ronda, categoria, oro, plata, bronce)
cross join (values ('oro'), ('plata'), ('bronce')) as c(cuadro);