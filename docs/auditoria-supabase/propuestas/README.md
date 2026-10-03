# Propuestas SQL — archivadas mientras la auditoría está en pausa

Estos archivos son borradores de remediación derivados de SQL que el usuario pegó anteriormente y de decisiones ya confirmadas. El schema/migrations fuente no están en el checkout actual. Se guardan fuera de `supabase/migrations` deliberadamente: no son aptos para que el CLI los aplique automáticamente ni se han validado contra el catálogo remoto.

No ejecutar ni promoverlos mientras la auditoría esté en pausa. Si se reanuda, antes de promoverlos a migraciones oficiales:

1. Confirmar que el proyecto objetivo es staging.
2. Comparar tablas, columnas, enum, funciones y policies con `CONSULTAS_DIAGNOSTICO.sql`.
3. Revisar el historial y el contenido aplicado de `20261003000600` y cualquier migración posterior.
4. Ejecutar preflight y pruebas en una copia sintética; guardar resultados.
5. Recién entonces numerar y mover la migración aprobada a `supabase/migrations`.

La auditoría de Supabase está en pausa. `REPARACION_TEMPORADAS.sql` conserva la propuesta H-03; `AUDITORIA_INSCRIPCIONES_ATOMICA.sql` conserva H-06 y debe probarse en staging antes de publicar el refactor de acciones. No hay otras propuestas activas.
