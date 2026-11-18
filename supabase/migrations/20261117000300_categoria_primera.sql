-- =========================================================
-- Añade la 1.ª categoría (válida desde la prueba 2)
-- =========================================================

alter table public.prueba_categorias
  drop constraint prueba_categorias_categoria_check;
alter table public.prueba_categorias
  add constraint prueba_categorias_categoria_check
  check (categoria in ('primera', 'segunda', 'tercera', 'cuarta'));

alter table public.points_scale
  drop constraint points_scale_categoria_check;
alter table public.points_scale
  add constraint points_scale_categoria_check
  check (categoria in ('primera', 'segunda', 'tercera', 'cuarta'));