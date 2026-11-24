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
| T02 | BLOQUEADA | `lib/legal/contenido.ts`, `lib/legal/requisitos.ts`, `tests/legal.test.ts` | Búsqueda de `Caparr` en `lib app components actions`: sin resultados. `typecheck` bloqueado por `tsc` ausente tras T01; `npm install` no pudo reparar `node_modules` (`ENOTEMPTY`/`EPERM`, archivos en uso). Revisión jurídica pendiente (LSSI-CE art. 10: identificación del prestador). |
| T03 | OK | `docs/reglamento-tecnico.md`, `INFORME.md` | Tabla de `TAMANOS` transcrita; sin cambios de código. Pendiente de confirmación por la organización: si el tope es por prueba, por categoría o ambos. |
| T04 | BLOQUEADA | `actions/checkin.ts`, `actions/contacto.ts`, `actions/estadisticas.ts`, `actions/horarios.ts`, `actions/legal.ts`, `actions/noticias.ts`, `actions/patrocinio.ts`, `actions/simulador.ts`, `components/analitica/Graficas.tsx`, `components/horarios/EditorHorarios.tsx`, `lib/jugadores/publico.ts` | Quitados imports/declaración/comentario comprobados sin uso. No se pudo confirmar `lint` sin warnings: `npm install` terminó con `ENOTEMPTY`/`EPERM` al limpiar archivos de `node_modules` abiertos; `tsc` tampoco está disponible. |
| T05 | BLOQUEADA | `lib/cuadros/formatos.ts`, `actions/cuadros.ts`, `actions/cierre.ts`, `lib/cuadros/posiciones.ts` | Renombrado `RONDAS`/`Ronda` propios de formatos a `FASES_CUADRO`/`FaseCuadro`; `rg` en `lib/cuadros` y usos afectados no encuentra nombres antiguos. `typecheck` pendiente porque falta `tsc` en `node_modules` tras T01. |
| T06 | BLOQUEADA | `tests/escala-espejo.test.ts` | Test añadido para extraer las filas del `insert into public.points_scale` y comparar 28 valores; inspección estática de las 28 filas no detecta diferencias. No se puede ejecutar `vitest` porque `node_modules` quedó incompleto tras T01. |
