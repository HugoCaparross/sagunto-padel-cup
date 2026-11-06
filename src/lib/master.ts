export const MASTER_STATUS_LABEL: Record<string, string> = {
    candidate: "Candidato",
    eligible: "Clasificado",
    confirmed: "Confirmado",
    declined: "Renuncia",
    waitlist: "Lista de espera",
    ineligible: "No elegible",
};

// Estados que el admin puede asignar a mano
export const MASTER_EDITABLE: string[] = ["eligible", "confirmed", "declined", "waitlist"];

// Con estos estados de prueba, la lista ya no se toca
export const MASTER_LOCKED_EVENT_STATUS: string[] = ["in_progress", "completed", "archived", "cancelled"];