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
| T06 | OK | `tests/escala-espejo.test.ts` | Test añadido y ejecutado. La escala coincide con las 28 filas de `points_scale`; suite final: 8 archivos y 50 tests OK. |
| T07 | BLOQUEADA | `lib/patrocinio/publico.ts`, `INFORME.md` | Auditoría: `sitemap` filtra noticias publicadas, pruebas con estado distinto de `proxima` y perfiles visibles; perfiles públicos filtran visibilidad y ocultan datos deportivos si son privados; pruebas usan cliente de servidor sujeto a RLS (el enum no tiene estado borrador); ranking solo expone nombres/fotos al comprobar visibilidad; cuenta filtra inscripciones por `jugador_1/jugador_2` y puntos por `jugador_id`. Corregido histórico de patrocinadores para limitar a `activo = true`. Premios: cuadro oro, descripción oculta hasta `revelar_at`; `NULL` se interpreta como publicación inmediata en la regla existente. Tipos/tests bloqueados por `node_modules` incompleto. |
| T08 | BLOQUEADA | `supabase/migrations/20261125000000_slug_perfiles.sql`, `lib/jugadores/slug.ts`, `tests/jugador-slug.test.ts`, `lib/jugadores/publico.ts`, `app/sitemap.ts`, `types/database.types.ts` | Añadido slug con fallback `jugador` para nombres vacíos, consulta solo por slug (sin UUID fallback), sitemap por slug y tipo nullable. No hay MCP de Supabase disponible; migración no aplicada. Tests/typecheck bloqueados por instalación incompleta. Migración pendiente de aprobación de Hugo antes de aplicar a producción. |
| T09 | BLOQUEADA-ENTORNO | — | `npm run build` con variables ficticias falla al cargar Next: `Cannot find module '@swc/helpers/_/_interop_require_default'` (Node v24.12.0); entorno `node_modules` incompleto por T01. No llegó a la fase de Google Fonts. |
| T10 | BLOQUEADA-ENTORNO | `scripts/smoke-publico.sh` | Script creado para 17 rutas (200) y una inexistente (404). No ejecutable aquí: Windows deniega acceso a `bash.exe`, y el build no permite levantar el servidor. |

## Verificación final

| Comando | Resultado |
|---|---|
| `npm ci` | BLOQUEADA: `EPERM` al eliminar binarios nativos abiertos; copia temporal limpia reveló entradas `@emnapi` ausentes del lock. |
| `npm run typecheck` | BLOQUEADA: TypeScript no encuentra `lib.esnext.d.ts` ni tipos globales estándar tras la instalación incompleta. |
| `npm test` | OK: 8 archivos y 50 tests. Línea base anterior: 5 archivos y 45 tests. |
| `npm run lint` | BLOQUEADA: ESLint no encuentra `./source-code` en `node_modules/eslint`; T04 retiró los usos sin uso identificados, pero no se pudo verificar 0 warnings. |
| `npm run build` | BLOQUEADA-ENTORNO: falta `@swc/helpers/_/_interop_require_default`. |

## Decisiones pendientes de Hugo

- Confirmar si el cupo máximo es por prueba, por categoría o ambos (T03).
- Revisión jurídica del aviso legal (LSSI-CE art. 10: identificación del prestador) (T02).
- Aprobar la migración de slug antes de aplicarla en producción (T08). La migración no se ha aplicado.
- No se detectaron discrepancias de escala; la prueba de espejo ejecutada pasó (T06).

## Commits de la rama `publico-lista`

- `d4fdf98` — `chore: línea base verificada`
- `8eec177` — `chore: sincroniza package-lock.json`
- `3e3edef` — `fix(legal): titular Sagunto Padel Cup sin datos personales`
- `98de84b` — `docs: reglas de cupo documentadas (pendiente de confirmación)`
- `ca49caa` — `chore: elimina warnings de lint sin usar`
- `0776866` — `refactor: renombra RONDAS de formatos a FASES_CUADRO`
- `e991dd6` — `test: escala de puntos coincide con seed.sql`
- `082f9a4` — `fix(seguridad): filtros públicos explícitos en lecturas con cliente admin`
- `6a62ac5` — `feat(jugadores): slug público en fichas de jugador (migración sin aplicar)`
- `b190097` — `test: smoke test de rutas públicas`

### Detalle de auditoría T07

| Consulta | Filtro / privacidad | Resultado |
|---|---|---|
| `app/sitemap.ts` noticias | `publicada = true` | OK |
| `app/sitemap.ts` pruebas | `estado <> proxima` | OK |
| `app/sitemap.ts` perfiles | `visibilidad_publica = true` | OK |
| `lib/jugadores/publico.ts` ficha/listado | La ficha privada retorna `null` salvo propietario; listado filtra visibilidad; datos deportivos solo visibles para perfil público | OK |
| `lib/pruebas/publico.ts` | Cliente de servidor con RLS pública; enum sin estado borrador | OK |
| `lib/patrocinio/publico.ts` patrocinadores | Activos en ficha e histórico | CORREGIDO (histórico admin añadía activos) |
| `lib/patrocinio/publico.ts` premios | Solo cuadro Oro; `revelar_at` futuro oculta descripción y `NULL` publica de inmediato | OK; regla observada, no se cambia |
| `lib/ranking/cargar.ts` | Nombre anonimizado al mapear ranking; fotos firmadas solo para IDs visibles en home | OK |
| `lib/cuenta/cargar.ts` | Inscripciones limitadas por `jugador_1/jugador_2`; puntos por `jugador_id` | OK |
