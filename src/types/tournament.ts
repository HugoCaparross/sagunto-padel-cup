import type {
    Bracket,
    Category,
    Club,
    Group,
    GroupStanding,
    GroupWithStandings,
    Match,
    MatchPhase,
    MatchStatus,
    MatchTier,
    Pair,
    Player,
    Prize,
    Season,
    Tournament,
    TournamentCategory,
} from "@/types/database";

// =============================================================================
// TOURNAMENT CORE
// =============================================================================

export type TournamentWithRelations = Tournament & {
    season: Season | null;

    club: Club | null;

    categories: TournamentCategoryWithRelations[];
};

export type TournamentCategoryWithRelations =
    TournamentCategory & {
        category: Category | null;
    };

// =============================================================================
// TOURNAMENT SETTINGS
// =============================================================================

/**
 * Configuración general del torneo.
 *
 * Se mantiene flexible para permitir que las reglas competitivas
 * evolucionen sin tener que modificar constantemente el esquema SQL.
 */
export type TournamentSettings = {
    /**
     * Tipo de torneo dentro de la temporada.
     */
    tournament_type: "regular" | "master";

    /**
     * Género competitivo.
     *
     * Actualmente SPC trabaja con mixto, pero la arquitectura
     * queda preparada para masculino/femenino.
     */
    gender:
    | "mixto"
    | "masculino"
    | "femenino";

    /**
     * Permite inscripción individual sin pareja.
     */
    individual_registration: boolean;

    /**
     * Permite utilizar la bolsa de compañeros.
     */
    partner_pool_enabled: boolean;

    /**
     * Pago realizado fuera de la plataforma.
     */
    external_payment: boolean;

    /**
     * Número máximo de parejas por categoría.
     *
     * null = sin límite configurado.
     */
    default_max_pairs: number | null;

    /**
     * Número mínimo de parejas para poder generar competición.
     *
     * null = sin mínimo configurado.
     */
    default_min_pairs: number | null;

    /**
     * Sistema de grupos.
     */
    group_stage: GroupStageSettings;

    /**
     * Configuración de las fases eliminatorias.
     */
    knockout: KnockoutSettings;

    /**
     * Configuración de pistas.
     */
    courts: CourtSettings;

    /**
     * Configuración de horarios.
     */
    scheduling: SchedulingSettings;

    /**
     * Permite aplazamientos.
     */
    postponements_enabled: boolean;

    /**
     * Configuración específica del Master.
     */
    master: MasterTournamentSettings | null;

    /**
     * Metadatos adicionales.
     */
    metadata?: Record<string, unknown>;
};

// =============================================================================
// GROUP STAGE
// =============================================================================

export type GroupStageSettings = {
    enabled: boolean;

    /**
     * Todos contra todos dentro de cada grupo.
     */
    round_robin: boolean;

    /**
     * Número de parejas por grupo preferido.
     */
    preferred_group_size: number | null;

    /**
     * Número de parejas mínimo para formar grupo.
     */
    min_group_size: number | null;

    /**
     * Número máximo de parejas por grupo.
     */
    max_group_size: number | null;

    /**
     * Criterios de desempate en orden de prioridad.
     */
    tie_break_criteria: GroupTieBreakCriterion[];

    /**
     * Puntuación por victoria.
     */
    win_points: number;

    /**
     * Puntuación por derrota.
     */
    loss_points: number;

    /**
     * Configuración del formato de partido de grupos.
     */
    match_format: MatchFormat;
};

export type GroupTieBreakCriterion =
    | "puntos_obtenidos"
    | "head_to_head"
    | "set_difference"
    | "game_difference"
    | "sets_won"
    | "games_won"
    | "random";

// =============================================================================
// KNOCKOUT
// =============================================================================

export type KnockoutSettings = {
    enabled: boolean;

    tiers: KnockoutTierSettings[];

    structures: KnockoutStructureTemplate[];
};

export type KnockoutTierSettings = {
    tramo: MatchTier;

    enabled: boolean;

    max_rounds: number;

    has_final: boolean;

    match_format: MatchFormat;
};

export type KnockoutStructureTemplate = {
    pair_count: number;

    tiers: MatchTier[];

    group_count?: number;

    group_size?: number;

    phases: KnockoutPhaseTemplate[];

    notes?: string;
};

