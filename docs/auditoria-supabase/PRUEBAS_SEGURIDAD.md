# Pruebas de seguridad y validación

## Resultados ejecutados

| Prueba | Resultado | Evidencia/alcance |
|---|---|---|
| Resolver ruta OAuth con parser local de Node (antes del fix) | **Ejecutada; defecto confirmado y luego corregido** | `/\\evil.example` relativo a una URL HTTPS externa resuelve a origen externo. No hubo conexión de red. |
| `npm.cmd test` | **Ejecutada; 4/4 pasaron** | Pruebas automatizadas para paths internos, normalización, URLs externas, `//`, backslash raw/encoded, controles y escapes malformados. |
| `npx.cmd tsc --noEmit` | **Ejecutada; pasó** | Incluye el módulo y tests TypeScript. Se activó `allowImportingTsExtensions` (noEmit) para importar la fuente real desde Node test runner. |
| `npm.cmd run lint` | **Ejecutada; 0 errores, 15 warnings** | Warnings en otros archivos del repo (img, location.assign y no-unused-vars); no se introdujeron errores. |
| `npm.cmd run build` | **Ejecutada; pasó** | Next 16.3.3 compiló, completó TypeScript y generó 40 páginas. |
| `git diff --check` | **Ejecutada** | Sin errores de whitespace en archivos versionados; advertencias CRLF de archivos modificados preexistentes. |
| Revisión estática del diagnóstico SQL | **Ejecutada; 19 sentencias SELECT/WITH** | Se separó en bloques y se comprobó que cada sentencia empieza por `SELECT` o `WITH`. No equivale a validar sintaxis contra la versión PostgreSQL remota. Incluye catálogos de `storage`; los settings de Auth siguen siendo revisión de Dashboard. |
| Inspección estática de clientes y referencias a claves | **Ejecutada parcialmente** | Cliente usa anon key; no se encontró service-role key en `src`. No es escaneo completo de secretos del entorno/hosting. |
| Inspección de guards en rutas/acciones administrativas | **Ejecutada parcialmente** | `requireAdminContext()` está presente en las superficies revisadas; layout no guarda por sí mismo. No se ejercitaron rutas HTTP. |
| Lectura de SQL de schema/migraciones | **Parcial; fuente actual no disponible** | Se revisaron extractos pegados por el usuario en turnos anteriores y el análisis previo. No están en el checkout ni en `HEAD`, así que no se pudo repetir lectura directa ni comparar baseline completo. |
| Consultas a Supabase / pruebas de escritura | **No ejecutadas** | No hay cliente SQL/CLI disponible ni staging confirmado. No se contactó Supabase. |
| Script independiente `npm run qa` | **No ejecutado** | Se corrieron suite de seguridad, TypeScript, ESLint y build; no se invocó el script QA adicional. |

El usuario había informado en una fase anterior seis contadores P0 en cero. Se registran como **resultado comunicado por el usuario**, no como prueba repetida o verificación de permisos/RPC.

## Estado actualizado de hallazgos

- **H-01:** el validador aislado pasó sus cuatro pruebas; el handler OAuth real no se ejecutó con proveedor/session. Prueba HTTP en staging pendiente.
- **H-02:** `changePlayerRoleAdmin` y `updatePlayerRole` no tienen consumidores; se eliminaron los helpers muertos, no el trigger. No hay operación activa que probar. Requiere requisito de producto si se solicita administrar roles desde la web.
- **H-06:** las Server Actions ya no escriben el log por separado y hay una propuesta de trigger transaccional con `EXECUTE` revocado a clientes. La atomicidad no queda demostrada hasta aplicar el trigger en staging y pasar las pruebas de rollback, actor y una fila por mutación. Publicar antes el cambio de aplicación dejaría las acciones sin auditoría.
- **H-03 a H-12:** sin cambios ni validaciones remotas. La auditoría queda en pausa; cualquier prueba de staging requiere solicitud expresa para reanudarla.

## Preparación previa para staging

1. Confirmar por canal independiente que el proyecto es staging y crear backup/snapshot.
2. Crear datos sintéticos: admin, dos jugadores normales, categorías habilitadas, torneo abierto con cupo pequeño y una temporada activa. No usar PII real.
3. Preparar dos sesiones autenticadas separadas y una sesión anónima. No copiar tokens en informes.
4. Aplicar migraciones únicamente por el procedimiento de staging aprobado; comparar catálogo antes/después.
5. Cada caso debe registrar rol, operación, resultado esperado/real e IDs sintéticos, sin credenciales.

## Matriz de pruebas

