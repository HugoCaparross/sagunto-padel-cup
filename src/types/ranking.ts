/**
 * Ranking domain types
 * Sagunto Padel Cup
 *
 * Reglas principales:
 * - Ranking individual.
 * - Ranking independiente por categoría.
 * - Los puntos se obtienen por resultado competitivo.
 * - Los puntos pertenecen al jugador, no a la pareja.
 * - Cada temporada gestiona su propio ciclo de ranking.
 * - Al cerrar una temporada se conserva el 30 % y se elimina el 70 %.
 * - Los puntos no caducan simplemente por cumplir 365 días.
 */

import type {
    Category,
    Player,
    RankingPoint,
    RankingSnapshot,
    Season,
    Tournament,
} from "@/types/database";

// =============================================================================
// RANKING POSITIONS
// =============================================================================

export type RankingPosition = {
    position: number;

    player: Player;

    category: Category;

    season: Season;

    /**
     * Puntos que cuentan actualmente.
     */
    points: number;

    /**
     * Número de torneos disputados.
     */
    tournaments_played: number;

    /**
     * Número de resultados que generan puntos.
     */
    scored_results: number;

    /**
     * Posición anterior.
     */
    previous_position: number | null;

    /**
     * Diferencia respecto a la posición anterior.
     *
     * Ejemplo:
     * +2 = sube dos posiciones.
     * -1 = baja una posición.
     * 0 = mantiene posición.
     */
    position_change: number;

    /**
     * Variación de puntos desde el último snapshot.
     */
    points_change: number;

    /**
     * Indica si el jugador está dentro del Top 4.
     */
    is_top_four: boolean;

    /**
     * Indica si el jugador tiene acceso/prioridad
     * relacionada con el Master según las reglas configuradas.
     */
    master_eligible: boolean;
};

// =============================================================================
// RANKING TABLE
// =============================================================================

export type RankingTable = {
    season: Season;

    category: Category;

    positions: RankingPosition[];

    total_players: number;

    updated_at: string;
};

// =============================================================================
// RANKING RESULT
// =============================================================================

export type RankingResult = {
    player_id: string;

    category_id: string;

    season_id: string;

    position: number;

    points: number;

    previous_position: number | null;

    position_change: number;

    points_change: number;
};

// =============================================================================
// RANKING POINT CONFIGURATION
// =============================================================================

export type RankingResultType =
    | "campeon"
    | "finalista"
    | "semifinalista"
    | "cuartos";

export type RankingPointsByCategory = {
    category_order: number;

    category_name: string;

    points: RankingPointsTable;
};

/**
 * Tabla definitiva de puntuación SPC.
 *
 * 1ª: 120 -> 106
 * 2ª: 105 -> 91
 * 3ª: 90 -> 76
 * 4ª: 75 -> 61
 *
 * No hay solapamiento entre categorías.
 */
export type RankingPointsTable = {
    oro: {
        campeon: number;
        finalista: number;
        semifinalista: number;
        cuartos: number;
    };

    plata: {
        campeon: number;
        finalista: number;
        semifinalista: number;
        cuartos: number;
    };

    bronce: {
        campeon: number;
        finalista: number;
        semifinalista: number;
        cuartos: number;
    };
};

// =============================================================================
// DEFINITIVE SPC POINTS
// =============================================================================

export const SPC_RANKING_POINTS: Record<
    1 | 2 | 3 | 4,
    RankingPointsTable
> = {
    1: {
        oro: {
            campeon: 120,
            finalista: 118,
            semifinalista: 116,
            cuartos: 114,
        },

        plata: {
            campeon: 113,
            finalista: 112,
            semifinalista: 111,
            cuartos: 110,
        },

        bronce: {
            campeon: 109,
            finalista: 108,
            semifinalista: 107,
            cuartos: 106,
        },
    },

    2: {
        oro: {
            campeon: 105,
            finalista: 103,
            semifinalista: 101,
            cuartos: 99,
        },

        plata: {
            campeon: 98,
            finalista: 97,
            semifinalista: 96,
            cuartos: 95,
        },

        bronce: {
            campeon: 94,
            finalista: 93,
            semifinalista: 92,
            cuartos: 91,
        },
    },

    3: {
        oro: {
            campeon: 90,
            finalista: 88,
            semifinalista: 86,
            cuartos: 84,
        },

        plata: {
            campeon: 83,
            finalista: 82,
            semifinalista: 81,
            cuartos: 80,
        },

        bronce: {
            campeon: 79,
            finalista: 78,
            semifinalista: 77,
            cuartos: 76,
        },
    },

    4: {
        oro: {
            campeon: 75,
            finalista: 73,
            semifinalista: 71,
            cuartos: 69,
        },

        plata: {
            campeon: 68,
            finalista: 67,
            semifinalista: 66,
            cuartos: 65,
        },

        bronce: {
            campeon: 64,
            finalista: 63,
            semifinalista: 62,
            cuartos: 61,
        },
    },
};