export type KnockoutPhaseTemplate = {
    fase: MatchPhase;

    match_count: number;

    tramo: MatchTier;

    sources: KnockoutSource[];
};

export type KnockoutSource =
    | {
        type: "group_position";

        group_index: number;

        group_position: number;
    }
    | {
        type: "match_winner";

        match_index: number;
    }
    | {
        type: "match_loser";

        match_index: number;
    };

// =============================================================================
// MATCH FORMAT
// =============================================================================

export type MatchFormat = {
    type:
    | "one_set"
    | "race_to_games"
    | "best_of_two_sets";

    target_games: number | null;

    sets_to_win: number | null;

    golden_point: boolean;

    super_tiebreak: SuperTiebreakSettings | null;
};

export type SuperTiebreakSettings = {
    enabled: boolean;

    target_points: number;

    /**
     * Debe existir una diferencia mínima de 2 puntos.
     */
    win_by_two: boolean;
};

// =============================================================================
// COURTS
// =============================================================================

export type CourtSettings = {
    /**
     * Número de pistas disponibles.
     */
    court_count: number;

    /**
     * Permite asignación manual.
     */
    manual_assignment: boolean;

    /**
     * Permite reasignación durante el torneo.
     */
    live_reassignment: boolean;

    /**
     * Nombres personalizados de pistas.
     */
    names?: string[];
};

// =============================================================================
// SCHEDULING
// =============================================================================

export type SchedulingSettings = {
    /**
     * El organizador puede modificar horarios durante el torneo.
     */
    live_changes: boolean;

    /**
     * Duración estimada de un partido.
     */
    default_match_duration_minutes: number;

    /**
     * Descanso mínimo recomendado entre partidos.
     */
    minimum_rest_minutes: number;

    /**
     * Permite partidos simultáneos.
     */
    parallel_matches: boolean;
};

// =============================================================================
// MASTER FINAL
// =============================================================================

export type MasterTournamentSettings = {
    enabled: boolean;

    /**
     * El Master está abierto a jugadores que hayan participado
     * al menos en un torneo previo del circuito.
     */
    minimum_previous_events: number;

    /**
     * Número de mejores parejas/jugadores premiados.
     */
    awarded_positions: number;

    /**
     * Tratamiento especial del ranking.
     *
     * Se deja configurable porque la regla exacta del Master
     * puede evolucionar.
     */
    ranking_treatment:
    | "normal"
    | "bonus"
    | "separate"
    | "configurable";

    metadata?: Record<string, unknown>;
};

// =============================================================================
// DEFAULT SETTINGS
// =============================================================================

export const DEFAULT_GROUP_TIE_BREAK_CRITERIA:
    GroupTieBreakCriterion[] = [
        "puntos_obtenidos",
        "head_to_head",
        "set_difference",
        "game_difference",
        "sets_won",
        "games_won",
        "random",
    ];

export const DEFAULT_TOURNAMENT_SETTINGS:
    TournamentSettings = {
    tournament_type: "regular",

    gender: "mixto",

    individual_registration: true,

    partner_pool_enabled: true,

    external_payment: true,

    default_max_pairs: null,

    default_min_pairs: null,

    group_stage: {
        enabled: true,

        round_robin: true,

        preferred_group_size: 4,

        min_group_size: 3,

        max_group_size: 4,

        tie_break_criteria:
            DEFAULT_GROUP_TIE_BREAK_CRITERIA,

        win_points: 1,

        loss_points: 0,

        match_format: {
            type: "one_set",

            target_games: null,

            sets_to_win: null,

            golden_point: true,

            super_tiebreak: null,
        },
    },

    knockout: {
        enabled: true,

        tiers: [
            {
                tramo: "oro",

                enabled: true,

                max_rounds: 4,

                has_final: true,

                match_format: {
                    type: "race_to_games",

                    target_games: 9,

                    sets_to_win: null,

                    golden_point: true,

                    super_tiebreak: null,
                },
            },

            {
                tramo: "plata",

                enabled: true,

                max_rounds: 4,

                has_final: true,

                match_format: {
                    type: "race_to_games",

                    target_games: 9,

                    sets_to_win: null,

                    golden_point: true,

                    super_tiebreak: null,
                },
            },

            {
                tramo: "bronce",

                enabled: true,

                max_rounds: 4,

                has_final: true,

                match_format: {
                    type: "race_to_games",

                    target_games: 9,

                    sets_to_win: null,

                    golden_point: true,

                    super_tiebreak: null,
                },
            },
        ],

        structures: [],
    },

    courts: {
        court_count: 1,

        manual_assignment: true,

        live_reassignment: true,

        names: [],
    },

    scheduling: {
        live_changes: true,

        default_match_duration_minutes: 60,

        minimum_rest_minutes: 15,

        parallel_matches: true,
    },

    postponements_enabled: true,

    master: null,

    metadata: {},
};

