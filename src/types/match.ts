/**
 * Match domain types
 * Sagunto Padel Cup
 *
 * Reglas oficiales:
 *
 * Fase de grupos:
 * - 1 set.
 * - Punto de oro.
 *
 * Fase eliminatoria:
 * - Primero a 9 juegos.
 * - Punto de oro.
 *
 * Finales:
 * - Mejor de 2 sets.
 * - Punto de oro.
 * - Si hay empate tras los sets correspondientes:
 *   super tie-break a 10.
 *
 * Los jugadores comunican el resultado al organizador.
 * Solo el organizador puede introducir o modificar resultados.
 */

import type {
    Group,
    Match,
    MatchPhase,
    MatchStatus,
    MatchTier,
    Pair,
    Player,
} from "@/types/database";

// =============================================================================
// SET SCORE
// =============================================================================

export type SetScore = {
    pair1: number;

    pair2: number;
};

// =============================================================================
// SUPER TIE-BREAK
// =============================================================================

export type SuperTiebreakScore = {
    pair1: number;

    pair2: number;
};

// =============================================================================
// MATCH RESULT
// =============================================================================

export type MatchResult = {
    sets: SetScore[];

    super_tiebreak: SuperTiebreakScore | null;

    winner_pair_id: string | null;

    loser_pair_id: string | null;

    /**
     * Resultado administrativo.
     */
    decided_by:
    | "normal"
    | "walkover"
    | "retirada"
    | null;

    /**
     * Información adicional introducida por organización.
     */
    notes: string | null;
};

// =============================================================================
// MATCH FORMAT
// =============================================================================

export type MatchFormat =
    | "group_one_set"
    | "knockout_race_to_9"
    | "final_best_of_two";

export type MatchFormatConfig = {
    type: MatchFormat;

    target_games: number | null;

    target_sets: number | null;

    golden_point: boolean;

    super_tiebreak: {
        enabled: boolean;

        target_points: number;

        win_by_two: boolean;
    } | null;
};

// =============================================================================
// OFFICIAL FORMATS
// =============================================================================

export const GROUP_MATCH_FORMAT: MatchFormatConfig = {
    type: "group_one_set",

    target_games: null,

    target_sets: 1,

    golden_point: true,

    super_tiebreak: null,
};

export const KNOCKOUT_MATCH_FORMAT: MatchFormatConfig = {
    type: "knockout_race_to_9",

    target_games: 9,

    target_sets: 1,

    golden_point: true,

    super_tiebreak: null,
};

export const FINAL_MATCH_FORMAT: MatchFormatConfig = {
    type: "final_best_of_two",

    target_games: 6,

    target_sets: 2,

    golden_point: true,

    super_tiebreak: {
        enabled: true,

        target_points: 10,

        win_by_two: true,
    },
};

// =============================================================================
// MATCH PARTICIPANTS
// =============================================================================

export type MatchParticipant = {
    pair: Pair;

    player1: Player | null;

    player2: Player | null;
};

export type MatchParticipants = {
    pair1: MatchParticipant | null;

    pair2: MatchParticipant | null;
};

// =============================================================================
// MATCH WITH RELATIONS
// =============================================================================

export type MatchWithRelations = Match & {
    pair1: PairWithPlayers | null;

    pair2: PairWithPlayers | null;

    group: Group | null;

    next_match: Match | null;

    previous_matches: Match[];
};

export type PairWithPlayers = Pair & {
    player1: Player | null;

    player2: Player | null;
};

// =============================================================================
// MATCH CARD
// =============================================================================

export type MatchCardData = {
    match: Match;

    pair1: MatchPairDisplay | null;

    pair2: MatchPairDisplay | null;

    format: MatchFormatConfig;

    is_live: boolean;

    is_finished: boolean;

    is_upcoming: boolean;

    can_edit_result: boolean;
};

export type MatchPairDisplay = {
    pair_id: string;

    player1_name: string;

    player2_name: string | null;

    seed: number | null;

    winner: boolean;
};

// =============================================================================
// MATCH CREATION
// =============================================================================

