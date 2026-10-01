# Estado de implementación — 1 de octubre de 2026

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
| Navegación administrativa | Corregidos enlaces visibles a rutas inexistentes | `src/components/admin/AdminShell.tsx`; los módulos restantes aún no están implementados |
| Perfiles públicos y privacidad | Migración preparada, no aplicada | `public_player_profiles` requiere despliegue controlado y pruebas de roles |
| Campos sensibles de inscripción | Protección preparada, no aplicada | Trigger en migración; comprobar con pruebas de integración |
| Inscripciones concurrentes y capacidad sin máximo | Migración y RPC preparadas, no aplicadas | Revisar transacciones, permisos y aceptación de pareja en Supabase local/staging |
| Calendario 2026–2027 | Fechas confirmadas; seed preparado | `supabase/seed/official-calendar-2026-2027.sql`; no ejecutado. Las sedes/horas quedan vacías |
| Categorías y aforo configurable | Confirmado; esquema preparado | `supabase/migrations/20261001000200_unlimited_category_capacity.sql` permite `NULL` sin máximo |
| Master Final / Race to Master | Vista pública implementada por categoría | Muestra top 4 individual y empates en el corte; falta validar datos reales y desempate oficial |
| Tabla de puntos v1.1 | Conservada en constantes y lógica de ranking | Validar la asignación de resultados con fixtures/casos de integración |
| Cuadros, resultados y recalculado de puntos | Parcial | Hay lógica de dominio/servicios; faltan flujos operativos conectados y pruebas de extremo a extremo |
| RLS en todas las tablas | No verificado completamente | Revisar matches, ranking, grants y matriz completa de roles; ninguna migración aplicada |
| QA local | Pendiente de repetición tras los últimos cambios | Ejecutar `npm run qa` y `npm run build` en esta revisión |

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
