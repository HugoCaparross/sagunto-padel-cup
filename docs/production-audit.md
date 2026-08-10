# Auditoría inicial de producción — Sagunto Padel Cup

Fecha: 2026-08-09. Alcance: repositorio local. No se ha tenido acceso al panel, base de datos, Storage ni configuración de Supabase/Vercel, por lo que esos aspectos se marcan como **no verificables** y no como aprobados.

## Resumen ejecutivo

La aplicación contiene los flujos principales del circuito: autenticación, perfil, torneos, parejas, lista de espera, sorteo, cuadros, resultados, ranking, contenido y administración. No hay código de gamificación, quiniela o comparador en `src`.

No está preparada para producción todavía. Los principales riesgos locales se concentran en la integridad del registro de parejas y en acciones de servidor que dependen de RLS sin comprobar el resultado de la operación. La auditoría real de RLS, Auth, SMTP, Storage, copias de seguridad y despliegue queda bloqueada hasta disponer de acceso a sus consolas.

## Inventario técnico

| Área | Estado encontrado |
| --- | --- |
| Framework | Next.js 16.2.12, React 19.2.4 y TypeScript estricto |
| Estilos | Tailwind CSS 4 mediante `globals.css` |
| Datos y Auth | Supabase SSR; cliente de navegador, servidor y cliente service role separados |
| Email | Resend para inscripciones, lista de espera e invitaciones |
| Analítica | `@vercel/analytics` está instalado e incluido en `CookieConsent` |
| API HTTP | No hay Route Handlers (`route.ts`) en `src`; se usan Server Actions |
| Proxy | `src/proxy.ts` protege `/app/*` y `/admin/*` de usuarios no autenticados |
| Migraciones/infraestructura DB | No existe directorio `supabase/`, migraciones, esquema SQL ni definición de policies en el repositorio |
| Configuración de despliegue | No hay configuración de Vercel versionada; `next.config.ts` no define opciones |
| Tests | No se han encontrado tests unitarios, integración o E2E; `package.json` no tiene scripts `test` ni `typecheck` |
| Variables referenciadas | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_EMAIL`, `RESEND_API_KEY` |

Los ficheros `.env*` están ignorados por Git. No se han mostrado ni inspeccionado sus valores.

## Rutas actuales

| Ruta | Área | Indexable | Observación |
| --- | --- | --- | --- |
| `/` | Pública | Sí | Home y próxima prueba |
| `/calendario` | Pública | Sí | Lista de pruebas |
| `/torneo/[slug]` | Pública | Sí | Landing canónica del torneo |
| `/torneo/[slug]/participantes` | Pública funcional | Por decidir | Vista secundaria del torneo |
| `/torneo/[slug]/horarios` | Pública funcional | Por decidir | Vista secundaria del torneo |
| `/torneo/[slug]/grupos` | Pública funcional | Por decidir | Vista secundaria del torneo |
| `/torneo/[slug]/cuadros` | Pública funcional | Por decidir | Vista secundaria del torneo |
| `/torneo/[slug]/resultados` | Pública funcional | Por decidir | Vista secundaria del torneo |
| `/torneo/[slug]/premios` | Pública funcional | Por decidir | Vista secundaria del torneo |
| `/torneo/[slug]/fotos` | Pública funcional | Por decidir | Vista secundaria del torneo |
| `/torneo/[slug]/inscribirse` | Pública funcional | No recomendado | Formulario/transacción; falta `noindex` explícito |
| `/ranking` | Pública | Sí | Ranking individual |
| `/master-final` | Pública | Sí | Regla Top 4 ya alineada |
| `/circuito`, `/circuito/faq`, `/circuito/reglamento` | Pública | Sí | Contenido del circuito |
| `/jugadores`, `/jugador/[id]` | Pública | Por decidir | Exponen perfiles/estadísticas; requiere revisión de datos públicos |
| `/noticias`, `/noticias/[slug]` | Pública | Sí | Noticias publicadas |
| `/patrocinadores`, `/patrocinadores/historico`, `/contacto` | Pública | Sí/por decidir | Contenido institucional |
| `/legal/*` | Pública | No prioritario | Legal; requiere revisión jurídica |
| `/login`, `/registro`, `/registro/confirma`, `/subir/[token]` | Pública funcional | No | `noindex` aplicado por layouts; `robots` los bloquea |
| `/app/*` | Privada | No | Proxy exige sesión y layout `noindex` |
| `/admin/*` | Administración | No | Proxy exige sesión; layout y acciones comprueban administración |

## Hallazgos

### P0 — bloquea producción

1. **No existe evidencia versionada de RLS, policies, constraints, índices, triggers ni buckets.**
   - El repositorio no contiene migraciones ni esquema de Supabase.
   - Impacto: no se puede demostrar que las lecturas públicas, perfiles, notificaciones, Storage y acciones con service role estén protegidos.
   - Acción: exportar/versionar las migraciones y auditar la base real tabla por tabla antes de desplegar.

2. **El registro de parejas necesita una garantía transaccional de base de datos.**
   - La Server Action ya verifica autenticación, torneo abierto, categoría disponible, autopareja y duplicados dentro del torneo.
   - El cupo se calcula y se inserta en operaciones separadas. Dos solicitudes simultáneas pueden superar el cupo.
   - Si la pareja está incompleta, se crea una `registration` con estado `confirmada` mientras `pairs.estado` es `incompleta`.
   - Acción: centralizar estas invariantes en una transacción/RPC con constraints de base de datos y adaptar la acción a su resultado.

3. **Quedan acciones administrativas sin comprobación homogénea de errores.**
   - Las acciones de notificaciones, onboarding, baja y cancelación ya comprueban identidad/propiedad y errores. Varias acciones administrativas aún ignoran errores de Supabase.
   - Impacto: feedback falso, posibles actualizaciones erróneas si RLS es deficiente y dificultad de trazabilidad.
   - Acción: comprobar identidad/propiedad en toda acción de usuario, validar entradas y devolver/registrar errores controlados.

4. **Faltan pruebas automatizadas de negocio y E2E.**
   - `npm run lint`, `npm run typecheck` y `npm run build` terminan correctamente. Existe un aviso no bloqueante de compatibilidad de React Hook Form.
   - Acción: añadir pruebas de inscripción, cupos, resultados, ranking y los dos flujos E2E antes de cualquier lanzamiento.

5. **Configuración externa de producción no verificable.**
   - Faltan evidencias de dominio, `NEXT_PUBLIC_SITE_URL` real, SMTP, redirect URLs de Auth, rate limits, Storage, backups, logs y monitorización.
   - Acción: completar el checklist manual de Supabase/Vercel antes de decidir Go/No-Go.

### P1 — importante

1. **Autorización admin basada en `ADMIN_EMAIL`.**
   - Funciona como comprobación de servidor, pero no escala a varios administradores ni queda auditada en base de datos.
   - Recomendada una estrategia de roles respaldada por Supabase/RLS antes de ampliar equipo.

2. **El formulario de contacto no limita volumen ni escapa explícitamente el HTML interpolado.**
   - El input se valida con Zod, pero puede usarse para spam y el contenido se interpola en el email.
   - Añadir limitación de tasa, honeypot/Turnstile y escape/sanitización de HTML.

3. **Metadatos de rutas funcionales secundarias sin decisión explícita.**
   - El sitemap mantiene solo canónicas, pero participantes, horarios, grupos, cuadros, resultados, premios y fotos no declaran canonical/noindex de forma individual.
   - Decidir y aplicar la estrategia por estado y valor de cada vista.

4. **Documentación del proyecto es la plantilla de Next.js.**
   - `README.md` no documenta instalación, variables, arquitectura, operaciones ni despliegue reales.

5. **Faltan estados `loading.tsx` y `error.tsx` en rutas de la aplicación.**
   - Las vistas tienen algunos empty states, pero no hay cobertura global de carga/error.

6. **No se encontraron referencias de carrera de espera, Race to Master ni la administración del Master como funcionalidad separada.**
   - La página de Master usa el ranking individual como referencia, correctamente sin inferir parejas Top 4. La determinación oficial de parejas/cuadro aún no está modelada en el repositorio.

### P2 — mejora

1. Crear componentes reutilizables para estados de página, cabeceras, breadcrumbs y CTA principal.
2. Añadir metadatos completos a páginas públicas estáticas y breadcrumbs/Schema donde correspondan.
3. Revisar imágenes con `<img>` y definir tamaños, `alt` significativo y estrategia de optimización.
4. Sustituir datos de contacto/remitente hardcodeados por variables de entorno documentadas, sin cambiar valores sin confirmación.
5. Añadir analítica de negocio respetando el consentimiento de cookies.

### P3 — opcional tras estabilizar P0/P1

1. Vista de evolución de ranking cuando exista una definición fiable de temporada y desempates.
2. Páginas editoriales adicionales para categorías, puntuación y Race to Master cuando el contenido deportivo esté aprobado.

## Funcionalidades eliminadas o ausentes

No se han localizado en `src` módulos, rutas ni referencias a gamificación, XP, niveles, quiniela, predicciones o comparador. Los `StatusBadge` existentes son etiquetas de estado de torneo, no gamificación.

La regla del Master está alineada en las páginas de circuito, FAQ, onboarding y Master Final: ranking individual de referencia; Top 4 de parejas con acceso directo solo cuando las parejas estén determinadas.

## Validación ejecutada

| Comprobación | Resultado |
| --- | --- |
| Inventario de archivos, rutas, Server Actions y dependencias | Completado |
| Búsqueda de código residual y variables referenciadas | Completado |
| Revisión estática de acciones críticas y cliente service role | Completado |
| `git diff --check` | Correcto en cambios existentes |
| Sintaxis TS/TSX de archivos modificados | Correcta |
| `npm run lint` | Correcto; 1 aviso no bloqueante de React Hook Form |
| `npm run typecheck` | Correcto |
| `npm run build` | Correcto; 32 rutas generadas |
| RLS, policies, Storage, SMTP, backups, Vercel y DNS | No verificable sin acceso externo |

## Próximo bloque recomendado

Resolver el **P0 de integridad de inscripciones** antes de realizar mejoras de UX: definir las reglas ya aprobadas como constraints/RPC transaccional de Supabase, versionarlas como migración y adaptar `registerPair` y la cancelación a esa única fuente de verdad. Antes de escribir esa migración, confirmar únicamente las reglas deportivas aún no fijadas: política de pareja incompleta, lista de espera y si una persona puede jugar en más de una categoría/torneo.