// =============================================================================
// KNOWN SPC STRUCTURES
// =============================================================================

/**
 * Estructura para 3 parejas.
 *
 * Regla definida:
 * - Solo las dos primeras pasan a Oro.
 * - La tercera no entra en Oro.
 *
 * El tratamiento de Plata/Bronce queda configurable.
 */
export const THREE_PAIR_STRUCTURE:
    KnockoutStructureTemplate = {
    pair_count: 3,

    tiers: ["oro"],

    group_count: 1,

    group_size: 3,

    phases: [
        {
            fase: "final",

            match_count: 1,

            tramo: "oro",

            sources: [
                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 1,
                },

                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 2,
                },
            ],
        },
    ],

    notes:
        "Con 3 parejas, únicamente las posiciones 1 y 2 acceden a la final de Oro.",
};

/**
 * Estructura para 4 parejas.
 *
 * - Todos contra todos.
 * - 1º vs 4º.
 * - 2º vs 3º.
 * - Ganadores: final de Oro.
 * - Perdedores: final de Plata.
 * - No existe Bronce.
 */
export const FOUR_PAIR_STRUCTURE:
    KnockoutStructureTemplate = {
    pair_count: 4,

    tiers: [
        "oro",
        "plata",
    ],

    group_count: 1,

    group_size: 4,

    phases: [
        {
            fase: "semis",

            match_count: 2,

            tramo: "oro",

            sources: [
                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 1,
                },

                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 4,
                },
            ],
        },

        {
            fase: "semis",

            match_count: 1,

            tramo: "oro",

            sources: [
                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 2,
                },

                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 3,
                },
            ],
        },

        {
            fase: "final",

            match_count: 1,

            tramo: "oro",

            sources: [
                {
                    type: "match_winner",

                    match_index: 0,
                },

                {
                    type: "match_winner",

                    match_index: 1,
                },
            ],
        },

        {
            fase: "final",

            match_count: 1,

            tramo: "plata",

            sources: [
                {
                    type: "match_loser",

                    match_index: 0,
                },

                {
                    type: "match_loser",

                    match_index: 1,
                },
            ],
        },
    ],

    notes:
        "Con 4 parejas, los perdedores de semifinales disputan la final de Plata.",
};

/**
 * Estructura para 8 parejas.
 *
 * - 2 grupos de 4.
 * - Los dos primeros de cada grupo pasan a Oro.
 * - Los terceros disputan Plata.
 * - Los cuartos disputan Bronce.
 */
export const EIGHT_PAIR_STRUCTURE:
    KnockoutStructureTemplate = {
    pair_count: 8,

    tiers: [
        "oro",
        "plata",
        "bronce",
    ],

    group_count: 2,

    group_size: 4,

    phases: [
        {
            fase: "semis",

            match_count: 2,

            tramo: "oro",

            sources: [
                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 1,
                },

                {
                    type: "group_position",

                    group_index: 1,

                    group_position: 2,
                },
            ],
        },

        {
            fase: "semis",

            match_count: 1,

            tramo: "oro",

            sources: [
                {
                    type: "group_position",

                    group_index: 1,

                    group_position: 1,
                },

                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 2,
                },
            ],
        },

        {
            fase: "final",

            match_count: 1,

            tramo: "oro",

            sources: [
                {
                    type: "match_winner",

                    match_index: 0,
                },

                {
                    type: "match_winner",

                    match_index: 1,
                },
            ],
        },

        {
            fase: "final",

            match_count: 1,

            tramo: "plata",

            sources: [
                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 3,
                },

                {
                    type: "group_position",

                    group_index: 1,

                    group_position: 3,
                },
            ],
        },

        {
            fase: "final",

            match_count: 1,

            tramo: "bronce",

            sources: [
                {
                    type: "group_position",

                    group_index: 0,

                    group_position: 4,
                },

                {
                    type: "group_position",

                    group_index: 1,

                    group_position: 4,
                },
            ],
        },
    ],

    notes:
        "Con 8 parejas, los dos primeros de cada grupo disputan Oro; los terceros Plata y los cuartos Bronce.",
};

