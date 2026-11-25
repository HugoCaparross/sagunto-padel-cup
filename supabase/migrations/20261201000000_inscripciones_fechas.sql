alter table public.pruebas
  add column if not exists inscripciones_abren_at timestamptz,
  add column if not exists inscripciones_cierran_at timestamptz;
