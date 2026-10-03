# Hallazgos de auditoría

Estados: **Confirmado local** significa demostrado por el código/SQL versionado o un experimento local aislado. **Probable** necesita confirmar flujo/regla. **Pendiente remoto** requiere catálogo o prueba del proyecto Supabase. Ningún estado equivale a una vulnerabilidad remota comprobada.

## H-01 — Redirección externa desde el callback OAuth

- **Severidad:** Medio. **Estado:** Corregido localmente; callback HTTP remoto pendiente.
- **Componente:** `src/lib/auth/flow.ts:getSafeNextPath`; `src/app/auth/callback/route.ts`.
- **Evidencia original:** la función anterior aceptaba cualquier cadena que empezaba por `/` excepto `//`. `new URL('/\\evil.example', 'https://spc.example')` produce origen `https://evil.example`. El callback redirigía al destino tras crear sesión.
- **Impacto/condición:** un atacante puede preparar un enlace de callback con parámetro `next` manipulado y enviar a la víctima a un sitio externo después de autenticarse; facilita phishing. No se observó exposición de token en el destino.
- **Corrección aplicada:** `src/lib/auth/safe-next-path.ts` exige path root-relative, rechaza `\\` literal y codificada, slash codificado, controles, escapes inválidos y cualquier URL cuyo origen parseado difiera del origen interno fijo; devuelve path/query/hash normalizados. Callback importa esta función aislada.
- **Efectos secundarios:** se rechazan rutas ambiguas/codificadas que antes podían aceptarse. Los destinos usados hoy (`/registro/confirma`, `/restablecer`) se conservan.
- **Pruebas:** `tests/auth/safe-next-path.test.ts`, 4 pruebas pasaron: rutas normales/normalización, protocolos externos, separadores/controles/escapes y valores vacíos/relativos. HTTP callback todavía pendiente en staging.

## H-02 — Cambio de rol administrativo bloqueado por trigger

- **Severidad:** Medio (integridad/funcionalidad). **Estado:** Helper eliminado localmente; necesidad de un flujo de roles pendiente de producto.
- **Componente:** migración `20261003000400_registration_rls_hardening.sql`/trigger `prevent_self_role_escalation`; helpers `changePlayerRoleAdmin()` y `updatePlayerRole()`.
- **Evidencia:** el trigger versionado rechaza cambios de `role` salvo actor `service_role`; ambos helpers llamaban a `updatePlayer({ role })`. Búsqueda global bajo `src` encontró solo sus definiciones: no había consumidores. `updatePlayerRole()` además documentaba protección `requireAdmin()` que no ejecutaba por sí mismo.
- **Impacto/condición:** la operación que exponía el helper habría fallado en la BD; no existía un flujo de usuario activo. El trigger sigue protegiendo el rol.
- **Corrección aplicada:** se eliminaron ambos helpers muertos. No se añadió RPC ni se relajó el trigger.
- **Efectos secundarios:** la aplicación no ofrece una función para asignar/quitar roles admin. Si pasa a ser requisito, deberá diseñarse separadamente con protección del último admin y auditabilidad.
- **Prueba:** `rg` confirmó ausencia de consumidores antes del cambio; TypeScript, lint y build pasaron después. Falta staging solo si se crea un flujo futuro.

## H-03 — Cierre y rollover incompatibles con el esquema base

- **Severidad:** Alto funcional. **Estado:** Confirmado en SQL base de `HEAD`; remoto pendiente.
- **Componente:** `supabase/schema.sql` de `HEAD`, `close_season(uuid)`, `create_season_from_previous(...)`, tabla `seasons`, `ranking_points`.
- **Evidencia:** enum `season_status` no contiene `finalizada`, pero ambas funciones la usan; la columna `ranking_points.tournament_id` es `NOT NULL`, mientras rollover inserta `NULL`.
- **Impacto/condición:** el cierre/creación derivada no puede completarse con ese esquema sin una reparación posterior. Dado que las migraciones posteriores fueron borradas localmente, no se conoce la definición remota vigente.
- **Corrección:** verificar migraciones y catálogo remotos; en una migración revisada, usar `archivada` terminal, permitir puntos de operación de temporada mediante constraint explícito, hacer rollover idempotente y bloquear escrituras tardías contra temporadas archivadas.
- **Efectos secundarios:** cambiar `NOT NULL` afecta todas las escrituras y tipos generados; requiere reconciliar filas antiguas y probar ranking por torneo/temporada.
- **Prueba:** cierre con snapshot, retry idempotente, rollover una sola vez, rechazo de corrección en temporada archivada y concurrencia cierre/escritura.

## H-04 — Lectura pública de elementos no publicados de galería

