// src/lib/competition/ranking.ts

import {
    RANKING_POINTS,
    RANKING_RETENTION,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Categorías oficiales del ranking SPC.
 *
 * Se deriva directamente de la tabla de puntos para evitar que
 * la definición de categorías y la tabla de puntuación puedan
 * quedar desincronizadas.
 */
export type RankingCategory =
    keyof typeof RANKING_POINTS;

/**
 * Tramos competitivos oficiales.
 */
export type RankingTier =
    | "oro"
    | "plata"
    | "bronce";

/**
 * Resultado final dentro de un tramo.
 */
export type RankingFinish =
    | "campeon_oro"
    | "finalista_oro"
    | "semifinalista_oro"
    | "cuartos_oro"
    | "campeon_plata"
    | "finalista_plata"
    | "semifinalista_plata"
    | "cuartos_plata"
    | "campeon_bronce"
    | "finalista_bronce"
    | "semifinalista_bronce"
    | "cuartos_bronce";

/**
 * Entrada utilizada para calcular los puntos de un resultado.
 */
export type RankingResultInput = {
    category: RankingCategory;
    tier: RankingTier;
    position: number;
};

/**
 * Resultado completo del cálculo de puntos.
 */
export type RankingPointCalculation = {
    category: RankingCategory;
    tier: RankingTier;
    position: number;
    finish: RankingFinish;
    points: number;
};

/**
 * Registro interno del ledger de ranking.
 *
 * Los puntos pertenecen siempre al jugador individual.
 */
export type RankingLedgerEntry = {
    playerId: string;
    tournamentId: string;
    category: RankingCategory;
    tier: RankingTier;
    finish: RankingFinish;
    points: number;
    seasonId?: string | null;
    createdAt?: string;
};

/**
 * Resumen de ranking de un jugador.
 */
export type RankingPlayerSummary = {
    playerId: string;
    totalPoints: number;
    tournamentsPlayed: number;
    wins: number;
    podiums: number;
    position: number | null;
};

/* -------------------------------------------------------------------------- */
/* FINISH DEFINITIONS                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Correspondencia entre posición final y resultado de ranking.
 *
 * Cada tramo tiene cuatro posiciones computables:
 *
 * 1 → campeón
 * 2 → finalista
 * 3 → semifinalista
 * 4 → cuartos
 */
const FINISH_BY_TIER_AND_POSITION: Record<
    RankingTier,
    Record<number, RankingFinish>
> = {
    oro: {
        1: "campeon_oro",
        2: "finalista_oro",
        3: "semifinalista_oro",
        4: "cuartos_oro",
    },

    plata: {
        1: "campeon_plata",
        2: "finalista_plata",
        3: "semifinalista_plata",
        4: "cuartos_plata",
    },

    bronce: {
        1: "campeon_bronce",
        2: "finalista_bronce",
        3: "semifinalista_bronce",
        4: "cuartos_bronce",
    },
};

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

const VALID_CATEGORIES =
    new Set<RankingCategory>(
        Object.keys(
            RANKING_POINTS,
        ) as RankingCategory[],
    );

const VALID_TIERS =
    new Set<RankingTier>([
        "oro",
        "plata",
        "bronce",
    ]);

/**
 * Validates a ranking category.
 */
function assertCategory(
    category: RankingCategory,
): void {
    if (
        !VALID_CATEGORIES.has(
            category,
        )
    ) {
        throw new Error(
            `Categoría de ranking no válida: ${category}`,
        );
    }
}

/**
 * Validates a ranking tier.
 */
function assertTier(
    tier: RankingTier,
): void {
    if (
        !VALID_TIERS.has(tier)
    ) {
        throw new Error(
            `Nivel de competición no válido: ${tier}`,
        );
    }
}

/**
 * Validates a final position.
 *
 * The official points table defines four ranking positions
 * per tramo.
 */
function assertPosition(
    position: number,
): void {
    if (
        !Number.isInteger(
            position,
        ) ||
        position < 1 ||
        position > 4
    ) {
        throw new Error(
            "La posición final debe estar comprendida entre 1 y 4.",
        );
    }
}

/* -------------------------------------------------------------------------- */
/* POINT LOOKUP                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Returns the official finish key for a category/tier/position.
 *
 * The category itself does not alter the finish key; it determines
 * the points associated with that finish.
 */
export function getRankingFinish(
    tier: RankingTier,
    position: number,
): RankingFinish {
    assertTier(tier);
    assertPosition(position);

    const finish =
        FINISH_BY_TIER_AND_POSITION[
        tier
        ][position];

    if (!finish) {
        throw new Error(
            `No existe una posición de ranking configurada para ${tier}: ${position}`,
        );
    }

    return finish;
}

/**
 * Returns the official points assigned to a result.
 */
export function getRankingPoints(
    category: RankingCategory,
    tier: RankingTier,
    position: number,
): number {
    assertCategory(category);
    assertTier(tier);
    assertPosition(position);

    const finish =
        getRankingFinish(
            tier,
            position,
        );

    const categoryPoints =
        RANKING_POINTS[
        category
        ];

    const points =
        categoryPoints[
        finish
        ];

    if (
        typeof points !==
        "number"
    ) {
        throw new Error(
            `No hay puntos configurados para ${category} / ${finish}.`,
        );
    }

    return points;
}


/**
 * Returns the points awarded to the last classified pair in the
 * five-pair format.
 *
 * The fifth pair is eliminated after the group phase. It receives the
 * minimum points available in its category. This reuses the lower bound
 * of the official band and therefore preserves the non-overlap between
 * categories. The competitive label stored by the service is
 * `fase_grupos`; it is not treated as a Bronce tier.
 */
export function getGroupEliminationPoints(
    category: RankingCategory,
): number {
    assertCategory(category);

    const points =
        RANKING_POINTS[category]
            .fase_grupos;

    if (typeof points !== "number") {
        throw new Error(
            `No hay puntos configurados para la eliminación en fase de grupos de ${category}.`,
        );
    }

    return points;
}

/**
 * Complete point calculation.
 */
export function calculateRankingPoints(
    input: RankingResultInput,
): RankingPointCalculation {
    const {
        category,
        tier,
        position,
    } = input;

    const finish =
        getRankingFinish(
            tier,
            position,
        );

    const points =
        getRankingPoints(
            category,
            tier,
            position,
        );

    return {
        category,
        tier,
        position,
        finish,
        points,
    };
}

/* -------------------------------------------------------------------------- */
/* CATEGORY BANDS                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Returns the minimum and maximum official ranking points
 * available in a category.
 */
export function getCategoryRankingBand(
    category: RankingCategory,
): {
    minimum: number;
    maximum: number;
} {
    assertCategory(category);

    const values =
        Object.values(
            RANKING_POINTS[
            category
            ],
        );

    if (
        values.length === 0
    ) {
        throw new Error(
            `La categoría ${category} no tiene puntos configurados.`,
        );
    }

    return {
        minimum:
            Math.min(
                ...values,
            ),
        maximum:
            Math.max(
                ...values,
            ),
    };
}

/**
 * Validates the fundamental property of the SPC ranking:
 *
 * every point awarded in a higher category must remain above every
 * point awarded in the next lower category.
 */
export function validateRankingBands(): boolean {
    const categories =
        Object.keys(
            RANKING_POINTS,
        ) as RankingCategory[];

    /**
     * The official system currently contains four categories.
     */
    if (
        categories.length !== 4
    ) {
        return false;
    }

    const expectedOrder:
        RankingCategory[] = [
            "1ª",
            "2ª",
            "3ª",
            "4ª",
        ];

    for (
        let index = 0;
        index <
        expectedOrder.length - 1;
        index += 1
    ) {
        const current =
            getCategoryRankingBand(
                expectedOrder[
                index
                ],
            );

        const next =
            getCategoryRankingBand(
                expectedOrder[
                index + 1
                ],
            );

        if (
            current.minimum <=
            next.maximum
        ) {
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* RESULT → RANKING EVENT                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Creates the ranking event generated by a tournament result.
 *
 * Ranking points belong to individual players, not pairs.
 */
export function createRankingPointEvent(
    params: {
        playerId: string;
        tournamentId: string;
        seasonId?: string | null;
        category: RankingCategory;
        tier: RankingTier;
        position: number;
    },
): RankingLedgerEntry {
    const calculation =
        calculateRankingPoints({
            category:
                params.category,

            tier:
                params.tier,

            position:
                params.position,
        });

    return {
        playerId:
            params.playerId,

        tournamentId:
            params.tournamentId,

        seasonId:
            params.seasonId,

        category:
            calculation.category,

        tier:
            calculation.tier,

        finish:
            calculation.finish,

        points:
            calculation.points,

        createdAt:
            new Date().toISOString(),
    };
}

/* -------------------------------------------------------------------------- */
/* TOTALS                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Calculates total active ranking points from ledger events.
 */
export function calculateTotalRankingPoints(
    events: Array<
        Pick<
            RankingLedgerEntry,
            "points"
        >
    >,
): number {
    return events.reduce(
        (
            total,
            event,
        ) =>
            total +
            event.points,
        0,
    );
}

/**
 * Groups ledger events by tournament.
 */
export function groupRankingEventsByTournament(
    events: RankingLedgerEntry[],
): Map<
    string,
    RankingLedgerEntry[]
> {
    const grouped =
        new Map<
            string,
            RankingLedgerEntry[]
        >();

    for (
        const event of events
    ) {
        const current =
            grouped.get(
                event.tournamentId,
            ) ?? [];

        current.push(event);

        grouped.set(
            event.tournamentId,
            current,
        );
    }

    return grouped;
}

/**
 * Returns one tournament result per tournament.
 *
 * If duplicate ledger records exist for the same tournament/player,
 * only the latest event is retained.
 */
export function getUniqueTournamentResults(
    events: RankingLedgerEntry[],
): RankingLedgerEntry[] {
    const byTournament =
        new Map<
            string,
            RankingLedgerEntry
        >();

    for (
        const event of events
    ) {
        const previous =
            byTournament.get(
                event.tournamentId,
            );

        if (!previous) {
            byTournament.set(
                event.tournamentId,
                event,
            );

            continue;
        }

        const previousTime =
            previous.createdAt
                ? new Date(
                    previous.createdAt,
                ).getTime()
                : 0;

        const currentTime =
            event.createdAt
                ? new Date(
                    event.createdAt,
                ).getTime()
                : 0;

        if (
            currentTime >=
            previousTime
        ) {
            byTournament.set(
                event.tournamentId,
                event,
            );
        }
    }

    return Array.from(
        byTournament.values(),
    );
}

/* -------------------------------------------------------------------------- */
/* SEASON RESET                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Calculates the amount of points retained when a season closes.
 *
 * Official SPC rule:
 * - 30 % retained
 * - 70 % removed
 *
 * This is a season operation and NOT a rolling 365-day expiry.
 */
export function calculateSeasonCarryOver(
    points: number,
): number {
    if (
        !Number.isFinite(
            points,
        ) ||
        points < 0
    ) {
        throw new Error(
            "Los puntos deben ser un número positivo o cero.",
        );
    }

    return Math.floor(
        points *
        (
            RANKING_RETENTION
                .retainedPercentage /
            100
        ),
    );
}

/**
 * Calculates the points removed at season rollover.
 */
export function calculateSeasonExpiredPoints(
    points: number,
): number {
    if (
        !Number.isFinite(
            points,
        ) ||
        points < 0
    ) {
        throw new Error(
            "Los puntos deben ser un número positivo o cero.",
        );
    }

    const retained =
        calculateSeasonCarryOver(
            points,
        );

    return (
        points -
        retained
    );
}

/**
 * Creates the season reset calculation.
 */
export function calculateSeasonReset(
    points: number,
): {
    previousPoints: number;
    retainedPoints: number;
    removedPoints: number;
    retainedPercentage: number;
    removedPercentage: number;
} {
    const retained =
        calculateSeasonCarryOver(
            points,
        );

    const removed =
        points -
        retained;

    return {
        previousPoints:
            points,

        retainedPoints:
            retained,

        removedPoints:
            removed,

        retainedPercentage:
            RANKING_RETENTION
                .retainedPercentage,

        removedPercentage:
            RANKING_RETENTION
                .removedPercentage,
    };
}

/* -------------------------------------------------------------------------- */
/* RANKING SORTING                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Stable ranking comparator.
 *
 * Primary:
 *   total points descending.
 *
 * Secondary:
 *   tournaments played descending.
 *
 * Tertiary:
 *   podiums descending.
 *
 * Final:
 *   player id ascending for deterministic ordering.
 */
export function compareRankingPlayers(
    a: RankingPlayerSummary,
    b: RankingPlayerSummary,
): number {
    if (
        a.totalPoints !==
        b.totalPoints
    ) {
        return (
            b.totalPoints -
            a.totalPoints
        );
    }

    if (
        a.tournamentsPlayed !==
        b.tournamentsPlayed
    ) {
        return (
            b.tournamentsPlayed -
            a.tournamentsPlayed
        );
    }

    if (
        a.podiums !==
        b.podiums
    ) {
        return (
            b.podiums -
            a.podiums
        );
    }

    return a.playerId.localeCompare(
        b.playerId,
    );
}

/**
 * Sorts ranking entries without mutating the original array.
 */
export function sortRankingPlayers(
    players: RankingPlayerSummary[],
): RankingPlayerSummary[] {
    return [...players]
        .sort(
            compareRankingPlayers,
        )
        .map(
            (
                player,
                index,
            ) => ({
                ...player,
                position:
                    index + 1,
            }),
        );
}

/* -------------------------------------------------------------------------- */
/* PLAYER SUMMARY                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Builds a ranking summary for one player.
 */
export function buildPlayerRankingSummary(
    playerId: string,
    events: RankingLedgerEntry[],
): RankingPlayerSummary {
    const playerEvents =
        events.filter(
            (event) =>
                event.playerId ===
                playerId,
        );

    const uniqueResults =
        getUniqueTournamentResults(
            playerEvents,
        );

    const totalPoints =
        calculateTotalRankingPoints(
            uniqueResults,
        );

    /**
     * `podiums` currently represents Gold champions,
     * following the existing SPC interpretation in this module.
     */
    const podiums =
        uniqueResults.filter(
            (event) =>
                event.tier ===
                "oro" &&
                event.finish ===
                "campeon_oro",
        ).length;

    /**
     * `wins` represents bracket/tournament victories,
     * not individual match victories.
     */
    const wins =
        uniqueResults.filter(
            (event) =>
                event.finish ===
                "campeon_oro" ||
                event.finish ===
                "campeon_plata" ||
                event.finish ===
                "campeon_bronce",
        ).length;

    return {
        playerId,

        totalPoints,

        tournamentsPlayed:
            uniqueResults.length,

        wins,

        podiums,

        position: null,
    };
}

/* -------------------------------------------------------------------------- */
/* RANKING VALIDATION                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Validates a complete ranking event.
 *
 * This verifies that the stored points correspond exactly
 * to the official category/tier/result combination.
 */
export function validateRankingEvent(
    event: RankingLedgerEntry,
): boolean {
    if (!event.playerId) {
        return false;
    }

    if (
        !event.tournamentId
    ) {
        return false;
    }

    if (
        !VALID_CATEGORIES.has(
            event.category,
        )
    ) {
        return false;
    }

    if (
        !VALID_TIERS.has(
            event.tier,
        )
    ) {
        return false;
    }

    if (
        !Number.isFinite(
            event.points,
        ) ||
        event.points < 0
    ) {
        return false;
    }

    const position =
        getPositionFromFinish(
            event.finish,
        );

    const expected =
        getRankingPoints(
            event.category,
            event.tier,
            position,
        );

    return (
        expected ===
        event.points
    );
}

/* -------------------------------------------------------------------------- */
/* FINISH HELPERS                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Converts a ranking finish into its position inside the corresponding tier.
 */
export function getPositionFromFinish(
    finish: RankingFinish,
): number {
    switch (finish) {
        case "campeon_oro":
        case "campeon_plata":
        case "campeon_bronce":
            return 1;

        case "finalista_oro":
        case "finalista_plata":
        case "finalista_bronce":
            return 2;

        case "semifinalista_oro":
        case "semifinalista_plata":
        case "semifinalista_bronce":
            return 3;

        case "cuartos_oro":
        case "cuartos_plata":
        case "cuartos_bronce":
            return 4;

        default:
            throw new Error(
                `Resultado de ranking desconocido: ${finish}`,
            );
    }
}

/**
 * Converts a ranking finish into its competitive tier.
 */
export function getTierFromFinish(
    finish: RankingFinish,
): RankingTier {
    if (
        finish.endsWith(
            "_oro",
        )
    ) {
        return "oro";
    }

    if (
        finish.endsWith(
            "_plata",
        )
    ) {
        return "plata";
    }

    return "bronce";
}

/* -------------------------------------------------------------------------- */
/* OFFICIAL TABLE                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Returns a read-only representation of the official points table.
 *
 * This is useful for public ranking information and admin screens.
 */
export function getOfficialRankingTable(): {
    [K in RankingCategory]: typeof RANKING_POINTS[K];
} {
    return {
        "1ª": {
            ...RANKING_POINTS[
            "1ª"
            ],
        },

        "2ª": {
            ...RANKING_POINTS[
            "2ª"
            ],
        },

        "3ª": {
            ...RANKING_POINTS[
            "3ª"
            ],
        },

        "4ª": {
            ...RANKING_POINTS[
            "4ª"
            ],
        },
    } as {
            [K in RankingCategory]:
            typeof RANKING_POINTS[K];
        };
}

/* -------------------------------------------------------------------------- */
/* MASTER / RACE TO MASTER                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A player qualifies for the Master Final after participating
 * in at least one regular circuit tournament.
 */
export function isMasterEligible(
    regularTournamentsPlayed: number,
): boolean {
    return (
        Number.isInteger(
            regularTournamentsPlayed,
        ) &&
        regularTournamentsPlayed >=
        1
    );
}

/**
 * Determines whether a player is inside the Race To Master
 * qualification positions.
 *
 * Current SPC rule:
 * top 4 positions per category.
 */
export function isInsideMasterQualification(
    rankingPosition: number,
    qualificationLimit = 4,
): boolean {
    return (
        Number.isInteger(
            rankingPosition,
        ) &&
        rankingPosition >= 1 &&
        rankingPosition <=
        qualificationLimit
    );
}

/**
 * Returns the default Master qualification limit.
 */
export function getMasterQualificationLimit(): number {
    return 4;
}

/* -------------------------------------------------------------------------- */
/* CATEGORY CHANGE                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Ranking history is never deleted when a player changes category.
 *
 * This helper determines the category used for a NEW tournament.
 */
export function resolveCompetitionCategory(
    params: {
        currentCategory: RankingCategory;
        requestedCategory?:
        | RankingCategory
        | null;
        approved: boolean;
    },
): RankingCategory {
    if (
        params.approved &&
        params.requestedCategory
    ) {
        return (
            params.requestedCategory
        );
    }

    return (
        params.currentCategory
    );
}

/* -------------------------------------------------------------------------- */
/* INTEGRITY CHECKS                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Performs all static ranking integrity checks.
 *
 * This should be used in tests/build validation rather than
 * on every normal request.
 */
export function runRankingIntegrityChecks(): {
    valid: boolean;
    bandsValid: boolean;
    bandsMatch: boolean;
    retainedPercentage: number;
    removedPercentage: number;
} {
    const bandsValid =
        validateRankingBands();

    const expectedBands: Record<
        RankingCategory,
        {
            min: number;
            max: number;
        }
    > = {
        "1ª": {
            min: 106,
            max: 120,
        },

        "2ª": {
            min: 91,
            max: 105,
        },

        "3ª": {
            min: 76,
            max: 90,
        },

        "4ª": {
            min: 61,
            max: 75,
        },
    };

    const actualBands = {
        "1ª":
            getCategoryRankingBand(
                "1ª",
            ),

        "2ª":
            getCategoryRankingBand(
                "2ª",
            ),

        "3ª":
            getCategoryRankingBand(
                "3ª",
            ),

        "4ª":
            getCategoryRankingBand(
                "4ª",
            ),
    };

    const bandsMatch =
        actualBands["1ª"]
            .minimum ===
        expectedBands["1ª"]
            .min &&
        actualBands["1ª"]
            .maximum ===
        expectedBands["1ª"]
            .max &&

        actualBands["2ª"]
            .minimum ===
        expectedBands["2ª"]
            .min &&
        actualBands["2ª"]
            .maximum ===
        expectedBands["2ª"]
            .max &&

        actualBands["3ª"]
            .minimum ===
        expectedBands["3ª"]
            .min &&
        actualBands["3ª"]
            .maximum ===
        expectedBands["3ª"]
            .max &&

        actualBands["4ª"]
            .minimum ===
        expectedBands["4ª"]
            .min &&
        actualBands["4ª"]
            .maximum ===
        expectedBands["4ª"]
            .max;

    return {
        valid:
            bandsValid &&
            bandsMatch,

        bandsValid,

        bandsMatch,

        retainedPercentage:
            RANKING_RETENTION
                .retainedPercentage,

        removedPercentage:
            RANKING_RETENTION
                .removedPercentage,
    };
}

/* -------------------------------------------------------------------------- */
/* DISPLAY HELPERS                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Formats a ranking position for UI.
 */
export function formatRankingPosition(
    position: number,
): string {
    return `#${position}`;
}

/**
 * Formats a position change.
 */
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

/**
 * Formats a points change.
 */
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