// Ruta: src/lib/estados.ts
//
// Traducción centralizada de estados internos a texto y semántica
// visual para la UI.
//
// IMPORTANTE:
// Los valores internos de la base de datos no deben mostrarse
// directamente.
//
// Este archivo es la fuente única de verdad para:
// - Texto visible del estado.
// - Tipo semántico del badge.
// - Interpretación visual del estado.
//
// La definición de los colores reales se encuentra en globals.css.

/* ============================================================
   TIPOS
   ============================================================ */

export type EstadoBadge =
  | "open"
  | "live"
  | "closed"
  | "pending"
  | "neutral"
  | "success"
  | "warning"
  | "critical"
  | "info";

/* ============================================================
   ESTADOS DE TORNEO
   ============================================================ */

export const ESTADO_TORNEO: Record<string, string> = {
  borrador: "Borrador",
  publicado: "Próximamente",
  inscripciones_abiertas: "Inscripciones abiertas",
  inscripciones_cerradas: "Inscripciones cerradas",
  en_preparacion: "En preparación",
  en_juego: "En juego",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
  archivado: "Archivado",
};

/**
 * Semántica visual de los estados de torneo.
 *
 * Criterio:
 *
 * - success:
 *   Estado positivo y disponible.
 *
 * - open:
 *   Estado disponible para realizar una acción.
 *
 * - live:
 *   Competición actualmente activa.
 *
 * - info:
 *   Estado informativo o de preparación.
 *
 * - pending:
 *   Requiere atención o todavía no está definido.
 *
 * - neutral:
 *   Estado histórico, cerrado o sin acción inmediata.
 *
 * - critical:
 *   Estado negativo.
 */
export const ESTADO_TORNEO_BADGE: Record<
  string,
  | "open"
  | "live"
  | "closed"
  | "pending"
  | "neutral"
  | "success"
  | "warning"
  | "critical"
  | "info"
> = {
  borrador: "neutral",

  // PRÓXIMAMENTE → VERDE
  publicado: "success",

  // INSCRIPCIONES ABIERTAS → VERDE
  inscripciones_abiertas: "open",

  // INSCRIPCIONES CERRADAS → GRIS
  inscripciones_cerradas: "closed",

  // EN PREPARACIÓN → AZUL INFORMATIVO
  en_preparacion: "info",

  // EN JUEGO → AZUL ACTIVO
  en_juego: "live",

  // FINALIZADO → GRIS
  finalizado: "closed",

  // CANCELADO → ROJO
  cancelado: "critical",

  // ARCHIVADO → GRIS
  archivado: "closed",
};

/* ============================================================
   ESTADOS DE INSCRIPCIÓN
   ============================================================ */

export const ESTADO_INSCRIPCION: Record<string, string> = {
  confirmada: "Confirmada",
  pendiente_pago: "Pendiente de confirmación",
  incompleta: "Inscripción incompleta",
  lista_espera: "Lista de espera",
  cancelada: "Cancelada",
};

/**
 * Semántica visual de las inscripciones.
 */
export const ESTADO_INSCRIPCION_BADGE: Record<string, EstadoBadge> = {
  // Todo correcto.
  confirmada: "success",

  // Requiere atención.
  pendiente_pago: "warning",

  // Falta completar información.
  incompleta: "warning",

  // No hay plaza confirmada.
  lista_espera: "warning",

  // Estado negativo.
  cancelada: "critical",
};

/* ============================================================
   ESTADOS DE PARTIDO
   ============================================================ */

export const ESTADO_PARTIDO: Record<string, string> = {
  pendiente: "Por jugar",
  en_juego: "En juego",
  finalizado: "Finalizado",
  walkover: "Walkover",
  retirada: "Retirada",
  aplazado: "Aplazado",
  cancelado: "Cancelado",
  bloqueado: "Bloqueado",
};

/**
 * Semántica visual de los partidos.
 */
export const ESTADO_PARTIDO_BADGE: Record<string, EstadoBadge> = {
  // Todavía no se ha disputado.
  pendiente: "pending",

  // Partido actualmente activo.
  en_juego: "live",

  // Partido terminado.
  finalizado: "closed",

  // Victoria por incomparecencia.
  // No es un error del sistema, pero sí requiere
  // una lectura especial.
  walkover: "warning",

  // Un jugador se ha retirado.
  retirada: "critical",

  // Partido desplazado a otra fecha/hora.
  aplazado: "warning",

  // Partido cancelado.
  cancelado: "critical",

  // Partido no disponible para jugar.
  bloqueado: "neutral",
};

/* ============================================================
   ESTADOS DE RESULTADO
   ============================================================ */

export const ESTADO_RESULTADO: Record<string, string> = {
  pendiente: "Pendiente",
  validacion: "Pendiente de validación",
  confirmado: "Confirmado",
  corregido: "Corregido",
  anulado: "Anulado",
};