- **Severidad:** Medio. **Estado:** Confirmado en esquema base de `HEAD`; remoto pendiente.
- **Componente:** `gallery_items`, política base `lectura publica galeria`; `src/lib/public/site.ts:getPublicGallery()`.
- **Evidencia:** política pública `USING (true)`; la aplicación filtra `published=true`, pero PostgREST permite consultar la tabla según grants/policies.
- **Impacto/condición:** fotos en borrador, metadatos, etiquetas o autor podrían ser consultables directamente si la política base está desplegada. Condicionado a que datos no publicados se consideren privados.
- **Corrección:** limitar SELECT público a `published=true`; reducir columnas expuestas mediante vista segura si se deben ocultar `metadata`, uploader o etiquetas.
- **Efectos secundarios:** algunas páginas admin consultan filas no publicadas y necesitarán acceso admin explícito; confirmar compatibilidad con políticas OR.
- **Prueba:** anon no ve borradores; admin sí; público solo ve columnas autorizadas.

## H-05 — Privilegios de tabla y privilegios por defecto demasiado amplios

- **Severidad:** Medio. **Estado:** Confirmado en dump de `HEAD`; efecto remoto pendiente.
- **Componente:** `supabase/schema.sql`, grants sobre tablas/funciones y `ALTER DEFAULT PRIVILEGES`.
- **Evidencia:** `GRANT ALL` a `anon` y `authenticated` aparece para tablas públicas; default privileges vuelven a conceder ALL para futuras tablas, funciones y secuencias.
- **Impacto/condición:** hoy RLS sigue aplicando a los roles normales, por lo que el grant amplio no demuestra acceso no autorizado por sí solo. Aumenta riesgo por políticas amplias, futuras tablas sin RLS y funciones ejecutables accidentalmente.
- **Corrección:** inventariar privilegios efectivos e ownership; revocar por defecto y conceder solo operaciones necesarias por tabla/columna/RPC. Mantener `service_role` solo en sistemas de backend confiables.
- **Efectos secundarios:** puede romper `INSERT/UPDATE/DELETE` legítimos o llamadas RPC existentes; hacer primero mapa de consultas y probar staging.
- **Prueba:** `has_table_privilege`, `has_column_privilege`, `has_function_privilege`; probar flujos por rol después de migración.

## H-06 — Auditoría de operaciones de inscripción no transaccional

- **Severidad:** Medio. **Estado:** Confirmado en flujo de aplicación.
- **Componente:** `src/app/(admin)/admin/inscripciones/actions.ts:writeRegistrationAudit` y RPCs invocadas desde `src/lib/services/admin.ts`/`registrations.ts`.
- **Evidencia:** la operación principal se realiza por RPC y el registro se inserta después mediante otra llamada; el código reconoce `auditoria_error` aunque el cambio de negocio ya pudo confirmarse.
- **Impacto/condición:** el historial puede omitir una cancelación, promoción, pago o check-in si falla la segunda llamada.
- **Corrección:** mover mutación y audit insert a una RPC transaccional que valide admin, o crear mecanismo de outbox; capturar actor, entidad, antes/después y resultado.
- **Efectos secundarios:** RPC unificada debe mantener compatibilidad de respuestas/errores y bloquear de forma coherente filas relacionadas.
- **Prueba:** forzar error de escritura de auditoría en staging; comprobar rollback o reintento recuperable sin duplicar acción.

## H-07 — Restricciones relacionales incompletas para alcance de torneo/categoría

- **Severidad:** Medio. **Estado:** Confirmado en esquema base; reglas cruzadas pendientes.
- **Componente:** FKs de `registrations`, `pairs`, `matches`, `groups`, `group_standings`, `brackets`, `ranking_points`.
- **Evidencia:** FKs independientes a torneo, categoría y pareja/grupo no garantizan que sus IDs pertenezcan al mismo torneo/categoría. Algunos flujos comparan alcance desde aplicación/RPC.
- **Impacto/condición:** una escritura administrativa, error de servicio o futura RPC defectuosa puede crear relaciones cruzadas que consultas y cuadros interpreten mal.
- **Corrección:** listar invariantes oficiales; incorporar claves únicas compuestas y FKs compuestas cuando el modelo lo permita, o centralizar escritura en RPC y añadir constraints diferibles/trigger validado. No imponer regla de exclusividad entre categorías hasta aprobación deportiva.
- **Efectos secundarios:** limpieza previa de datos y cambios en tipos/joins; migración debe abortar con diagnóstico seguro si existen filas incompatibles.
- **Prueba:** inserts cruzados deben fallar y flujos válidos de inscripción/fixture/ranking seguir funcionando.

## H-08 — Exclusividad del jugador en distintas categorías no está garantizada por índices parciales

