-- =========================================================
-- Estado del cuadro por categoría y marca de desactualización
-- Requiere 20261117000800_partidos_cuadros.sql
-- =========================================================

create table public.cuadros (
  prueba_id     uuid not null references public.pruebas (id) on delete cascade,
  categoria     text not null check (categoria in ('primera', 'segunda', 'tercera', 'cuarta')),
  estado        text not null default 'sin_generar'
                check (estado in ('sin_generar', 'generado', 'desactualizado')),
  participantes uuid[] not null default '{}',   -- ids de inscripción usados en el último sorteo
  generado_at   timestamptz,
  primary key (prueba_id, categoria)
);

alter table public.cuadros enable row level security;

create policy "cuadros: lectura pública"
  on public.cuadros for select to anon, authenticated using (true);

create policy "cuadros: organizador escribe"
  on public.cuadros for all to authenticated
  using ((select public.es_organizador()))
  with check ((select public.es_organizador()));

-- Cualquier cambio en qué parejas participan invalida el cuadro generado.
-- Solo cuentan los cambios de estado de o hacia un estado activo.
create or replace function public.marcar_cuadro_desactualizado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_activa_ahora boolean;
  v_activa_antes boolean;
begin
  v_activa_ahora := new.estado in ('pendiente', 'confirmada', 'pagada_en_prueba');
  v_activa_antes := tg_op = 'UPDATE'
                    and old.estado in ('pendiente', 'confirmada', 'pagada_en_prueba');

  if v_activa_antes = v_activa_ahora then
    return new;
  end if;

  update public.cuadros
  set estado = 'desactualizado'
  where prueba_id = new.prueba_id
    and categoria = new.categoria
    and estado = 'generado';

  return new;
end;
$$;

create trigger inscripciones_cuadro_desactualizado
  after insert or update of estado on public.inscripciones
  for each row execute function public.marcar_cuadro_desactualizado();