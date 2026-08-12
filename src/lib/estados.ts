// Ruta: src/lib/estados.ts
//
// Traducción centralizada de estados internos a texto para la UI.
// Los valores internos de la base de datos no deben mostrarse directamente.

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
> = {
  borrador: "neutral",
  publicado: "pending",
  inscripciones_abiertas: "open",
  inscripciones_cerradas: "pending",
  en_preparacion: "warning",
  en_juego: "live",
  finalizado: "closed",
  cancelado: "critical",
  archivado: "closed",
};

export const ESTADO_INSCRIPCION: Record<string, string> = {
  confirmada: "Confirmada",
  pendiente_pago: "Pendiente de confirmación",
  incompleta: "Inscripción incompleta",
  lista_espera: "Lista de espera",
  cancelada: "Cancelada",
};

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

export const ESTADO_RESULTADO: Record<string, string> = {
  pendiente: "Pendiente",
  validacion: "Pendiente de validación",
  confirmado: "Confirmado",
  corregido: "Corregido",
  anulado: "Anulado",
};

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
