-- Premios Oro confirmados para la primera prueba.
do $$
begin
  if not exists (select 1 from public.pruebas where slug = 'prueba-1-2026') then
    raise exception 'No existe la Prueba 1 (prueba-1-2026) para cargar sus premios';
  end if;
end
$$;

insert into public.premios (prueba_id, categoria, cuadro, descripcion, revelar_at)
select prueba.id, premio.categoria, 'oro', premio.descripcion, null
from public.pruebas prueba
cross join (
  values
    ('segunda', 'Campeón: trofeo y comida en Restaurante Torres Torres. Subcampeón: inscripción gratis.'),
    ('tercera', 'Campeón: trofeo y cena en Paréntesis. Subcampeón: trofeo y desayuno para dos en La Pícara.'),
    ('cuarta', 'Campeón: trofeo y tres sesiones de prueba por persona en Bodymax. Subcampeón: trofeo, paleteros y tarta de queso.')
) as premio(categoria, descripcion)
where prueba.slug = 'prueba-1-2026'
on conflict (prueba_id, categoria, cuadro)
do update set descripcion = excluded.descripcion, revelar_at = null;
