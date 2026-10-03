# Estado de implementación — 2 de octubre de 2026

Este registro contrasta la Especificación Definitiva, el Documento Maestro v1.1 y las decisiones posteriores del organizador con el código. La elección expresa del organizador fue conservar la tabla de puntos v1.1. Las migraciones y los datos iniciales de este repositorio son propuestas revisables: no se han aplicado a Supabase.

## Decisiones confirmadas

- Calendario de temporada: 12–13 septiembre de 2026, 14–15 noviembre de 2026, 23–24 enero de 2027, 27–28 marzo de 2027, 15–16 mayo de 2027 y 11–12 septiembre de 2027. Master Final: 11–12 diciembre de 2027.
- Categorías: 1.ª, 2.ª, 3.ª y 4.ª/Iniciación.
- No hay máximo fijo de parejas por categoría. La capacidad queda sin límite salvo que administración configure uno.
- Clasificación individual: las cuatro primeras posiciones de cada categoría tienen acceso directo al Master Final. La resolución de un empate por la cuarta plaza sigue pendiente.
- Se conserva la tabla oficial de puntos del Documento Maestro v1.1, con bandas por categoría.
- Los horarios se configurarán por torneo; no se inventan horas ni sedes.

## Matriz de requisitos

| Requisito | Estado | Evidencia / siguiente comprobación |
| --- | --- | --- |
| Portada conectada a datos publicados y próximos | Implementado; build previa verificada | `src/app/(public)/page.tsx`; probar con staging y zona Europe/Madrid |
| Alta de torneo con validación, errores y estado de envío | Implementado; build previa verificada | `src/app/(admin)/admin/torneos/nuevo/` |
| Actividad privada del jugador | Implementado a nivel de consulta | `/app` usa partidos finalizados; falta validar contra staging |
| Dashboard administrativo | Rediseñado con próxima fecha, prioridades y accesos reales | `/admin`; métricas del servicio administrativo y torneo siguiente desde Supabase |
| Navegación y cierre de sesión | Enlaces limitados a páginas implementadas; error de logout visible | `src/components/admin/AdminShell.tsx`, `LogoutButton.tsx` |
| Gestión de jugadores | Listado y ficha deportiva de solo consulta con actividad, inscripciones y puntos | `/admin/jugadores`, `/admin/jugadores/[id]`; faltan edición administrativa autorizada y pruebas de extremo a extremo |
| Gestión de inscripciones | Filtros por torneo/estado/pago, verificar pago, confirmar pareja pagada y check-in | `/admin/inscripciones`; confirmar requiere pareja completa y el servicio valida el pago |
| Operación de partidos | Filtros por torneo/categoría/estado; editar programación y pista; resultado en solo lectura | `/admin/competicion`; la captura/corrección de marcador requiere un flujo de validación dedicado |
| Ranking administrativo | Tabla individual por categoría con puntos, pruebas y plazas Race to Master | `/admin/ranking`; corte compartido por helper probado; el desempate deportivo sigue pendiente de aprobación |
| Gestión de contenidos | Crear borradores de noticias, filtrar y publicar/retirar | `/admin/contenidos` |
| Filtros de torneos | Búsqueda, estado, temporada y rango de fechas | `/admin/torneos`; fechas filtran por fecha de inicio del torneo |
| Creación de cuadros y captura/corrección de resultados | Pendiente; el área de partidos solo programa horarios/pistas y consulta marcadores | Diseñar con validación oficial e historial de cambios antes de habilitar mutaciones |
| Fichas de jugadores/parejas | Consulta deportiva implementada; acciones de modificación de pareja no disponibles | `/admin/jugadores/[id]`, `/admin/parejas/[id]`; sustituciones requieren regla aprobada |
| Categorías, Master y configuración | Pendiente de páginas operativas | Se mantienen fuera del menú para evitar destinos vacíos |
| Perfiles públicos y privacidad | Migración preparada, no aplicada | `public_player_profiles` requiere despliegue controlado y pruebas de roles |
| Campos sensibles de inscripción | Protección preparada, no aplicada | Trigger en migración; comprobar con pruebas de integración |
| Inscripciones concurrentes y capacidad sin máximo | Migración y RPC preparadas, no aplicadas | Revisar transacciones, permisos y aceptación de pareja en Supabase local/staging |
| Calendario 2026–2027 | Fechas confirmadas; seed preparado | `supabase/seed/official-calendar-2026-2027.sql`; no ejecutado. Las sedes/horas quedan vacías |
| Categorías y aforo configurable | Confirmado; esquema preparado | `supabase/migrations/20261001000200_unlimited_category_capacity.sql` permite `NULL` sin máximo |
| Master Final / Race to Master | Vista pública implementada por categoría; calcula corte sobre ranking completo antes de filtrar perfiles públicos | Pruebas unitarias locales cubren privado en el corte, ranking corto y empate; falta validar datos reales e integración con resultados |
| Tabla de puntos v1.1 | Conservada en constantes y lógica de ranking | Pruebas unitarias locales cubren categorías, tramos y rondas; asignación integrada desde resultados sigue pendiente |
| Cuadros, resultados y recalculado de puntos | Parcial | Hay lógica de dominio/servicios; faltan flujos operativos conectados y pruebas de extremo a extremo |
| RLS en todas las tablas | No verificado completamente | Revisar matches, ranking, grants y matriz completa de roles; ninguna migración aplicada |
| QA local histórico (2 oct 2026) | Sustituido por la verificación del 4 oct 2026 al final de este documento | Los avisos de ese día no representan el estado actual |

