-- =========================================================
-- Partidos de grupo sin cuadro y origen de cada plaza en las llaves
-- Requiere 20261117000100_dominio_padel.sql
-- =========================================================

-- El partido de grupo no pertenece a ningún cuadro todavía
alter table public.partidos drop constraint if exists partidos_cuadro_check;
alter table public.partidos alter column cuadro drop not null;

-- De dónde sale cada plaza: "ganador:<partido_id>", "perdedor:<partido_id>" o vacío si ya está asignada
alter table public.partidos
  add column origen_a text,
  add column origen_b text;

alter table public.partidos
  add constraint partidos_cuadro_fase_coherente check (
    (fase = 'grupo' and cuadro is null)
    or (fase = 'eliminatoria' and cuadro in ('oro', 'plata', 'bronce'))
  );