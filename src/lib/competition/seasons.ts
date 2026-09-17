import type {
    RankingPoint,
    RankingSnapshot,
    Season,
} from "@/types/database";

import {
    RANKING_RETENTION,
    SEASON,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type SeasonStatus =
    | "planificada"
    | "activa"
    | "finalizada"
    | "archivada";

export type SeasonInput = {
    name: string;
    slug: string;
    startDate: string;
    endDate: string;
    masterFinalDate?: string | null;
};

export type SeasonResetResult = {
    playerId: string;

    previousPoints: number;
    retainedPoints: number;
    removedPoints: number;

    retainedPercentage: number;
    removedPercentage: number;
};

export type SeasonResetSummary = {
    seasonId: string;

    playersProcessed: number;
    totalPreviousPoints: number;
    totalRetainedPoints: number;
    totalRemovedPoints: number;

    retainedPercentage: number;
    removedPercentage: number;
};

export type SeasonValidation = {
    valid: boolean;
    errors: string[];
};

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

export const CURRENT_SEASON = {
    name: SEASON.current,
    firstTournamentDate:
        SEASON.firstTournamentDate,
    firstTournamentEndDate:
        SEASON.firstTournamentEndDate,
    masterFinalYear:
        SEASON.masterFinalYear,
} as const;

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

function isValidDate(
    value: string,
): boolean {
    const timestamp =
        new Date(value).getTime();

    return Number.isFinite(
        timestamp,
    );
}

function normalizeDate(
    value: string,
): string {
    if (!isValidDate(value)) {
        throw new Error(
            `Fecha no válida: ${value}`,
        );
    }

    return value;
}

export function validateSeasonInput(
    input: SeasonInput,
): SeasonValidation {
    const errors: string[] = [];

    if (!input.name.trim()) {
        errors.push(
            "El nombre de la temporada es obligatorio.",
        );
    }

    if (!input.slug.trim()) {
        errors.push(
            "El slug de la temporada es obligatorio.",
        );
    }

    if (!isValidDate(input.startDate)) {
        errors.push(
            "La fecha de inicio no es válida.",
        );
    }

    if (!isValidDate(input.endDate)) {
        errors.push(
            "La fecha de finalización no es válida.",
        );
    }

    if (
        isValidDate(input.startDate) &&
        isValidDate(input.endDate) &&
        new Date(input.endDate) <=
        new Date(input.startDate)
    ) {
        errors.push(
            "La fecha de finalización debe ser posterior a la fecha de inicio.",
        );
    }

    if (
        input.masterFinalDate &&
        !isValidDate(
            input.masterFinalDate,
        )
    ) {
        errors.push(
            "La fecha de la Master Final no es válida.",
        );
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/* -------------------------------------------------------------------------- */
/* SEASON CREATION                                                            */
/* -------------------------------------------------------------------------- */

export function createSeason(
    input: SeasonInput,
) {
    const validation =
        validateSeasonInput(
            input,
        );

    if (!validation.valid) {
        throw new Error(
            validation.errors.join(" "),
        );
    }

    return {
        name:
            input.name.trim(),

        slug:
            input.slug.trim().toLowerCase(),

        start_date:
            normalizeDate(
                input.startDate,
            ),

        end_date:
            normalizeDate(
                input.endDate,
            ),

        settings: input.masterFinalDate
            ? {
                master_final_date: normalizeDate(input.masterFinalDate),
            }
            : {},

        status:
            "planificada" as SeasonStatus,

        rollover_percentage: RANKING_RETENTION.retainedPercentage,
    };
}

/* -------------------------------------------------------------------------- */
/* SEASON STATE                                                               */
/* -------------------------------------------------------------------------- */

export function canActivateSeason(
    season: Pick<
        Season,
        "status"
    >,
): boolean {
    return (
        season.status ===
        "planificada"
    );
}

export function canCloseSeason(
    season: Pick<
        Season,
        "status"
    >,
): boolean {
    return (
        season.status ===
        "activa"
    );
}

export function canArchiveSeason(
    season: Pick<
        Season,
        "status"
    >,
): boolean {
    return (
        season.status ===
        "finalizada" ||
        season.status ===
        "archivada"
    );
}

export function activateSeason() {
    return {
        status: "activa" as const,
    };
}

export function closeSeason() {
    return {
        status: "finalizada" as const,
        closedAt: new Date().toISOString(),
    };
}

export function archiveSeason() {
    return {
        status: "archivada" as const,
        archivedAt: new Date().toISOString(),
    };
}

/* -------------------------------------------------------------------------- */
/* DATE RELATIONSHIPS                                                         */
/* -------------------------------------------------------------------------- */

export function isTournamentInsideSeason(
    tournamentStart: string,
    tournamentEnd: string,
    season: Pick<
        Season,
        "start_date" | "end_date"
    >,
): boolean {
    if (
        !isValidDate(
            tournamentStart,
        ) ||
        !isValidDate(
            tournamentEnd,
        )
    ) {
        return false;
    }

    const start =
        new Date(
            tournamentStart,
        );

    const end =
        new Date(
            tournamentEnd,
        );

    const seasonStart =
        new Date(
            season.start_date,
        );

    const seasonEnd =
        new Date(
            season.end_date,
        );

    return (
        start >= seasonStart &&
        end <= seasonEnd &&
        end >= start
    );
}

/**
 * Checks whether two seasons overlap.
 */
export function seasonsOverlap(
    a: Pick<
        Season,
        "start_date" | "end_date"
    >,
    b: Pick<
        Season,
        "start_date" | "end_date"
    >,
): boolean {
    const aStart =
        new Date(
            a.start_date,
        );

    const aEnd =
        new Date(
            a.end_date,
        );

    const bStart =
        new Date(
            b.start_date,
        );

    const bEnd =
        new Date(
            b.end_date,
        );

    return (
        aStart <= bEnd &&
        bStart <= aEnd
    );
}

/* -------------------------------------------------------------------------- */
/* CURRENT SEASON                                                             */
/* -------------------------------------------------------------------------- */

export function isCurrentSeason(
    season: Pick<
        Season,
        "name" | "start_date" | "end_date"
    >,
    now = new Date(),
): boolean {
    const start =
        new Date(
            season.start_date,
        );

    const end =
        new Date(
            season.end_date,
        );

    return (
        now >= start &&
        now <= end
    );
}

/* -------------------------------------------------------------------------- */
/* RANKING RETENTION                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Calculates the puntos_obtenidos retained when closing a season.
 *
 * Official rule:
 *   30% retained
 *   70% removed
 *
 * The operation is performed at season rollover, not continuously.
 */
export function calculateRetainedPoints(
    puntos_obtenidos: number,
): number {
    if (
        !Number.isFinite(puntos_obtenidos) ||
        puntos_obtenidos < 0
    ) {
        throw new Error(
            "Los puntos deben ser un número válido igual o superior a 0.",
        );
    }

    return Math.round(
        puntos_obtenidos *
        (
            RANKING_RETENTION.retainedPercentage /
            100
        ),
    );
}

/**
 * Calculates the puntos_obtenidos removed during season rollover.
 */
export function calculateRemovedPoints(
    puntos_obtenidos: number,
): number {
    if (
        !Number.isFinite(puntos_obtenidos) ||
        puntos_obtenidos < 0
    ) {
        throw new Error(
            "Los puntos deben ser un número válido igual o superior a 0.",
        );
    }

    return (
        puntos_obtenidos -
        calculateRetainedPoints(
            puntos_obtenidos,
        )
    );
}

/**
 * Calculates the complete rollover for one player.
 */
export function calculatePlayerSeasonReset(
    playerId: string,
    puntos_obtenidos: number,
): SeasonResetResult {
    const retained =
        calculateRetainedPoints(
            puntos_obtenidos,
        );

    const removed =
        puntos_obtenidos - retained;

    return {
        playerId,

        previousPoints:
            puntos_obtenidos,

        retainedPoints:
            retained,

        removedPoints:
            removed,

        retainedPercentage:
            RANKING_RETENTION.retainedPercentage,

        removedPercentage:
            RANKING_RETENTION.removedPercentage,
    };
}

/* -------------------------------------------------------------------------- */
/* BULK SEASON RESET                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Calculates the rollover for all players.
 *
 * This function performs no database writes. The service layer is
 * responsible for persisting the resulting ledger/snapshot changes.
 */
export function calculateSeasonReset(
    rankings: Array<{
        playerId: string;
        puntos_obtenidos: number;
    }>,
    seasonId: string,
): {
    results: SeasonResetResult[];
    summary: SeasonResetSummary;
} {
    if (!seasonId) {
        throw new Error(
            "Falta seasonId.",
        );
    }

    const uniquePlayers =
        new Map<
            string,
            number
        >();

    for (const ranking of rankings) {
        if (!ranking.playerId) {
            continue;
        }

        const previous =
            uniquePlayers.get(
                ranking.playerId,
            ) ?? 0;

        uniquePlayers.set(
            ranking.playerId,
            previous +
            Math.max(
                ranking.puntos_obtenidos,
                0,
            ),
        );
    }

    const results =
        Array.from(
            uniquePlayers.entries(),
        ).map(
            ([
                playerId,
                puntos_obtenidos,
            ]) =>
                calculatePlayerSeasonReset(
                    playerId,
                    puntos_obtenidos,
                ),
        );

    const totalPreviousPoints =
        results.reduce(
            (
                total,
                resultado_json,
            ) =>
                total +
                resultado_json.previousPoints,
            0,
        );

    const totalRetainedPoints =
        results.reduce(
            (
                total,
                resultado_json,
            ) =>
                total +
                resultado_json.retainedPoints,
            0,
        );

    const totalRemovedPoints =
        results.reduce(
            (
                total,
                resultado_json,
            ) =>
                total +
                resultado_json.removedPoints,
            0,
        );

    return {
        results,

        summary: {
            seasonId,

            playersProcessed:
                results.length,

            totalPreviousPoints,

            totalRetainedPoints,

            totalRemovedPoints,

            retainedPercentage:
                RANKING_RETENTION.retainedPercentage,

            removedPercentage:
                RANKING_RETENTION.removedPercentage,
        },
    };
}

/* -------------------------------------------------------------------------- */
/* SNAPSHOTS                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Builds a ranking snapshot for one player.
 *
 * Snapshots are historical records and should not replace the ranking ledger.
 */
export function createRankingSnapshot(
    params: {
        seasonId: string;
        playerId: string;
        posicion: number;
        puntos_obtenidos: number;
        categoryId: string;
    },
) {
    if (!params.seasonId) {
        throw new Error(
            "Falta seasonId.",
        );
    }

    if (!params.playerId) {
        throw new Error(
            "Falta playerId.",
        );
    }

    if (
        !Number.isInteger(
            params.posicion,
        ) ||
        params.posicion < 1
    ) {
        throw new Error(
            "La posición del ranking no es válida.",
        );
    }

    if (
        !Number.isFinite(
            params.puntos_obtenidos,
        ) ||
        params.puntos_obtenidos < 0
    ) {
        throw new Error(
            "Los puntos no son válidos.",
        );
    }

    if (!params.categoryId) {
        throw new Error(
            "Falta categoryId.",
        );
    }

    return {
        season_id:
            params.seasonId,

        player_id:
            params.playerId,

        posicion:
            params.posicion,

        puntos_obtenidos:
            params.puntos_obtenidos,

        categoria_id:
            params.categoryId,
    };
}

/* -------------------------------------------------------------------------- */
/* TOURNAMENT ELIGIBILITY                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Checks whether a tournament belongs to the regular circuit season.
 */
export function isRegularTournamentEligible(
    tournamentType:
        | "regular"
        | "master",
): boolean {
    return (
        tournamentType ===
        "regular"
    );
}

/**
 * The Master Final is a special competition and should not automatically
 * behave like a normal regular-season tournament.
 */
export function isMasterTournament(
    tournamentType:
        | "regular"
        | "master",
): boolean {
    return (
        tournamentType ===
        "master"
    );
}

/* -------------------------------------------------------------------------- */
/* MASTER ELIGIBILITY                                                         */
/* -------------------------------------------------------------------------- */

/**
 * A player can participate in the Master Final after playing at least
 * one previous regular circuit tournament.
 */
export function isEligibleForMaster(
    regularTournamentsPlayed: number,
): boolean {
    return (
        Number.isInteger(
            regularTournamentsPlayed,
        ) &&
        regularTournamentsPlayed >= 1
    );
}

/* -------------------------------------------------------------------------- */
/* SEASON PROGRESS                                                            */
/* -------------------------------------------------------------------------- */

export function calculateSeasonProgress(
    startDate: string,
    endDate: string,
    now = new Date(),
): number {
    const start =
        new Date(
            startDate,
        ).getTime();

    const end =
        new Date(
            endDate,
        ).getTime();

    const current =
        now.getTime();

    if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start
    ) {
        return 0;
    }

    if (current <= start) {
        return 0;
    }

    if (current >= end) {
        return 100;
    }

    return Math.round(
        (
            (
                current -
                start
            ) /
            (
                end -
                start
            )
        ) *
        100,
    );
}

/* -------------------------------------------------------------------------- */
/* SEASON TOURNAMENT COUNTS                                                   */
/* -------------------------------------------------------------------------- */

export function countSeasonTournaments(
    tournaments: Array<{
        season_id?: string | null;
        tournament_type?: string | null;
        estado?: string | null;
    }>,
    seasonId: string,
): {
    total: number;
    regular: number;
    master: number;
    finished: number;
} {
    const seasonTournaments =
        tournaments.filter(
            (tournament) =>
                tournament.season_id ===
                seasonId,
        );

    return {
        total:
            seasonTournaments.length,

        regular:
            seasonTournaments.filter(
                (tournament) =>
                    tournament.tournament_type ===
                    "regular",
            ).length,

        master:
            seasonTournaments.filter(
                (tournament) =>
                    tournament.tournament_type ===
                    "master",
            ).length,

        finished:
            seasonTournaments.filter(
                (tournament) =>
                    tournament.estado ===
                    "finalizado",
            ).length,
    };
}

/* -------------------------------------------------------------------------- */
/* SEASON COMPLETION                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Determines whether the season can be closed.
 *
 * The function intentionally does not require a hard-coded number of
 * tournaments. The final number belongs to the season configuration.
 */
export function canCompleteSeason(
    params: {
        estado: SeasonStatus;
        expectedRegularTournaments?: number | null;
        completedRegularTournaments: number;
        masterCompleted?: boolean;
        masterRequired?: boolean;
    },
): boolean {
    if (
        params.estado !==
        "activa"
    ) {
        return false;
    }

    if (
        params.expectedRegularTournaments !==
        undefined &&
        params.expectedRegularTournaments !==
        null &&
        params.completedRegularTournaments <
        params.expectedRegularTournaments
    ) {
        return false;
    }

    if (
        params.masterRequired &&
        !params.masterCompleted
    ) {
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* OFFICIAL CURRENT SEASON                                                    */
/* -------------------------------------------------------------------------- */

export function getCurrentSeasonDefinition() {
    return {
        name:
            CURRENT_SEASON.name,

        firstTournamentDate:
            CURRENT_SEASON.firstTournamentDate,

        firstTournamentEndDate:
            CURRENT_SEASON.firstTournamentEndDate,

        masterFinalYear:
            CURRENT_SEASON.masterFinalYear,

        retainedPercentage:
            RANKING_RETENTION.retainedPercentage,

        removedPercentage:
            RANKING_RETENTION.removedPercentage,
    };
}

/* -------------------------------------------------------------------------- */
/* INTEGRITY                                                                  */
/* -------------------------------------------------------------------------- */

export function validateSeasonResetIntegrity(
    resultado_json: SeasonResetResult,
): boolean {
    return (
        resultado_json.previousPoints >=
        0 &&
        resultado_json.retainedPoints >=
        0 &&
        resultado_json.removedPoints >=
        0 &&
        resultado_json.retainedPoints +
        resultado_json.removedPoints ===
        resultado_json.previousPoints &&
        resultado_json.retainedPercentage ===
        30 &&
        resultado_json.removedPercentage ===
        70
    );
}

export function validateSeasonResetSummary(
    summary: SeasonResetSummary,
): boolean {
    return (
        summary.playersProcessed >=
        0 &&
        summary.totalPreviousPoints >=
        0 &&
        summary.totalRetainedPoints >=
        0 &&
        summary.totalRemovedPoints >=
        0 &&
        summary.totalRetainedPoints +
        summary.totalRemovedPoints ===
        summary.totalPreviousPoints &&
        summary.retainedPercentage ===
        30 &&
        summary.removedPercentage ===
        70
    );
}