| ID | Actor/flujo | Prueba | Resultado esperado | Estado |
|---|---|---|---|---|
| S-01 | Anónimo | Consultar perfiles, inscripciones, notificaciones y la vista pública | No se exponen PII ni filas privadas; la vista solo muestra perfiles con opt-in y columnas aprobadas | En pausa; requiere reanudar auditoría staging |
| S-02 | Jugador A | Leer/editar su perfil permitido; intentar leer/editar perfil B | Perfil propio permitido solo en campos permitidos; B y campos sensibles denegados | Pendiente staging |
| S-03 | Jugador A | Invocar RPC administrativa de confirmar/cancelar/promover | Rechazo por autorización (`42501` o equivalente), sin cambios | Pendiente staging |
| S-04 | Jugador A | Modificar `role`, pago, check-in, destinatario/contenido de notificación o QR | Denegado por RLS/trigger; valores originales intactos | Pendiente staging |
| S-05 | Admin | Ejecutar transiciones válidas e inválidas de registro/pago/check-in | Válidas según máquina aprobada; inválidas rechazadas sin escrituras parciales | Pendiente staging |
| S-06 | Dos admins | Inscribir simultáneamente dos parejas con una plaza disponible | Exactamente una ocupa plaza; otra queda en lista de espera o recibe conflicto según regla aprobada; nunca sobrecupo | Pendiente staging |
| S-07 | Dos sesiones | Promover dos inscripciones de espera para una plaza | Solo una promoción confirmada; estado de pareja/registro/pago consistente | Pendiente staging |
| S-08 | Dos jugadores | Mismo jugador en slots cruzados o categorías concurrentes | Comportamiento conforme a regla aprobada; una regla global debe aplicarse atómicamente, no solo en UI | Pendiente decisión + staging |
| S-09 | Pareja | Inscribir jugador 1 y jugador 2; probar jugador 2 inexistente/inactivo/no participante | No crear pareja inválida ni exponer datos; consentimiento conforme al flujo aprobado | Pendiente staging |
| S-10 | Admin/pareja | Cancelar antes y después de check-in o partido; repetir cancelación | Antes permitido según estado; después denegado; pareja y registro sincronizados; retry idempotente | Pendiente staging |
| S-11 | Admin | Fallo inducido de audit insert tras mutación | La acción y audit deben confirmar/rollback juntos; comprobar una fila por mutación y ningún duplicado | Propuesta local; pendiente aplicar trigger y prueba en staging |
| S-12 | Admin | Cambio de rol autorizado, normal no autorizado, intento de quitar último admin | No existe flujo web/RPC actualmente; si se aprueba como requisito futuro, proteger último admin y log actor/objetivo | No aplica al flujo actual; diseño futuro pendiente |
| S-13 | Admin | Crear/cerrar temporada, repetir RPC, rollover y escribir puntos concurrentemente con cierre | Un hijo/rollover/snapshot; retry idempotente; cierre serializa cambios; archivada impide corrección ordinaria | Pendiente staging |
| S-14 | Cliente público | Enviar `next` como `/\\evil.example`, `//evil.example`, `%5c`, URL externa | Callback solo redirige mismo origen o destino allowlisted | Validador corregido y unit tests pasados; callback HTTP staging pendiente |
| S-15 | SQL/API | Intentar insertar registro con torneo/categoría distintos de pareja y partido con pareja de otro torneo | Rechazo en base de datos o RPC central validada | Pendiente corrección/integridad |
| S-16 | Auth/Storage | Alta/baja de usuario, callback allowlist, subida/lectura/borrado por bucket | Configuración coincide con política de privacidad; no acceso cruzado | Pendiente dashboard |

## Concurrencia y evidencia

Para S-06 y S-07 usar transacciones/sesiones separadas y barrera de inicio coordinada. Repetir al menos 20 veces en staging con datos sintéticos y comprobar conteos tras cada ronda. No hacer esta prueba en producción. Guardar solo agregados, SQLSTATE y trazas sin tokens ni información personal.

## Criterio de cierre

No cerrar P0 hasta: catálogo remoto comparado con Git, todas las rutas de escritura sensibles probadas por actor, plazas sin sobrecupo bajo concurrencia, transiciones confirmadas, historial/auditoría consistente, temporadas idempotentes y acceso anónimo probado sobre PostgREST y Storage. Los estados pendientes de decisión de negocio se deben resolver antes de añadir constraints que puedan prohibir flujos legítimos.


La verificación de acceso a contenido multimedia era parte de la matriz anterior y queda retirada junto con esa funcionalidad de la aplicación. No se borraron sus tablas ni datos de Supabase.

## Revalidación local — 4 de octubre de 2026

Tras retirar la funcionalidad multimedia: `npm test` 4/4; `npm run qa` 0 errores y 4 warnings por validadores opcionales ausentes; `npx tsc --noEmit` pasó; ESLint 0 errores y 14 warnings; `npm run build` pasó y generó 39 páginas. La búsqueda de referencias funcionales/visuales no encontró coincidencias en `src`, `scripts`, `public`, README ni documentación de producto. Las únicas menciones restantes están en el archivo de diagnóstico histórico congelado y en la nota H-04 archivada. Ninguna prueba se conectó a Supabase.