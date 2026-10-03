# Auditoría de Supabase — Sagunto Padel Cup

**Fecha:** 3 de octubre de 2026
**Alcance:** revisión estática del checkout, sus archivos SQL versionados en `HEAD` y la integración Next.js/Supabase. No se accedió a Supabase remoto ni se ejecutaron operaciones de escritura.

**Fase local siguiente (3 de octubre de 2026):** aplicada en la rama `audit/local-security-fixes`. H-01 corregido; helper huérfano H-02 eliminado, sin añadir RPC. Se añadieron pruebas automatizadas. TypeScript, ESLint y build completaron; detalles al final.

## Resumen ejecutivo

Se revisaron las migraciones y el esquema recuperables desde Git, los clientes Supabase, los servicios y acciones de servidor, los callbacks de autenticación y las rutas administrativas. Hay protecciones útiles en el diseño: el cliente de servidor usa la sesión del usuario y la clave pública; las mutaciones críticas de inscripción pasan por RPC administrativas; las políticas de jugador y registro intentan limitar cambios propios; y las operaciones de capacidad bloquean la fila de configuración de categoría.

La auditoría encontró riesgos locales que requieren atención: una redirección externa posible en el callback OAuth, una incompatibilidad entre el trigger de roles y el helper de cambio de rol, y un esquema base de temporadas con estados/columnas incompatibles con sus funciones. Además, hay superficies públicas amplias y diferencias entre el checkout y `HEAD` que impiden atribuir seguridad al entorno remoto.

**Estado remoto: no verificado.** No están disponibles `psql` ni Supabase CLI, Docker no tiene un daemon accesible, y no se pudo identificar de forma segura si la referencia enlazada corresponde a staging o producción. No se usaron credenciales ni se imprimieron valores de entorno. Las seis métricas P0 reportadas previamente por el usuario fueron cero, pero no se volvieron a consultar y no prueban RLS, permisos ni RPC.

## Repositorio y conservación de cambios

Al iniciar la revisión ya existían cambios y eliminaciones en el árbol de trabajo. Se conservaron intactos. Entre las eliminaciones preexistentes figuran `supabase/schema.sql`, las migraciones `20261001000100`–`20261001000200` y `20261003000100`–`20261003000400`, y `supabase/audits/p0_registration_readonly.sql`. Se utilizó el contenido de `HEAD` como evidencia histórica cuando fue necesario; esto no demuestra qué se encuentra desplegado.

No se aplicaron migraciones, no se editó código de aplicación ni configuración, no se conectó al proyecto remoto y no se ejecutaron pruebas contra una base de datos. Los únicos archivos nuevos de esta entrega son los cinco documentos de esta carpeta.

## Arquitectura observada

- `src/lib/supabase/server.ts`: cliente SSR basado en `@supabase/ssr`, URL pública y anon key; las operaciones usan la sesión autenticada.
- `src/lib/supabase/client.ts`: cliente de navegador con anon key. No se encontró uso de service-role key en código de aplicación.
- `src/lib/supabase/proxy.ts` y `src/proxy.ts`: sincronización/renovación de sesión. No reemplazan autorización en páginas, acciones o RLS.
- `src/lib/services/admin.ts`: `requireAdminContext()` valida usuario y perfil con rol `admin`; los helpers administrativos lo invocan.
- `src/app/(admin)/admin/inscripciones/actions.ts` y `src/lib/services/registrations.ts`: operaciones administrativas llaman RPC de cancelación, promoción, confirmación o lista de espera. El registro de auditoría se escribe después, en una operación separada.
- `src/app/auth/callback/route.ts` y `src/lib/auth/flow.ts`: intercambio OAuth y selección de destino posterior.
- `src/lib/services/seasons.ts`: contiene creación/actualización de temporada y una vista previa de rollover, pero no una integración completa de cierre/rollover.
- No se encontró endpoint API de negocio. Hay callbacks de Auth. Los servicios usan PostgREST/RPC; no se encontró SQL dinámico en la aplicación.
- `src/lib/supabase/client.ts` expone helpers para buckets `gallery` y `public`, pero no se encontró un flujo real de subida. No hay configuración de Storage versionada suficiente para auditar buckets/policies remotos.

