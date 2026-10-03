# Auditoría de Supabase — Sagunto Padel Cup

**Fecha:** 3 de octubre de 2026
**Alcance:** revisión estática del checkout, sus archivos SQL versionados en `HEAD` y la integración Next.js/Supabase. No se accedió a Supabase remoto ni se ejecutaron operaciones de escritura.

**Fase local siguiente (3 de octubre de 2026):** aplicada en la rama `audit/local-security-fixes`. H-01 corregido; helper huérfano H-02 eliminado, sin añadir RPC. Se añadieron pruebas automatizadas. TypeScript, ESLint y build completaron; detalles al final.

## Resumen ejecutivo

Se revisaron los cinco documentos de auditoría, el código actual de clientes/servicios/acciones, y los extractos de schema/migraciones que el usuario había proporcionado antes. Los SQL fuente ya no están en el checkout ni en `HEAD`. Hay protecciones útiles descritas en ese material: sesión autenticada y clave pública en el cliente de servidor; mutaciones de inscripción por RPC admin; políticas de jugador/registro; y bloqueo de cupo por categoría. La configuración efectiva remota no está disponible.

La auditoría encontró riesgos locales: el open redirect OAuth ya se corrigió; los helpers de cambio de rol incompatibles y sin consumidores se retiraron; el esquema base de temporadas conserva incompatibilidades con sus funciones. Se conservan propuestas no aplicadas para temporadas y auditoría de inscripciones. El hallazgo histórico H-04 salió del alcance de la aplicación al retirar esa funcionalidad; no se modificó su estructura en Supabase. El schema dump y las migraciones ya no están en el checkout ni en el `HEAD` actual, por lo que sus conclusiones se basan en SQL pegado anteriormente y no acreditan el entorno remoto.

**Estado remoto: no verificado.** No están disponibles `psql` ni Supabase CLI, Docker no tiene un daemon accesible, y existe un marcador local de proyecto enlazado cuya identidad no se inspeccionó ni se usó. No se usaron credenciales ni se contactó Supabase. El único resultado remoto ya recibido es el reporte del usuario de seis métricas P0 en cero; no se volvieron a consultar y no prueban RLS, permisos ni RPC.

## Repositorio y conservación de cambios

El diagnóstico SQL actualizado y los documentos de auditoría están en el checkout de trabajo, pero aún no en `HEAD`. Tampoco están en el checkout ni en `HEAD` el schema dump ni las migraciones de seguridad/inscripciones. El usuario había pegado el schema completo y el contenido de la migración de rollover en mensajes anteriores; se usan como evidencia histórica junto con los informes previos, no como archivos actuales reproducibles. No se restauraron ni sobrescribieron los archivos ausentes.

En la fase anterior se corrigió H-01 en código y se retiraron los helpers huérfanos de H-02. En esta fase no se modificó ni conectó ninguna base; se prepararon borradores SQL fuera de `supabase/migrations`. En el estado local actual también se refactorizaron las acciones de inscripciones para retirar el segundo insert de auditoría; su despliegue depende de instalar y validar primero el trigger H-06 en staging.

## Arquitectura observada

- `src/lib/supabase/server.ts`: cliente SSR basado en `@supabase/ssr`, URL pública y anon key; las operaciones usan la sesión autenticada.
- `src/lib/supabase/client.ts`: cliente de navegador con anon key. No se encontró uso de service-role key en código de aplicación.
- `src/lib/supabase/proxy.ts` y `src/proxy.ts`: sincronización/renovación de sesión. No reemplazan autorización en páginas, acciones o RLS.
- `src/lib/services/admin.ts`: `requireAdminContext()` valida usuario y perfil con rol `admin`; los helpers administrativos lo invocan.
- `src/app/(admin)/admin/inscripciones/actions.ts` y `src/lib/services/registrations.ts`: las acciones llaman RPC/servicios para mutaciones. El refactor local ya quitó el segundo insert de audit; depende del trigger de la propuesta H-06, que debe instalarse primero en staging.
- `src/app/auth/callback/route.ts` y `src/lib/auth/flow.ts`: intercambio OAuth y selección de destino posterior.
- `src/lib/services/seasons.ts`: contiene creación/actualización de temporada y una vista previa de rollover, pero no una integración completa de cierre/rollover.
- No se encontró endpoint API de negocio. Hay callbacks de Auth. Los servicios usan PostgREST/RPC; no se encontró SQL dinámico en la aplicación.
- No se encontró un flujo de carga multimedia requerido por la aplicación. La configuración de Storage no se auditó ni se modificó; la base de datos está en pausa.

