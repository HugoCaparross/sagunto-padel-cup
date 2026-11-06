export const ORGANIZER_ROLES = ["main_organizer", "organizer", "venue", "collaborator"] as const;

export const ORGANIZER_ROLE_LABEL: Record<string, string> = {
    main_organizer: "Organizador principal",
    organizer: "Organizador",
    venue: "Sede",
    collaborator: "Colaborador",
};

export const SPONSOR_TYPES = ["sponsor", "collaborator", "organizer", "club"] as const;

export const SPONSOR_TYPE_LABEL: Record<string, string> = {
    sponsor: "Patrocinador",
    collaborator: "Colaborador",
    organizer: "Organizador",
    club: "Club",
};