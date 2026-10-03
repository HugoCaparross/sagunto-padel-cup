# Plan de correcciones propuesto

No se aplicaron cambios a ninguna base. La auditoría queda en pausa por decisión del propietario. Permanecen dos borradores SQL no aplicados, para H-03 (temporadas) y H-06 (auditoría transaccional), en `propuestas/`. Se basan en SQL pegado anteriormente; el esquema/migraciones fuente no están en el checkout actual. No son aptos para aplicación hasta recuperar el baseline y compararlos con staging.

| Prioridad | Trabajo | Objetos/rutas | Dependencias y control de riesgo |
|---|---|---|---|
| P0 | H-01, cerrado local | `src/lib/auth/safe-next-path.ts`, callback, tests | Implementado y probado con Node. Falta callback HTTP en staging y confirmar enlaces de retorno reales. |
| P0 | H-03, borrador preparado; estado remoto pendiente | enum, `close_season`, `create_season_from_previous`, `ranking_points` | Revisar `propuestas/REPARACION_TEMPORADAS.sql` junto con la migración 006 que pudo aplicarse. Ejecutar bloques 3, 6, 8A, 8B, 9A. El borrador aborta si encuentra duplicados, pero no está validado sobre la BD remota. |
| P1 | H-02, helpers eliminados; no hay corrección DB | `changePlayerRoleAdmin`, `updatePlayerRole`, trigger | Sin consumidores, se quitaron ambos helpers. No crear RPC hasta que se confirme requisito de administración de roles. Si se aprueba, proteger último admin y registrar actor dentro de operación atómica. |
| P1 | Limitar otros datos públicos | policies de `sponsors`, vista de perfiles, ranking | En pausa. Requiere reanudar expresamente la auditoría y obtener catálogo remoto antes de proponer cambios. |
| P1 | Reducir grants excesivos | grants/default privileges de tablas/funciones/secuencias | Construir inventario real de `anon`, `authenticated`, `service_role`, ownership y funciones. Aplicar matriz por módulo; no revocar globalmente sin probar dependencias. |
| P1 | H-06, trigger propuesto y Server Actions coordinadas | `registrations`, `audit_log`, `inscripciones/actions.ts` | Revisar `propuestas/AUDITORIA_INSCRIPCIONES_ATOMICA.sql`; aplicar/probar primero en staging y desplegar luego la app. El trigger guarda actor/antes/después. Verificar una fila por cambio y rollback si falla el log. |
| P1 | Validar estados de registro/pago | registrar, confirmar, plazas y promoción | Aprobar máquina de estados; unificar estado de pareja/registro/pago. Antes de backfill, identificar datos discordantes con conteos agregados. |
| P2 | Asegurar alcance relacional | constraints/FKs compuestas para torneo/categoría/pareja | Preparar primero consultas de huérfanos y cruces. Aplicar constraints `NOT VALID`/validación posterior si versión PostgreSQL lo permite y despliegue lo requiere. |
| P2 | Revisar exclusividad de jugador | RPC de registro, índices/tablas de asignación | Requiere decisión del reglamento sobre varias categorías. Si se prohíbe, serializar por torneo y cubrir slots cruzados concurrentes. |
| P2 | Defensa en profundidad del panel | `(admin)/admin/layout.tsx` | Comprobar redirecciones y mantener guardas dentro de acciones. No sustituye RLS. |
| P2 | Privacidad y ciclo de vida Auth | players, `handle_new_user`, cuenta/retención | Definir proceso de baja, anonimización y datos históricos; resolver duplicados antes de índices normalizados. |
| P3 | Inventariar Auth y Storage | dashboard/Auth/Storage | Confirmar redirect allowlist, providers, MFA si aplica, rate limits, bucket visibility y policies. Ninguna configuración se cambia durante auditoría. |

## Dependencias y conflictos a resolver antes de migrar

- **Grants vs. RLS:** reducir grants antes o junto a nuevas policies puede romper operaciones hoy funcionales. Primero inventariar permisos efectivos (bloques 5A–5C y 6) y ejecutar pruebas de rol.
- **Auditoría atómica vs. RPC de registro:** H-06 necesita integrar log y mutación en la misma transacción. No combinar esa migración con cambios de enum/cupo; definir respuesta idempotente por acción.
- **Restricciones compuestas vs. históricos:** H-07 requiere limpiar/probar datos cruzados antes de validar constraints. Afecta escrituras de inscripción, grupos y cuadros.
- **Exclusividad de pareja vs. categorías:** H-08 depende de reglamento. Un índice único o lock demasiado amplio puede prohibir participación múltiple autorizada.
- **Temporadas vs. puntos de torneo:** H-03 necesita comprobar si migraciones `005/006` u otras correcciones existen remotamente. No reaplicar ni recrear la migración desde los archivos eliminados antes de comparar catálogo e historial.
- **Roles:** H-02 no depende de cambios de BD mientras no haya requisito activo. Si se solicita, debe ser una pieza independiente de la hardening de registros.

## Trabajo local completado en esta fase

- H-01 implementado y con cuatro pruebas automatizadas.
- H-02 helpers de rol no utilizados retirados; trigger de DB no se modificó.
- Diagnóstico SQL reordenado en bloques 1–9 y ampliado con enums; bloque de migraciones marcado opcional; anotadas dependencias por hallazgo.
- QA local: test, TypeScript, ESLint y build completados; no se conectó a Supabase.
- Se prepararon propuestas no aplicadas para H-03/H-04/H-06 fuera del directorio de migraciones activas.
- H-06: se preparó trigger transaccional y se eliminó el segundo insert de audit desde Server Actions. Requiere instalar trigger antes de desplegar el código.

## Propuestas SQL conservadas mientras la auditoría está en pausa

1. **H-06, auditoría transaccional:** borrador de trigger en `propuestas/AUDITORIA_INSCRIPCIONES_ATOMICA.sql`. Instalar y probar en staging antes de desplegar las Server Actions actualizadas.
2. **H-03, rollover de temporada:** borrador en `propuestas/REPARACION_TEMPORADAS.sql`. No revisar/aplicar hasta reanudar auditoría, recuperar el baseline y cotejar el estado remoto.

No hay una propuesta activa para contenido multimedia; la anterior se retiró al eliminar esa funcionalidad de la aplicación. La base de datos no se modificó.
## Reversión y despliegue

- Aplicar primero en staging con copia de datos sintéticos o anonimizados.
- Guardar inventario pre/post de policies, grants, funciones, triggers y constraints.
- Para cambios de política/grants, revertir restaurando la matriz concreta anterior si los flujos fallan; no usar `GRANT ALL` como rollback general.
- Para constraints, revertir solo después de comprobar integridad de filas y dependencias.
- Para rollover/snapshot, no borrar ledger ni snapshots como rollback automático; preferir migración correctiva compensatoria y auditada.
- Producción: aprobación explícita, ventana, backup verificado, aplicación por migraciones y smoke tests posteriores.
