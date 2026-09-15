import type {
    GroupStanding,
    Pair,
} from "@/types/database";

import type {
    GroupTieBreakCriterion,
} from "@/types/tournament";

import {
    GROUP_STANDING_POINTS,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type GroupPair = Pick<
    Pair,
    | "id"
    | "tournament_id"
    | "categoria_id"
    | "player_1_id"
    | "player_2_id"
>;

export type GroupMatchResult = {
    groupId: string;

    pair1Id: string;

    pair2Id: string;

    pair1Sets?: number;

    pair2Sets?: number;

    pair1Games?: number;

    pair2Games?: number;

    winnerPairId?: string | null;
};

export type CalculatedGroupStanding = {
    groupId: string;

    pairId: string;

    partidos_jugados: number;

    victorias: number;

    derrotas: number;

    setsFor: number;

    setsAgainst: number;

    gamesFor: number;

    gamesAgainst: number;

    puntos_obtenidos: number;

    setDifference: number;

    gameDifference: number;

    /**
     * Posición calculada dinámicamente.
     *
     * No se persiste necesariamente como fuente de verdad.
     */
    posicion: number;
};

export type GroupDefinition = {
    id: string;

    name: string;

    tournamentId: string;

    categoryId: string;

    pairIds: string[];
};

export type GroupDistribution = {
    groups: GroupDefinition[];

    groupSize: number;
};

/**
 * Representación preparada para persistir en group_standings.
 */
export type DatabaseGroupStanding = Omit<
    GroupStanding,
    "id" | "created_at" | "updated_at"
>;

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Criterios oficiales por defecto.
 *
 * 1. Puntos
 * 2. Enfrentamiento directo
 * 3. Diferencia de sets
 * 4. Diferencia de juegos
 *
 * Los criterios posteriores quedan disponibles para configuraciones
 * futuras o desempates adicionales.
 */
const DEFAULT_TIE_BREAKERS:
    GroupTieBreakCriterion[] = [
        "puntos_obtenidos",
        "head_to_head",
        "set_difference",
        "game_difference",
    ];

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeNumber(
    value: number | null | undefined,
): number {
    return Number.isFinite(value)
        ? Number(value)
        : 0;
}

function calculateDifference(
    forValue: number,
    againstValue: number,
): number {
    return (
        forValue -
        againstValue
    );
}

function cloneStandings(
    standings: CalculatedGroupStanding[],
): CalculatedGroupStanding[] {
    return standings.map(
        (standing) => ({
            ...standing,
        }),
    );
}

/* -------------------------------------------------------------------------- */
/* GROUP COUNT                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Número de grupos recomendado según el número de parejas.
 *
 * Estructuras oficiales:
 *
 * 3 parejas  → 1 grupo
 * 4 parejas  → 1 grupo
 * 8 parejas  → 2 grupos
 *
 * Para cantidades futuras se intenta mantener aproximadamente
 * 4 parejas por grupo.
 */
export function calculateNumberOfGroups(
    pairCount: number,
): number {
    if (
        !Number.isInteger(pairCount) ||
        pairCount < 1
    ) {
        throw new Error(
            "El número de parejas debe ser un entero positivo.",
        );
    }

    if (pairCount <= 4) {
        return 1;
    }

    if (pairCount <= 8) {
        return 2;
    }

    return Math.ceil(
        pairCount / 4,
    );
}

/**
 * Tamaño máximo/recomendado de los grupos.
 */
export function calculateGroupSize(
    pairCount: number,
): number {
    if (
        !Number.isInteger(pairCount) ||
        pairCount < 1
    ) {
        throw new Error(
            "El número de parejas debe ser un entero positivo.",
        );
    }

    const numberOfGroups =
        calculateNumberOfGroups(
            pairCount,
        );

    return Math.ceil(
        pairCount /
        numberOfGroups,
    );
}

/* -------------------------------------------------------------------------- */
/* GROUP CREATION                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Crea los grupos a partir del orden de parejas recibido.
 *
 * El sorteo real debe producir previamente el orden de pairIds.
 * Esta función solamente distribuye ese orden.
 */
export function createGroups(params: {
    tournamentId: string;

    categoryId: string;

    pairIds: string[];
}): GroupDistribution {
    const {
        tournamentId,
        categoryId,
        pairIds,
    } = params;

    if (!tournamentId) {
        throw new Error(
            "Falta tournamentId.",
        );
    }

    if (!categoryId) {
        throw new Error(
            "Falta categoryId.",
        );
    }

    if (
        !Array.isArray(pairIds) ||
        pairIds.length === 0
    ) {
        throw new Error(
            "No se pueden crear grupos sin parejas.",
        );
    }

    const uniquePairIds =
        Array.from(
            new Set(pairIds),
        );

    if (
        uniquePairIds.length !==
        pairIds.length
    ) {
        throw new Error(
            "Una pareja no puede aparecer dos veces en el mismo sorteo.",
        );
    }

    const groupCount =
        calculateNumberOfGroups(
            uniquePairIds.length,
        );

    const groups:
        GroupDefinition[] =
        Array.from(
            {
                length: groupCount,
            },
            (_, index) => ({
                id:
                    `${tournamentId}-${categoryId}-group-${index + 1}`,

                name:
                    getGroupName(index),

                tournamentId,

                categoryId,

                pairIds: [],
            }),
        );

    /*
     * Distribución circular.
     *
     * Ejemplo con 8 parejas:
     *
     * A → 1,3,5,7
     * B → 2,4,6,8
     */
    uniquePairIds.forEach(
        (
            pairId,
            index,
        ) => {
            const groupIndex =
                index %
                groups.length;

            groups[
                groupIndex
            ].pairIds.push(
                pairId,
            );
        },
    );

    return {
        groups,

        groupSize:
            calculateGroupSize(
                uniquePairIds.length,
            ),
    };
}

/**
 * Nombre humano del grupo.
 */
export function getGroupName(
    index: number,
): string {
    if (
        !Number.isInteger(index) ||
        index < 0
    ) {
        throw new Error(
            "El índice del grupo no es válido.",
        );
    }

    return `Grupo ${String.fromCharCode(
        65 + index,
    )}`;
}

/* -------------------------------------------------------------------------- */
/* ROUND ROBIN                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Genera todos los enfrentamientos de un grupo.
 *
 * Cada pareja juega exactamente una vez contra cada otra pareja.
 */
export function generateRoundRobinMatches(
    pairIds: string[],
): Array<{
    pair1Id: string;

    pair2Id: string;
}> {
    const uniquePairIds =
        Array.from(
            new Set(pairIds),
        );

    if (
        uniquePairIds.length < 2
    ) {
        return [];
    }

    const matches:
        Array<{
            pair1Id: string;

            pair2Id: string;
        }> = [];

    for (
        let i = 0;
        i <
        uniquePairIds.length;
        i += 1
    ) {
        for (
            let j = i + 1;
            j <
            uniquePairIds.length;
            j += 1
        ) {
            matches.push({
                pair1Id:
                    uniquePairIds[i],

                pair2Id:
                    uniquePairIds[j],
            });
        }
    }

    return matches;
}

/**
 * Número de partidos de un round robin completo.
 */
export function calculateRoundRobinMatchCount(
    pairCount: number,
): number {
    if (
        !Number.isInteger(pairCount) ||
        pairCount < 0
    ) {
        throw new Error(
            "El número de parejas no es válido.",
        );
    }

    return (
        pairCount *
        (pairCount - 1)
    ) / 2;
}

/* -------------------------------------------------------------------------- */
/* STANDINGS                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Crea una clasificación vacía.
 */
export function createEmptyStandings(
    groupId: string,
    pairIds: string[],
): CalculatedGroupStanding[] {
    if (!groupId) {
        throw new Error(
            "Falta groupId.",
        );
    }

    const uniquePairIds =
        Array.from(
            new Set(pairIds),
        );

    return uniquePairIds.map(
        (
            pairId,
            index,
        ) => ({
            groupId,

            pairId,

            partidos_jugados: 0,

            victorias: 0,

            derrotas: 0,

            setsFor: 0,

            setsAgainst: 0,

            gamesFor: 0,

            gamesAgainst: 0,

            puntos_obtenidos: 0,

            setDifference: 0,

            gameDifference: 0,

            posicion:
                index + 1,
        }),
    );
}

/* -------------------------------------------------------------------------- */
/* MATCH RESULT                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Aplica un resultado terminado a una clasificación.
 *
 * Reglamento actual:
 *
 * Victoria → 1 punto
 * Derrota → 0 puntos
 */
export function applyGroupMatchResult(
    standings: CalculatedGroupStanding[],
    resultado_json: GroupMatchResult,
): CalculatedGroupStanding[] {
    if (
        resultado_json.pair1Id ===
        resultado_json.pair2Id
    ) {
        throw new Error(
            "Una pareja no puede jugar contra sí misma.",
        );
    }

    const pair1 =
        standings.find(
            (standing) =>
                standing.pairId ===
                resultado_json.pair1Id,
        );

    const pair2 =
        standings.find(
            (standing) =>
                standing.pairId ===
                resultado_json.pair2Id,
        );

    if (!pair1 || !pair2) {
        throw new Error(
            "Las parejas del partido no pertenecen al grupo.",
        );
    }

    const pair1Sets =
        normalizeNumber(
            resultado_json.pair1Sets,
        );

    const pair2Sets =
        normalizeNumber(
            resultado_json.pair2Sets,
        );

    const pair1Games =
        normalizeNumber(
            resultado_json.pair1Games,
        );

    const pair2Games =
        normalizeNumber(
            resultado_json.pair2Games,
        );

    if (
        pair1Sets === pair2Sets &&
        pair1Games === pair2Games
    ) {
        throw new Error(
            "El resultado no puede terminar empatado.",
        );
    }

    const calculatedWinnerId =
        pair1Sets >
            pair2Sets ||
            (
                pair1Sets ===
                pair2Sets &&
                pair1Games >
                pair2Games
            )
            ? resultado_json.pair1Id
            : resultado_json.pair2Id;

    const winnerId =
        resultado_json.winnerPairId ??
        calculatedWinnerId;

    if (
        winnerId !==
        resultado_json.pair1Id &&
        winnerId !==
        resultado_json.pair2Id
    ) {
        throw new Error(
            "El ganador indicado no pertenece al partido.",
        );
    }

    const updated =
        cloneStandings(
            standings,
        );

    const updatedPair1 =
        updated.find(
            (standing) =>
                standing.pairId ===
                resultado_json.pair1Id,
        );

    const updatedPair2 =
        updated.find(
            (standing) =>
                standing.pairId ===
                resultado_json.pair2Id,
        );

    if (
        !updatedPair1 ||
        !updatedPair2
    ) {
        throw new Error(
            "No se pudieron actualizar las clasificaciones.",
        );
    }

    updatedPair1.partidos_jugados += 1;

    updatedPair2.partidos_jugados += 1;

    updatedPair1.setsFor +=
        pair1Sets;

    updatedPair1.setsAgainst +=
        pair2Sets;

    updatedPair2.setsFor +=
        pair2Sets;

    updatedPair2.setsAgainst +=
        pair1Sets;

    updatedPair1.gamesFor +=
        pair1Games;

    updatedPair1.gamesAgainst +=
        pair2Games;

    updatedPair2.gamesFor +=
        pair2Games;

    updatedPair2.gamesAgainst +=
        pair1Games;

    updatedPair1.setDifference =
        calculateDifference(
            updatedPair1.setsFor,
            updatedPair1.setsAgainst,
        );

    updatedPair2.setDifference =
        calculateDifference(
            updatedPair2.setsFor,
            updatedPair2.setsAgainst,
        );

    updatedPair1.gameDifference =
        calculateDifference(
            updatedPair1.gamesFor,
            updatedPair1.gamesAgainst,
        );

    updatedPair2.gameDifference =
        calculateDifference(
            updatedPair2.gamesFor,
            updatedPair2.gamesAgainst,
        );

    const winPoints =
        normalizeNumber(
            GROUP_STANDING_POINTS.win,
        );

    if (
        winnerId ===
        resultado_json.pair1Id
    ) {
        updatedPair1.victorias += 1;

        updatedPair2.derrotas += 1;

        updatedPair1.puntos_obtenidos +=
            winPoints;
    } else {
        updatedPair2.victorias += 1;

        updatedPair1.derrotas += 1;

        updatedPair2.puntos_obtenidos +=
            winPoints;
    }

    return sortStandings(
        updated,
    );
}

/* -------------------------------------------------------------------------- */
/* HEAD TO HEAD                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Compara dos parejas mediante sus enfrentamientos directos.
 *
 * Devuelve:
 *
 * < 0 → a queda por delante
 * > 0 → b queda por delante
 * = 0 → no existe diferencia
 */
export function compareWithHeadToHead(
    a: CalculatedGroupStanding,
    b: CalculatedGroupStanding,
    matches: GroupMatchResult[],
): number {
    const relevantMatches =
        matches.filter(
            (match) =>
                (
                    match.pair1Id ===
                    a.pairId &&
                    match.pair2Id ===
                    b.pairId
                ) ||
                (
                    match.pair1Id ===
                    b.pairId &&
                    match.pair2Id ===
                    a.pairId
                ),
        );

    if (
        relevantMatches.length ===
        0
    ) {
        return 0;
    }

    let aWins = 0;

    let bWins = 0;

    for (
        const match of
        relevantMatches
    ) {
        if (
            match.winnerPairId ===
            a.pairId
        ) {
            aWins += 1;
        }

        if (
            match.winnerPairId ===
            b.pairId
        ) {
            bWins += 1;
        }
    }

    if (
        aWins !== bWins
    ) {
        return (
            bWins -
            aWins
        );
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* STANDINGS COMPARISON                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Compara dos clasificaciones según un único criterio.
 */
export function compareStandings(
    a: CalculatedGroupStanding,
    b: CalculatedGroupStanding,
    criteria: GroupTieBreakCriterion[] =
        DEFAULT_TIE_BREAKERS,
): number {
    for (
        const criterion of
        criteria
    ) {
        switch (
        criterion
        ) {
            case "puntos_obtenidos": {
                if (
                    a.puntos_obtenidos !==
                    b.puntos_obtenidos
                ) {
                    return (
                        b.puntos_obtenidos -
                        a.puntos_obtenidos
                    );
                }

                break;
            }

            case "head_to_head": {
                /*
                 * El enfrentamiento directo necesita conocer
                 * los partidos disputados y por eso se resuelve
                 * en sortStandings().
                 */
                break;
            }

            case "set_difference": {
                if (
                    a.setDifference !==
                    b.setDifference
                ) {
                    return (
                        b.setDifference -
                        a.setDifference
                    );
                }

                break;
            }

            case "game_difference": {
                if (
                    a.gameDifference !==
                    b.gameDifference
                ) {
                    return (
                        b.gameDifference -
                        a.gameDifference
                    );
                }

                break;
            }

            case "sets_won": {
                if (
                    a.setsFor !==
                    b.setsFor
                ) {
                    return (
                        b.setsFor -
                        a.setsFor
                    );
                }

                break;
            }

            case "games_won": {
                if (
                    a.gamesFor !==
                    b.gamesFor
                ) {
                    return (
                        b.gamesFor -
                        a.gamesFor
                    );
                }

                break;
            }

            case "random": {
                /*
                 * No se introduce aleatoriedad dentro del
                 * comparador de ordenación porque produciría
                 * resultados inestables.
                 *
                 * Se utiliza el pairId como desempate
                 * determinista.
                 */
                break;
            }

            default:
                break;
        }
    }

    return a.pairId.localeCompare(
        b.pairId,
    );
}

/**
 * Ordena una clasificación completa.
 *
 * Los puntos son siempre la primera referencia.
 * Posteriormente se aplican los criterios configurados.
 */
export function sortStandings(
    standings: CalculatedGroupStanding[],
    matches: GroupMatchResult[] = [],
    criteria: GroupTieBreakCriterion[] =
        DEFAULT_TIE_BREAKERS,
): CalculatedGroupStanding[] {
    const sorted =
        [...standings].sort(
            (
                a,
                b,
            ) => {
                /*
                 * Puntos siempre primero.
                 */
                if (
                    a.puntos_obtenidos !==
                    b.puntos_obtenidos
                ) {
                    return (
                        b.puntos_obtenidos -
                        a.puntos_obtenidos
                    );
                }

                for (
                    const criterion of
                    criteria
                ) {
                    if (
                        criterion ===
                        "head_to_head"
                    ) {
                        const headToHead =
                            compareWithHeadToHead(
                                a,
                                b,
                                matches,
                            );

                        if (
                            headToHead !==
                            0
                        ) {
                            return headToHead;
                        }

                        continue;
                    }

                    if (
                        criterion ===
                        "puntos_obtenidos"
                    ) {
                        continue;
                    }

                    const comparison =
                        compareStandings(
                            a,
                            b,
                            [criterion],
                        );

                    if (
                        comparison !==
                        0
                    ) {
                        return comparison;
                    }
                }

                /*
                 * Desempate final determinista.
                 */
                return a.pairId.localeCompare(
                    b.pairId,
                );
            },
        );

    return sorted.map(
        (
            standing,
            index,
        ) => ({
            ...standing,

            posicion:
                index + 1,
        }),
    );
}

/* -------------------------------------------------------------------------- */
/* DATABASE CONVERSION                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Convierte una clasificación calculada al modelo de base de datos.
 *
 * No eliminamos posicion: el modelo actual de database.ts la contempla.
 */
export function toDatabaseStandings(
    standings: CalculatedGroupStanding[],
): DatabaseGroupStanding[] {
    return standings.map(
        (standing) => ({
            group_id:
                standing.groupId,

            pair_id:
                standing.pairId,

            partidos_jugados:
                standing.partidos_jugados,

            victorias:
                standing.victorias,

            derrotas:
                standing.derrotas,

            sets_favor:
                standing.setsFor,

            sets_contra:
                standing.setsAgainst,

            juegos_favor:
                standing.gamesFor,

            juegos_contra:
                standing.gamesAgainst,

            puntos:
                standing.puntos_obtenidos,

            posicion:
                standing.posicion,
        }),
    );
}

/* -------------------------------------------------------------------------- */
/* QUALIFICATION                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Devuelve las parejas clasificadas según su posición.
 */
export function getQualifiedPairs(
    standings: CalculatedGroupStanding[],
    count: number,
): string[] {
    if (
        !Number.isInteger(count) ||
        count < 1
    ) {
        return [];
    }

    return [...standings]
        .sort(
            (
                a,
                b,
            ) =>
                a.posicion -
                b.posicion,
        )
        .slice(
            0,
            count,
        )
        .map(
            (
                standing,
            ) =>
                standing.pairId,
        );
}

/**
 * Devuelve las parejas fuera de la zona de clasificación.
 */
export function getNonQualifiedPairs(
    standings: CalculatedGroupStanding[],
    qualifiedCount: number,
): string[] {
    if (
        !Number.isInteger(
            qualifiedCount,
        ) ||
        qualifiedCount < 0
    ) {
        throw new Error(
            "El número de clasificados no es válido.",
        );
    }

    return [...standings]
        .sort(
            (
                a,
                b,
            ) =>
                a.posicion -
                b.posicion,
        )
        .slice(
            qualifiedCount,
        )
        .map(
            (
                standing,
            ) =>
                standing.pairId,
        );
}

/* -------------------------------------------------------------------------- */
/* TIER DISTRIBUTION                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Distribución oficial de parejas por tramo.
 *
 * 3:
 * - 2 → Oro
 * - 1 → fuera de Oro
 *
 * 4:
 * - 4 → estructura Oro
 * - perdedores de semifinal → Plata
 *
 * 8:
 * - 4 → Oro
 * - 2 → Plata
 * - 2 → Bronce
 */
export function getTierDistribution(
    pairCount: number,
):
    | {
        gold: number;

        silver: number;

        bronze: number;
    }
    | null {
    switch (
    pairCount
    ) {
        case 3:
            return {
                gold: 2,

                silver: 1,

                bronze: 0,
            };

        case 4:
            return {
                gold: 4,

                silver: 0,

                bronze: 0,
            };

        case 8:
            return {
                gold: 4,

                silver: 2,

                bronze: 2,
            };

        default:
            return null;
    }
}

/* -------------------------------------------------------------------------- */
/* GROUP VALIDATION                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Valida un grupo.
 */
export function validateGroup(
    group: GroupDefinition,
): boolean {
    if (!group.id) {
        return false;
    }

    if (!group.tournamentId) {
        return false;
    }

    if (!group.categoryId) {
        return false;
    }

    if (
        group.pairIds.length ===
        0
    ) {
        return false;
    }

    return (
        new Set(
            group.pairIds,
        ).size ===
        group.pairIds.length
    );
}

/**
 * Valida una distribución completa.
 */
export function validateGroupDistribution(
    distribution: GroupDistribution,
): boolean {
    if (
        !distribution ||
        distribution.groups.length ===
        0
    ) {
        return false;
    }

    const allPairs =
        distribution.groups.flatMap(
            (
                group,
            ) =>
                group.pairIds,
        );

    if (
        allPairs.length ===
        0
    ) {
        return false;
    }

    if (
        new Set(allPairs).size !==
        allPairs.length
    ) {
        return false;
    }

    return distribution.groups.every(
        validateGroup,
    );
}

/* -------------------------------------------------------------------------- */
/* MATCH COUNT / WORKLOAD                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Número total de partidos de grupos.
 */
export function calculateTotalGroupMatches(
    groups: Array<{
        pairIds: string[];
    }>,
): number {
    return groups.reduce(
        (
            total,
            group,
        ) =>
            total +
            calculateRoundRobinMatchCount(
                group.pairIds.length,
            ),
        0,
    );
}

/**
 * Número de partidos que juega cada pareja
 * dentro de un round robin completo.
 */
export function calculateMatchesPerPair(
    groupPairCount: number,
): number {
    if (
        !Number.isInteger(
            groupPairCount,
        ) ||
        groupPairCount < 1
    ) {
        return 0;
    }

    return Math.max(
        groupPairCount - 1,
        0,
    );
}

/* -------------------------------------------------------------------------- */
/* DRAW UTILITIES                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Genera un orden pseudoaleatorio determinista.
 *
 * El seed debe guardarse para poder reproducir el sorteo.
 */
export function createSeededOrder<T>(
    items: T[],
    seed: number,
): T[] {
    const resultado_json =
        [...items];

    let estado =
        Math.abs(
            Math.floor(seed),
        ) || 1;

    for (
        let index =
            resultado_json.length - 1;
        index > 0;
        index -= 1
    ) {
        estado =
            (
                estado *
                1664525 +
                1013904223
            ) %
            4294967296;

        const random =
            estado /
            4294967296;

        const target =
            Math.floor(
                random *
                (index + 1),
            );

        [
            resultado_json[index],
            resultado_json[target],
        ] = [
                resultado_json[target],
                resultado_json[index],
            ];
    }

    return resultado_json;
}

/* -------------------------------------------------------------------------- */
/* OFFICIAL STRUCTURE CHECKS                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Indica si existe una estructura oficial explícitamente definida.
 */
export function isOfficialGroupStructure(
    pairCount: number,
): pairCount is 3 | 4 | 8 {
    return (
        pairCount === 3 ||
        pairCount === 4 ||
        pairCount === 8
    );
}

/**
 * Descripción humana de la estructura.
 */
export function getGroupStructureDescription(
    pairCount: number,
): string {
    switch (
    pairCount
    ) {
        case 3:
            return (
                "3 parejas: las 2 primeras acceden a Oro."
            );

        case 4:
            return (
                "4 parejas: todos juegan fase de grupos; " +
                "1ª-4ª y 2ª-3ª forman las semifinales de Oro."
            );

        case 8:
            return (
                "8 parejas: 2 grupos de 4; las 2 primeras " +
                "de cada grupo acceden a Oro."
            );

        default:
            return (
                "Estructura configurable para el número de parejas."
            );
    }
}