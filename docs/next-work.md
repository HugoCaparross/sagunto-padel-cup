# Siguiente trabajo de Sagunto Padel Cup

Revisión local del 4 de octubre de 2026. La auditoría de Supabase queda en pausa. Este backlog prioriza tareas de aplicación que pueden avanzar sin conexión ni cambios de base de datos.

## Prioridades

| Prioridad | Bloque | Impacto | Esfuerzo | Dependencias |
| --- | --- | --- | --- | --- |
| 1 | Pruebas de regresión del ranking v1.1 y Race to Master | Alto: reduce errores en puntos y plazas clasificatorias | Bajo/medio | Usar fixtures locales; mantener el empate de corte como provisional hasta que se apruebe desempate. |
| 2 | Cuadros y captura/corrección de resultados | Muy alto: habilita la operación completa del torneo | Alto | Antes de escribir código que determine resultados hacen falta reglas aprobadas: formato por tamaño, grupos/byes, marcador, retirada, walkover, desempate y correcciones. |
| 3 | Categorías y grupos por torneo | Alto: prepara participantes para cuadros y partidos | Medio/alto | Completar grupos, asignaciones y estados sobre las páginas de categorías existentes; no asumir formato ni criterios pendientes. |
| 4 | Operativa de torneo desde ficha | Alto: concentra tareas y reduce navegación | Medio | Mejorar accesos contextuales a inscripciones, categorías, competición y resultados; mantener las transiciones existentes y sus validaciones. |
| 5 | UX, accesibilidad y responsive del panel | Medio/alto: mejora tareas diarias en móvil y escritorio | Medio | Revisar formularios/tablas existentes, teclado, errores, estados vacíos y carga; evitar cambios de reglas de negocio. |
| 6 | Contenidos y páginas institucionales | Medio: mejora autoservicio e información pública | Medio | Revisar FAQ/contacto y gestión de noticias; mantener imágenes de noticias y avatares como elementos distintos de módulos retirados. |
| 7 | Mantenimiento y calidad automatizada | Medio: reduce regresiones | Bajo/medio | Resolver los 14 warnings ESLint y cuatro advertencias QA, añadir pruebas de lógica de dominio y ampliar automatización de rutas. |

## Siguiente bloque recomendado

Empezar por el bloque 1: añadir pruebas unitarias con fixtures para la tabla oficial de puntos v1.1, acumulación por temporada, orden del ranking y corte Race to Master. Las pruebas deben asegurar que el empate en la cuarta plaza se presenta como provisional y no inventa un desempate. Es un bloque acotado, verificable localmente y no requiere cambiar datos ni reglas.

Después, completar categorías/grupos y navegación contextual de la ficha del torneo. Dejar generación de cuadros y captura de resultados para cuando se aprueben sus decisiones deportivas; el estado actual de `/admin/competicion` permite filtrar, programar fecha/pista y consultar resultados, pero no editar marcadores.

## Estado de producto observado

- La galería se retiró de la aplicación. No se eliminaron tablas, policies, buckets ni datos de Supabase.
- Hay páginas de consulta de fichas deportivas de jugador y pareja; las acciones de sustitución de pareja no están habilitadas.
- La competición permite programar partidos y consultar marcadores, pero no generar cuadros desde el panel ni introducir/corregir resultados.
- Ranking público/admin y Race to Master existen; el desempate de la cuarta plaza y el recalculado desde resultados siguen pendientes.
- Las categorías de torneo tienen una pantalla administrativa; gestión completa de grupos sigue pendiente.
- La suite automatizada actual tiene cuatro pruebas unitarias centradas en destinos internos OAuth. No hay pruebas funcionales end-to-end del circuito.
- No se verificaron operaciones contra Supabase y la auditoría de base de datos permanece pausada.
