# Informe de trabajo — parte pública

## Línea base

- Rama: `publico-lista`.
- `npm install`: OK, código 0; auditó 455 paquetes, 0 vulnerabilidades. Mostró avisos ERESOLVE de peer dependencies de `@napi-rs/wasm-runtime` con `@emnapi/core` y `@emnapi/runtime`.
- `npm run typecheck`: OK.
- `npm test`: OK, 5 archivos y 45 tests (el documento de tareas indicaba 49).
- `npm run lint`: 0 errores y 11 warnings (10 enumerados en T04 y uno adicional en `lib/jugadores/publico.ts`, `estadisticasJugador` sin usar).

## Estado de tareas

| Tarea | Estado | Archivos tocados | Comandos y resultado |
|---|---|---|---|
| T00 | OK | `INFORME.md` | `npm install`, `npm run typecheck`, `npm test` (45 OK), `npm run lint` (0 errores, 11 warnings). |
| T01 | BLOQUEADA | `INFORME.md` | `npm ci` en el repo falla con `EPERM` al quitar `node_modules/lightningcss-win32-x64-msvc/lightningcss.win32-x64-msvc.node` (archivo en uso). Tras regenerar el lock, una instalación limpia temporal falla con `EUSAGE`: falta `@emnapi/runtime@` en el lock. Revertí el lockfile para no dejar una instalación inconsistente. |

T01 queda bloqueada por dos causas reproducibles: binarios nativos abiertos en el workspace y una dependencia `@emnapi` que npm 11 no resuelve correctamente en el lockfile. No cerré procesos externos porque pueden pertenecer al servidor de desarrollo del usuario.

## Tareas T02–T11

| Tarea | Estado | Archivos tocados | Comandos y resultado |
|---|---|---|---|
| T02 | EN CURSO | `lib/legal/contenido.ts`, `lib/legal/requisitos.ts`, `tests/legal.test.ts` | Búsqueda de `Caparr` en `lib app components actions`: sin resultados. `typecheck` bloqueado por `tsc` ausente tras T01; `npm install` no pudo reparar `node_modules` (`ENOTEMPTY`/`EPERM`, archivos en uso). Revisión jurídica pendiente (LSSI-CE art. 10: identificación del prestador). |
| T03 | EN CURSO | `docs/reglamento-tecnico.md` | Tabla de `TAMANOS` transcrita; sin cambios de código. Pendiente de confirmación por la organización: si el tope es por prueba, por categoría o ambos. |