## Decisiones todavía pendientes

- Regla oficial de desempate para la cuarta plaza del Master; el sitio muestra a todos los empatados sin resolver quién obtiene plaza exclusiva.
- Sustituciones, formación de parejas clasificadas, formatos del Master y premios/puntos del Master.
- Formatos de cuadro para cada número de parejas, byes, desempates de grupos, retiradas, incomparecencias y descalificaciones.
- Ventanas de inscripción, invitación y aceptación de compañero, lista de espera, bajas y reapertura de plaza.
- Texto y evidencia del consentimiento para fotos/datos, edad mínima o consentimiento de tutores, conservación y retirada del consentimiento.
- Reglas de cambios de categoría/pareja, identificador público y canales de comunicación.

## Migraciones, datos y publicación

- `20261001000100_secure_public_player_profiles.sql`: vista pública con opt-in y protecciones para perfiles, parejas e inscripciones.
- `20261001000200_unlimited_category_capacity.sql`: capacidad ilimitada por defecto para nuevas categorías y RPC transaccional de inscripción.
- `official-calendar-2026-2027.sql`: datos de temporada, cuatro categorías y siete torneos confirmados.
- Aplicar primero las migraciones en Supabase local/staging, luego el seed; verificar estructura existente y ejecutar pruebas anónimas, jugador propio/ajeno y administrador. No aplicar directamente en producción.
- Antes de publicar: probar Auth, variables de entorno, políticas RLS, flujos de inscripción/resultados/ranking, textos legales, copias de seguridad, dominio y HTTPS. La web aún no está lista para operación completa mientras falten esos flujos y validaciones.


## Continuaci?n de auditor?a ? 2 de octubre de 2026

- Se verific? el ?rbol real de rutas administrativas: la ficha enlazaba a subsecciones que no exist?an. Se retiraron esos destinos ficticios; inscripciones y partidos enlazan ahora a las p?ginas existentes con filtro de torneo.
- Se a?adi? una ruta de edici?n general de torneo. La acci?n exige sesi?n de administrador, valida identificador, campos y fechas, actualiza mediante el servicio existente, escribe una entrada de auditor?a y revalida ficha, listado y portada.
- El formulario de edici?n requiere al menos una temporada y un club; no altera el estado del torneo ni aplica reglas deportivas.
- El flujo de escritura real, permisos RLS y entrada de auditor?a no se pudieron comprobar sin credenciales de Supabase local/staging. La ficha de torneo queda parcialmente implementada hasta completar categor?as, transiciones operativas y prueba de integraci?n.


## Auditoria de cobertura del panel - 2 de octubre de 2026

