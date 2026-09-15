// src/lib/services/ranking.ts

import { createClient } from "@/lib/supabase/server";

import type {
    Player,
    RankingPoint,
    RankingPointInsert,
    RankingSnapshot,
    RankingSnapshotInsert,
} from "@/types/database";

import type {
    RankingFinish,
} from "@/lib/competition/ranking";

import {
    calculateRankingPoints,
    calculateSeasonCarryOver,
    calculateSeasonExpiredPoints,
    getPositionFromFinish,
} from "@/lib/competition/ranking";

/* -------------------------------------------------------------------------- */
/* LOCAL RANKING TYPES                                                        */
/* -------------------------------------------------------------------------- */

type RankingCategory =
    | "1ª"
    | "2ª"
    | "3ª"
    | "4ª";

type RankingTier =
    | "oro"
    | "plata"
    | "bronce";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type RankingFilters = {
    seasonId?: string;
    categoryId?: string;
    playerId?: string;
    tournamentId?: string;
};

export type RankingPointWithRelations =
    RankingPoint & {
        player?: Player | null;
    };

export type RankingEntry = {
    playerId: string;
    categoryId: string;
    seasonId: string;

    posicion: number;

    totalPoints: number;
    tournamentsPlayed: number;

    victorias: number;
    podiums: number;

    lastTournamentAt: string | null;

    player?: Player | null;
};

export type RankingEntryWithPlayer =
    RankingEntry & {
        player?: Player | null;
    };

export type RankingSummary = {
    seasonId: string | null;
    categoryId: string | null;

    totalPlayers: number;
    totalPoints: number;

    leader:
    RankingEntryWithPlayer | null;

    entries:
    RankingEntryWithPlayer[];
};

export type CreateRankingPointInput = {
    seasonId: string;
    tournamentId: string;

    playerId: string;
    categoryId: string;

    puntos_obtenidos: number;

    pairId?: string | null;

    resultType?:
    | "campeon"
    | "finalista"
    | "semifinalista"
    | "cuartos";

    tramo?: RankingTier | null;

    awardedAt?: string;

    source?:
    | "tournament"
    | "manual_adjustment"
    | "season_operation";

    notes?: string | null;
};

export type CreateRankingSnapshotInput = {
    seasonId: string;
    categoryId: string;

    snapshotDate?: string;

    entries: Array<{
        playerId: string;
        posicion: number;
        totalPoints: number;
        activePoints: number;
        inactivePoints: number;
    }>;
};

export type TournamentRankingAllocation = {
    seasonId: string;
    tournamentId: string;

    playerId: string;
    categoryId: string;

    pairId?: string | null;

    puntos_obtenidos: number;

    resultType:
    | "campeon"
    | "finalista"
    | "semifinalista"
    | "cuartos";

    tramo: RankingTier;

    notes?: string | null;
};

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const VALID_CATEGORIES =
    new Set<RankingCategory>([
        "1ª",
        "2ª",
        "3ª",
        "4ª",
    ]);

const VALID_TIERS =
    new Set<RankingTier>([
        "oro",
        "plata",
        "bronce",
    ]);

const VALID_RESULT_TYPES =
    new Set<
        RankingPoint["ronda_alcanzada"]
    >([
        "campeon",
        "finalista",
        "semifinalista",
        "cuartos",
    ]);

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                 */
/* -------------------------------------------------------------------------- */

function assertId(
    value: string,
    label: string,
): void {
    if (!value?.trim()) {
        throw new Error(
            `Falta ${label}.`,
        );
    }
}

function assertPoints(
    puntos_obtenidos: number,
    allowNegative = false,
): void {
    if (
        !Number.isInteger(
            puntos_obtenidos,
        ) ||
        (
            !allowNegative &&
            puntos_obtenidos < 0
        )
    ) {
        throw new Error(
            "La puntuación de ranking no es válida.",
        );
    }
}

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

function assertTier(
    tramo: RankingTier,
): void {
    if (
        !VALID_TIERS.has(
            tramo,
        )
    ) {
        throw new Error(
            `Nivel de competición no válido: ${tramo}`,
        );
    }
}

