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