| Area | Estado observado | Evidencia / limitacion |
| --- | --- | --- |
| Dashboard | Parcial, consulta servicios y enlaza operaciones actuales | `src/app/(admin)/admin/page.tsx`; falta validacion de datos en entorno Supabase |
| Torneos: alta y ficha | Alta y edicion general implementadas; categorias asignables con cupo opcional y activacion/desactivacion | `src/app/(admin)/admin/torneos/[id]/editar/`, `src/app/(admin)/admin/torneos/[id]/categorias/`; grupos siguen pendientes |
| Torneos: transiciones y archivo | No verificado desde interfaz de ficha | Hay servicios de estado; no se expusieron acciones que permitan mutaciones de estado sin flujo claro |
| Inscripciones | Parcial; consulta, verificacion de pago, confirmacion y check-in | No incluye baja, lista de espera ni promocion probadas |
| Jugadores | Listado y ficha deportiva implementados; estadisticas agregadas, inscripciones, parejas relacionadas y ledger reciente. Sin edicion de datos ni historial individual de partidos | `/admin/jugadores`, `/admin/jugadores/[id]`; no probado con datos Supabase reales |
| Parejas | Parcial; lectura contextual, sin modulo CRUD dedicado | Inscripciones y partidos muestran parejas |
| Categorias y grupos | CRUD parcial implementado para asignar categoria al torneo, actualizar cupos opcionales y activar/desactivar inscripcion; gestion de grupos pendiente | `src/app/(admin)/admin/torneos/[id]/categorias/`; sin borrado fisico para preservar relaciones |
| Cuadros | Pendiente; logica de dominio no esta conectada a una herramienta de generacion | No existe ruta administrativa dedicada |
| Partidos y resultados | Parcial; filtro, horario/pista editables, resultados solo lectura | `/admin/competicion`; sin captura/correccion de marcador |
| Clasificacion / Race to Master | Parcial; vistas con ranking y plazas; recalculo/historial admin incompletos | `/admin/ranking`, `/master-final`; empate de corte pendiente |
| Master Final administrativo | Pendiente | La vista publica no configura participantes, formato ni premios |
| Noticias | Parcial; borradores y publicacion disponibles | `/admin/contenidos` |
| FAQ, contacto y configuracion | Pendiente de gestion desde panel | No hay rutas administrativas operativas comprobadas |
| Sesion y permisos | Proteccion de layout/acciones identificada; matriz completa de roles/RLS no verificada | La edicion nueva comprueba admin tanto al cargar como al mutar |
| UX compartida | Navegacion apunta a areas activas; ficha de torneo ya no enlaza a subsecciones inexistentes | Quedan estados/tablas y flujos pendientes en los modulos aun parciales |

Las rutas nuevas de edicion general y gestion de categorias guardan por los servicios existentes, revalidan las vistas afectadas y registran eventos en `audit_log`. Si guardar tiene exito pero falla el registro de auditoria, el formulario informa que los datos si se guardaron y la auditoria no. La prueba no se ha ejecutado contra Supabase: la existencia de RLS y las credenciales disponibles no bastan para demostrar el resultado en una sesion real.


## Continuacion - 3 de octubre de 2026 - inscripciones

| Operacion | Estado | Verificacion y limitaciones |
| --- | --- | --- |
| Listado y detalle de inscripciones por categoria | Implementados; el detalle incluye participantes, estados y eventos de auditoria disponibles | `/admin/inscripciones?categoria=...`, `/admin/inscripciones/[id]`; compilacion verificada |
| Cancelacion administrativa | Implementado mediante RPC transaccional preparado en `20261003000100_admin_registration_operations.sql` | Valida rol, check-in, estado del torneo y partidos; conserva el registro y el estado de pago, cancela la pareja y limpia la busqueda de companero. No inicia reembolsos. La migracion no esta aplicada ni validada en Supabase |
| Promocion manual desde espera | Implementado mediante RPC transaccional preparado en la misma migracion | El administrador elige cada pareja; no se aplica prioridad automatica. Valida cupo, pareja completa, categoria abierta y ausencia de partidos |
| Auditoria de cancelacion/promocion | Implementada en acciones con aviso si la mutacion se completo y fallo el log | Requiere validar permisos/RLS en local o staging |
| Funcion SQL antigua `cancelar_inscripcion(uuid)` | Revocada a `anon` y `authenticated` en la migracion nueva | La funcion SECURITY DEFINER anterior permitia mutacion sin control suficiente; el reemplazo administrativo valida `is_admin()` |

| Ficha detallada de inscripcion | Implementada, incluidos jugadores, pago, check-in y auditoria disponible | `/admin/inscripciones/[id]`; el historial solo contiene eventos instrumentados |
| Confirmacion, movimiento manual a espera, cancelacion y promocion manual | RPC transaccionales preparadas; sincronizan estado de pareja e inscripcion | Requieren aplicar migracion en local/staging y probar con sesion admin |