function assertResultType(
    resultType:
        RankingPoint["ronda_alcanzada"],
): void {
    if (
        !VALID_RESULT_TYPES.has(
            resultType,
        )
    ) {
        throw new Error(
            `Tipo de resultado no válido: ${resultType}`,
        );
    }
}

/* -------------------------------------------------------------------------- */
/* RESULT HELPERS                                                             */
/* -------------------------------------------------------------------------- */

function resultTypeFromFinish(
    finish: RankingFinish,
): RankingPoint["ronda_alcanzada"] {
    const posicion =
        getPositionFromFinish(
            finish,
        );

    switch (posicion) {
        case 1:
            return "campeon";

        case 2:
            return "finalista";

        case 3:
            return "semifinalista";

        case 4:
            return "cuartos";

        default:
            throw new Error(
                `Posición de ranking no válida: ${posicion}`,
            );
    }
}

function rankingFinishFromResult(
    tramo: RankingTier,
    resultType:
        RankingPoint["ronda_alcanzada"],
): RankingFinish {
    switch (tramo) {
        case "oro":
            switch (resultType) {
                case "campeon":
                    return "campeon_oro";

                case "finalista":
                    return "finalista_oro";

                case "semifinalista":
                    return "semifinalista_oro";

                case "cuartos":
                    return "cuartos_oro";

                default:
                    break;
            }

            break;

        case "plata":
            switch (resultType) {
                case "campeon":
                    return "campeon_plata";

                case "finalista":
                    return "finalista_plata";

                case "semifinalista":
                    return "semifinalista_plata";

                case "cuartos":
                    return "cuartos_plata";

                default:
                    break;
            }

            break;

        case "bronce":
            switch (resultType) {
                case "campeon":
                    return "campeon_bronce";

                case "finalista":
                    return "finalista_bronce";

                case "semifinalista":
                    return "semifinalista_bronce";

                case "cuartos":
                    return "cuartos_bronce";

                default:
                    break;
            }

            break;

        default:
            break;
    }

    throw new Error(
        `Resultado de ranking no válido: ${resultType} / ${tramo}`,
    );
}

function normalizePlayer(
    player: unknown,
): Player | null {
    if (!player) {
        return null;
    }

    return player as Player;
}

/* -------------------------------------------------------------------------- */
/* RAW LEDGER                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Obtiene los registros brutos del ledger de ranking.
 *
 * ranking_points es histórico y no debe recalcularse desde la UI.
 */
export async function getRankingPoints(
    filters: RankingFilters = {},
): Promise<
    RankingPointWithRelations[]
> {
    const supabase =
        await createClient();

    let query = supabase
        .from("ranking_points")
        .select("*")
        .order(
            "fecha",
            {
                ascending: false,
            },
        );

    if (filters.seasonId) {
        query = query.eq(
            "season_id",
            filters.seasonId,
        );
    }

    if (filters.categoryId) {
        query = query.eq(
            "categoria_id",
            filters.categoryId,
        );
    }

    if (filters.playerId) {
        query = query.eq(
            "player_id",
            filters.playerId,
        );
    }

    if (
        filters.tournamentId
    ) {
        query = query.eq(
            "tournament_id",
            filters.tournamentId,
        );
    }

    const {
        data,
        error,
    } = await query;

    if (error) {
        throw new Error(
            `No se pudieron obtener los puntos del ranking: ${error.message}`,
        );
    }

    const rankingPoints =
        (data ?? []) as RankingPoint[];

    if (
        rankingPoints.length ===
        0
    ) {
        return [];
    }

    const playerIds =
        Array.from(
            new Set(
                rankingPoints.map(
                    (point) =>
                        point.player_id,
                ),
            ),
        );

    const {
        data: playersData,
        error: playersError,
    } = await supabase
        .from("players")
        .select("*")
        .in(
            "id",
            playerIds,
        );

    if (playersError) {
        throw new Error(
            `No se pudieron obtener los jugadores del ranking: ${playersError.message}`,
        );
    }

    const players =
        (playersData ??
            []) as Player[];

    const playersById =
        new Map(
            players.map(
                (player) => [
                    player.id,
                    player,
                ],
            ),
        );

    return rankingPoints.map(
        (point) => ({
            ...point,

            player:
                playersById.get(
                    point.player_id,
                ) ?? null,
        }),
    );
}

