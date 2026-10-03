# Decisiones pendientes de Sagunto Padel Cup

Este registro separa las decisiones de organización de las implementaciones técnicas. Ninguna regla marcada como pendiente debe inferirse desde la interfaz o aplicarse automáticamente a datos deportivos.

| # | Decisión | Estado | Módulos afectados | Trabajo seguro mientras se decide | Riesgo de decidir tarde |
| --- | --- | --- | --- | --- | --- |
| 1 | Desempate de la cuarta plaza del Master | Pendiente | Ranking, Race to Master, Master Final | Mostrar todos los empatados y marcar el corte | No se puede cerrar la lista de clasificados |
| 2 | Formatos de competición por tamaño de cuadro | Pendiente | Grupos, cuadros, partidos | Consulta y preparación de participantes | Generar cuadros incompatibles |
| 3 | Reglas de clasificación de grupos | Pendiente | Grupos, avance de ronda | Mostrar partidos y datos sin declarar posiciones definitivas | Clasificar parejas incorrectamente |
| 4 | Byes y distribución de cabezas de serie | Pendiente | Cuadros | Preparar visualización de estructura ya existente | Alterar equidad del cuadro |
| 5 | Criterio de emparejamiento y sorteo | Pendiente | Cuadros | Mantener opciones existentes sin generar/publicar | Requerir regeneración tras sorteo |
| 6 | Uso y orden de cabezas de serie | Pendiente | Cuadros | Conservar valores cargados y mostrarlos | Afectar el sorteo |
| 7 | Retiradas durante partido | Pendiente | Resultados, grupos, puntos | Capturar incidencia como pendiente de resolución, sin recalcular | Cambiar clasificación y puntos |
| 8 | Incomparecencias | Pendiente | Resultados, cuadros, puntos | Registrar estado operativo sin atribuir marcador/puntos | Alterar avance deportivo |
| 9 | Descalificaciones | Pendiente | Inscripciones, resultados, ranking | Documentar el caso sin mutar elegibilidad | Invalidar resultados previos |
| 10 | Marcadores incompletos y formatos de set | Pendiente | Validación de resultados | Preparar almacenamiento/lectura de resultado existente | Aceptar resultados inválidos |
| 11 | Cambios de pareja e integrantes | Pendiente | Parejas, inscripciones | Consulta e historial disponible | Inconsistencia de participantes |
| 12 | Sustituciones y elegibilidad de suplentes | Pendiente | Parejas, cuadros, Master | Preparar expediente y motivo sin ejecutar cambios | Invalidar partidos y clasificación |
| 13 | Efecto de cambios en puntos y cuadros | Pendiente | Ranking, cuadros | Mantener ledger inmutable y partidos históricos | Pérdida de trazabilidad |
| 14 | Apertura/cierre, invitación y aceptación de compañero | Pendiente | Inscripciones | Guardas de estado y operaciones manuales actuales | Parejas incompletas fuera de plazo |
| 15 | Política de pagos, justificantes y reembolsos | Pendiente | Inscripciones, administración económica | Verificación manual de pagos externos; baja conserva el pago | Conflictos económicos y de auditoría |
| 16 | Orden de la lista de espera | Manual, sin prioridad automática aprobada | Inscripciones | Promoción manual de una pareja elegida | Trato desigual si se automatiza sin criterio |
| 17 | Puntos oficiales por ronda/categoría | Confirmada según Documento Maestro v1.1 | Ranking | Mantener tabla v1.1 y evitar reglas nuevas | Inconsistencia histórica si se cambia |
| 18 | Acumulación, caducidad y rollover | Pendiente de validación operativa | Ranking, temporadas | Mostrar ledger/snapshots existentes sin recalcular | Diferencias entre temporadas |
| 19 | Criterio de Race to Master | Parcial; cuatro primeras plazas y empate de corte pendientes | Ranking, Master | Mostrar clasificación provisional y empates | Invitar participante incorrecto |
| 20 | Acceso y suplencias del Master Final | Pendiente | Master Final | Consulta pública provisional | Selección incorrecta de participantes |
| 21 | Formato, grupos y cuadros del Master | Pendiente | Master Final | Preparar gestión informativa | Rehacer competición publicada |
| 22 | Premios y condiciones | Pendiente | Premios, contenidos | Gestionar contenido solo cuando esté aprobado | Compromisos económicos no autorizados |
| 23 | Consentimiento para imágenes y procedimiento de retirada | Pendiente | Galería, perfiles | No añadir publicaciones administrativas sin autorización registrada | Exposición de imagen no consentida |
| 24 | Datos públicos de participantes | Pendiente de definición granular | Jugadores, privacidad, web pública | Aplicar opt-in disponible y limitar datos | Exposición de datos personales |
| 25 | Conservación, rectificación y borrado de datos | Pendiente | Jugadores, contacto, privacidad | Evitar borrados en cascada desde el panel | Pérdida de obligaciones o historial |
| 26 | Canales, preferencias y tipos de comunicación | Pendiente | Emails, notificaciones | Preparar eventos sin simular entregas | Comunicaciones duplicadas o no deseadas |
| 27 | Roles administrativos granulares | Pendiente; actualmente existe admin general | Todo el panel | Mantener comprobación de administrador en servidor/RPC | Acceso excesivo si crece el equipo |
| 28 | Fechas y configuración de temporada | Parcial; calendario 2026–2027 preparado | Torneos, ranking | Usar fechas aprobadas del seed y no inferir horas/sedes | Publicación de calendario incompleto |
| 29 | Incidencias deportivas y administrativas | Pendiente | Partidos, jugadores, dashboard | Añadir visibilidad solo con fuente y permisos definidos | Casos sin responsable ni historial |
| 30 | Contacto: conservación, acceso y asignación | Pendiente | Contacto | Proteger datos y evitar acceso general | Retención/exposición indebidas |
| 31 | Patrocinios: modalidades, temporadas y compromisos | Pendiente donde no lo cubre el esquema | Patrocinadores, torneos | CRUD de campos existentes sin inventar contratos | Promesas no registradas |
| 32 | Canales para pagos y comunicaciones oficiales | Pendiente | Inscripciones, notificaciones | Mantener gestión manual que ya existe | Información operativa contradictoria |

## Dependencias técnicas relacionadas

- Las mutaciones de grupos/cuadros/resultados que alteran la competición deben permanecer bloqueadas hasta aprobar formatos, byes, desempates y tratamiento de incidencias.
- El cálculo oficial de puntos debe seguir la tabla v1.1 confirmada; el cierre de temporada, rollover y correcciones necesitan validación con fixtures y base de pruebas.
- Cancelar una inscripción conserva el estado y los datos del pago; no hay devolución automática.
- La lista de espera usa elección administrativa manual y no aplica orden automático.
- Cambios de pareja después de actividad deportiva no deben modificar filas históricas.
- La galería pública requiere definir consentimiento, retirada y conservación antes de habilitar publicación operativa.
