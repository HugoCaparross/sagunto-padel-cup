// src/lib/constants.ts

/**
 * Sagunto Padel Cup
 * Application-wide constants.
 *
 * Keep business rules and domain values centralized here.
 * Dynamic data belongs in Supabase and should not be hardcoded in this file.
 */

/* -------------------------------------------------------------------------- */
/* BRAND                                                                      */
/* -------------------------------------------------------------------------- */

export const BRAND = {
    name: "Sagunto Padel Cup",
    shortName: "SPC",
    city: "Sagunto",
    region: "Comunitat Valenciana",
    country: "España",
    season: "2026/27",
} as const;

/* -------------------------------------------------------------------------- */
/* ROUTES                                                                     */
/* -------------------------------------------------------------------------- */

export const ROUTES = {
    home: "/",

    tournaments: "/torneos",
    tournament: (slug: string) => `/torneos/${slug}`,

    ranking: "/ranking",
    players: "/jugadores",
    player: (id: string) => `/jugadores/${id}`,

    circuit: "/circuito",
    calendar: "/calendario",
    master: "/master-final",

    news: "/noticias",
    newsArticle: (slug: string) => `/noticias/${slug}`,

    faq: "/faq",
    regulation: "/reglamento",
    contact: "/contacto",
    sponsors: "/patrocinadores",
    gallery: "/galeria",

    compare: "/comparar",

    login: "/login",
    register: "/registro",

    app: "/app",
    appDashboard: "/app",
    appProfile: "/app/perfil",
    appTournaments: "/app/torneos",
    appRanking: "/app/ranking",
    appMatches: "/app/partidos",
    appRegistrations: "/app/inscripciones",
    appPartner: "/app/pareja",

    admin: "/admin",
    adminDashboard: "/admin",
    adminTournaments: "/admin/torneos",
    adminPlayers: "/admin/jugadores",
    adminRegistrations: "/admin/inscripciones",
    adminMatches: "/admin/partidos",
    adminRanking: "/admin/ranking",
    adminClubs: "/admin/clubes",
    adminSponsors: "/admin/patrocinadores",
    adminNews: "/admin/noticias",
    adminGallery: "/admin/galeria",
    adminSettings: "/admin/configuracion",
} as const;

/* -------------------------------------------------------------------------- */
/* CATEGORIES                                                                 */
/* -------------------------------------------------------------------------- */