/* -------------------------------------------------------------------------- */
/* PLAYER / TOURNAMENT QUERIES                                                */
/* -------------------------------------------------------------------------- */

export async function getPlayerRankingPoints(
    playerId: string,
    seasonId: string,
): Promise<
    RankingPointWithRelations[]
> {
    assertId(
        playerId,
        "playerId",
    );

    assertId(
        seasonId,
        "seasonId",
    );

    return getRankingPoints({
        playerId,
        seasonId,
    });
}

export async function getTournamentRankingPoints(
    tournamentId: string,
): Promise<
    RankingPointWithRelations[]
> {
    assertId(
        tournamentId,
        "tournamentId",
    );

    return getRankingPoints({
        tournamentId,
    });
}

/* -------------------------------------------------------------------------- */
/* RANKING AGGREGATION                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Agrupa el ledger por jugador.
 *
 * Los puntos son individuales, aunque el resultado competitivo procede
 * de una pareja.
 */
export async function getActiveRankingEntries(
    filters: RankingFilters = {},
): Promise<
    RankingEntryWithPlayer[]
> {
    const puntos_obtenidos =
        await getRankingPoints(
            filters,
        );

    if (
        puntos_obtenidos.length ===
        0
    ) {
        return [];
    }

    const grouped =
        new Map<
            string,
            RankingEntryWithPlayer
        >();

    for (
        const point of puntos_obtenidos
    ) {
        const existing =
            grouped.get(
                point.player_id,
            );

        if (!existing) {
            grouped.set(
                point.player_id,
                {
                    playerId:
                        point.player_id,

                    categoryId:
                        point.categoria_id,

                    seasonId:
                        point.season_id,

                    posicion:
                        0,

                    totalPoints:
                        Number(
                            point.puntos_obtenidos,
                        ),

                    tournamentsPlayed:
                        point.source ===
                            "tournament"
                            ? 1
                            : 0,

                    victorias:
                        point.ronda_alcanzada ===
                            "campeon"
                            ? 1
                            : 0,

                    podiums:
                        point.ronda_alcanzada ===
                            "campeon" ||
                            point.ronda_alcanzada ===
                            "finalista"
                            ? 1
                            : 0,

                    lastTournamentAt:
                        point.fecha ??
                        point.created_at ??
                        null,

                    player:
                        normalizePlayer(
                            point.player,
                        ),
                },
            );

            continue;
        }

        existing.totalPoints +=
            Number(
                point.puntos_obtenidos,
            );

        if (
            point.source ===
            "tournament"
        ) {
            existing.tournamentsPlayed +=
                1;
        }

        if (
            point.ronda_alcanzada ===
            "campeon"
        ) {
            existing.victorias += 1;
            existing.podiums += 1;
        } else if (
            point.ronda_alcanzada ===
            "finalista"
        ) {
            existing.podiums += 1;
        }

        const currentDate =
            point.fecha ??
            point.created_at ??
            null;

        if (
            currentDate &&
            (
                !existing.lastTournamentAt ||
                currentDate >
                existing.lastTournamentAt
            )
        ) {
            existing.lastTournamentAt =
                currentDate;
        }
    }

    const entries =
        Array.from(
            grouped.values(),
        );

    entries.sort(
        (
            a,
            b,
        ) => {
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
        },
    );

    return entries.map(
        (
            entry,
            index,
        ) => ({
            ...entry,

            posicion:
                index + 1,
        }),
    );
}

/* -------------------------------------------------------------------------- */
/* CATEGORY / SEASON RANKING                                                  */
/* -------------------------------------------------------------------------- */

export async function getCategoryRanking(
    seasonId: string,
    categoryId: string,
): Promise<
    RankingEntryWithPlayer[]
> {
    assertId(
        seasonId,
        "seasonId",
    );

    assertId(
        categoryId,
        "categoryId",
    );

    return getActiveRankingEntries({
        seasonId,
        categoryId,
    });
}