export type CreateMatchInput = {
    tournament_id: string;

    categoria_id: string;

    fase: MatchPhase;

    group_id?: string | null;

    pair_1_id?: string | null;

    pair_2_id?: string | null;

    tramo?: MatchTier | null;

    hora_programada?: string | null;

    pista?: number | null;

    estado?: MatchStatus;
};

export type CreateMatchResult = {
    success: boolean;

    match: Match | null;

    message: string;

    errors: string[];
};

// =============================================================================
// MATCH SCHEDULING
// =============================================================================

export type ScheduleMatchInput = {
    match_id: string;

    pista: number | null;

    hora_programada: string | null;
};

export type ScheduleMatchResult = {
    success: boolean;

    match: Match | null;

    message: string;

    errors: string[];
};

// =============================================================================
// LIVE COURT
// =============================================================================

export type LiveCourt = {
    court_number: number;

    name: string;

    match: MatchWithRelations | null;

    estado:
    | "available"
    | "scheduled"
    | "live"
    | "finished"
    | "blocked";

    updated_at: string;
};

export type LiveCourtBoard = {
    tournament_id: string;

    courts: LiveCourt[];

    updated_at: string;
};

// =============================================================================
// MATCH STATUS
// =============================================================================

export function isMatchPending(
    estado: MatchStatus,
): boolean {
    return estado === "pendiente";
}

export function isMatchLive(
    estado: MatchStatus,
): boolean {
    return estado === "en_juego";
}

export function isMatchFinished(
    estado: MatchStatus,
): boolean {
    return (
        estado === "finalizado" ||
        estado === "walkover" ||
        estado === "retirada"
    );
}

export function isMatchPostponed(
    estado: MatchStatus,
): boolean {
    return estado === "aplazado";
}

// =============================================================================
// RESULT VALIDATION
// =============================================================================

export type MatchResultValidation = {
    valid: boolean;

    winner_pair_id: string | null;

    errors: string[];

    warnings: string[];
};

/**
 * Comprueba un resultado antes de almacenarlo.
 */
export function validateMatchResult(
    resultado_json: MatchResult,
    pair1Id: string,
    pair2Id: string,
    format: MatchFormatConfig,
): MatchResultValidation {
    const errors: string[] = [];

    const warnings: string[] = [];

    if (!resultado_json.sets.length) {
        errors.push(
            "El partido debe contener al menos un set.",
        );

        return {
            valid: false,
            winner_pair_id: null,
            errors,
            warnings,
        };
    }

    for (const set of resultado_json.sets) {
        if (set.pair1 < 0 || set.pair2 < 0) {
            errors.push(
                "Los juegos no pueden tener valores negativos.",
            );
        }

        if (!Number.isInteger(set.pair1)) {
            errors.push(
                "La puntuación de la pareja 1 debe ser un número entero.",
            );
        }

        if (!Number.isInteger(set.pair2)) {
            errors.push(
                "La puntuación de la pareja 2 debe ser un número entero.",
            );
        }
    }

    if (format.type === "group_one_set") {
        validateGroupSet(
            resultado_json.sets[0],
            errors,
        );
    }

    if (format.type === "knockout_race_to_9") {
        validateRaceToNine(
            resultado_json.sets,
            errors,
        );
    }

    if (format.type === "final_best_of_two") {
        validateFinalResult(
            resultado_json,
            errors,
        );
    }

    const winner = determineWinner(
        resultado_json,
        pair1Id,
        pair2Id,
        format,
    );

    if (!winner) {
        errors.push(
            "No se puede determinar el ganador con este resultado.",
        );
    }

    return {
        valid: errors.length === 0,
        winner_pair_id: winner,
        errors,
        warnings,
    };
}

// =============================================================================
// GROUP RESULT VALIDATION
// =============================================================================

