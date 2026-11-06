export const PLACEMENTS = [
    { code: 1, label: "Campeón/a" },
    { code: 2, label: "Subcampeón/a" },
    { code: 3, label: "Semifinalista" },
    { code: 5, label: "Cuartofinalista" },
    { code: 9, label: "Octavofinalista" },
    { code: 17, label: "Dieciseisavos" },
    { code: 33, label: "Participación inicial" },
] as const;

export const PLACEMENT_CODES: number[] = PLACEMENTS.map((p) => p.code);