export const SPC_KNOCKOUT_STRUCTURES:
    KnockoutStructureTemplate[] = [
        THREE_PAIR_STRUCTURE,

        FOUR_PAIR_STRUCTURE,

        EIGHT_PAIR_STRUCTURE,
    ];

// =============================================================================
// TOURNAMENT PHASE VIEW MODELS
// =============================================================================

export type TournamentPhase =
    | "registration"
    | "draw"
    | "groups"
    | "knockout"
    | "finished";

export type TournamentLiveStatus = {
    tournament_id: string;

    fase: TournamentPhase;

    estado: Tournament["estado"];

    active_matches: Match[];

    upcoming_matches: Match[];

    recently_finished_matches: Match[];

    current_court_assignments:
    CourtAssignment[];

    last_updated: string;
};

export type CourtAssignment = {
    pista: number;

    match_id: string | null;

    estado: MatchStatus;

    hora_programada: string | null;
};

// =============================================================================
// DRAW
// =============================================================================

export type DrawMode =
    | "automatic"
    | "manual"
    | "random"
    | "seeded";

export type TournamentDraw = {
    tournament_id: string;

    categoria_id: string;

    mode: DrawMode;

    executed_at: string;

    executed_by: string;

    groups: DrawGroup[];

    seed?: number;

    metadata?: Record<string, unknown>;
};

export type DrawGroup = {
    name: string;

    pair_ids: string[];
};

// =============================================================================
// TOURNAMENT SUMMARY / DASHBOARD MODELS
// =============================================================================

export type TournamentSummary = {
    tournament: Tournament;

    season: Season | null;

    club: Club | null;

    categories: TournamentCategorySummary[];

    total_pairs: number;

    confirmed_pairs: number;

    pending_payment_pairs: number;

    waiting_list_pairs: number;

    incomplete_pairs: number;

    completed_matches: number;

    pending_matches: number;

    live_matches: number;

    next_match: Match | null;
};

export type TournamentCategorySummary = {
    tournament_category: TournamentCategory;

    category: Category | null;

    pair_count: number;

    confirmed_pair_count: number;

    completed_match_count: number;

    pending_match_count: number;

    live_match_count: number;
};

// =============================================================================
// TOURNAMENT CATEGORY DETAIL
// =============================================================================

export type TournamentCategoryDetail = {
    tournament_category: TournamentCategory;

    category: Category;

    pairs: PairWithPlayers[];

    groups: GroupWithStandings[];

    matches: MatchWithRelations[];

    brackets: Bracket[];

    prizes: Prize[];
};

export type MatchWithRelations = Match & {
    pair1: PairWithPlayers | null;

    pair2: PairWithPlayers | null;

    group: Group | null;

    next_match: Match | null;
};

export type PairWithPlayers = Pair & {
    player1: Player | null;

    player2: Player | null;
};

// =============================================================================
// REGISTRATION CONTEXT
// =============================================================================

export type RegistrationEligibility = {
    eligible: boolean;

    reasons: RegistrationEligibilityReason[];

    player: Player;

    category: Category;

    tournament: Tournament;

    existing_pair: Pair | null;

    can_join_partner_pool: boolean;
};

export type RegistrationEligibilityReason =
    | "already_registered"
    | "already_in_other_category"
    | "tournament_closed"
    | "category_closed"
    | "category_full"
    | "player_inactive"
    | "player_suspended"
    | "master_not_eligible"
    | "unknown";

export type RegistrationFlowState =
    | "choose_category"
    | "choose_partner"
    | "partner_search"
    | "individual_registration"
    | "pending_payment"
    | "confirmed"
    | "waiting_list"
    | "completed";

// =============================================================================
// TOURNAMENT ADMIN OPERATIONS
// =============================================================================

export type TournamentOperation =
    | "publish"
    | "open_registrations"
    | "close_registrations"
    | "generate_draw"
    | "start_tournament"
    | "pause_tournament"
    | "finish_tournament"
    | "archive_tournament";