// =============================================================================
// RANKING RULES
// =============================================================================

export const RANKING_RULES = {
    individual: true,

    points_are_per_player: true,

    separate_by_category: true,

    category_changes_preserve_history: true,

    category_changes_apply_to_future_events_only: true,

    victory_bonus: false,

    season_carry_over_percentage: 30,

    season_reset_percentage: 70,

    ranking_expires_by_days: false,

    ranking_expiration_days: null,

    master_uses_configurable_treatment: true,
} as const;

// =============================================================================
// CATEGORY ORDER
// =============================================================================

export const RANKING_CATEGORY_ORDER = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
} as const;

export type RankingCategoryOrder =
    keyof typeof RANKING_CATEGORY_ORDER;

// =============================================================================
// POINT LOOKUP
// =============================================================================

export function getRankingPoints(
    categoryOrder: number,
    tier: "oro" | "plata" | "bronce",
    result: RankingResultType,
): number {
    if (
        categoryOrder !== 1 &&
        categoryOrder !== 2 &&
        categoryOrder !== 3 &&
        categoryOrder !== 4
    ) {
        throw new Error(
            `Categoría de ranking no válida: ${categoryOrder}`,
        );
    }

    return SPC_RANKING_POINTS[
        categoryOrder as RankingCategoryOrder
    ][tier][result];
}

// =============================================================================
// POINT VALIDATION
// =============================================================================

export function isValidRankingPoints(
    categoryOrder: number,
    points: number,
): boolean {
    if (
        categoryOrder !== 1 &&
        categoryOrder !== 2 &&
        categoryOrder !== 3 &&
        categoryOrder !== 4
    ) {
        return false;
    }

    const table = SPC_RANKING_POINTS[
        categoryOrder as RankingCategoryOrder
    ];

    const validPoints = [
        table.oro.campeon,
        table.oro.finalista,
        table.oro.semifinalista,
        table.oro.cuartos,

        table.plata.campeon,
        table.plata.finalista,
        table.plata.semifinalista,
        table.plata.cuartos,

        table.bronce.campeon,
        table.bronce.finalista,
        table.bronce.semifinalista,
        table.bronce.cuartos,
    ];

    return validPoints.includes(points);
}

// =============================================================================
// CATEGORY POINT RANGE
// =============================================================================

export function getCategoryPointRange(
    categoryOrder: number,
): {
    min: number;
    max: number;
} {
    switch (categoryOrder) {
        case 1:
            return {
                min: 106,
                max: 120,
            };

        case 2:
            return {
                min: 91,
                max: 105,
            };

        case 3:
            return {
                min: 76,
                max: 90,
            };

        case 4:
            return {
                min: 61,
                max: 75,
            };

        default:
            throw new Error(
                `Categoría de ranking no válida: ${categoryOrder}`,
            );
    }
}

// =============================================================================
// CATEGORY POINT ORDER VALIDATION
// =============================================================================

/**
 * Garantiza que ningún resultado de una categoría inferior
 * supere a cualquier resultado de una categoría superior.
 */
export function validateCategoryPointBands(): boolean {
    const ranges = [
        getCategoryPointRange(1),
        getCategoryPointRange(2),
        getCategoryPointRange(3),
        getCategoryPointRange(4),
    ];

    for (let index = 0; index < ranges.length - 1; index++) {
        const current = ranges[index];
        const next = ranges[index + 1];

        if (next.max >= current.min) {
            return false;
        }
    }

    return true;
}

// =============================================================================
// RANKING LEDGER
// =============================================================================

