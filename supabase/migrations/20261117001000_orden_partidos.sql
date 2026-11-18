-- Orden visual de los partidos dentro de cada categoría
alter table public.partidos
  add column if not exists orden integer not null default 0;

create index if not exists partidos_orden_idx
  on public.partidos (prueba_id, categoria, orden);