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

/**
 * Entrada utilizada para calcular los puntos de un resultado.
 */
export type RankingPointsCalculation = {
    category: RankingCategory;
    tier: RankingTier;
    position: number;
};

/**
 * Resultado del cálculo oficial de puntos.
 *
 * El servicio de ranking utiliza tanto los puntos obtenidos
 * como la ronda/resultado alcanzado.
 */
export type RankingPointsResult = {
    points: number;
    finish: RankingFinish;
};

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

function assertNeverFinish(
    finish: never,
): never {
    throw new Error(
        `Ronda de finalización no válida: ${String(finish)}`,
    );
}

/* -------------------------------------------------------------------------- */
/* FINISH / TIER CONVERSION                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene la posición numérica asociada a un resultado.
 *
 * La fase de grupos no representa una posición final de 1 a 4,
 * por lo que devuelve 0.
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

        case "fase_grupos":
            return 0;

        default:
            return assertNeverFinish(finish);
    }
}

/**
 * Obtiene el tramo competitivo asociado a un resultado.
 *
 * La fase de grupos no pertenece a Oro, Plata ni Bronce.
 */
export function getTierFromFinish(
    finish: RankingFinish,
): RankingTier | null {
    switch (finish) {
        case "campeon_oro":
        case "finalista_oro":
        case "semifinalista_oro":
        case "cuartos_oro":
            return "oro";

        case "campeon_plata":
        case "finalista_plata":
        case "semifinalista_plata":
        case "cuartos_plata":
            return "plata";

        case "campeon_bronce":
        case "finalista_bronce":
        case "semifinalista_bronce":
        case "cuartos_bronce":
            return "bronce";

        case "fase_grupos":
            return null;

        default:
            return assertNeverFinish(finish);
    }
}

/* -------------------------------------------------------------------------- */
/* POINT CALCULATION                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Devuelve únicamente los puntos oficiales de una categoría,
 * tramo competitivo y posición.
 *
 * Esta función mantiene la API simple utilizada por otros módulos.
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
 * Calcula los puntos oficiales y devuelve también el resultado alcanzado.
 *
 * IMPORTANTE:
 * El servicio de ranking utiliza esta función pasando un objeto
 * y posteriormente accede a:
 *
 *   result.points
 *   result.finish
 *
 * Por eso no debe convertirse en una función que devuelva solamente
 * un número.
 */
export function calculateRankingPoints(
    input: RankingPointsCalculation,
): RankingPointsResult {
    const {
        category,
        tier,
        position,
    } = input;

    assertCategory(category);

    const finish =
        getFinishKey(
            tier,
            position,
        );

    return {
        points:
            RANKING_POINTS[category][finish],
        finish,
    };
}

/**
 * Devuelve el mínimo de puntos de una categoría.
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
 * Devuelve el máximo de puntos de una categoría.
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

/**
 * Devuelve los puntos correspondientes a una eliminación
 * durante la fase de grupos.
 */
export function getGroupEliminationPoints(
    category: RankingCategory,
): number {
    assertCategory(category);

    return RANKING_POINTS[category]
        .fase_grupos;
}

/* -------------------------------------------------------------------------- */
/* CATEGORY BANDS                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Devuelve la banda mínima/máxima de puntos de una categoría.
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
 * Valida la propiedad fundamental del ranking SPC:
 *
 * todos los puntos posibles de una categoría superior
 * deben estar por encima de todos los puntos posibles
 * de la categoría inmediatamente inferior.
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
 * Crea el evento de ranking generado por un resultado.
 *
 * Los puntos son individuales: cada jugador de la pareja
 * recibe su propio evento de ranking.
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

    const result =
        calculateRankingPoints({
            category,
            tier,
            position,
        });

    return {
        player_id: playerId,
        tournament_id: tournamentId,
        categoria_id: null,
        puntos_obtenidos:
            result.points,
        ronda_alcanzada:
            result.finish,
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
 * Crea el evento mínimo para un jugador eliminado
 * durante la fase de grupos.
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
            getGroupEliminationPoints(
                category,
            ),
        ronda_alcanzada:
            "fase_grupos",
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
 * Calcula los puntos que se conservan al cerrar una temporada.
 *
 * Regla oficial SPC:
 * - 30 % conservado.
 * - 70 % eliminado.
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
        (
            RANKING_RETENTION
                .retainedPercentage / 100
        ),
    );
}

/**
 * Alias utilizado por los servicios de temporada.
 *
 * Conserva el 30 % de los puntos acumulados.
 */
export function calculateSeasonCarryOver(
    points: number,
): number {
    return calculateSeasonRolloverPoints(
        points,
    );
}

/**
 * Calcula los puntos eliminados al cerrar temporada.
 *
 * El resultado es exactamente:
 *
 * puntos acumulados - puntos conservados.
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

/**
 * Alias utilizado por los servicios de temporada.
 *
 * Representa el 70 % que deja de formar parte del ranking
 * de la nueva temporada.
 */
export function calculateSeasonExpiredPoints(
    points: number,
): number {
    return calculateSeasonRemovedPoints(
        points,
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

/**
 * Ordena las entradas del ranking por puntos descendentes.
 *
 * En caso de empate se utiliza el ID del jugador como
 * desempate técnico estable.
 */
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
 * Agrega eventos de ranking por jugador.
 *
 * El ranking es individual aunque los puntos se hayan
 * generado desde resultados de parejas.
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
 * Comprueba que un número de puntos pertenece a la banda
 * oficial de una categoría.
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
 * Valida la configuración oficial completa del ranking SPC.
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