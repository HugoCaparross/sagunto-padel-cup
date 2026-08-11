// Ruta: src/lib/estados.ts

// Traducción centralizada de estados internos a texto para el usuario.
// Nunca mostrar el valor interno de la BD directamente en la UI.

export const ESTADO_TORNEO: Record<
  string,
  string
> = {
  borrador: "No mostrar",
  publicado: "Próximamente",
  inscripciones_abiertas:
    "Inscripciones abiertas",
  en_juego: "En juego",
  finalizado: "Finalizado",
  archivado: "Finalizado",
};

export const ESTADO_TORNEO_BADGE: Record<
  string,
  | "open"
  | "live"
  | "closed"
  | "pending"
> = {
  publicado: "pending",
  inscripciones_abiertas: "open",
  en_juego: "live",
  finalizado: "closed",
  archivado: "closed",
};

export const ESTADO_INSCRIPCION: Record<
  string,
  string
> = {
  confirmada: "Confirmada",
  pendiente_pago:
    "Pendiente de confirmación",
  incompleta:
    "Inscripción incompleta",
  lista_espera: "Lista de espera",
  cancelada: "Cancelada",
};

export const ESTADO_PARTIDO: Record<
  string,
  string
> = {
  pendiente: "Por jugar",
  en_juego: "En juego",
  finalizado: "Finalizado",
  walkover: "Walkover",
  retirada: "Retirada",
  aplazado: "Aplazado",
};

function crearFecha(
  fecha: string
): Date | null {
  const resultado = new Date(fecha);

  if (
    Number.isNaN(
      resultado.getTime()
    )
  ) {
    return null;
  }

  return resultado;
}

export function formatearFecha(
  fecha: string
) {
  const date = crearFecha(fecha);

  if (!date) {
    return "Fecha por confirmar";
  }

  return date.toLocaleDateString(
    "es-ES",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

export function formatearFechaHora(
  fecha: string
) {
  const date = crearFecha(fecha);

  if (!date) {
    return "Hora por confirmar";
  }

  return date.toLocaleString(
    "es-ES",
    {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}