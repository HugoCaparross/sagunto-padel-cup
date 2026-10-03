# Propuestas SQL — archivadas mientras la auditoría está en pausa

Estos archivos son borradores de remediación derivados de SQL que el usuario pegó anteriormente y de decisiones ya confirmadas. El schema/migrations fuente no están en el checkout actual. Se guardan fuera de `supabase/migrations` deliberadamente: no son aptos para que el CLI los aplique automáticamente ni se han validado contra el catálogo remoto.

No ejecutar ni promoverlos mientras la auditoría esté en pausa. Si se reanuda, antes de promoverlos a migraciones oficiales:

1. Confirmar que el proyecto objetivo es staging.
2. Comparar tablas, columnas, enum, funciones y policies con `CONSULTAS_DIAGNOSTICO.sql`.
3. Revisar el historial y el contenido aplicado de `20261003000600` y cualquier migración posterior.
4. Ejecutar preflight y pruebas en una copia sintética; guardar resultados.
5. Recién entonces numerar y mover la migración aprobada a `supabase/migrations`.

La auditoría de Supabase está en pausa. `REPARACION_TEMPORADAS.sql` conserva la propuesta H-03; `AUDITORIA_INSCRIPCIONES_ATOMICA.sql` conserva H-06 y debe probarse en staging antes de publicar el refactor de acciones. No hay otras propuestas activas.
# Propuesta de retirada de objetos heredados de galería

`ELIMINAR_OBJETOS_GALERIA.sql` es un borrador local, no ejecutado. Se basa en
el esquema que el propietario pegó en la conversación; no certifica el catálogo
remoto actual.

El esquema conocido incluye `public.gallery_items` (fotos/vídeos asociados a
torneos y etiquetas opcionales de jugadores) y
`public.gallery_upload_access` (tokens de acceso para colaboradores que podían
subir contenido a un torneo). Ambas tablas pueden contener información que
deba conservarse. El borrador aborta si tienen filas, no usa `CASCADE` y sus
`DROP TABLE` retirarán índices, triggers y políticas pertenecientes a esas
tablas. Las claves foráneas de `gallery_items` a torneos/jugadores y la de
`gallery_upload_access` a torneos se eliminan con sus tablas. Un objeto
dependiente no contemplado hará fallar el `DROP` de forma segura.

El trigger de `updated_at` conocido llama a `public.set_updated_at()`, una
función compartida por otras tablas; no debe eliminarse. En el código local ya
no se encontró consumidor de galería, bucket ni endpoint de subida. Los cuerpos
de funciones PL/pgSQL y la configuración remota de Storage pueden contener
referencias no rastreadas como dependencias SQL.

El bucket de Storage conocido por la antigua configuración de la aplicación se
llamaba `gallery`; su existencia remota, contenido y policies no se han
verificado. No borrar filas de `storage.buckets`/`storage.objects` por SQL: eso
puede dejar archivos huérfanos en el backend de objetos. Antes de retirarlo,
confirmar en Supabase Storage que el bucket existe, está vacío, ninguna policy
lo comparte y ningún cliente externo lo utiliza; descargar/conservar cualquier
archivo requerido y eliminarlo desde la interfaz/API de Storage.

No hay evidencia local suficiente para afirmar si existen RPC o endpoints
remotos adicionales. El inventario manual del proyecto remoto es un requisito
previo a aplicar la propuesta. La decisión final sobre conservar o exportar
filas es del propietario; este script no las borra.