function validateStandardSetScore(
    set: SetScore,
    errors: string[],
    context: "grupo" | "final",
): void {
    if (
        !Number.isInteger(set.pair1) ||
        !Number.isInteger(set.pair2) ||
        set.pair1 < 0 ||
        set.pair2 < 0
    ) {
        return;
    }

    if (set.pair1 === set.pair2) {
        errors.push(
            `El set de ${context} no puede terminar empatado.`,
        );
        return;
    }

    const winner = Math.max(set.pair1, set.pair2);
    const loser = Math.min(set.pair1, set.pair2);

    /*
     * Set estándar:
     * 6-0 hasta 6-4, 7-5 o 7-6.
     */
    const valid =
        (winner === 6 && loser >= 0 && loser <= 4) ||
        (winner === 7 && (loser === 5 || loser === 6));

    if (!valid) {
        errors.push(
            `El resultado del set de ${context} no es válido.`,
        );
    }
}

function validateGroupSet(
    set: SetScore,
    errors: string[],
): void {
    validateStandardSetScore(
        set,
        errors,
        "grupo",
    );
}

// =============================================================================
// RACE TO 9 VALIDATION
// =============================================================================

function validateRaceToNine(
    sets: SetScore[],
    errors: string[],
): void {
    if (sets.length !== 1) {
        errors.push(
            "Un partido a 9 debe contener exactamente un resultado.",
        );

        return;
    }

    const set = sets[0];

    if (set.pair1 === set.pair2) {
        errors.push(
            "Un partido a 9 no puede terminar empatado.",
        );
    }

    if (
        set.pair1 !== 9 &&
        set.pair2 !== 9
    ) {
        errors.push(
            "Uno de los participantes debe alcanzar 9 juegos.",
        );
    }

    if (
        Math.max(set.pair1, set.pair2) === 9 &&
        Math.min(set.pair1, set.pair2) > 8
    ) {
        errors.push(
            "En un partido a 9, el perdedor no puede superar los 8 juegos.",
        );
    }
}

// =============================================================================
// FINAL VALIDATION
// =============================================================================

function validateFinalResult(
    resultado_json: MatchResult,
    errors: string[],
): void {
    if (
        resultado_json.sets.length !== 2
    ) {
        errors.push(
            "La final debe registrar dos sets.",
        );

        return;
    }

    const firstSet = resultado_json.sets[0];

    const secondSet = resultado_json.sets[1];

    validateStandardSetScore(
        firstSet,
        errors,
        "final",
    );

    validateStandardSetScore(
        secondSet,
        errors,
        "final",
    );

    const firstWinner =
        firstSet.pair1 > firstSet.pair2
            ? 1
            : 2;

    const secondWinner =
        secondSet.pair1 > secondSet.pair2
            ? 1
            : 2;

    /*
     * Si una pareja gana ambos sets, el partido termina 2-0.
     * El super tie-break solo existe cuando los sets se reparten 1-1.
     */
    if (
        firstWinner === secondWinner
    ) {
        if (resultado_json.super_tiebreak) {
            errors.push(
                "No debe existir super tie-break cuando una pareja gana los dos sets.",
            );
        }

        return;
    }

    if (!resultado_json.super_tiebreak) {
        errors.push(
            "Debe registrarse super tie-break cuando los sets se reparten.",
        );

        return;
    }

    validateSuperTiebreak(
        resultado_json.super_tiebreak,
        errors,
    );
}

// =============================================================================
// SUPER TIE-BREAK VALIDATION
// =============================================================================

function validateSuperTiebreak(
    score: SuperTiebreakScore,
    errors: string[],
): void {
    if (
        score.pair1 < 0 ||
        score.pair2 < 0
    ) {
        errors.push(
            "La puntuación del super tie-break no puede ser negativa.",
        );

        return;
    }

    if (score.pair1 === score.pair2) {
        errors.push(
            "El super tie-break no puede terminar empatado.",
        );

        return;
    }

    const winner = Math.max(
        score.pair1,
        score.pair2,
    );

    const loser = Math.min(
        score.pair1,
        score.pair2,
    );

    if (winner < 10) {
        errors.push(
            "El ganador del super tie-break debe alcanzar al menos 10 puntos.",
        );
    }

    if (
        winner >= 10 &&
        winner - loser < 2
    ) {
        errors.push(
            "El super tie-break debe ganarse por una diferencia mínima de 2 puntos.",
        );
    }
}

// =============================================================================
// WINNER
// =============================================================================

