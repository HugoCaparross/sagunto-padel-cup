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
| Gestión de jugadores | Listado real con búsqueda y estado; no muestra email/teléfono | `/admin/jugadores`; ficha individual e historial siguen pendientes |
| Gestión de inscripciones | Filtros por torneo/estado/pago, verificar pago, confirmar pareja pagada y check-in | `/admin/inscripciones`; confirmar requiere pareja completa y el servicio valida el pago |
| Operación de partidos | Filtros por torneo/categoría/estado; editar programación y pista; resultado en solo lectura | `/admin/competicion`; la captura/corrección de marcador requiere un flujo de validación dedicado |
| Ranking administrativo | Tabla individual por categoría con puntos, pruebas y plazas Race to Master | `/admin/ranking`; empate de corte se identifica, falta aprobación de desempate |
| Gestión de contenidos | Crear borradores de noticias, filtrar y publicar/retirar | `/admin/contenidos`; gestión de galería y carga de imágenes siguen pendientes |
| Filtros de torneos | Búsqueda, estado, temporada y rango de fechas | `/admin/torneos`; fechas filtran por fecha de inicio del torneo |
| Creación de cuadros y captura/corrección de resultados | Pendiente; el área de partidos solo programa horarios/pistas y consulta marcadores | Diseñar con validación oficial e historial de cambios antes de habilitar mutaciones |
| Fichas completas de jugadores/parejas, historial deportivo | Pendiente | El listado de jugadores no expone datos privados y no tiene ficha detallada |
| Galería, categorías, Master y configuración | Pendiente de páginas operativas | Se mantienen fuera del menú para evitar destinos vacíos |
| Perfiles públicos y privacidad | Migración preparada, no aplicada | `public_player_profiles` requiere despliegue controlado y pruebas de roles |
| Campos sensibles de inscripción | Protección preparada, no aplicada | Trigger en migración; comprobar con pruebas de integración |
| Inscripciones concurrentes y capacidad sin máximo | Migración y RPC preparadas, no aplicadas | Revisar transacciones, permisos y aceptación de pareja en Supabase local/staging |
| Calendario 2026–2027 | Fechas confirmadas; seed preparado | `supabase/seed/official-calendar-2026-2027.sql`; no ejecutado. Las sedes/horas quedan vacías |
| Categorías y aforo configurable | Confirmado; esquema preparado | `supabase/migrations/20261001000200_unlimited_category_capacity.sql` permite `NULL` sin máximo |
| Master Final / Race to Master | Vista pública implementada por categoría | Muestra top 4 individual y empates en el corte; falta validar datos reales y desempate oficial |
| Tabla de puntos v1.1 | Conservada en constantes y lógica de ranking | Validar la asignación de resultados con fixtures/casos de integración |
| Cuadros, resultados y recalculado de puntos | Parcial | Hay lógica de dominio/servicios; faltan flujos operativos conectados y pruebas de extremo a extremo |
| RLS en todas las tablas | No verificado completamente | Revisar matches, ranking, grants y matriz completa de roles; ninguna migración aplicada |
| QA local (2 oct 2026) | `npm run qa`: 0 errores; `npm run build`: correcta con 39 rutas | ESLint 16 avisos; QA conserva 4 avisos por validadores opcionales ausentes; faltan pruebas integradas de Supabase |

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
| FAQ, contacto, galeria y configuracion | Pendiente de gestion desde panel | No hay rutas administrativas operativas comprobadas |
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