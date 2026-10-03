-- PROPUESTA NO EJECUTADA. Revisar y adaptar solo después de inspeccionar el
-- catálogo remoto y confirmar que las tablas no contienen datos necesarios.
-- No contiene cambios de Storage; ver README.md de esta carpeta.

-- Preflight: confirmar que estas relaciones existen y que están vacías.
select 'public.gallery_items' as relation_name, count(*)::bigint as row_count
from public.gallery_items
union all
select 'public.gallery_upload_access', count(*)::bigint
from public.gallery_upload_access;

-- Inventario de dependencias directamente asociadas a las dos tablas.
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('gallery_items', 'gallery_upload_access')
order by tablename, policyname;

select n.nspname as schema_name,
       c.relname as table_name,
       t.tgname as trigger_name,
       pg_get_triggerdef(t.oid, true) as trigger_definition,
       p.oid::regprocedure as trigger_function
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal
  and n.nspname = 'public'
  and c.relname in ('gallery_items', 'gallery_upload_access')
order by c.relname, t.tgname;

-- Dependencias registradas por PostgreSQL que harían fallar DROP RESTRICT.
select dependent_ns.nspname as dependent_schema,
       dependent.relname as dependent_object,
       dependent.relkind as dependent_kind,
       source.relname as referenced_gallery_table,
       pg_describe_object(d.classid, d.objid, d.objsubid) as dependency
from pg_depend d
join pg_class source on source.oid = d.refobjid
join pg_namespace source_ns on source_ns.oid = source.relnamespace
join pg_class dependent on dependent.oid = d.objid
join pg_namespace dependent_ns on dependent_ns.oid = dependent.relnamespace
where source_ns.nspname = 'public'
  and source.relname in ('gallery_items', 'gallery_upload_access')
  and d.deptype <> 'i'
order by source.relname, dependent_ns.nspname, dependent.relname;

-- Revisar todos los resultados anteriores. El bloque aborta si hay datos y
-- nunca usa CASCADE, por lo que las dependencias ajenas impiden la operación.
do $$
declare
    gallery_items_count bigint;
    upload_access_count bigint;
begin
    select count(*) into gallery_items_count from public.gallery_items;
    select count(*) into upload_access_count from public.gallery_upload_access;

    if gallery_items_count <> 0 or upload_access_count <> 0 then
        raise exception 'Limpieza cancelada: gallery_items tiene % filas y gallery_upload_access tiene % filas. Exportar/revisar y obtener aprobación antes de decidir sobre los datos.',
            gallery_items_count, upload_access_count;
    end if;

    drop table public.gallery_upload_access;
    drop table public.gallery_items;
end;
$$;