export function determineWinner(
    resultado_json: MatchResult,
    pair1Id: string,
    pair2Id: string,
    format: MatchFormatConfig,
): string | null {
    if (
        resultado_json.decided_by === "walkover" ||
        resultado_json.decided_by === "retirada"
    ) {
        return resultado_json.winner_pair_id;
    }

    if (!resultado_json.sets.length) {
        return null;
    }

    if (
        format.type === "group_one_set" ||
        format.type === "knockout_race_to_9"
    ) {
        const set = resultado_json.sets[0];

        if (set.pair1 === set.pair2) {
            return null;
        }

        return set.pair1 > set.pair2
            ? pair1Id
            : pair2Id;
    }

    if (
        format.type === "final_best_of_two"
    ) {
        const firstSet = resultado_json.sets[0];

        const secondSet = resultado_json.sets[1];

        let pair1Sets = 0;

        let pair2Sets = 0;

        if (firstSet.pair1 > firstSet.pair2) {
            pair1Sets++;
        } else {
            pair2Sets++;
        }

        if (secondSet.pair1 > secondSet.pair2) {
            pair1Sets++;
        } else {
            pair2Sets++;
        }

        if (pair1Sets > pair2Sets) {
            return pair1Id;
        }

        if (pair2Sets > pair1Sets) {
            return pair2Id;
        }

        if (!resultado_json.super_tiebreak) {
            return null;
        }

        return resultado_json.super_tiebreak.pair1 >
            resultado_json.super_tiebreak.pair2
            ? pair1Id
            : pair2Id;
    }

    return null;
}

// =============================================================================
// LOSER
// =============================================================================

export function determineLoser(
    resultado_json: MatchResult,
    pair1Id: string,
    pair2Id: string,
    format: MatchFormatConfig,
): string | null {
    const winner = determineWinner(
        resultado_json,
        pair1Id,
        pair2Id,
        format,
    );

    if (!winner) {
        return null;
    }

    return winner === pair1Id
        ? pair2Id
        : pair1Id;
}

// =============================================================================
// RESULT NORMALIZATION
// =============================================================================

export function normalizeMatchResult(
    resultado_json: MatchResult,
    pair1Id: string,
    pair2Id: string,
    format: MatchFormatConfig,
): MatchResult {
    const winner = determineWinner(
        resultado_json,
        pair1Id,
        pair2Id,
        format,
    );

    const loser = winner
        ? winner === pair1Id
            ? pair2Id
            : pair1Id
        : null;

    return {
        ...resultado_json,

        winner_pair_id: winner,

        loser_pair_id: loser,
    };
}

// =============================================================================
// RESULT SCORE DISPLAY
// =============================================================================

export function formatSetScore(
    score: SetScore,
): string {
    return `${score.pair1}-${score.pair2}`;
}

export function formatSuperTiebreakScore(
    score: SuperTiebreakScore,
): string {
    return `${score.pair1}-${score.pair2}`;
}

export function formatMatchResult(
    resultado_json: MatchResult | null,
): string {
    if (!resultado_json || !resultado_json.sets.length) {
        return "—";
    }

    const sets = resultado_json.sets
        .map(formatSetScore)
        .join(" / ");

    if (resultado_json.super_tiebreak) {
        return `${sets} · STB ${formatSuperTiebreakScore(
            resultado_json.super_tiebreak,
        )}`;
    }

    return sets;
}

// =============================================================================
// MATCH PHASE HELPERS
// =============================================================================

export function getMatchPhaseLabel(
    fase: MatchPhase,
): string {
    switch (fase) {
        case "grupos":
            return "Grupos";

        case "octavos":
            return "Octavos";

        case "cuartos":
            return "Cuartos";

        case "semis":
            return "Semifinales";

        case "final":
            return "Final";

        default:
            return fase;
    }
}

export function getMatchTierLabel(
    tramo: MatchTier | null,
): string {
    switch (tramo) {
        case "oro":
            return "Oro";

        case "plata":
            return "Plata";

        case "bronce":
            return "Bronce";

        default:
            return "—";
    }
}

// =============================================================================
// MATCH FORMAT HELPERS
// =============================================================================