## Esquema y RLS recuperables desde HEAD

El `supabase/schema.sql` versionado define 24 tablas públicas y habilita RLS en todas. RLS no está forzado. Esto no implica por sí solo bypass para `anon` o `authenticated`; los roles privilegiados, dueños de tabla y `service_role` requieren evaluación separada. El dump concede amplios privilegios de tabla a `anon`, `authenticated` y `service_role`, además de privilegios por defecto amplios. La decisión efectiva depende también de RLS, grants heredados, ownership y configuración remota.

El esquema base define lecturas públicas amplias para datos deportivos, parejas, perfiles, galería, patrocinadores y rankings. La migración `20261001000100_secure_public_player_profiles.sql` endurece perfiles/parejas/bolsa de parejas; no elimina la lectura pública base de `gallery_items`, que incluye filas no publicadas si la migración no añade otro control. `getPublicGallery()` añade un filtro de publicación en la consulta de la aplicación, pero ese filtro no protege acceso directo a la API.

La vista `public_player_profiles` pretende exponer perfiles con opt-in y columnas seleccionadas. Debe verificarse en remoto su definición, privilegios, opciones de seguridad y columnas; no se asumió que una vista garantice por sí sola seguridad de columnas/RLS en todas las configuraciones.

Las políticas PostgreSQL permisivas se combinan por OR dentro de su ámbito; una política amplia puede neutralizar el efecto esperado de otra restrictiva. Por eso se requiere inspeccionar el catálogo remoto y probar como `anon`, usuario y admin.

## Inscripciones, pagos y concurrencia

Las migraciones recuperables muestran RPC `SECURITY DEFINER` con `search_path` fijado y validación administrativa para las operaciones administrativas de inscripción. La inscripción de pareja bloquea la configuración de cupo de la categoría antes de contar y escribir, lo que serializa altas que usen esa RPC. La migración P0 posterior modifica privilegios y estados, pero el estado del checkout tiene esas migraciones eliminadas, así que no se puede confirmar cuál definición aplica.

La RPC `registrar_pareja` debe probarse con dos sesiones concurrentes y con identidades distintas. La lógica consultada comprueba al solicitante principal y duplicados en torneo/categoría, pero no demuestra consentimiento del segundo jugador ni aplica atómicamente una regla de exclusividad entre categorías. Esto es una cuestión de integridad/regla de negocio y requiere validar el flujo aprobado.

Los estados iniciales creados por la RPC y las precondiciones de confirmación administrativa deben probarse conjuntamente: el esquema base crea inscripción confirmada con pago pendiente, mientras que `admin_confirm_registration` espera estado pendiente de pago. Las migraciones posteriores podrían haber cambiado esa transición; remoto pendiente.

Las relaciones FK no garantizan por sí mismas que el torneo y categoría de una inscripción coincidan con la pareja, ni que el torneo/categoría de un partido coincidan con sus parejas. Hay validaciones de aplicación/RPC, pero faltan invariantes relacionales compuestas en el esquema consultado.

## Temporadas y ranking

En el esquema base recuperado desde `HEAD`, `season_status` contiene `planificada`, `activa`, `cerrada`, `archivada`; las funciones `close_season` y `create_season_from_previous` usan `finalizada`. Asimismo, el `ranking_points.tournament_id` base es `NOT NULL`, aunque el rollover intenta insertar `NULL`. Esas operaciones no son compatibles con el esquema base. El helper `calculate_rollover_points` aplica 30 % y redondeo; la aplicación define retención 30/70, pero no se verificó en una base real.

El usuario aprobó `archivada` como estado terminal y permitió elegir el tratamiento adecuado del rollover; no se interpretó eso como autorización para cambiar una base. En el checkout actual no están las migraciones anteriores mencionadas en el historial de trabajo, incluyendo la reparación de temporadas, por lo que no se da por corregido el defecto remoto.