export const CATEGORY_NAMES = [
    "1ª",
    "2ª",
    "3ª",
    "4ª",
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export const CATEGORY_ORDER: Record<CategoryName, number> = {
    "1ª": 1,
    "2ª": 2,
    "3ª": 3,
    "4ª": 4,
};

/**
 * Competition gender modes.
 *
 * The current circuit operates with mixed competition, but the data model
 * remains prepared for future male/female categories.
 */
export const CATEGORY_GENDERS = [
    "masculina",
    "femenina",
    "mixta",
] as const;

export type CategoryGender = (typeof CATEGORY_GENDERS)[number];

/* -------------------------------------------------------------------------- */
/* TOURNAMENT STATES                                                          */
/* -------------------------------------------------------------------------- */

export const TOURNAMENT_STATES = [
    "borrador",
    "publicado",
    "inscripciones_abiertas",
    "en_juego",
    "finalizado",
    "archivado",
] as const;

export type TournamentState = (typeof TOURNAMENT_STATES)[number];

/* -------------------------------------------------------------------------- */
/* TOURNAMENT TYPES                                                           */
/* -------------------------------------------------------------------------- */

export const TOURNAMENT_TYPES = [
    "regular",
    "master",
] as const;

export type TournamentType = (typeof TOURNAMENT_TYPES)[number];

/* -------------------------------------------------------------------------- */
/* PAIR STATES                                                                */
/* -------------------------------------------------------------------------- */

export const PAIR_STATUSES = [
    "confirmada",
    "lista_espera",
    "incompleta",
    "pendiente_pago",
] as const;

export type PairStatus = (typeof PAIR_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/* REGISTRATION                                                               */
/* -------------------------------------------------------------------------- */

export const REGISTRATION_STATUSES = [
    "confirmada",
    "lista_espera",
    "pendiente_pago",
    "cancelada",
] as const;

export type RegistrationStatus =
    (typeof REGISTRATION_STATUSES)[number];

/**
 * Payment is deliberately independent from registration status.
 *
 * There is NO online payment system in SPC.
 * Payment is performed externally and verified by the organizer.
 */
export const PAYMENT_STATUSES = [
    "pendiente",
    "verificado",
    "rechazado",
    "no_requerido",
] as const;

export type PaymentStatus =
    (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
    "fisico",
    "transferencia",
    "otro",
] as const;

export type PaymentMethod =
    (typeof PAYMENT_METHODS)[number];

/* -------------------------------------------------------------------------- */
/* MATCHES                                                                    */
/* -------------------------------------------------------------------------- */

export const MATCH_PHASES = [
    "grupos",
    "octavos",
    "cuartos",
    "semis",
    "final",
] as const;

export type MatchPhase =
    (typeof MATCH_PHASES)[number];

export const MATCH_STATUSES = [
    "pendiente",
    "en_juego",
    "finalizado",
    "walkover",
    "retirada",
    "aplazado",
] as const;

export type MatchStatus =
    (typeof MATCH_STATUSES)[number];

export const MATCH_TIERS = [
    "oro",
    "plata",
    "bronce",
] as const;

export type MatchTier =
    (typeof MATCH_TIERS)[number];

/* -------------------------------------------------------------------------- */
/* OFFICIAL MATCH FORMATS                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Group stage:
 * - One set.
 * - Golden point.
 */
export const GROUP_MATCH_FORMAT = {
    sets: 1,
    goldenPoint: true,
    finalSetSuperTieBreak: false,
} as const;

/**
 * Knockout matches before finals:
 * - First to 9 games.
 * - Golden point.
 */
export const KNOCKOUT_MATCH_FORMAT = {
    sets: 1,
    gamesToWin: 9,
    goldenPoint: true,
    finalSetSuperTieBreak: false,
} as const;

/**
 * Finals:
 * - Best of 2 sets.
 * - Golden point.
 * - Super tie-break to 10 when required.
 */
export const FINAL_MATCH_FORMAT = {
    sets: 2,
    bestOf: 2,
    goldenPoint: true,
    superTieBreakPoints: 10,
} as const;

/* -------------------------------------------------------------------------- */
/* COMPETITION TIERS                                                          */
/* -------------------------------------------------------------------------- */

export const COMPETITION_TIERS = {
    oro: {
        key: "oro",
        label: "Oro",
    },
    plata: {
        key: "plata",
        label: "Plata",
    },
    bronce: {
        key: "bronce",
        label: "Bronce",
    },
} as const;

/* -------------------------------------------------------------------------- */
/* GROUP STAGE                                                                */
/* -------------------------------------------------------------------------- */

export const DEFAULT_GROUP_TIE_BREAKERS = [
    "enfrentamiento_directo",
    "diferencia_sets",
    "diferencia_juegos",
] as const;

/**
 * Group standings:
 * - Victory = 1 point.
 * - Defeat = 0 points.
 */
export const GROUP_STANDING_POINTS = {
    win: 1,
    loss: 0,
} as const;

/* -------------------------------------------------------------------------- */
/* DRAW                                                                       */
/* -------------------------------------------------------------------------- */

export const DRAW_MODES = [
    "manual",
    "aleatorio",
    "sembrado",
] as const;

export type DrawMode =
    (typeof DRAW_MODES)[number];

/* -------------------------------------------------------------------------- */
/* RANKING                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Official ranking points by finishing position.
 *
 * Each category has its own non-overlapping band:
 *
 * 1ª: 120–106
 * 2ª: 105–91
 * 3ª: 90–76
 * 4ª: 75–61
 *
 * In a 5-pair format, the fifth pair is eliminated after the group phase
 * and receives the minimum points of its category.
 *
 * Ranking points are individual:
 * the points generated by a pair are assigned to each player individually.
 */
export const RANKING_POINTS = {
    "1ª": {
        campeon_oro: 120,
        finalista_oro: 118,
        semifinalista_oro: 116,
        cuartos_oro: 114,

        campeon_plata: 113,
        finalista_plata: 112,
        semifinalista_plata: 111,
        cuartos_plata: 110,

        campeon_bronce: 109,
        finalista_bronce: 108,
        semifinalista_bronce: 107,
        cuartos_bronce: 106,

        fase_grupos: 106,
    },

    "2ª": {
        campeon_oro: 105,
        finalista_oro: 103,
        semifinalista_oro: 101,
        cuartos_oro: 99,

        campeon_plata: 98,
        finalista_plata: 97,
        semifinalista_plata: 96,
        cuartos_plata: 95,

        campeon_bronce: 94,
        finalista_bronce: 93,
        semifinalista_bronce: 92,
        cuartos_bronce: 91,

        fase_grupos: 91,
    },

    "3ª": {
        campeon_oro: 90,
        finalista_oro: 88,
        semifinalista_oro: 86,
        cuartos_oro: 84,

        campeon_plata: 83,
        finalista_plata: 82,
        semifinalista_plata: 81,
        cuartos_plata: 80,

        campeon_bronce: 79,
        finalista_bronce: 78,
        semifinalista_bronce: 77,
        cuartos_bronce: 76,

        fase_grupos: 76,
    },

    "4ª": {
        campeon_oro: 75,
        finalista_oro: 73,
        semifinalista_oro: 71,
        cuartos_oro: 69,

        campeon_plata: 68,
        finalista_plata: 67,
        semifinalista_plata: 66,
        cuartos_plata: 65,

        campeon_bronce: 64,
        finalista_bronce: 63,
        semifinalista_bronce: 62,
        cuartos_bronce: 61,

        fase_grupos: 61,
    },
} as const;

export type RankingCategory =
    keyof typeof RANKING_POINTS;

/* -------------------------------------------------------------------------- */
/* SEASON ROLLOVER                                                            */
/* -------------------------------------------------------------------------- */

export const RANKING_RETENTION = {
    retainedPercentage: 30,
    removedPercentage: 70,
} as const;

/* -------------------------------------------------------------------------- */
/* MASTER FINAL                                                               */
/* -------------------------------------------------------------------------- */

export const MASTER = {
    minimumRegularTournaments: 1,
    topPairsPerCategory: 4,
    qualifyingRequirement:
        "haber disputado al menos un torneo regular del circuito",
} as const;

/* -------------------------------------------------------------------------- */
/* SEASON                                                                     */
/* -------------------------------------------------------------------------- */

export const SEASON = {
    current: "2026/27",

    firstTournamentDate:
        "2026-09-12",

    firstTournamentEndDate:
        "2026-09-13",

    masterFinalYear: 2027,

    rankingRetentionPercentage: 30,

    rankingExpirationPercentage: 70,
} as const;

/* -------------------------------------------------------------------------- */
/* PLAYER                                                                     */
/* -------------------------------------------------------------------------- */

export const PLAYER_ROLES = [
    "player",
    "admin",
] as const;

export type PlayerRole =
    (typeof PLAYER_ROLES)[number];

export const PLAYER_STATUSES = [
    "activo",
    "inactivo",
] as const;

export type PlayerStatus =
    (typeof PLAYER_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/* VISIBILITY                                                                 */
/* -------------------------------------------------------------------------- */

export const DEFAULT_PLAYER_VISIBILITY = {
    profile: true,
    phone: false,
    email: false,
    instagram: true,
    photo: true,
} as const;

/* -------------------------------------------------------------------------- */
/* NOTIFICATIONS                                                              */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_TYPES = [
    "info",
    "success",
    "warning",
    "error",
] as const;

export type NotificationType =
    (typeof NOTIFICATION_TYPES)[number];

/* -------------------------------------------------------------------------- */
/* NEWS                                                                       */
/* -------------------------------------------------------------------------- */

export const NEWS_STATUSES = [
    "borrador",
    "publicado",
    "archivado",
] as const;

export type NewsStatus =
    (typeof NEWS_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/* SPONSORS                                                                   */
/* -------------------------------------------------------------------------- */

export const SPONSOR_TIERS = [
    "principal",
    "oficial",
    "colaborador",
] as const;

export type SponsorTier =
    (typeof SPONSOR_TIERS)[number];

/* -------------------------------------------------------------------------- */
/* PAGINATION                                                                 */
/* -------------------------------------------------------------------------- */

export const PAGINATION = {
    defaultPage: 1,
    defaultPageSize: 20,

    rankingPageSize: 50,
    playersPageSize: 24,
    newsPageSize: 12,
    galleryPageSize: 24,
} as const;

/* -------------------------------------------------------------------------- */
/* DATE / TIME                                                                */
/* -------------------------------------------------------------------------- */

export const DATE_FORMATS = {
    short: "dd/MM/yyyy",
    long: "d 'de' MMMM 'de' yyyy",
    time: "HH:mm",
    dateTime: "dd/MM/yyyy HH:mm",
} as const;