export function getMatchFormat(
    fase: MatchPhase,
): MatchFormatConfig {
    if (fase === "grupos") {
        return GROUP_MATCH_FORMAT;
    }

    if (fase === "final") {
        return FINAL_MATCH_FORMAT;
    }

    return KNOCKOUT_MATCH_FORMAT;
}

export function getMatchFormatLabel(
    format: MatchFormat,
): string {
    switch (format) {
        case "group_one_set":
            return "1 set · Punto de oro";

        case "knockout_race_to_9":
            return "A 9 juegos · Punto de oro";

        case "final_best_of_two":
            return "2 sets · Punto de oro · Super tie-break";

        default:
            return format;
    }
}

// =============================================================================
// LIVE MATCH
// =============================================================================

export type LiveMatchState = {
    match: MatchWithRelations;

    elapsed_minutes: number | null;

    current_court: number | null;

    can_start: boolean;

    can_finish: boolean;

    can_edit: boolean;
};

export function canStartMatch(
    match: Match,
): boolean {
    return (
        match.estado === "pendiente" &&
        Boolean(match.pair_1_id) &&
        Boolean(match.pair_2_id)
    );
}

export function canFinishMatch(
    match: Match,
): boolean {
    return match.estado === "en_juego";
}

export function canEditMatchResult(
    match: Match,
): boolean {
    return (
        match.estado === "finalizado" ||
        match.estado === "walkover" ||
        match.estado === "retirada"
    );
}

export function canEnterNormalResult(match: Match): boolean {
    return match.estado === "en_juego" &&
        Boolean(match.pair_1_id) &&
        Boolean(match.pair_2_id);
}

export function getMatchFormatForPhase(
    fase: MatchPhase,
): MatchFormatConfig {
    return getMatchFormat(fase);
}

// =============================================================================
// MATCH ADMIN OPERATIONS
// =============================================================================

export type MatchAdminAction =
    | "assign_court"
    | "remove_court"
    | "schedule"
    | "reschedule"
    | "start"
    | "enter_result"
    | "edit_result"
    | "finish"
    | "postpone"
    | "cancel_postponement"
    | "walkover"
    | "retirement";

export type MatchAdminActionInput = {
    match_id: string;

    accion: MatchAdminAction;

    pista?: number | null;

    hora_programada?: string | null;

    resultado_json?: MatchResult | null;

    reason?: string | null;

    usuario_id: string;
};

export type MatchAdminActionResult = {
    success: boolean;

    match: Match | null;

    accion: MatchAdminAction;

    message: string;

    errors: string[];
};

// =============================================================================
// POSTPONEMENT
// =============================================================================

export type MatchPostponement = {
    match_id: string;

    original_scheduled_at: string | null;

    new_scheduled_at: string | null;

    reason:
    | "weather"
    | "force_majeure"
    | "organizational"
    | "player_request"
    | "other";

    notes: string | null;

    changed_by: string;

    changed_at: string;
};

export type PostponeMatchInput = {
    match_id: string;

    new_scheduled_at: string | null;

    reason: MatchPostponement["reason"];

    notes?: string | null;

    usuario_id: string;
};

// =============================================================================
// MATCH LISTS
// =============================================================================

export type MatchFilters = {
    tournament_id: string;

    categoria_id?: string;

    fase?: MatchPhase | "all";

    tramo?: MatchTier | "all";

    estado?: MatchStatus | "all";

    pista?: number | "all";

    date?: string;

    search?: string;
};

export type MatchList = {
    matches: MatchWithRelations[];

    total: number;

    filters: MatchFilters;

    updated_at: string;
};

// =============================================================================
// TOURNAMENT MATCH STATS
// =============================================================================

export type TournamentMatchStats = {
    total: number;

    pending: number;

    live: number;

    finished: number;

    postponed: number;

    walkovers: number;

    retirements: number;

    by_phase: Record<
        MatchPhase,
        number
    >;

    by_tier: Record<
        MatchTier,
        number
    >;
};

// =============================================================================
// COMPETITION OPERATION
// =============================================================================

export type GenerateMatchesResult = {
    success: boolean;

    created_matches: number;

    matches: Match[];

    errors: string[];
};