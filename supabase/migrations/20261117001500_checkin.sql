-- Código de check-in por inscripción y hora de llegada
alter table public.inscripciones
  add column checkin_token uuid not null default gen_random_uuid() unique,
  add column checkin_at timestamptz;

create index if not exists inscripciones_checkin_at_idx
  on public.inscripciones (prueba_id)
  where checkin_at is not null;