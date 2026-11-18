-- Duración propia de un partido. Si es null, se usa la de la prueba según el formato.
alter table public.partidos
  add column if not exists duracion_min integer
    check (duracion_min is null or duracion_min > 0);