export type TournamentOperationResult = {
    success: boolean;

    operation: TournamentOperation;

    message: string;

    tournament: Tournament | null;

    errors?: string[];
};

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isTournamentMaster(
    tournament: Tournament,
): boolean {
    return tournament.tournament_type;
}

export function isTournamentRegistrationOpen(
    tournament: Tournament,
): boolean {
    return (
        tournament.estado ===
        "inscripciones_abiertas"
    );
}

export function isTournamentLive(
    tournament: Tournament,
): boolean {
    return tournament.estado === "en_juego";
}

export function isTournamentFinished(
    tournament: Tournament,
): boolean {
    return tournament.estado === "finalizado";
}

export function isMatchLive(
    match: Match,
): boolean {
    return match.estado === "en_juego";
}

export function isMatchFinished(
    match: Match,
): boolean {
    return (
        match.estado === "finalizado" ||
        match.estado === "walkover" ||
        match.estado === "retirada"
    );
}

export function isMatchPostponed(
    match: Match,
): boolean {
    return match.estado === "aplazado";
}

export function isPairComplete(
    pair: Pair,
): boolean {
    return Boolean(
        pair.player_1_id &&
        pair.player_2_id,
    );
}

// =============================================================================
// STRUCTURE HELPERS
// =============================================================================

export function getStructureForPairCount(
    pairCount: number,
): KnockoutStructureTemplate | null {
    switch (pairCount) {
        case 3:
            return THREE_PAIR_STRUCTURE;

        case 4:
            return FOUR_PAIR_STRUCTURE;

        case 8:
            return EIGHT_PAIR_STRUCTURE;

        default:
            return null;
    }
}

export function getAvailableTiersForPairCount(
    pairCount: number,
): MatchTier[] {
    return (
        getStructureForPairCount(
            pairCount,
        )?.tiers ?? []
    );
}

// =============================================================================
// DEFAULT MATCH FORMATS
// =============================================================================

export const GROUP_MATCH_FORMAT:
    MatchFormat = {
    type: "one_set",

    target_games: null,

    sets_to_win: null,

    golden_point: true,

    super_tiebreak: null,
};

export const KNOCKOUT_MATCH_FORMAT:
    MatchFormat = {
    type: "race_to_games",

    target_games: 9,

    sets_to_win: null,

    golden_point: true,

    super_tiebreak: null,
};

export const FINAL_MATCH_FORMAT:
    MatchFormat = {
    type: "best_of_two_sets",

    target_games: 6,

    sets_to_win: 2,

    golden_point: true,

    super_tiebreak: {
        enabled: true,

        target_points: 10,

        win_by_two: true,
    },
};

// =============================================================================
// DEFAULT SETTINGS FACTORIES
// =============================================================================

/**
 * Configuración completa inicial recomendada
 * para un torneo regular SPC.
 */
export function createDefaultTournamentSettings():
    TournamentSettings {
    return {
        ...DEFAULT_TOURNAMENT_SETTINGS,

        group_stage: {
            ...DEFAULT_TOURNAMENT_SETTINGS.group_stage,

            tie_break_criteria: [
                ...DEFAULT_GROUP_TIE_BREAK_CRITERIA,
            ],
        },

        knockout: {
            ...DEFAULT_TOURNAMENT_SETTINGS.knockout,

            tiers:
                DEFAULT_TOURNAMENT_SETTINGS.knockout.tiers.map(
                    (tramo) => ({
                        ...tramo,

                        match_format: {
                            ...tramo.match_format,
                        },
                    }),
                ),

            structures:
                SPC_KNOCKOUT_STRUCTURES,
        },

        courts: {
            ...DEFAULT_TOURNAMENT_SETTINGS.courts,
        },

        scheduling: {
            ...DEFAULT_TOURNAMENT_SETTINGS.scheduling,
        },
    };
}

/**
 * Configuración inicial del Master Final.
 *
 * La regla de acceso queda fijada:
 * mínimo 1 participación previa en el circuito.
 *
 * El tratamiento exacto de puntos del Master permanece
 * configurable hasta que se defina definitivamente.
 */
export function createDefaultMasterSettings():
    TournamentSettings {
    const settings =
        createDefaultTournamentSettings();

    return {
        ...settings,

        tournament_type: "master",

        master: {
            enabled: true,

            minimum_previous_events: 1,

            awarded_positions: 4,

            ranking_treatment:
                "configurable",
        },
    };
}