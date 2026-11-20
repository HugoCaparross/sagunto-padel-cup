-- Los puntos se asignan a cada jugador, no a la pareja.
-- Idempotente: se puede ejecutar varias veces sin error.

-- Quita cualquier restricción única que afecte solo a inscripcion_id
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
    where c.conrelid = 'public.puntos_prueba'::regclass
      and c.contype = 'u'
      and array_length(c.conkey, 1) = 1
      and a.attname = 'inscripcion_id'
  loop
    execute format('alter table public.puntos_prueba drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.puntos_prueba
  add column if not exists jugador_id uuid references public.perfiles (id) on delete cascade;

alter table public.puntos_prueba
  alter column jugador_id set not null;

alter table public.puntos_prueba
  drop constraint if exists puntos_prueba_inscripcion_jugador_key;

alter table public.puntos_prueba
  add constraint puntos_prueba_inscripcion_jugador_key
  unique (inscripcion_id, jugador_id);

create index if not exists puntos_prueba_jugador_idx
  on public.puntos_prueba (jugador_id);