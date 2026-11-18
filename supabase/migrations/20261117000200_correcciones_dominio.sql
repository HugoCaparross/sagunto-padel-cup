-- =========================================================
-- CORRECCIONES sobre 20261117000100_dominio_padel.sql
-- =========================================================

-- 1. Las pruebas duran dos días (sábado y domingo)
alter table public.pruebas rename column fecha to fecha_inicio;
alter table public.pruebas add column fecha_fin date;
update public.pruebas set fecha_fin = fecha_inicio where fecha_fin is null;
alter table public.pruebas alter column fecha_fin set not null;
alter table public.pruebas
  add constraint pruebas_fechas_check check (fecha_fin >= fecha_inicio);

-- 2. Rondas reales de la escala de puntos
alter table public.points_scale drop constraint points_scale_ronda_check;
alter table public.points_scale
  add constraint points_scale_ronda_check check (ronda in (
    'campeon', 'subcampeon', 'semifinalista', 'cuartos',
    'octavos', 'dieciseisavos', 'participacion'
  ));