/**
 * Un registro del ledger representa una única asignación de puntos.
 *
 * Nunca debemos modificar el histórico para recalcular simplemente
 * la clasificación visual.
 */
export type RankingLedgerEntry = {
    id: string;

    season_id: string;

    tournament_id: string;

    category_id: string;

    player_id: string;

    pair_id: string | null;

    tier: "oro" | "plata" | "bronce" | null;

    result_type: RankingResultType;

    points: number;

    awarded_at: string;

    source:
    | "tournament"
    | "manual_adjustment"
    | "season_operation";

    notes: string | null;
};

// =============================================================================
// ACTIVE RANKING POINTS
// =============================================================================

export type ActiveRankingPoint = RankingPoint & {
    active: boolean;

    /**
     * Motivo por el que el punto está activo/inactivo.
     */
    state:
    | "active"
    | "carried_over"
    | "removed"
    | "superseded";
};

// =============================================================================
// RANKING CALCULATION
// =============================================================================

export type RankingCalculationInput = {
    season: Season;

    category_id: string;

    players: Player[];

    points: RankingPoint[];

    previous_snapshot: RankingSnapshot | null;
};

export type RankingCalculationOutput = {
    season_id: string;

    category_id: string;

    positions: CalculatedRankingPosition[];

    generated_at: string;
};

export type CalculatedRankingPosition = {
    player_id: string;

    position: number;

    points: number;

    tournaments_played: number;

    results_count: number;

    previous_position: number | null;

    position_change: number;

    points_change: number;
};

// =============================================================================
// RANKING SORTING
// =============================================================================

/**
 * Criterios para ordenar jugadores con los mismos puntos.
 *
 * La plataforma no debe inventar un criterio competitivo que no
 * esté definido. Por ello, el desempate definitivo se puede
 * configurar por temporada.
 */
export type RankingTieBreakCriterion =
    | "puntos"
    | "victorias"
    | "mejor_resultado"
    | "torneos_disputados"
    | "ranking_anterior"
    | "orden_alfabetico";

export type RankingTieBreakSettings = {
    criteria: RankingTieBreakCriterion[];

    /**
     * Si después de todos los criterios persiste el empate,
     * se utiliza el orden alfabético únicamente como último
     * criterio técnico estable.
     */
    final_fallback: "orden_alfabetico";
};

export const DEFAULT_RANKING_TIE_BREAK_SETTINGS: RankingTieBreakSettings =
{
    criteria: [
        "puntos",
        "mejor_resultado",
        "victorias",
        "ranking_anterior",
    ],

    final_fallback: "orden_alfabetico",
};

// =============================================================================
// SEASON RESET
// =============================================================================

export type SeasonResetMode =
    | "percentage"
    | "manual"
    | "full_reset"
    | "none";

export type SeasonResetConfiguration = {
    mode: SeasonResetMode;

    /**
     * Porcentaje de puntos conservado.
     *
     * SPC = 30.
     */
    carry_over_percentage: number;

    /**
     * Porcentaje eliminado.
     *
     * SPC = 70.
     */
    reset_percentage: number;

    effective_date: string;

    performed_by: string | null;

    notes: string | null;
};

export type SeasonResetResult = {
    success: boolean;

    previous_season_id: string;

    new_season_id: string;

    processed_players: number;

    retained_points: number;

    removed_points: number;

    errors: string[];
};

// =============================================================================
// MASTER
// =============================================================================

export type MasterEligibility = {
    player_id: string;

    eligible: boolean;

    previous_events_count: number;

    minimum_required: number;

    qualifying_tournaments: MasterQualifyingTournament[];

    reason:
    | "eligible"
    | "no_previous_events"
    | "insufficient_events"
    | "inactive_player"
    | "category_not_available"
    | "unknown";
};

export type MasterQualifyingTournament = {
    tournament_id: string;

    tournament_name: string;

    date: string;

    category_id: string;

    participated: boolean;
};

export type MasterRankingPosition = {
    position: number;

    player: Player;

    points: number;

    category: Category;

    eligible: boolean;

    awarded: boolean;
};

// =============================================================================
// RACE TO MASTER
// =============================================================================

export type RaceToMaster = {
    season: Season;

    category: Category;

    positions: RaceToMasterPosition[];

    qualification_cutoff: number;

    updated_at: string;
};

