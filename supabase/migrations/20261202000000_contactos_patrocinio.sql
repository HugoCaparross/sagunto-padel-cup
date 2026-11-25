alter table public.contactos
  drop constraint if exists contactos_tipo_check;

alter table public.contactos
  add constraint contactos_tipo_check
  check (tipo in ('consulta', 'sugerencia', 'patrocinio'));
