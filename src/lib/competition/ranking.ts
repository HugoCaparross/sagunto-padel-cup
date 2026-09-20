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
 * Posiciones de finalización utilizadas por el sistema.
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
    | "cuartos_bronce"
    | "fase_grupos";

/* -------------------------------------------------------------------------- */
/* INTERNAL HELPERS                                                           */
/* -------------------------------------------------------------------------- */

function assertCategory(
    category: string,
): asserts category is RankingCategory {
    if (!(category in RANKING_POINTS)) {
        throw new Error(
            `Categoría de ranking no válida: ${category}`,
        );
    }
}

function getFinishKey(
    tier: RankingTier,
    position: number,
): RankingFinish {
    if (tier === "oro") {
        switch (position) {
            case 1:
                return "campeon_oro";

            case 2:
                return "finalista_oro";

            case 3:
                return "semifinalista_oro";

            case 4:
                return "cuartos_oro";

            default:
                throw new Error(
                    `Posición Oro no válida: ${position}`,
                );
        }
    }

    if (tier === "plata") {
        switch (position) {
            case 1:
                return "campeon_plata";

            case 2:
                return "finalista_plata";

            case 3:
                return "semifinalista_plata";

            case 4:
                return "cuartos_plata";

            default:
                throw new Error(
                    `Posición Plata no válida: ${position}`,
                );
        }
    }

    switch (position) {
        case 1:
            return "campeon_bronce";

        case 2:
            return "finalista_bronce";

        case 3:
            return "semifinalista_bronce";

        case 4:
            return "cuartos_bronce";

        default:
            throw new Error(
                `Posición Bronce no válida: ${position}`,
            );
    }
}

/* -------------------------------------------------------------------------- */
/* POINT CALCULATION                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Returns the official points for a category/tier/position.
 *
 * Ranking points are awarded individually to both players of the pair.
 */
export function getRankingPoints(
    category: RankingCategory,
    tier: RankingTier,
    position: number,
): number {
    assertCategory(category);

    const finish = getFinishKey(
        tier,
        position,
    );

    return RANKING_POINTS[category][finish];
}

/**
 * Returns the minimum points of a category.
 */
export function getMinimumCategoryPoints(
    category: RankingCategory,
): number {
    assertCategory(category);

    const values =
        Object.values(
            RANKING_POINTS[category],
        ) as number[];

    return Math.min(...values);
}

/**
 * Returns the maximum points of a category.
 */