La fecha de inscripcion no esta disponible en el tipo actual de `registrations`, asi que no se agrega un filtro de fecha inventado. No hay una instancia local Supabase escuchando en el puerto 54321; la migracion no pudo validarse con PostgreSQL en este entorno. El flujo de confirmacion de pago sigue separado de la confirmacion de la inscripcion. La elegibilidad real de operaciones administrativas continua pendiente de pruebas con Supabase autenticado.


Verificacion tecnica del bloque de inscripciones (3 oct 2026): `npm run qa` finalizo con 0 errores y 4 avisos; ESLint encontro 0 errores y 15 avisos globales; `npx tsc --noEmit` y `npm run build` finalizaron correctamente. Build genero 39 paginas estaticas/dinamicas. `git diff --check` queda registrado tras el repaso final. No hay pruebas automatizadas de servicios Supabase ni PostgreSQL local; las RPC y RLS solo estan revisadas contra `supabase/schema.sql`, no ejecutadas.


Verificacion final tras agregar ficha de inscripcion (3 oct 2026): `npm run qa` y `npm run build` pasaron. El build incluye `/admin/inscripciones/[id]`. SQL de la migracion no se ejecuta porque no hay PostgreSQL/Supabase local ni CLI; requiere validacion en entorno local o staging antes de aplicar.


## Continuacion - ficha deportiva de jugadores - 3 de octubre de 2026

- El listado enlaza a fichas privadas del panel y el filtro de limpieza usa navegacion Next. La ficha muestra estado/categoria y datos deportivos permitidos; omite contacto.
- La actividad usa partidos finalizados y puntos presentes en el ledger; no recalcula ranking. Las inscripciones enlazan a su ficha administrativa.
- La consulta de estadisticas ahora restringe partidos a parejas del jugador en la base de datos, en vez de descargar todos los partidos finalizados.
- Cambios de categoria, sustituciones, incidencias y edicion de datos siguen pendientes de reglas o flujo aprobado; no se habilitaron mutaciones desde la ficha.

## Continuacion - parejas - 3 de octubre de 2026

| Funcion | Estado | Evidencia / limite |
| --- | --- | --- |
| Consulta administrativa de parejas | Implementada con busqueda por integrante, filtros de torneo/categoria/estado y paginacion | `/admin/parejas`; protegido por contexto de administrador |
| Ficha de pareja | Implementada en modo consulta con integrantes, torneo, categoria, inscripciones y partidos relacionados | `/admin/parejas/[id]`; no modifica integrantes ni estado deportivo |
| Navegacion del modulo | Disponible dentro de Participantes; rutas activas añadidas a `AdminShell` | La paginacion es adaptable en movil |
| Reglas de cambios de integrante | Pendientes | No hay sustituciones ni edicion de pareja hasta aprobar reglas |

Verificacion de esta continuacion (3 oct 2026): `npm run qa` finalizo con 0 errores, 4 avisos del verificador y 15 avisos ESLint. `npm run build` genero 40 rutas, incluidas las fichas de jugadores y parejas. `git diff --check` no encontro errores de whitespace. Falta probar consultas con una sesion real de administrador en Supabase local/staging; no se ejecuto ninguna migracion.


## Auditoria de esquema y RPC de inscripciones - 3 de octubre de 2026

| Hallazgo | Estado | Evidencia / accion |
| --- | --- | --- |
| Enum de pago discrepante | Corregido en TypeScript/UI y RPC: schema.sql usa no_aplicable, no no_requerido | Tipos, constantes, servicios, panel y migraciones administrativas |
| Conteo de cupo en promocion/inscripcion | Unificado: pareja completa y activa confirmada o con reserva pendiente de pago; la fila de categoria serializa promociones/altas | Migraciones administrativas `20261003000200` y `20261003000300` |
| Confirmacion de inscripcion | Exige pago verificado/no aplicable, torneo abierto, pareja completa, categoria habilitada y ausencia de partidos en categoria | RPC transaccional; pendiente de prueba PostgreSQL |
| Despliegue de correccion | Migraciones incrementales preparadas para instalaciones que ya aplicaron migraciones previas | No ejecutadas en Supabase |
| Integridad/concurrencia de base real | No verificada | No hay Supabase local disponible ni se aplicaron migraciones |

Las decisiones deportivas/organizativas que bloquean cambios se consolidan en docs/pending-decisions.md. Mantener como no verificadas las escrituras, concurrencia, permisos y RLS hasta ejecutar pruebas con PostgreSQL/Supabase autenticado.