## Hallazgos prioritarios

El detalle de evidencia, impacto, condición, corrección, efectos secundarios y pruebas está en [HALLAZGOS.md](HALLAZGOS.md).

1. **H-01, Medio — OAuth open redirect: corregido localmente.** `getSafeNextPath()` ahora rechaza origen externo, barras invertidas, separadores codificados, caracteres de control y escapes malformados; normaliza destinos internos. Se añadieron cuatro tests. Pendiente comprobar callback HTTP en staging.
2. **H-02, Medio funcional — cambio de rol administrativo incompatible: helpers huérfanos eliminados.** La búsqueda del repositorio encontró únicamente las definiciones de `changePlayerRoleAdmin()` y `updatePlayerRole()`, sin consumidores en páginas, acciones ni otros módulos. No se añadió RPC; no existe actualmente un flujo de administración de roles que los helpers desbloqueen. Si el producto necesita asignar roles desde el panel, requiere un requisito y diseño explícitos, autorización server-side y auditabilidad.
3. **Alto funcional — temporada base no ejecutable:** enum terminal y funciones no coinciden; rollover inserta un torneo nulo en columna no nula. Corresponde a `HEAD` base y no prueba el remoto ni se corrigió localmente.
4. **Medio — galería pública no limitada en BD:** política pública `USING (true)` sobre filas no publicadas en el esquema base; el filtro de página no limita PostgREST directo.
5. **Medio — grants demasiado amplios:** grants a nivel de tabla y privilegios por defecto obligan a depender de RLS y pueden exponer objetos futuros que no tengan política.
6. **Medio — escritura de negocio y auditoría no atómica:** la RPC puede completar y el insert en `audit_log` fallar después.
7. **Medio/pendiente — integridad transversal:** falta garantía de BD para varios alcances torneo/categoría y para exclusividad del jugador a través de categorías.
8. **Pendiente — funciones de temporada y RPC de inscripción en remoto:** propiedad, grants efectivos, definiciones y triggers no pueden confirmarse desde archivos locales.

## Conclusiones y límites

No se encontraron secretos privilegiados usados por la aplicación en las rutas revisadas; el cliente utiliza anon key. Esto no es una auditoría de secretos de todo el entorno ni de dashboard. No se comprobaron Auth provider settings, redirect allow list, límites de tasa, Storage policies, permisos de columna, roles heredados, historial remoto de migraciones, definiciones remotas, ni pruebas funcionales contra staging.

Para cerrar la auditoría remota se necesita ejecutar [CONSULTAS_DIAGNOSTICO.sql](CONSULTAS_DIAGNOSTICO.sql) desde SQL Editor conectado explícitamente al proyecto de **staging** (o una sesión read-only confirmada). Revisar resultados antes de cualquier cambio. Para cerrar seguridad funcional ejecutar el plan de [PRUEBAS_SEGURIDAD.md](PRUEBAS_SEGURIDAD.md). Las correcciones sugeridas y su secuencia están en [PLAN_CORRECCIONES.md](PLAN_CORRECCIONES.md).

## Validación de cambios locales

- `npm.cmd test`: 4/4 pruebas pasaron. Node mostró una advertencia inocua sobre detección de módulos tipados; no afectó resultado.
- `npx.cmd tsc --noEmit`: pasó.
- `npm.cmd run lint`: pasó con 0 errores y 15 warnings existentes en archivos no modificados por esta fase.
- `npm.cmd run build`: pasó; compiló, completó TypeScript y generó 40 páginas.
- El diagnóstico SQL fue revisado estáticamente: 18 sentencias, todas `SELECT`/`WITH`, dividido en bloques 1–9. No se ejecutó contra PostgreSQL; se debe correr un bloque a la vez en staging.

La rama actual es `audit/local-security-fixes`. No se creó commit ni se hizo push. Los cambios previos del usuario, incluidas eliminaciones de archivos SQL, permanecen intactos.
