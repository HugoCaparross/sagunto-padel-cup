-- Fecha en la que el jugador completó el onboarding
alter table public.perfiles
  add column onboarding_completado_at timestamptz;

grant update (onboarding_completado_at) on public.perfiles to authenticated;