export async function getSeasonRanking(
    seasonId: string,
): Promise<
    RankingEntryWithPlayer[]
> {
    assertId(
        seasonId,
        "seasonId",
    );

    return getActiveRankingEntries({
        seasonId,
    });
}

/* -------------------------------------------------------------------------- */
/* PLAYER TOTAL / POSITION                                                    */
/* -------------------------------------------------------------------------- */

export async function getPlayerRankingTotal(
    playerId: string,
    seasonId?: string,
): Promise<number> {
    assertId(
        playerId,
        "playerId",
    );

    const puntos_obtenidos =
        await getRankingPoints({
            playerId,
            seasonId,
        });

    return puntos_obtenidos.reduce(
        (
            total,
            point,
        ) =>
            total +
            Number(
                point.puntos_obtenidos,
            ),
        0,
    );
}

export async function getPlayerRankingPosition(
    playerId: string,
    seasonId: string,
    categoryId?: string,
): Promise<
    number | null
> {
    assertId(
        playerId,
        "playerId",
    );

    assertId(
        seasonId,
        "seasonId",
    );

    const entries =
        await getActiveRankingEntries({
            seasonId,
            categoryId,
        });

    const entry =
        entries.find(
            (item) =>
                item.playerId ===
                playerId,
        );

    return (
        entry?.posicion ??
        null
    );
}

/* -------------------------------------------------------------------------- */
/* ADD RAW RANKING POINTS                                                     */
/* -------------------------------------------------------------------------- */