export type RaceToMasterPosition = {
    position: number;

    player: Player;

    points: number;

    tournaments_played: number;

    master_eligible: boolean;

    points_to_next: number | null;

    points_from_cutoff: number | null;
};

// =============================================================================
// RANKING HISTORY
// =============================================================================

export type RankingHistoryEntry = {
    date: string;

    position: number;

    points: number;

    season_id: string;

    category_id: string;

    source:
    | "snapshot"
    | "tournament"
    | "season_operation";
};

export type PlayerRankingHistory = {
    player: Player;

    category: Category;

    season: Season;

    history: RankingHistoryEntry[];
};

// =============================================================================
// RANKING TOURNAMENT RESULT
// =============================================================================

export type TournamentRankingResult = {
    tournament: Tournament;

    category: Category;

    player: Player;

    pair_id: string;

    tier: "oro" | "plata" | "bronce";

    result: RankingResultType;

    points: number;

    awarded_at: string;
};

// =============================================================================
// RANKING ADMIN OPERATIONS
// =============================================================================

export type RankingOperation =
    | "recalculate"
    | "create_points"
    | "adjust_points"
    | "create_snapshot"
    | "reset_season"
    | "rebuild_season"
    | "rebuild_all";

export type RankingOperationResult = {
    success: boolean;

    operation: RankingOperation;

    affected_players: number;

    affected_points: number;

    message: string;

    errors?: string[];
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function calculatePositionChange(
    currentPosition: number,
    previousPosition: number | null,
): number {
    if (previousPosition === null) {
        return 0;
    }

    return previousPosition - currentPosition;
}

export function calculatePointsChange(
    currentPoints: number,
    previousPoints: number | null,
): number {
    if (previousPoints === null) {
        return currentPoints;
    }

    return currentPoints - previousPoints;
}

export function isTopFour(position: number): boolean {
    return position >= 1 && position <= 4;
}

/**
 * Calcula los puntos que se conservan al cerrar una temporada.
 *
 * 30 % de los puntos actuales.
 *
 * El redondeo se realiza hacia abajo para evitar generar
 * puntos artificiales adicionales.
 */
export function calculateCarryOverPoints(
    points: number,
    percentage = RANKING_RULES.season_carry_over_percentage,
): number {
    if (points <= 0) {
        return 0;
    }

    if (percentage <= 0) {
        return 0;
    }

    if (percentage >= 100) {
        return points;
    }

    return Math.floor((points * percentage) / 100);
}

/**
 * Calcula los puntos eliminados durante el cierre de temporada.
 */
export function calculateRemovedPoints(
    points: number,
    carryOverPercentage = RANKING_RULES.season_carry_over_percentage,
): number {
    const retained = calculateCarryOverPoints(
        points,
        carryOverPercentage,
    );

    return Math.max(0, points - retained);
}

/**
 * Comprueba que la tabla oficial de puntos mantiene
 * exactamente los rangos definidos.
 */
export function validateRankingConfiguration(): {
    valid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!validateCategoryPointBands()) {
        errors.push(
            "Los rangos de puntos de las categorías se solapan.",
        );
    }

    if (RANKING_RULES.season_carry_over_percentage !== 30) {
        errors.push(
            "El porcentaje de arrastre de temporada debe ser 30 %.",
        );
    }

    if (RANKING_RULES.season_reset_percentage !== 70) {
        errors.push(
            "El porcentaje de reinicio de temporada debe ser 70 %.",
        );
    }

    if (RANKING_RULES.victory_bonus) {
        errors.push(
            "El bonus por victoria no está permitido en el sistema SPC.",
        );
    }

    if (RANKING_RULES.ranking_expires_by_days) {
        errors.push(
            "El ranking no debe utilizar caducidad fija por días.",
        );
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

export function formatRankingPosition(
    position: number,
): string {
    return `#${position}`;
}

export function formatPositionChange(
    change: number,
): string {
    if (change > 0) {
        return `+${change}`;
    }

    if (change < 0) {
        return `${change}`;
    }

    return "—";
}

export function formatPointsChange(
    change: number,
): string {
    if (change > 0) {
        return `+${change}`;
    }

    if (change < 0) {
        return `${change}`;
    }

    return "—";
}