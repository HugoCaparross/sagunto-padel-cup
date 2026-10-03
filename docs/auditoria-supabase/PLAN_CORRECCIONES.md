# Plan de correcciones propuesto

No se aplica ninguna corrección en esta fase. Antes de preparar migraciones, ejecutar el diagnóstico remoto sobre staging y resolver los puntos de decisión indicados. No copiar SQL a producción directamente.

| Prioridad | Trabajo | Objetos/rutas | Dependencias y control de riesgo |
|---|---|---|---|
| P0 | H-01, cerrado local | `src/lib/auth/safe-next-path.ts`, callback, tests | Implementado y probado con Node. Falta callback HTTP en staging y confirmar enlaces de retorno reales. |
| P0 | Verificar si temporadas sigue defectuosa en remoto | enum, `close_season`, `create_season_from_previous`, `ranking_points` | Ejecutar bloques 3, 6, 8A, 8B, 9A. Si falta arreglo, diseñar migración separada con `archivada`, rollover idempotente y protección contra escrituras tras snapshot. Resolver duplicados existentes antes del índice único. |
| P1 | H-02, helpers eliminados; no hay corrección DB | `changePlayerRoleAdmin`, `updatePlayerRole`, trigger | Sin consumidores, se quitaron ambos helpers. No crear RPC hasta que se confirme requisito de administración de roles. Si se aprueba, proteger último admin y registrar actor dentro de operación atómica. |
| P1 | Limitar datos públicos | políticas `gallery_items`, `sponsors`, vista de perfiles, ranking | Remoto pendiente: ejecutar bloques 3, 4, 5A, 8D, 9A. Confirmar qué filas/columnas son públicas. Policies permisivas se combinan OR. No cambiar hasta comprobar consulta pública y admin. |
| P1 | Reducir grants excesivos | grants/default privileges de tablas/funciones/secuencias | Construir inventario real de `anon`, `authenticated`, `service_role`, ownership y funciones. Aplicar matriz por módulo; no revocar globalmente sin probar dependencias. |
| P1 | Hacer operación y auditoría atómicas | RPCs de inscripción y `audit_log` | Agregar una llamada transaccional que actualice estado y loguee actor/antes/después. Compatibilidad de la action UI y comportamiento idempotente. |
| P1 | Validar estados de registro/pago | registrar, confirmar, plazas y promoción | Aprobar máquina de estados; unificar estado de pareja/registro/pago. Antes de backfill, identificar datos discordantes con conteos agregados. |
| P2 | Asegurar alcance relacional | constraints/FKs compuestas para torneo/categoría/pareja | Preparar primero consultas de huérfanos y cruces. Aplicar constraints `NOT VALID`/validación posterior si versión PostgreSQL lo permite y despliegue lo requiere. |
| P2 | Revisar exclusividad de jugador | RPC de registro, índices/tablas de asignación | Requiere decisión del reglamento sobre varias categorías. Si se prohíbe, serializar por torneo y cubrir slots cruzados concurrentes. |
| P2 | Defensa en profundidad del panel | `(admin)/admin/layout.tsx` | Comprobar redirecciones y mantener guardas dentro de acciones. No sustituye RLS. |
| P2 | Privacidad y ciclo de vida Auth | players, `handle_new_user`, cuenta/retención | Definir proceso de baja, anonimización y datos históricos; resolver duplicados antes de índices normalizados. |
| P3 | Inventariar Auth y Storage | dashboard/Auth/Storage | Confirmar redirect allowlist, providers, MFA si aplica, rate limits, bucket visibility y policies. Ninguna configuración se cambia durante auditoría. |

## Dependencias y conflictos a resolver antes de migrar

- **Grants vs. RLS:** reducir grants antes o junto a nuevas policies puede romper operaciones hoy funcionales. Primero inventariar permisos efectivos (bloques 5A–5C y 6) y ejecutar pruebas de rol.
- **Galería pública vs. panel admin:** añadir `published=true` a SELECT público no debe retirar lectura de borradores a admins; revisar policies existentes, porque permissive se combinan con OR.
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

## Propuesta de migraciones futuras

Separar para revisión y rollback controlado:

1. **`secure_public_gallery`**: política pública de solo publicados y vista con columnas permitidas, tras revisar consumidores admin y nombres de policies existentes.
2. **`registration_audit_atomicity`**: RPC transaccional para cada operación administrativa y bitácora atómica; conceder EXECUTE solo a `authenticated`; comprobar `is_admin()` dentro de la función.
3. **`registration_scope_constraints`**: constraints/FKs de alcance después de resolver discrepancias existentes.
4. **`season_rollover_integrity`**: solo si catálogo remoto confirma que falta la corrección; debe manejar `archivada`, filas de rollover, idempotencia, lock de temporada y snapshot. Validar cálculo/rounding de acuerdo con la decisión vigente.
5. **`least_privilege_grants`**: por objeto y separado de cambios funcionales, acompañado de pruebas por rol y análisis de funciones expuestas.

Cada migración debe incluir preflight read-only, SQL transaccional cuando sea compatible, verificaciones post-aplicación y procedimiento de reversión. Los cambios de datos destructivos requieren backup y revisión humana.

## Reversión y despliegue

- Aplicar primero en staging con copia de datos sintéticos o anonimizados.
- Guardar inventario pre/post de policies, grants, funciones, triggers y constraints.
- Para cambios de política/grants, revertir restaurando la matriz concreta anterior si los flujos fallan; no usar `GRANT ALL` como rollback general.
- Para constraints, revertir solo después de comprobar integridad de filas y dependencias.
- Para rollover/snapshot, no borrar ledger ni snapshots como rollback automático; preferir migración correctiva compensatoria y auditada.
- Producción: aprobación explícita, ventana, backup verificado, aplicación por migraciones y smoke tests posteriores.