/**
 * Semántica visual de los resultados.
 */
export const ESTADO_RESULTADO_BADGE: Record<string, EstadoBadge> = {
  // Falta introducir / completar el resultado.
  pendiente: "pending",

  // Requiere revisión.
  validacion: "warning",

  // Resultado validado correctamente.
  confirmado: "success",

  // Resultado modificado posteriormente.
  // Es informativo, no necesariamente negativo.
  corregido: "info",

  // Resultado invalidado.
  anulado: "critical",
};

/* ============================================================
   ESTADOS DE JUGADOR
   ============================================================ */

export const ESTADO_JUGADOR: Record<string, string> = {
  activo: "Activo",
  suspendido: "Suspendido",
};

/**
 * Semántica visual de los jugadores.
 */
export const ESTADO_JUGADOR_BADGE: Record<string, EstadoBadge> = {
  activo: "success",
  suspendido: "critical",
};

/* ============================================================
   HELPERS DE ESTADO
   ============================================================ */

/**
 * Obtiene el texto visible de un estado de torneo.
 */
export function obtenerTextoEstadoTorneo(
  estado: string | null | undefined,
): string {
  if (!estado) {
    return "Estado por confirmar";
  }

  return ESTADO_TORNEO[estado] ?? estado;
}

/**
 * Obtiene el tipo visual de un estado de torneo.
 *
 * Si aparece un estado nuevo que todavía no está definido,
 * usamos "neutral" como fallback para evitar mostrar un
 * estado con un color incorrecto.
 */
export function obtenerBadgeEstadoTorneo(
  estado: string | null | undefined,
): EstadoBadge {
  if (!estado) {
    return "neutral";
  }

  return ESTADO_TORNEO_BADGE[estado] ?? "neutral";
}

/**
 * Obtiene el texto visible de una inscripción.
 */
export function obtenerTextoEstadoInscripcion(
  estado: string | null | undefined,
): string {
  if (!estado) {
    return "Estado por confirmar";
  }

  return ESTADO_INSCRIPCION[estado] ?? estado;
}

/**
 * Obtiene el tipo visual de una inscripción.
 */
export function obtenerBadgeEstadoInscripcion(
  estado: string | null | undefined,
): EstadoBadge {
  if (!estado) {
    return "neutral";
  }

  return ESTADO_INSCRIPCION_BADGE[estado] ?? "neutral";
}

/**
 * Obtiene el texto visible de un partido.
 */
export function obtenerTextoEstadoPartido(
  estado: string | null | undefined,
): string {
  if (!estado) {
    return "Estado por confirmar";
  }

  return ESTADO_PARTIDO[estado] ?? estado;
}

/**
 * Obtiene el tipo visual de un partido.
 */
export function obtenerBadgeEstadoPartido(
  estado: string | null | undefined,
): EstadoBadge {
  if (!estado) {
    return "neutral";
  }

  return ESTADO_PARTIDO_BADGE[estado] ?? "neutral";
}

/**
 * Obtiene el texto visible de un resultado.
 */
export function obtenerTextoEstadoResultado(
  estado: string | null | undefined,
): string {
  if (!estado) {
    return "Estado por confirmar";
  }

  return ESTADO_RESULTADO[estado] ?? estado;
}

/**
 * Obtiene el tipo visual de un resultado.
 */
export function obtenerBadgeEstadoResultado(
  estado: string | null | undefined,
): EstadoBadge {
  if (!estado) {
    return "neutral";
  }

  return ESTADO_RESULTADO_BADGE[estado] ?? "neutral";
}

/**
 * Obtiene el texto visible de un jugador.
 */
export function obtenerTextoEstadoJugador(
  estado: string | null | undefined,
): string {
  if (!estado) {
    return "Estado por confirmar";
  }

  return ESTADO_JUGADOR[estado] ?? estado;
}

/**
 * Obtiene el tipo visual de un jugador.
 */
export function obtenerBadgeEstadoJugador(
  estado: string | null | undefined,
): EstadoBadge {
  if (!estado) {
    return "neutral";
  }

  return ESTADO_JUGADOR_BADGE[estado] ?? "neutral";
}

/* ============================================================
   FECHAS
   ============================================================ */

function crearFecha(fecha: string): Date | null {
  const resultado = new Date(fecha);

  if (Number.isNaN(resultado.getTime())) {
    return null;
  }

  return resultado;
}

export function formatearFecha(fecha: string) {
  const date = crearFecha(fecha);

  if (!date) {
    return "Fecha por confirmar";
  }

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatearFechaHora(fecha: string) {
  const date = crearFecha(fecha);

  if (!date) {
    return "Hora por confirmar";
  }

  return date.toLocaleString("es-ES", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
