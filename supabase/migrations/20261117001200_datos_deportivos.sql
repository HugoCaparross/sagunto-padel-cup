-- Datos deportivos editables por el propio jugador
alter table public.perfiles
  add column datos_deportivos jsonb not null default '{}'::jsonb
    check (jsonb_typeof(datos_deportivos) = 'object');

-- El jugador puede editarlos; no toca rol ni otros campos protegidos
grant update (datos_deportivos) on public.perfiles to authenticated;