- **Severidad:** Medio. **Estado:** Probable/pendiente de regla y carrera concurrente.
- **Componente:** índices `pairs_player_1_unique_active`, `pairs_player_2_unique_active`; `registrar_pareja`; validación `validatePlayerTournamentEligibility`.
- **Evidencia:** los índices separan slot 1 y slot 2, y segmentan por categoría; no impiden que una persona aparezca como jugador 1 en un par y jugador 2 en otro o en otra categoría. La RPC consultada comprueba duplicado dentro de categoría, mientras la validación de aplicación comprueba torneo más ampliamente.
- **Impacto/condición:** solo si la regla aprobada prohíbe más de una inscripción por jugador en todo el torneo; dos solicitudes concurrentes pueden eludir validación solo de aplicación.
- **Corrección:** confirmar regla; si aplica, bloquear una fila común de torneo o usar tabla de asignación jugador/torneo con unique key para hacerla atómica.
- **Efectos secundarios:** puede prohibir participación múltiple legítima. No cambiar hasta confirmar reglamento.
- **Prueba:** solicitudes concurrentes en categorías/slots cruzados, más caso legítimo multi-categoría si existe.

## H-09 — Estados de inscripción y pago requieren prueba de transición

- **Severidad:** Medio. **Estado:** Probable; versiones desplegadas desconocidas.
- **Componente:** `registrar_pareja`, `registrations.estado`, `payment_status`, `admin_confirm_registration`.
- **Evidencia:** esquema base/RPC crea en algunos casos `estado='confirmada'` con pago `pendiente`; operación administrativa de confirmar exige registro `pendiente_pago` y pago verificado o no aplicable. Las migraciones P0 intentan unificar esto, pero faltan del checkout actual.
- **Impacto/condición:** el personal podría no disponer de una transición válida para marcar como confirmada una inscripción recién creada o el cupo podría contabilizar estados distintos entre flujos.
- **Corrección:** diagramar máquina de estados aprobada y hacer que RPC de alta, pago y confirmación la apliquen de manera consistente.
- **Efectos secundarios:** cambiar estado histórico o criterios de cupo requiere backfill revisado; no deducir cambios deportivos desde el UI.
- **Prueba:** tabla de transiciones válidas/inválidas y dos sesiones compitiendo por última plaza.

## H-10 — Área admin depende de guardas distribuidas

- **Severidad:** Bajo/Informativo. **Estado:** Confirmado en arquitectura local.
- **Componente:** `src/app/(admin)/admin/layout.tsx`; páginas, acciones y servicios individuales.
- **Evidencia:** el layout no es guard de autorización; se encontraron guardas `requireAdminContext()` en páginas/actions revisadas y RLS admin para escrituras.
- **Impacto/condición:** una ruta nueva que omita la guarda podría revelar datos consultados a un usuario autenticado antes de que RLS filtre filas o si usa una consulta pública.
- **Corrección:** añadir gate en layout como defensa en profundidad; conservar validación de cada Server Action y RLS.
- **Efectos secundarios:** revisar redirect de admins/player y páginas de error/loading.
- **Prueba:** rol player/anon contra rutas admin y acciones invocadas directamente.

## H-11 — Identidad de jugadores, cuentas desvinculadas y privacidad requieren revisión remota

- **Severidad:** Bajo/Medio. **Estado:** Pendiente remoto/privacidad.
- **Componente:** `players.auth_user_id`, índice no único en esquema base, `handle_new_user`, campos personales, `public_player_profiles`.
- **Evidencia:** base define índice normal en `auth_user_id`, email unique sensible a mayúsculas y `ON DELETE SET NULL` para Auth user; el trigger crea perfil desde metadata y rol por defecto player.
- **Impacto/condición:** identidades duplicadas o perfil huérfano podrían complicar recuperación, borrado y minimización de datos; no se observaron valores de usuarios.
- **Corrección:** revisar duplicados con agregados y procedimiento de baja/retención; añadir unicidad normalizada solo después de resolver colisiones y confirmar requisitos legales.
- **Efectos secundarios:** merge/unique index puede fallar o bloquear registros legítimos.
- **Prueba:** alta duplicada con email normalizado, eliminación/desvinculación Auth y proceso de solicitud de baja.

## H-12 — Catálogo remoto, Storage y configuración Auth sin verificar

- **Severidad:** Informativo. **Estado:** Pendiente.
- **Componente:** proyecto Supabase remoto, Storage, Auth, grants, migraciones.
- **Evidencia:** no hubo `psql`, Supabase CLI ni sesión read-only confirmada; la referencia de proyecto no se expuso ni se usó. No hay `supabase/config.toml` ni políticas Storage suficientes en el checkout.
- **Impacto:** no se puede comparar esquema aplicado, permisos efectivos, settings Auth ni Storage.
- **Acción:** una persona con acceso al dashboard debe confirmar explícitamente staging y ejecutar las consultas SQL de diagnóstico en una sesión de solo lectura.
- **Prueba:** entregar resultados de bloques identificados en `CONSULTAS_DIAGNOSTICO.sql`; revisar con responsable antes de preparar migraciones.