export async function addRankingPoints(
    input: CreateRankingPointInput,
): Promise<RankingPoint> {
    assertId(
        input.seasonId,
        "seasonId",
    );

    assertId(
        input.tournamentId,
        "tournamentId",
    );

    assertId(
        input.playerId,
        "playerId",
    );

    assertId(
        input.categoryId,
        "categoryId",
    );

    const source =
        input.source ??
        "tournament";

    assertPoints(
        input.puntos_obtenidos,
        source ===
        "manual_adjustment",
    );

    if (
        input.resultType
    ) {
        assertResultType(
            input.resultType,
        );
    }

    if (
        input.tramo
    ) {
        assertTier(
            input.tramo,
        );
    }

    const supabase =
        await createClient();

    const payload:
        RankingPointInsert = {
        season_id:
            input.seasonId,

        tournament_id:
            input.tournamentId,

        categoria_id:
            input.categoryId,

        player_id:
            input.playerId,

        pair_id:
            input.pairId ??
            null,

        tramo:
            input.tramo ??
            null,

        ronda_alcanzada:
            input.resultType ??
            "campeon",

        puntos_obtenidos:
            input.puntos_obtenidos,

        fecha:
            input.awardedAt ??
            new Date().toISOString(),

        source,

        notes:
            input.notes ??
            null,
    };

    const {
        data,
        error,
    } = await supabase
        .from(
            "ranking_points",
        )
        .insert(payload)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudieron registrar los puntos del ranking: ${error.message}`,
        );
    }

    return data as RankingPoint;
}

/* -------------------------------------------------------------------------- */
/* DUPLICATE PROTECTION                                                       */
/* -------------------------------------------------------------------------- */

export async function hasTournamentRankingPoints(
    playerId: string,
    tournamentId: string,
): Promise<boolean> {
    assertId(
        playerId,
        "playerId",
    );

    assertId(
        tournamentId,
        "tournamentId",
    );

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from(
            "ranking_points",
        )
        .select("id")
        .eq(
            "player_id",
            playerId,
        )
        .eq(
            "tournament_id",
            tournamentId,
        )
        .eq(
            "source",
            "tournament",
        )
        .limit(1);

    if (error) {
        throw new Error(
            `No se pudo comprobar el ranking del torneo: ${error.message}`,
        );
    }

    return (
        (data?.length ??
            0) > 0
    );
}

/* -------------------------------------------------------------------------- */
/* OFFICIAL TOURNAMENT ALLOCATION                                             */
/* -------------------------------------------------------------------------- */

/**
 * Asigna automáticamente los puntos oficiales a un jugador.
 *
 * Nunca se introduce manualmente la cantidad de puntos:
 * categoría + tramo + posición determinan el resultado.
 */
export async function addTournamentFinishPoints(
    input: {
        seasonId: string;
        tournamentId: string;

        playerId: string;
        categoryId: string;

        category:
        RankingCategory;

        tramo:
        RankingTier;

        posicion: number;

        pairId?: string | null;

        notes?: string | null;
    },
): Promise<RankingPoint> {
    assertCategory(
        input.category,
    );

    assertTier(
        input.tramo,
    );

    const calculation =
        calculateRankingPoints({
            category:
                input.category,

            tramo:
                input.tramo,

            posicion:
                input.posicion,
        });

    const alreadyExists =
        await hasTournamentRankingPoints(
            input.playerId,
            input.tournamentId,
        );

    if (
        alreadyExists
    ) {
        throw new Error(
            "El jugador ya tiene puntos registrados para este torneo.",
        );
    }

    return addRankingPoints({
        seasonId:
            input.seasonId,

        tournamentId:
            input.tournamentId,

        playerId:
            input.playerId,

        categoryId:
            input.categoryId,

        pairId:
            input.pairId ??
            null,

        puntos_obtenidos:
            calculation.puntos_obtenidos,

        resultType:
            resultTypeFromFinish(
                calculation.finish,
            ),

        tramo:
            calculation.tramo,

        notes:
            input.notes ??
            null,

        source:
            "tournament",
    });
}

/* -------------------------------------------------------------------------- */
/* BULK TOURNAMENT ALLOCATION                                                 */
/* -------------------------------------------------------------------------- */

export async function addTournamentRankingPoints(
    allocations:
        TournamentRankingAllocation[],
): Promise<RankingPoint[]> {
    if (
        allocations.length ===
        0
    ) {
        return [];
    }

    const tournamentIds =
        new Set(
            allocations.map(
                (
                    allocation,
                ) =>
                    allocation.tournamentId,
            ),
        );

    if (
        tournamentIds.size !==
        1
    ) {
        throw new Error(
            "Todas las asignaciones deben pertenecer al mismo torneo.",
        );
    }

    const tournamentId =
        allocations[0]
            .tournamentId;

    const playerIds =
        allocations.map(
            (
                allocation,
            ) =>
                allocation.playerId,
        );

    const uniquePlayerIds =
        new Set(
            playerIds,
        );

    if (
        uniquePlayerIds.size !==
        allocations.length
    ) {
        throw new Error(
            "No puede haber más de una asignación para el mismo jugador en un torneo.",
        );
    }

    for (
        const allocation of
        allocations
    ) {
        assertId(
            allocation.seasonId,
            "seasonId",
        );

        assertId(
            allocation.tournamentId,
            "tournamentId",
        );

        assertId(
            allocation.playerId,
            "playerId",
        );

        assertId(
            allocation.categoryId,
            "categoryId",
        );

        assertTier(
            allocation.tramo,
        );

        assertResultType(
            allocation.resultType,
        );

        assertPoints(
            allocation.puntos_obtenidos,
        );

        const exists =
            await hasTournamentRankingPoints(
                allocation.playerId,
                tournamentId,
            );

        if (exists) {
            throw new Error(
                `El jugador ${allocation.playerId} ya tiene puntos para este torneo.`,
            );
        }
    }

    const supabase =
        await createClient();

    const payload:
        RankingPointInsert[] =
        allocations.map(
            (
                allocation,
            ) => ({
                season_id:
                    allocation.seasonId,

                tournament_id:
                    allocation.tournamentId,

                categoria_id:
                    allocation.categoryId,

                player_id:
                    allocation.playerId,

                pair_id:
                    allocation.pairId ??
                    null,

                tramo:
                    allocation.tramo,

                ronda_alcanzada:
                    allocation.resultType,

                puntos_obtenidos:
                    allocation.puntos_obtenidos,

                fecha:
                    new Date().toISOString(),

                source:
                    "tournament",

                notes:
                    allocation.notes ??
                    null,
            }),
        );

    const {
        data,
        error,
    } = await supabase
        .from(
            "ranking_points",
        )
        .insert(payload)
        .select("*");

    if (error) {
        throw new Error(
            `No se pudieron registrar los puntos del torneo: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as RankingPoint[];
}

