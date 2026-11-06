export const REGISTRATION_STATUS_LABEL: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    waitlist: "Lista de espera",
    cancelled: "Cancelada",
    rejected: "Rechazada",
};

export const PLAYER_STATUS_LABEL: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    suspended: "Suspendido",
    retired: "Retirado",
};

export const TRANSACTION_LABEL: Record<string, string> = {
    match_award: "Puntos por partido",
    manual_adjustment: "Ajuste manual",
    season_carryover: "Arrastre de temporada",
    reversal: "Reversión",
    correction: "Corrección",
};

export const EVENT_STATUS_LABEL: Record<string, string> = {
    draft: "Borrador",
    published: "Publicada",
    registration_open: "Inscripciones abiertas",
    registration_closed: "Inscripciones cerradas",
    in_progress: "En curso",
    completed: "Finalizada",
    postponed: "Aplazada",
    cancelled: "Cancelada",
    archived: "Archivada",
};

export function formatDate(iso?: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function formatPoints(value: number | string | null | undefined) {
    return Number(value ?? 0).toLocaleString("es-ES", {
        maximumFractionDigits: 2,
    });
}