Verificacion tras corregir el enum y las RPC (3 oct 2026): `npm run qa` completo con 0 errores, 4 avisos del verificador y 15 avisos ESLint; `npm run build` correcto con 40 rutas. Las migraciones 001 y 002 se inspeccionaron contra `schema.sql`, pero no se ejecutaron ni analizaron con un servidor PostgreSQL; estado de validacion SQL: pendiente.

## Tarea P0: auditoria de seguridad y consistencia - 3 de octubre de 2026

| Hallazgo | Estado | Correccion preparada |
| --- | --- | --- |
| Insert/update directo de parejas desde RLS permitia cambiar estado/categoria sin RPC | Corregido mediante retiro de politicas self_insert/self_update | Migracion 20261003000400_registration_rls_hardening.sql |
| Insert directo de inscripcion permitia elegir estados operativos sin transaccion | Corregido mediante retiro de registrations_self_insert | Usar RPC transaccional; servicios de insercion individual no tienen consumidores UI |
| Cancelacion directa del propietario podia saltarse check-in, estado de torneo y partidos y no sincronizaba pareja | Corregido en trigger: valida esas condiciones, conserva pago y deja pareja incompleta/retira bolsa de companero | Migracion 20261003000400_registration_rls_hardening.sql |
| RPC admin con permiso service_role pero comprobacion is_admin() | Permiso innecesario retirado | Migracion 20261003000400_registration_rls_hardening.sql; solo authenticated pasa por is_admin() |
| Prueba de RLS, triggers y concurrencia | Pendiente de validacion | No hay PostgreSQL/Supabase local ni CLI; no ejecutar en remoto |

El flujo directo actual soportado por base es registrar_pareja, transaccional y solo para usuario autenticado que registra su propio jugador (o admin). El alta individual compuesta por inserciones directas del servicio no tiene consumidores en la aplicacion; queda bloqueada por las nuevas politicas hasta que exista un RPC transaccional aprobado para ese flujo.
Actualizacion Tarea P0 (3 oct 2026): la migracion 20261003000400_registration_rls_hardening.sql tambien retira insercion/edicion directa de parejas e insercion directa de inscripciones por jugadores. Conserva la edicion autorizada del perfil personal, pero bloquea cambios propios de estado de cuenta, categoria actual, rol, identidad de Auth, alta y metadatos internos. Las RPC administrativas siguen pasando por is_admin().

Estado de verificacion P0: correcciones implementadas en el repositorio; pendientes de aplicar y probar en Supabase local/staging. La ruta de registro individual del servicio no tiene consumidores y depende de inserciones directas ahora bloqueadas; no debe presentarse como flujo disponible hasta sustituirla por una RPC atomica.
Verificacion Tarea P0 (3 oct 2026): npm run qa: 0 errores, 4 avisos del verificador; ESLint: 0 errores y 15 avisos; TypeScript: correcto. npm run build: correcto, 40 rutas. git diff --check: sin errores. No hay script de pruebas en package.json; psql y Supabase CLI no estan instalados. Docker CLI existe, pero no hay daemon accesible. Por ello no se ejecutaron SQL, RLS ni pruebas de concurrencia y las 5 tareas P0 siguen pendientes de validacion de base real.
## Tarea P0 de validacion Supabase e inscripciones - 3 de octubre de 2026

| Area | Estado actual | Evidencia / limite |
| --- | --- | --- |
| Seis migraciones de inscripciones | Reportadas por el propietario como aplicadas; no verificadas remotamente | El repositorio contiene versiones 20261001000100, 20261001000200 y 20261003000100 a 20261003000400. PostgREST no respondio a una solicitud GET de esquema y no hay acceso SQL/MCP en este entorno. |
| Auditoria de esquema, RLS, RPC, grants y triggers remotos | Pendiente | Preparada consulta estrictamente de solo lectura en `supabase/audits/p0_registration_readonly.sql`. No se ha ejecutado en Supabase. |
| Consistencia de plazas y pagos en datos reales | Pendiente | La auditoria SQL devuelve solo contadores agregados; no consulta datos personales. |
| Alta de pareja e inscripcion individual | `registrar_pareja` es el flujo transaccional existente; alta individual de servicio sin consumidores | Los metodos `createIndividualRegistration` y `createCompletePair` no tienen llamadas en la aplicacion. La migracion RLS 004 bloquea las inserciones directas que estas rutinas necesitarian; no se anadio otra RPC sin un flujo consumidor. |
| Recuento de lista de espera | Corregido en servicio | `getRegistrationCapacity` consulta inscripciones de todas las parejas de la categoria antes de contar lista de espera; solo parejas completas activas reservan plaza. |
| Carrera entre check-in y cancelacion | Corregida en servicio | La escritura de check-in exige atomicamente estado `confirmada` y `checked_in = false`. |
| Carrera entre pago y cancelacion | Corregida en servicio | La escritura de pago excluye atomicamente inscripciones canceladas. |