/* -------------------------------------------------------------------------- */
/* SNAPSHOTS                                                                  */
/* -------------------------------------------------------------------------- */

export async function getRankingSnapshots(
    filters: {
        seasonId?: string;
        categoryId?: string;
        playerId?: string;
    } = {},
): Promise<
    RankingSnapshot[]
> {
    const supabase =
        await createClient();

    let query = supabase
        .from(
            "ranking_snapshots",
        )
        .select("*")
        .order(
            "fecha_snapshot",
            {
                ascending: false,
            },
        )
        .order(
            "posicion",
            {
                ascending: true,
            },
        );

    if (
        filters.seasonId
    ) {
        query = query.eq(
            "season_id",
            filters.seasonId,
        );
    }

    if (
        filters.categoryId
    ) {
        query = query.eq(
            "categoria_id",
            filters.categoryId,
        );
    }

    if (
        filters.playerId
    ) {
        query = query.eq(
            "player_id",
            filters.playerId,
        );
    }

    const {
        data,
        error,
    } = await query;

    if (error) {
        throw new Error(
            `No se pudieron obtener los snapshots del ranking: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as RankingSnapshot[];
}

/**
 * Crea un snapshot por jugador.
 *
 * La tabla ranking_snapshots no almacena un JSON global:
 * cada jugador tiene su propia fila.
 */
export async function createRankingSnapshot(
    input: CreateRankingSnapshotInput,
): Promise<
    RankingSnapshot[]
> {
    assertId(
        input.seasonId,
        "seasonId",
    );

    assertId(
        input.categoryId,
        "categoryId",
    );

    if (
        input.entries.length ===
        0
    ) {
        return [];
    }

    const snapshotDate =
        input.snapshotDate ??
        new Date().toISOString();

    const payload:
        RankingSnapshotInsert[] =
        input.entries.map(
            (
                entry,
            ) => ({
                season_id:
                    input.seasonId,

                categoria_id:
                    input.categoryId,

                player_id:
                    entry.playerId,

                posicion:
                    entry.posicion,

                puntos:
                    entry.totalPoints,

                puntos_activos:
                    entry.activePoints,

                puntos_inactivos:
                    entry.inactivePoints,

                fecha_snapshot:
                    snapshotDate,
            }),
        );

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from(
            "ranking_snapshots",
        )
        .insert(payload)
        .select("*");

    if (error) {
        throw new Error(
            `No se pudo crear el snapshot del ranking: ${error.message}`,
        );
    }

    return (
        data ?? []
    ) as RankingSnapshot[];
}

export async function snapshotCurrentRanking(
    seasonId: string,
    categoryId: string,
): Promise<
    RankingSnapshot[]
> {
    const entries =
        await getCategoryRanking(
            seasonId,
            categoryId,
        );

    const snapshotEntries =
        entries.map(
            (
                entry,
            ) => ({
                playerId:
                    entry.playerId,

                posicion:
                    entry.posicion,

                totalPoints:
                    entry.totalPoints,

                activePoints:
                    entry.totalPoints,

                inactivePoints:
                    0,
            }),
        );

    return createRankingSnapshot({
        seasonId,
        categoryId,
        entries:
            snapshotEntries,
    });
}

/* -------------------------------------------------------------------------- */
/* SEASON ROLLOVER                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Calcula los puntos que se mantienen al cerrar una temporada.
 *
 * Regla SPC:
 * 30 % permanece.
 * 70 % se elimina.
 *
 * No existe caducidad automática a 365 días.
 */
export async function calculateSeasonRolloverForPlayer(
    playerId: string,
    previousSeasonId: string,
): Promise<number> {
    const puntos_obtenidos =
        await getPlayerRankingPoints(
            playerId,
            previousSeasonId,
        );

    const total =
        puntos_obtenidos.reduce(
            (
                sum,
                point,
            ) =>
                sum +
                Number(
                    point.puntos_obtenidos,
                ),
            0,
        );

    return calculateSeasonCarryOver(
        total,
    );
}

export async function calculateCategorySeasonRollover(
    previousSeasonId: string,
    categoryId: string,
): Promise<
    Array<{
        playerId: string;
        previousPoints: number;
        retainedPoints: number;
        expiredPoints: number;
    }>
> {
    const entries =
        await getCategoryRanking(
            previousSeasonId,
            categoryId,
        );

    return entries.map(
        (
            entry,
        ) => ({
            playerId:
                entry.playerId,

            previousPoints:
                entry.totalPoints,

            retainedPoints:
                calculateSeasonCarryOver(
                    entry.totalPoints,
                ),

            expiredPoints:
                calculateSeasonExpiredPoints(
                    entry.totalPoints,
                ),
        }),
    );
}

/* -------------------------------------------------------------------------- */
/* RANKING SUMMARY                                                            */
/* -------------------------------------------------------------------------- */

export async function getRankingSummary(
    filters: RankingFilters = {},
): Promise<RankingSummary> {
    const entries =
        await getActiveRankingEntries(
            filters,
        );

    const totalPoints =
        entries.reduce(
            (
                total,
                entry,
            ) =>
                total +
                Number(
                    entry.totalPoints,
                ),
            0,
        );

    return {
        seasonId:
            filters.seasonId ??
            null,

        categoryId:
            filters.categoryId ??
            null,

        totalPlayers:
            entries.length,

        totalPoints,

        leader:
            entries[0] ??
            null,

        entries,
    };
}

/* -------------------------------------------------------------------------- */
/* RANKING INTEGRITY                                                          */
/* -------------------------------------------------------------------------- */

export async function findRankingDuplicates(
    seasonId: string,
): Promise<
    Array<{
        playerId: string;
        tournamentId: string;
        count: number;
    }>
> {
    const puntos_obtenidos =
        await getRankingPoints({
            seasonId,
        });

    const grouped =
        new Map<
            string,
            number
        >();

    for (
        const point of puntos_obtenidos
    ) {
        if (
            point.source !==
            "tournament"
        ) {
            continue;
        }

        const key =
            `${point.player_id}:${point.tournament_id}`;

        grouped.set(
            key,
            (
                grouped.get(
                    key,
                ) ?? 0
            ) + 1,
        );
    }

    return Array.from(
        grouped.entries(),
    )
        .filter(
            (
                [, count],
            ) =>
                count > 1,
        )
        .map(
            (
                [key, count],
            ) => {
                const separator =
                    key.indexOf(
                        ":",
                    );

                return {
                    playerId:
                        key.slice(
                            0,
                            separator,
                        ),

                    tournamentId:
                        key.slice(
                            separator +
                            1,
                        ),

                    count,
                };
            },
        );
}

export async function findInvalidRankingPoints(
    seasonId: string,
): Promise<
    RankingPointWithRelations[]
> {
    const puntos_obtenidos =
        await getRankingPoints({
            seasonId,
        });

    return puntos_obtenidos.filter(
        (
            point,
        ) => {
            if (
                !Number.isInteger(
                    Number(
                        point.puntos_obtenidos,
                    ),
                )
            ) {
                return true;
            }

            if (
                point.source ===
                "tournament" &&
                Number(
                    point.puntos_obtenidos,
                ) < 0
            ) {
                return true;
            }

            if (
                !VALID_RESULT_TYPES.has(
                    point.ronda_alcanzada,
                )
            ) {
                return true;
            }

            if (
                point.tramo &&
                !VALID_TIERS.has(
                    point.tramo,
                )
            ) {
                return true;
            }

            return false;
        },
    );
}

/* -------------------------------------------------------------------------- */
/* REBUILD                                                                    */
/* -------------------------------------------------------------------------- */

export async function rebuildSeasonRanking(
    seasonId: string,
    categoryId?: string,
): Promise<
    RankingEntryWithPlayer[]
> {
    return getActiveRankingEntries({
        seasonId,
        categoryId,
    });
}

/* -------------------------------------------------------------------------- */
/* RACE TO MASTER                                                             */
/* -------------------------------------------------------------------------- */

export async function getRaceToMasterRanking(
    seasonId: string,
    categoryId: string,
): Promise<
    RankingEntryWithPlayer[]
> {
    return getCategoryRanking(
        seasonId,
        categoryId,
    );
}

export async function getTopRankingPlayers(
    seasonId: string,
    categoryId: string,
    limit = 4,
): Promise<
    RankingEntryWithPlayer[]
> {
    if (
        !Number.isInteger(
            limit,
        ) ||
        limit <= 0
    ) {
        return [];
    }

    const ranking =
        await getCategoryRanking(
            seasonId,
            categoryId,
        );

    return ranking.slice(
        0,
        limit,
    );
}

/* -------------------------------------------------------------------------- */
/* MASTER ELIGIBILITY                                                         */
/* -------------------------------------------------------------------------- */

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

export function isInsideMasterQualification(
    rankingPosition: number,
    qualificationLimit = 4,
): boolean {
    return (
        Number.isInteger(
            rankingPosition,
        ) &&
        rankingPosition >=
        1 &&
        rankingPosition <=
        qualificationLimit
    );
}

export function getMasterQualificationLimit(): number {
    return 4;
}

/* -------------------------------------------------------------------------- */
/* ADMIN CORRECTIONS                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Las correcciones son registros independientes.
 *
 * No se modifica ni se elimina el resultado original.
 */
export async function addRankingCorrection(
    input: {
        seasonId: string;
        playerId: string;
        categoryId: string;
        tournamentId: string;

        pointsDelta: number;

        reason: string;
    },
): Promise<RankingPoint> {
    assertId(
        input.seasonId,
        "seasonId",
    );

    assertId(
        input.playerId,
        "playerId",
    );

    assertId(
        input.categoryId,
        "categoryId",
    );

    assertId(
        input.tournamentId,
        "tournamentId",
    );

    assertId(
        input.reason,
        "motivo de la corrección",
    );

    assertPoints(
        input.pointsDelta,
        true,
    );

    if (
        input.pointsDelta ===
        0
    ) {
        throw new Error(
            "La corrección no puede ser de 0 puntos.",
        );
    }

    return addRankingPoints({
        seasonId:
            input.seasonId,

        tournamentId:
            input.tournamentId,

        playerId:
            input.playerId,

        categoryId:
            input.categoryId,

        puntos_obtenidos:
            input.pointsDelta,

        resultType:
            "campeon",

        tramo:
            null,

        source:
            "manual_adjustment",

        notes:
            input.reason.trim(),
    });
}

/* -------------------------------------------------------------------------- */
/* OFFICIAL FINISH VALIDATION                                                 */
/* -------------------------------------------------------------------------- */

export function validateStoredRankingPoint(
    point: RankingPoint,
): boolean {
    if (
        !point.player_id ||
        !point.tournament_id ||
        !point.season_id ||
        !point.categoria_id
    ) {
        return false;
    }

    if (
        !Number.isInteger(
            point.puntos_obtenidos,
        )
    ) {
        return false;
    }

    if (
        point.source ===
        "tournament" &&
        point.puntos_obtenidos < 0
    ) {
        return false;
    }

    if (
        !VALID_RESULT_TYPES.has(
            point.ronda_alcanzada,
        )
    ) {
        return false;
    }

    if (
        point.tramo &&
        !VALID_TIERS.has(
            point.tramo,
        )
    ) {
        return false;
    }

    return true;
}

/**
 * Comprueba que una asignación oficial coincide con la tabla SPC.
 */
export function validateOfficialRankingAllocation(
    input: {
        category:
        RankingCategory;

        tramo:
        RankingTier;

        resultType:
        | "campeon"
        | "finalista"
        | "semifinalista"
        | "cuartos";

        puntos_obtenidos: number;
    },
): boolean {
    assertCategory(
        input.category,
    );

    assertTier(
        input.tramo,
    );

    assertResultType(
        input.resultType,
    );

    const finish =
        rankingFinishFromResult(
            input.tramo,
            input.resultType,
        );

    const posicion =
        getPositionFromFinish(
            finish,
        );

    const expected =
        calculateRankingPoints({
            category:
                input.category,

            tramo:
                input.tramo,

            posicion,
        });

    return (
        expected.puntos_obtenidos ===
        input.puntos_obtenidos
    );
}