export function getMaximumCategoryPoints(
    category: RankingCategory,
): number {
    assertCategory(category);

    const values =
        Object.values(
            RANKING_POINTS[category],
        ) as number[];

    return Math.max(...values);
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
            RANKING_POINTS[category],
        ) as number[];

    if (values.length === 0) {
        throw new Error(
            `La categoría ${category} no tiene puntos configurados.`,
        );
    }

    return {
        minimum: Math.min(...values),
        maximum: Math.max(...values),
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

    if (categories.length !== 4) {
        return false;
    }

    const expectedOrder: RankingCategory[] = [
        "1ª",
        "2ª",
        "3ª",
        "4ª",
    ];

    for (
        let index = 0;
        index < expectedOrder.length - 1;
        index += 1
    ) {
        const current =
            getCategoryRankingBand(
                expectedOrder[index],
            );

        const next =
            getCategoryRankingBand(
                expectedOrder[index + 1],
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
        fecha?: string;
    },
) {
    const {
        playerId,
        tournamentId,
        seasonId = null,
        category,
        tier,
        position,
        fecha = new Date().toISOString(),
    } = params;

    const puntos =
        getRankingPoints(
            category,
            tier,
            position,
        );

    return {
        player_id: playerId,
        tournament_id: tournamentId,
        categoria_id: null,
        puntos_obtenidos: puntos,
        ronda_alcanzada:
            getFinishKey(
                tier,
                position,
            ),
        fecha,
        fecha_caducidad: null,
        season_id: seasonId,
        source: "tournament",
        metadata: {
            category,
            tier,
            position,
        },
    };
}

/**
 * Creates the minimum ranking event for a pair eliminated
 * during the group phase in a five-pair tournament.
 */
export function createGroupPhaseRankingPointEvent(
    params: {
        playerId: string;
        tournamentId: string;
        seasonId?: string | null;
        category: RankingCategory;
        fecha?: string;
    },
) {
    const {
        playerId,
        tournamentId,
        seasonId = null,
        category,
        fecha = new Date().toISOString(),
    } = params;

    return {
        player_id: playerId,
        tournament_id: tournamentId,
        categoria_id: null,
        puntos_obtenidos:
            getMinimumCategoryPoints(
                category,
            ),
        ronda_alcanzada: "fase_grupos",
        fecha,
        fecha_caducidad: null,
        season_id: seasonId,
        source: "tournament",
        metadata: {
            category,
            tier: null,
            position: null,
        },
    };
}

/* -------------------------------------------------------------------------- */
/* SEASON ROLLOVER                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Calculates the points retained when a season closes.
 *
 * SPC official rule:
 * - 30% retained.
 * - 70% removed.
 */
export function calculateSeasonRolloverPoints(
    points: number,
): number {
    if (!Number.isFinite(points)) {
        throw new Error(
            "Los puntos deben ser un número válido.",
        );
    }

    if (points <= 0) {
        return 0;
    }

    return Math.floor(
        points *
        (RANKING_RETENTION.retainedPercentage /
            100),
    );
}

/**
 * Calculates the points removed at season close.
 */
export function calculateSeasonRemovedPoints(
    points: number,
): number {
    if (!Number.isFinite(points)) {
        throw new Error(
            "Los puntos deben ser un número válido.",
        );
    }

    if (points <= 0) {
        return 0;
    }

    return (
        points -
        calculateSeasonRolloverPoints(
            points,
        )
    );
}

/* -------------------------------------------------------------------------- */
/* RANKING AGGREGATION                                                        */
/* -------------------------------------------------------------------------- */

export type RankingEntry = {
    playerId: string;
    points: number;
    position: number;
};

export function sortRankingEntries(
    entries: Array<{
        playerId: string;
        points: number;
    }>,
): RankingEntry[] {
    return [...entries]
        .sort(
            (a, b) =>
                b.points - a.points ||
                a.playerId.localeCompare(
                    b.playerId,
                ),
        )
        .map(
            (entry, index) => ({
                ...entry,
                position: index + 1,
            }),
        );
}

/**
 * Aggregates ranking point events by player.
 */
export function aggregateRankingPoints<
    T extends {
        player_id: string;
        puntos_obtenidos: number;
    },
>(
    events: T[],
): RankingEntry[] {
    const totals =
        new Map<string, number>();

    for (const event of events) {
        const current =
            totals.get(
                event.player_id,
            ) ?? 0;

        totals.set(
            event.player_id,
            current +
            Number(
                event.puntos_obtenidos,
            ),
        );
    }

    return sortRankingEntries(
        [...totals.entries()].map(
            ([playerId, points]) => ({
                playerId,
                points,
            }),
        ),
    );
}

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Validates that an awarded amount belongs to the official category band.
 */
export function validateRankingPoints(
    category: RankingCategory,
    points: number,
): boolean {
    assertCategory(category);

    if (
        !Number.isFinite(points)
    ) {
        return false;
    }

    const band =
        getCategoryRankingBand(
            category,
        );

    return (
        points >= band.minimum &&
        points <= band.maximum
    );
}

/**
 * Validates the complete official SPC ranking configuration.
 */
export function validateOfficialRankingConfiguration(): boolean {
    const expectedBands = {
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

    return (
        actualBands["1ª"].minimum ===
        expectedBands["1ª"].min &&
        actualBands["1ª"].maximum ===
        expectedBands["1ª"].max &&
        actualBands["2ª"].minimum ===
        expectedBands["2ª"].min &&
        actualBands["2ª"].maximum ===
        expectedBands["2ª"].max &&
        actualBands["3ª"].minimum ===
        expectedBands["3ª"].min &&
        actualBands["3ª"].maximum ===
        expectedBands["3ª"].max &&
        actualBands["4ª"].minimum ===
        expectedBands["4ª"].min &&
        actualBands["4ª"].maximum ===
        expectedBands["4ª"].max &&
        validateRankingBands()
    );
}