La afirmacion de que las migraciones estan aplicadas es informacion proporcionada por el propietario, no una observacion de la base remota. La prueba remota quedo bloqueada por la falta de conectividad y de credenciales de inspeccion; no se consultaron filas, no se ejecutaron RPC, migraciones ni escrituras. Para completar la validacion hace falta ejecutar la consulta de solo lectura en SQL Editor y revisar su salida, especialmente historial de migraciones, politicas, grants y contadores de integridad.

Verificacion local de esta tarea: `npm run qa` completado con 0 errores (4 avisos del verificador y 15 avisos ESLint); `npm run build` completado correctamente; `git diff --check` sin errores. No hay suite automatizada de pruebas de integracion Supabase en `package.json`.

## Actualizacion P0: resultados de integridad y revision previa a staging - 3 de octubre de 2026

### Integridad agregada reportada desde Supabase

El propietario ejecuto el bloque de integridad y reporta estos resultados: `players_in_multiple_active_pairs=0`, `categories_over_capacity=0`, `registration_pair_scope_mismatches=0`, `cancelled_registration_active_pair_rows=0`, `checked_in_non_confirmed=0` y `cancelled_verified_payment_without_payment_date=0`.

Estado: satisfactorio para esos seis indicadores y para el momento de la consulta, segun la salida proporcionada. No prueba por si mismo RLS, grants, triggers, RPC, concurrencia ni flujos funcionales. El indicador de parejas duplicadas de la primera version agrupaba por torneo y categoria; por ello no detectaba a un jugador activo en dos categorias distintas del mismo torneo. La auditoria local se amplio con `players_in_multiple_active_pairs_across_tournament`; ejecutar esa consulta adicional en staging antes de considerar cerrada la comprobacion de duplicados.

### Revision estatica local de bloques 2-8

Todavia no se recibieron las salidas de Supabase para enum, RLS, politicas, firmas/permisos efectivos, triggers, restricciones e indices. Los siguientes puntos son revision de los SQL locales y no acreditan el estado remoto:

| Punto | Revision local | Estado remoto |
| --- | --- | --- |
| Enum `payment_status` | `no_aplicable` es el literal coherente con schema y correcciones locales | Pendiente de recibir etiquetas del bloque 2 |
| RLS y politicas | Migraciones retiran alta/edicion directa de parejas e insercion directa de inscripciones; la lectura publica de perfiles se desplaza a una vista filtrada | Pendiente de recibir tablas/politicas del bloque 3 |
| Grants RPC | Operaciones admin revocan `anon`/`public`; la migracion 004 elimina `service_role` de RPC admin que exigen `is_admin()`; registro de pareja queda para `authenticated` y `service_role` | Pendiente de comparar permisos efectivos del bloque 5 |
| SECURITY DEFINER | RPC usan `search_path` fijado localmente. Debe comprobarse que remoto coincide y que no existen sobrecargas no esperadas | Pendiente de firmas/configuracion del bloque 5 |
| Triggers | La migracion 004 valida cambios del propietario y sincroniza cancelacion con pareja/bolsa; admin cancelacion sincroniza dentro de su RPC | Pendiente de definiciones y estado habilitado del bloque 6 |
| Restricciones/indices | Hay unicidad parcial por slot del jugador (player 1 y player 2), distinta de una unicidad conjunta; RPC valida ambos slots bajo bloqueo de categoria | Pendiente de definiciones del bloque 7 |
| Reserva y estados | `registrar_pareja` y promocion bloquean la fila de categoria; el conteo contempla parejas completas con inscripcion y pareja activas | Pendiente de prueba funcional y de concurrencia |

Riesgos/cuestiones para validar en staging:

1. **Duplicidad entre categorias.** La validacion SQL inicial no la detectaba y solo consideraba parejas que reservaban plaza; el nuevo contador tambien incluye lista de espera y agrupa por torneo completo. La funcion `validatePlayerTournamentEligibility` indica una regla de una categoria por torneo, pero `registrar_pareja` y los indices de unicidad operan por torneo y categoria. Confirmar con el flujo y requisito aprobado si esta regla debe ser global al torneo; si es obligatoria, falta enforcement atomico en base, no basta la validacion de UI.
2. **Transiciones de estado y pago.** `registrar_pareja` puede crear una pareja/inscripcion en estado `confirmada` con pago aun pendiente, mientras `admin_confirm_registration` solo acepta `pendiente_pago` con pago verificado o `no_aplicable`. Puede ser una separacion intencionada entre plaza y pago, pero requiere validar estados permitidos y que cada boton/operacion corresponde a uno. No se cambia la regla sin confirmar la semantica del negocio.
3. **Concurrencia con generacion de partidos.** Confirmar, promover, mover o cancelar bloquea filas operativas y algunas rutas bloquean categoria; comprobar que el generador de cuadros/partidos toma un bloqueo compatible para impedir que se inserte el primer partido entre la comprobacion `NOT EXISTS(matches)` y el cambio de estado.
4. **Registro de pareja.** El RPC permite que un jugador autenticado se identifique como jugador 1 y aporte un jugador 2 distinto; comprobar consentimiento/flujo de invitacion y disponibilidad del jugador 2 antes de habilitar un alta publica real. El servicio de alta individual sigue sin consumidores, por lo que no se considera un flujo funcional probado.
5. **Salidas de catalogo no adjuntas.** No afirmar las RLS/grants/triggers remotos como correctos hasta cotejar sus resultados con las migraciones locales.

### Plan de pruebas funcionales para staging (sin datos reales)

Preparar un torneo y categoria de prueba aislados, con capacidad pequena configurable, cuentas separadas `anon`, jugador A/B/C y admin; eliminar esos datos unicamente mediante el proceso controlado de limpieza de staging. Guardar salida, hora, usuario/rol y resultado de cada caso.

| Caso | Operacion / resultado esperado |
| --- | --- |
| A1 | `anon` y usuario autenticado no-admin no pueden ejecutar RPC administrativas; `anon` no puede ejecutar RPC de registro ni leer datos privados de jugadores/parejas/lista de espera. La vista publica solo muestra perfiles con opt-in. |
| A2 | Jugador autenticado solo puede registrar su identidad propia; intenta jugador ajeno, otra pareja activa duplicada y jugador 2 ocupado. Cada intento debe fallar sin filas parciales. Probar tambien duplicidad en otra categoria si la regla aprobada es global al torneo. |
| A3 | Registrar parejas hasta la capacidad; siguientes quedan en espera. Verificar conteo de plazas y estados pareja/inscripcion/pago. Repetir con categoria ilimitada (`cupo_maximo IS NULL`). |
| A4 | Dos sesiones intentan tomar la ultima plaza simultaneamente; exactamente una reserva plaza y la otra queda en espera. No se supera capacidad ni hay registros duplicados. |
| A5 | Admin promueve una pareja completa cuando hay plaza; pareja e inscripcion pasan juntas a pendiente de pago. Si esta lleno, categoria cerrada, torneo cerrado, pareja incompleta o ya hay partidos, la operacion falla sin cambios. |
| A6 | Pago pendiente no permite confirmar; pago verificado y `no_aplicable` (solo donde proceda) permiten confirmar. Rechazado/cancelado no se confirma. Verificar importe, metodo y fecha; repetir la peticion no debe causar transicion inesperada. |
| A7 | Cancelacion admin antes del torneo libera plaza, marca inscripcion cancelada y pareja incompleta, retira bolsa y conserva historial de pago. Probar que check-in, partidos existentes o torneo cerrado bloquean cancelacion y dejan todo intacto. |
| A8 | Check-in solo en inscripcion confirmada; doble check-in y check-in contra cancelacion concurrente no crean estado incoherente. Cancelar despues de check-in debe fallar. |
| A9 | Mover a lista de espera libera plaza; promover despues requiere plaza libre. Verificar estado sincronizado en pareja e inscripcion y que no pierde indebidamente datos de pago. |
| A10 | Paralelizar alta/promocion/cancelacion en la misma categoria y comparar plazas; paralelizar inicio de generacion de cuadro con cancelar/confirmar/promover para detectar carrera de bloqueo. |
| A11 | Ejecutar contadores de integridad antes y despues: todos cero, incluido `players_in_multiple_active_pairs_across_tournament`; repetir lecturas como roles anon, jugador y admin. |