## Esquema y RLS del material SQL aportado previamente

El SQL pegado por el usuario define 24 tablas públicas y habilita RLS en todas. No está disponible para reproducción local; el inventario del checkout encuentra solo el seed SQL. Por tanto, estas observaciones son del material previamente proporcionado, no una inspección reproducible del árbol actual. RLS no forzado no implica por sí solo bypass para `anon` o `authenticated`; owners, `BYPASSRLS` y `service_role` requieren evaluación separada. El SQL compartido concede amplios privilegios de tabla y default ACL a roles públicos, pero el acceso efectivo depende además de las policies, herencia y configuración remota.

El SQL compartido incluye estructuras y una lectura pública de contenido multimedia, pero la aplicación ya no consume esa funcionalidad. Se conserva únicamente como evidencia histórica de H-04; no se investigará ni cambiará la política mientras la auditoría de base de datos siga en pausa.

La vista `public_player_profiles` pretende exponer perfiles con opt-in y columnas seleccionadas. Debe verificarse en remoto su definición, privilegios, opciones de seguridad y columnas; no se asumió que una vista garantice por sí sola seguridad de columnas/RLS en todas las configuraciones.

Las políticas PostgreSQL permisivas se combinan por OR dentro de su ámbito; una política amplia puede neutralizar el efecto esperado de otra restrictiva. Por eso se requiere inspeccionar el catálogo remoto y probar como `anon`, usuario y admin.

## Inscripciones, pagos y concurrencia

Los extractos de migraciones proporcionados anteriormente muestran RPC `SECURITY DEFINER` con `search_path` fijado y validación administrativa para operaciones de inscripción. La inscripción de pareja bloquea la configuración de cupo de la categoría antes de contar y escribir. Los archivos ya no están en el checkout, por lo que no se puede confirmar qué definición aplica actualmente.

La RPC `registrar_pareja` debe probarse con dos sesiones concurrentes y con identidades distintas. La lógica consultada comprueba al solicitante principal y duplicados en torneo/categoría, pero no demuestra consentimiento del segundo jugador ni aplica atómicamente una regla de exclusividad entre categorías. Esto es una cuestión de integridad/regla de negocio y requiere validar el flujo aprobado.

Los estados iniciales creados por la RPC y las precondiciones de confirmación administrativa deben probarse conjuntamente: el esquema base crea inscripción confirmada con pago pendiente, mientras que `admin_confirm_registration` espera estado pendiente de pago. Las migraciones posteriores podrían haber cambiado esa transición; remoto pendiente.

Las relaciones FK no garantizan por sí mismas que el torneo y categoría de una inscripción coincidan con la pareja, ni que el torneo/categoría de un partido coincidan con sus parejas. Hay validaciones de aplicación/RPC, pero faltan invariantes relacionales compuestas en el esquema consultado.

## Temporadas y ranking

En el esquema base pegado anteriormente, `season_status` contiene `planificada`, `activa`, `cerrada`, `archivada`; las funciones `close_season` y `create_season_from_previous` usan `finalizada`. Asimismo, `ranking_points.tournament_id` es `NOT NULL`, aunque el rollover intenta insertar `NULL`. Esas operaciones no son compatibles con ese extracto. El helper `calculate_rollover_points` aplica 30 % y redondeo; la aplicación define retención 30/70. La fuente no está en el checkout actual.

El usuario aprobó `archivada` como estado terminal y rollover del 30 %. Se preparó `propuestas/REPARACION_TEMPORADAS.sql` con esa decisión, preflight contra duplicados, cierre idempotente y protección de ledger archivado. No se da por corregido el defecto remoto: falta cotejarlo con la migración 006 que pudo aplicarse y con el catálogo remoto. Tampoco conecta el RPC a la UI; el servicio actual de temporadas crea/actualiza registros y ofrece vista previa.

