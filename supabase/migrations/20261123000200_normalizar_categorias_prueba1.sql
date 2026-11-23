-- Normaliza las antiguas categorías de la primera prueba:
-- 2.ª -> 1.ª, 3.ª -> 2.ª, 4.ª -> 3.ª e Iniciación -> 4.ª.
do $$
declare
  prueba_uno uuid;
  tiene_categorias_antiguas boolean;
begin
  select id into prueba_uno
  from public.pruebas
  where slug = 'prueba-1-2026';

  if prueba_uno is null then
    raise exception 'No existe la Prueba 1 (prueba-1-2026) para normalizar sus categorías';
  end if;

  select
    exists (
      select 1 from public.prueba_categorias
      where prueba_id = prueba_uno and categoria = 'segunda'
    )
    and exists (
      select 1 from public.prueba_categorias
      where prueba_id = prueba_uno and categoria = 'tercera'
    )
    and exists (
      select 1 from public.prueba_categorias
      where prueba_id = prueba_uno and categoria = 'cuarta'
    )
    and not exists (
      select 1 from public.prueba_categorias
      where prueba_id = prueba_uno and categoria = 'primera'
    )
  into tiene_categorias_antiguas;

  if tiene_categorias_antiguas then
    if exists (
      select 1 from public.cuadros
      where prueba_id = prueba_uno and categoria = 'primera'
    ) then
      raise exception 'La Prueba 1 ya tiene un cuadro de 1.ª; se requiere revisión antes de renumerar';
    end if;

    alter table public.inscripciones
      drop constraint if exists inscripciones_prueba_id_categoria_fkey;
    alter table public.partidos
      drop constraint if exists partidos_prueba_id_categoria_fkey;

    update public.inscripciones
    set categoria = case categoria
      when 'segunda' then 'primera'
      when 'tercera' then 'segunda'
      when 'cuarta' then 'tercera'
    end
    where prueba_id = prueba_uno
      and categoria in ('segunda', 'tercera', 'cuarta');

    update public.partidos
    set categoria = case categoria
      when 'segunda' then 'primera'
      when 'tercera' then 'segunda'
      when 'cuarta' then 'tercera'
    end
    where prueba_id = prueba_uno
      and categoria in ('segunda', 'tercera', 'cuarta');

    update public.puntos_prueba
    set categoria = case categoria
      when 'segunda' then 'primera'
      when 'tercera' then 'segunda'
      when 'cuarta' then 'tercera'
    end
    where prueba_id = prueba_uno
      and categoria in ('segunda', 'tercera', 'cuarta');

    update public.puntos_prueba puntos
    set puntos = escala.puntos
    from public.points_scale escala
    where puntos.prueba_id = prueba_uno
      and escala.categoria = puntos.categoria
      and escala.cuadro = puntos.cuadro
      and escala.ronda = puntos.ronda;

    alter table public.cuadros
      drop constraint if exists cuadros_categoria_check;

    update public.cuadros
    set categoria = 'migrada_' || categoria
    where prueba_id = prueba_uno
      and categoria in ('segunda', 'tercera', 'cuarta');

    update public.cuadros
    set categoria = case categoria
      when 'migrada_segunda' then 'primera'
      when 'migrada_tercera' then 'segunda'
      when 'migrada_cuarta' then 'tercera'
    end
    where prueba_id = prueba_uno
      and categoria in ('migrada_segunda', 'migrada_tercera', 'migrada_cuarta');

    delete from public.prueba_categorias
    where prueba_id = prueba_uno;

    insert into public.prueba_categorias (prueba_id, categoria)
    values
      (prueba_uno, 'primera'),
      (prueba_uno, 'segunda'),
      (prueba_uno, 'tercera'),
      (prueba_uno, 'cuarta');

    alter table public.cuadros
      add constraint cuadros_categoria_check
      check (categoria in ('primera', 'segunda', 'tercera', 'cuarta'));

    alter table public.inscripciones
      add constraint inscripciones_prueba_id_categoria_fkey
      foreign key (prueba_id, categoria)
      references public.prueba_categorias (prueba_id, categoria);

    alter table public.partidos
      add constraint partidos_prueba_id_categoria_fkey
      foreign key (prueba_id, categoria)
      references public.prueba_categorias (prueba_id, categoria);
  end if;
end
$$;

-- Reemplaza los registros de premios antiguos por la asignación confirmada.
delete from public.premios
where prueba_id = (
  select id from public.pruebas where slug = 'prueba-1-2026'
)
and cuadro = 'oro'
and descripcion in (
  'Campeón: trofeo y comida en Restaurante Torres Torres. Subcampeón: inscripción gratis.',
  'Campeón: trofeo y cena en Paréntesis. Subcampeón: trofeo y desayuno para dos en La Pícara.',
  'Campeón: trofeo y tres sesiones de prueba por persona en Bodymax. Subcampeón: trofeo, paleteros y tarta de queso.',
  'Premio por confirmar.'
);

insert into public.premios (prueba_id, categoria, cuadro, descripcion, revelar_at)
select prueba.id, premio.categoria, 'oro', premio.descripcion, null
from public.pruebas prueba
cross join (
  values
    ('primera', 'Campeón: trofeo y comida en Restaurante Torres Torres. Subcampeón: inscripción gratis.'),
    ('segunda', 'Campeón: trofeo y cena en Paréntesis. Subcampeón: trofeo y desayuno para dos en La Pícara.'),
    ('tercera', 'Campeón: trofeo y tres sesiones de prueba por persona en Bodymax. Subcampeón: trofeo, paleteros y tarta de queso.'),
    ('cuarta', 'Premio por confirmar.')
) as premio(categoria, descripcion)
where prueba.slug = 'prueba-1-2026'
on conflict (prueba_id, categoria, cuadro)
do update set descripcion = excluded.descripcion, revelar_at = null;