Para cerrar el P0 falta: (a) recibir las salidas remotas de enum, RLS/politicas, privilegios de tablas, vista de perfiles, firmas/grants RPC, triggers, restricciones e indices, (b) ejecutar el contador adicional entre categorias, (c) ejecutar los casos A1-A11 en staging con usuarios de prueba y (d) resolver/documentar la regla de una o varias categorias por torneo y la semantica `confirmada` frente a pago pendiente. Hasta entonces las seis cifras quedan como verificadas por reporte, pero las operaciones permanecen pendientes de prueba.

## Auditoria ampliada: temporadas, notificaciones e inscripciones - 3 de octubre de 2026

El encargo de auditoria amplificada autorizo preparar cambios locales, pero no migrar remoto. La conectividad/credenciales SQL siguen sin estar disponibles; no se verifico el esquema remoto y no se hicieron escrituras remotas.

| Cambio local preparado | Archivos | Estado de prueba |
| --- | --- | --- |
| Limitar cambios de notificacion propia al estado de lectura; `read_at` lo asigna el trigger; permite leer/no leer, mantiene el camino admin/service | `supabase/migrations/20261003000500_protect_notification_content.sql` | Regresion de staging preparada en `supabase/tests/notification_update_guard.sql`; no ejecutada sin PostgreSQL/Supabase de prueba |
| Alinear estado final de temporada con `archivada`; permitir torneo nulo solo para `season_operation`; rollover 30% con source tipado y metadata; bloqueo/idempotencia para cierre y temporada hija; impedir cambios de puntos en temporadas archivadas; permisos anon/service retirados | `supabase/migrations/20261003000600_repair_season_rollover.sql`, `src/types/database.ts`, `src/lib/competition/seasons.ts`, `src/lib/services/ranking.ts`, `src/lib/public/site.ts`, `src/app/(admin)/admin/jugadores/[id]/page.tsx` | Prueba SQL preparada en `supabase/tests/season_rollover_regression.sql`; no ejecutada sin fixture admin/temporada/puntos en PostgreSQL de prueba |
| Auditoria solo lectura extendida a season_status, `ranking_points.tournament_id`, notificaciones, grants por columna, CREATE en public y RPC de temporada | `supabase/audits/p0_registration_readonly.sql` | No ejecutada contra remoto |

La migracion 006 incluye comprobaciones previas: aborta si encuentra duplicados de rollover/temporadas derivadas o puntos sin torneo con source no permitido. Normaliza el source legacy `rollover` a `season_operation` preservando filas y metadatos, y marca la operacion en metadata. Revisar la salida de esas comprobaciones antes de aplicarla en staging.

Decisiones aplicadas: al archivar, el ranking pasa a histórico inmutable; el trigger serializa escrituras autenticadas de puntos con el cierre, de forma que la escritura queda dentro del snapshot o se rechaza. El service role sigue siendo una vía privilegiada de mantenimiento. Se mantienen pendientes consentimiento del segundo jugador y transiciones de inscripción/pago, devoluciones y reserva de plaza. No se implementó alta de inscripciones desde la aplicación: `registrar_pareja` no tiene consumidor encontrado y el formulario público actual completa el perfil.

Verificación de esta ampliación: `npm run qa` completado con 0 errores (4 avisos de validadores ausentes; ESLint informa 15 advertencias); `npm run build` completado correctamente con generación de 40 páginas. `git diff --check` sin errores. Las pruebas SQL de regresión, RLS, permisos y concurrencia no se ejecutaron: requieren una base desechable de staging con los fixtures descritos. No se ha aplicado ninguna migración remota.

## Estado tras retirar contenido multimedia — 4 de octubre de 2026

- Se retiraron la ruta pública, su CSS, enlaces de navegación, helper de consulta, helpers de Storage y tipos de aplicación específicos. No hay ruta administrativa para ese módulo. No se modificó el esquema, los datos ni la configuración de Supabase.
- QA: 0 errores, 4 warnings del verificador (validadores opcionales ausentes); ESLint ejecutado con 0 errores y 14 warnings; TypeScript pasó; tests 4/4; build de producción pasó con 39 páginas.
- Las fichas admin de jugador y pareja sí existen y son de consulta; las descripciones antiguas que las marcaban inexistentes quedan corregidas arriba.