## Hallazgos prioritarios

El detalle de evidencia, impacto, condición, corrección, efectos secundarios y pruebas está en [HALLAZGOS.md](HALLAZGOS.md).

1. **H-01, Medio — OAuth open redirect: corregido localmente.** `getSafeNextPath()` ahora rechaza origen externo, barras invertidas, separadores codificados, caracteres de control y escapes malformados; normaliza destinos internos. Se añadieron cuatro tests. Pendiente comprobar callback HTTP en staging.
2. **H-02, Medio funcional — cambio de rol administrativo incompatible: helpers huérfanos eliminados.** La búsqueda del repositorio encontró únicamente las definiciones de `changePlayerRoleAdmin()` y `updatePlayerRole()`, sin consumidores en páginas, acciones ni otros módulos. No se añadió RPC; no existe actualmente un flujo de administración de roles que los helpers desbloqueen. Si el producto necesita asignar roles desde el panel, requiere un requisito y diseño explícitos, autorización server-side y auditabilidad.
3. **Alto funcional — temporada base no ejecutable:** el SQL pegado mostraba enum terminal y funciones incompatibles, y rollover insertando `NULL` en columna no nula. Borrador de reparación disponible; el defecto remoto no está verificado.
4. **H-04, histórico y fuera del alcance de producto:** se retiró la funcionalidad de la aplicación. La estructura de Supabase queda intacta y no se propone intervención mientras la base siga en pausa.
5. **Medio/observación — grants amplios:** aparecen en el SQL aportado previamente, pero no equivalen por sí solos a acceso efectivo cuando RLS lo deniega. Requieren matriz real por rol antes de revocar.
6. **Medio — escritura de negocio y auditoría no atómica:** corregida en el código para depender de trigger transaccional; borrador preparado, no aplicado ni validado en staging.
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
- El diagnóstico SQL fue revisado estáticamente: 19 sentencias, todas `SELECT`/`WITH`, dividido en bloques 1–9. No se ejecutó contra PostgreSQL; se debe correr un bloque a la vez en staging.
- Propuestas SQL H-03/H-04/H-06 en `propuestas/`; no forman parte de `supabase/migrations` y no se ejecutaron. H-06 exige trigger antes de desplegar el refactor de Server Actions.

La rama actual es `audit/local-security-fixes`. No se hizo push ni se ejecutó ninguna migración. El checkout actual carece de los archivos SQL base; no se restauraron.

## Cierre temporal de auditoría — 4 de octubre de 2026

La base de datos queda en pausa por decisión del propietario. No se ejecutarán consultas, pruebas, migraciones ni cambios remotos hasta que el propietario lo solicite expresamente. El archivo `CONSULTAS_DIAGNOSTICO.sql` y los seis contadores P0 comunicados anteriormente son material histórico, no tareas en curso. Los seis contadores fueron reportados en cero; no se recibieron los resultados de catálogo de los bloques 2–8 ni estados adicionales del bloque 9.

- H-01: validador de retorno OAuth interno implementado; 4 pruebas unitarias pasan. Callback HTTP con proveedor real no probado.
- H-02: helpers de cambio de rol sin consumidores retirados; no se añadió RPC ni se cambió trigger.
- H-03: incompatibilidad de temporada identificada en SQL aportado anteriormente; borrador `propuestas/REPARACION_TEMPORADAS.sql` pendiente de baseline y verificación si se reanuda la auditoría.
- H-04: alcance de la aplicación retirado. Sin cambios de tablas, policies, buckets o datos.
- H-05, H-07–H-12: sin validar remotamente; requisitos de permisos, integridad, reglas, Auth y Storage siguen abiertos según `HALLAZGOS.md`.
- H-06: borrador de trigger transaccional conservado. Las acciones locales ya no hacen una segunda escritura de auditoría; no desplegar ese cambio hasta aplicar y probar el trigger en staging.

En esta fase: `npm test` 4/4; `npm run qa` 0 errores y 4 warnings; `tsc --noEmit` pasó; ESLint 0 errores y 14 warnings; `next build` pasó con 39 páginas. No son validaciones de Supabase ni cierran hallazgos remotos.