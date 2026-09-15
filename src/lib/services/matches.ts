import { createClient } from "@/lib/supabase/server";

import type {
    Match,
    MatchStatus,
    Pair,
    Player,
} from "@/types/database";

import type {
    MatchResult,
    MatchWithRelations,
} from "@/types/match";

import {
    determineWinner,
    getMatchFormat,
    normalizeMatchResult,
    validateMatchResult,
} from "@/types/match";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type MatchWithRelationsExtended =
    Match & {
        pair1?: PairWithPlayers | null;
        pair2?: PairWithPlayers | null;
    };

export type PairWithPlayers =
    Pair & {
        player1?: Player | null;
        player2?: Player | null;
    };

/**
 * Filtros públicos del servicio.
 *
 * Se mantienen en camelCase para no romper los consumidores existentes.
 * El mapeo a las columnas de Supabase se realiza dentro de getMatches().
 */
export type ServiceMatchFilters = {
    tournamentId?: string;
    categoryId?: string;

    fase?: Match["fase"] | "all";
    groupId?: string;

    estado?: MatchStatus | "all";
    tramo?: Match["tramo"] | "all";
    pista?: number | "all";

    date?: string;
    search?: string;
};

export type CreateMatchInput = {
    tournamentId: string;
    categoryId: string;

    fase: Match["fase"];

    groupId?: string | null;

    pair1Id?: string | null;
    pair2Id?: string | null;

    pista?: number | null;

    scheduledAt?: string | null;
    startedAt?: string | null;

    tramo?: Match["tramo"] | null;

    nextMatchId?: string | null;
    nextSlot?: 1 | 2 | null;
};

export type UpdateMatchInput = {
    pista?: number | null;

    scheduledAt?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;

    estado?: MatchStatus;

    pair1Id?: string | null;
    pair2Id?: string | null;

    tramo?: Match["tramo"] | null;

    nextMatchId?: string | null;
    nextSlot?: 1 | 2 | null;
};

export type EnterMatchResultInput = {
    matchId: string;
    resultado_json: MatchResult;
};

export type PostponeMatchInput = {
    matchId: string;
    scheduledAt?: string | null;
    reason: string;
};

export type MatchOperationalSummary = {
    total: number;
    pending: number;
    live: number;
    finished: number;
    postponed: number;
    walkovers: number;
    retired: number;
};

/* -------------------------------------------------------------------------- */
/* RELATIONS                                                                  */
/* -------------------------------------------------------------------------- */

const MATCH_SELECT = `
    *,
    pair1:pairs!matches_pair_1_id_fkey(
        *,
        player1:players!pairs_player_1_id_fkey(*),
        player2:players!pairs_player_2_id_fkey(*)
    ),
    pair2:pairs!matches_pair_2_id_fkey(
        *,
        player1:players!pairs_player_1_id_fkey(*),
        player2:players!pairs_player_2_id_fkey(*)
    )
`;

/* -------------------------------------------------------------------------- */
/* QUERY                                                                      */
/* -------------------------------------------------------------------------- */

export async function getMatches(
    filters: ServiceMatchFilters = {},
): Promise<MatchWithRelationsExtended[]> {
    const supabase = await createClient();

    let query = supabase
        .from("matches")
        .select(MATCH_SELECT)
        .order("hora_programada", {
            ascending: true,
            nullsFirst: false,
        });

    if (filters.tournamentId) {
        query = query.eq(
            "tournament_id",
            filters.tournamentId,
        );
    }

    if (filters.categoryId) {
        query = query.eq(
            "categoria_id",
            filters.categoryId,
        );
    }

    if (
        filters.fase &&
        filters.fase !== "all"
    ) {
        query = query.eq(
            "fase",
            filters.fase,
        );
    }

    if (filters.groupId) {
        query = query.eq(
            "group_id",
            filters.groupId,
        );
    }

    if (
        filters.estado &&
        filters.estado !== "all"
    ) {
        query = query.eq(
            "estado",
            filters.estado,
        );
    }

    if (
        filters.tramo &&
        filters.tramo !== "all"
    ) {
        query = query.eq(
            "tramo",
            filters.tramo,
        );
    }

    if (
        filters.pista !== undefined &&
        filters.pista !== "all"
    ) {
        query = query.eq(
            "pista" as never,
            String(filters.pista) as never,
        );
    }

    if (filters.date) {
        query = query
            .gte(
                "hora_programada",
                `${filters.date}T00:00:00`,
            )
            .lte(
                "hora_programada",
                `${filters.date}T23:59:59`,
            );
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(
            `No se pudieron obtener los partidos: ${error.message}`,
        );
    }

    return (
        (data ?? []) as unknown as MatchWithRelationsExtended[]
    );
}

/* -------------------------------------------------------------------------- */
/* SINGLE MATCH                                                               */
/* -------------------------------------------------------------------------- */

export async function getMatchById(
    matchId: string,
): Promise<MatchWithRelationsExtended | null> {
    if (!matchId) {
        return null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("matches")
        .select(MATCH_SELECT)
        .eq("id", matchId)
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo obtener el partido: ${error.message}`,
        );
    }

    return (
        data as unknown as
        MatchWithRelationsExtended | null
    );
}

/* -------------------------------------------------------------------------- */
/* TOURNAMENT MATCHES                                                         */
/* -------------------------------------------------------------------------- */

export async function getTournamentMatches(
    tournamentId: string,
): Promise<MatchWithRelationsExtended[]> {
    return getMatches({
        tournamentId,
    });
}

export async function getLiveMatches(
    tournamentId?: string,
): Promise<MatchWithRelationsExtended[]> {
    return getMatches({
        tournamentId,
        estado: "en_juego",
    });
}

export async function getPendingMatches(
    tournamentId?: string,
): Promise<MatchWithRelationsExtended[]> {
    return getMatches({
        tournamentId,
        estado: "pendiente",
    });
}

export async function getFinishedMatches(
    tournamentId?: string,
): Promise<MatchWithRelationsExtended[]> {
    return getMatches({
        tournamentId,
        estado: "finalizado",
    });
}

/* -------------------------------------------------------------------------- */
/* CREATION                                                                   */
/* -------------------------------------------------------------------------- */

export async function createMatch(
    input: CreateMatchInput,
): Promise<Match> {
    if (
        !input.tournamentId ||
        !input.categoryId
    ) {
        throw new Error(
            "Torneo y categoría son obligatorios.",
        );
    }

    if (
        input.pair1Id &&
        input.pair2Id &&
        input.pair1Id === input.pair2Id
    ) {
        throw new Error(
            "Un partido no puede enfrentar una pareja contra sí misma.",
        );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("matches")
        .insert({
            tournament_id: input.tournamentId,
            categoria_id: input.categoryId,
            fase: input.fase,
            group_id: input.groupId ?? null,
            pair_1_id: input.pair1Id ?? null,
            pair_2_id: input.pair2Id ?? null,
            pista:
                input.pista !== undefined &&
                    input.pista !== null
                    ? String(input.pista)
                    : null,
            hora_programada: input.scheduledAt ?? null,
            hora_inicio_real: input.startedAt ?? null,
            hora_fin: null,
            estado: "pendiente",
            resultado_json: null,
            introducido_por: null,
            fecha_modificacion: null,
            tramo: input.tramo ?? null,
            siguiente_match_id: input.nextMatchId ?? null,
            siguiente_slot: input.nextSlot ?? null,
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear el partido: ${error.message}`,
        );
    }

    return data as unknown as Match;
}

/* -------------------------------------------------------------------------- */
/* UPDATE                                                                     */
/* -------------------------------------------------------------------------- */

export async function updateMatch(
    matchId: string,
    input: UpdateMatchInput,
): Promise<Match> {
    if (!matchId) {
        throw new Error("Falta matchId.");
    }

    const current = await getMatchById(matchId);

    if (!current) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (
        current.estado === "finalizado" &&
        input.estado !== "finalizado"
    ) {
        throw new Error(
            "Un partido finalizado no puede volver a un estado operativo normal.",
        );
    }

    if (
        input.pair1Id &&
        input.pair2Id &&
        input.pair1Id === input.pair2Id
    ) {
        throw new Error(
            "Un partido no puede enfrentar una pareja contra sí misma.",
        );
    }

    const payload: Partial<Match> = {};

    if (input.pista !== undefined) {
        payload.pista =
            input.pista !== null
                ? String(input.pista)
                : null;
    }

    if (input.scheduledAt !== undefined) {
        payload.hora_programada = input.scheduledAt;
    }

    if (input.startedAt !== undefined) {
        payload.hora_inicio_real = input.startedAt;
    }

    if (input.endedAt !== undefined) {
        payload.hora_fin = input.endedAt;
    }

    if (input.estado !== undefined) {
        payload.estado = input.estado;
    }

    if (input.pair1Id !== undefined) {
        payload.pair_1_id = input.pair1Id;
    }

    if (input.pair2Id !== undefined) {
        payload.pair_2_id = input.pair2Id;
    }

    if (input.tramo !== undefined) {
        payload.tramo = input.tramo;
    }

    if (input.nextMatchId !== undefined) {
        payload.siguiente_match_id = input.nextMatchId;
    }

    if (input.nextSlot !== undefined) {
        payload.siguiente_slot = input.nextSlot;
    }

    if (Object.keys(payload).length === 0) {
        return current as Match;
    }

    payload.fecha_modificacion =
        new Date().toISOString();

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("matches")
        .update(payload)
        .eq("id", matchId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar el partido: ${error.message}`,
        );
    }

    return data as unknown as Match;
}

/* -------------------------------------------------------------------------- */
/* COURT ASSIGNMENT                                                           */
/* -------------------------------------------------------------------------- */

export async function assignCourt(
    matchId: string,
    pista: number,
): Promise<Match> {
    if (
        !Number.isInteger(pista) ||
        pista < 1
    ) {
        throw new Error(
            "La pista debe ser un número entero válido.",
        );
    }

    return updateMatch(matchId, {
        pista,
    });
}

export async function clearCourt(
    matchId: string,
): Promise<Match> {
    return updateMatch(matchId, {
        pista: null,
    });
}

/* -------------------------------------------------------------------------- */
/* SCHEDULING                                                                 */
/* -------------------------------------------------------------------------- */

export async function scheduleMatch(
    matchId: string,
    scheduledAt: string,
): Promise<Match> {
    if (!scheduledAt) {
        throw new Error(
            "La fecha y hora del partido son obligatorias.",
        );
    }

    if (
        !Number.isFinite(
            new Date(scheduledAt).getTime(),
        )
    ) {
        throw new Error(
            "La fecha y hora no son válidas.",
        );
    }

    return updateMatch(matchId, {
        scheduledAt,
    });
}

export async function unscheduleMatch(
    matchId: string,
): Promise<Match> {
    return updateMatch(matchId, {
        scheduledAt: null,
    });
}

/* -------------------------------------------------------------------------- */
/* LIVE MATCH                                                                 */
/* -------------------------------------------------------------------------- */

export async function startMatch(
    matchId: string,
): Promise<Match> {
    const match = await getMatchById(matchId);

    if (!match) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (match.estado !== "pendiente") {
        throw new Error(
            "Solo un partido pendiente puede comenzar.",
        );
    }

    if (
        !match.pair_1_id ||
        !match.pair_2_id
    ) {
        throw new Error(
            "No se puede comenzar un partido sin dos parejas.",
        );
    }

    return updateMatch(matchId, {
        estado: "en_juego",
        startedAt: new Date().toISOString(),
    });
}

/* -------------------------------------------------------------------------- */
/* RESULT VALIDATION                                                          */
/* -------------------------------------------------------------------------- */

export async function validateMatchResultForDatabase(
    matchId: string,
    resultado_json: MatchResult,
): Promise<void> {
    const match = await getMatchById(matchId);

    if (!match) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (
        !match.pair_1_id ||
        !match.pair_2_id
    ) {
        throw new Error(
            "El partido necesita dos parejas.",
        );
    }

    const format = getMatchFormat(
        match.fase,
    );

    const validation =
        validateMatchResult(
            resultado_json,
            match.pair_1_id,
            match.pair_2_id,
            format,
        );

    if (!validation.valid) {
        throw new Error(
            validation.errors.join(" "),
        );
    }
}

/* -------------------------------------------------------------------------- */
/* ENTER RESULT                                                               */
/* -------------------------------------------------------------------------- */

export async function enterMatchResult(
    input: EnterMatchResultInput,
): Promise<Match> {
    const match = await getMatchById(
        input.matchId,
    );

    if (!match) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (match.estado === "finalizado") {
        throw new Error(
            "El resultado del partido ya está cerrado.",
        );
    }

    if (
        match.estado === "aplazado" ||
        match.estado === "walkover" ||
        match.estado === "retirada"
    ) {
        throw new Error(
            "Este partido tiene un estado especial y no puede recibir un resultado normal.",
        );
    }

    if (
        !match.pair_1_id ||
        !match.pair_2_id
    ) {
        throw new Error(
            "El partido necesita dos parejas antes de introducir el resultado.",
        );
    }

    const format = getMatchFormat(
        match.fase,
    );

    const validation =
        validateMatchResult(
            input.resultado_json,
            match.pair_1_id,
            match.pair_2_id,
            format,
        );

    if (!validation.valid) {
        throw new Error(
            validation.errors.join(" "),
        );
    }

    const normalized =
        normalizeMatchResult(
            input.resultado_json,
            match.pair_1_id,
            match.pair_2_id,
            format,
        );

    if (!normalized.winner_pair_id) {
        throw new Error(
            "No se pudo determinar el ganador.",
        );
    }

    const supabase = await createClient();

    const now =
        new Date().toISOString();

    const { data, error } = await supabase
        .from("matches")
        .update({
            resultado_json: normalized,
            estado: "finalizado",
            hora_fin: now,
            fecha_modificacion: now,
        })
        .eq("id", input.matchId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo guardar el resultado del partido: ${error.message}`,
        );
    }

    return data as unknown as Match;
}

/* -------------------------------------------------------------------------- */
/* WALKOVER / RETIREMENT                                                      */
/* -------------------------------------------------------------------------- */

export async function markWalkover(
    matchId: string,
    winnerPairId: string,
    reason?: string,
): Promise<Match> {
    const match = await getMatchById(matchId);

    if (!match) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (
        winnerPairId !== match.pair_1_id &&
        winnerPairId !== match.pair_2_id
    ) {
        throw new Error(
            "La pareja ganadora no pertenece al partido.",
        );
    }

    if (match.estado === "finalizado") {
        throw new Error(
            "El partido ya está finalizado.",
        );
    }

    const now =
        new Date().toISOString();

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("matches")
        .update({
            estado: "walkover",
            resultado_json: {
                sets: [],
                super_tiebreak: null,
                winner_pair_id: winnerPairId,
                loser_pair_id:
                    winnerPairId === match.pair_1_id
                        ? match.pair_2_id
                        : match.pair_1_id,
                decided_by: "walkover",
                notes:
                    reason?.trim() || null,
            },
            hora_fin: now,
            fecha_modificacion: now,
        })
        .eq("id", matchId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo registrar el walkover: ${error.message}`,
        );
    }

    return data as unknown as Match;
}

export async function markRetirement(
    matchId: string,
    winnerPairId: string,
    reason?: string,
): Promise<Match> {
    const match = await getMatchById(matchId);

    if (!match) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (
        winnerPairId !== match.pair_1_id &&
        winnerPairId !== match.pair_2_id
    ) {
        throw new Error(
            "La pareja ganadora no pertenece al partido.",
        );
    }

    if (match.estado === "finalizado") {
        throw new Error(
            "El partido ya está finalizado.",
        );
    }

    const now =
        new Date().toISOString();

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("matches")
        .update({
            estado: "retirada",
            resultado_json: {
                sets: [],
                super_tiebreak: null,
                winner_pair_id: winnerPairId,
                loser_pair_id:
                    winnerPairId === match.pair_1_id
                        ? match.pair_2_id
                        : match.pair_1_id,
                decided_by: "retirement",
                notes:
                    reason?.trim() || null,
            },
            hora_fin: now,
            fecha_modificacion: now,
        })
        .eq("id", matchId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo registrar la retirada: ${error.message}`,
        );
    }

    return data as unknown as Match;
}

/* -------------------------------------------------------------------------- */
/* POSTPONEMENT                                                               */
/* -------------------------------------------------------------------------- */

export async function postponeMatch(
    input: PostponeMatchInput,
): Promise<Match> {
    if (!input.reason.trim()) {
        throw new Error(
            "El aplazamiento necesita un motivo.",
        );
    }

    const match = await getMatchById(
        input.matchId,
    );

    if (!match) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (match.estado === "finalizado") {
        throw new Error(
            "Un partido finalizado no puede aplazarse.",
        );
    }

    const supabase = await createClient();

    const now =
        new Date().toISOString();

    const { data, error } = await supabase
        .from("matches")
        .update({
            estado: "aplazado",
            hora_programada:
                input.scheduledAt ?? null,
            fecha_modificacion: now,
            resultado_json: {
                sets: [],
                super_tiebreak: null,
                winner_pair_id: null,
                loser_pair_id: null,
                decided_by: null,
                notes:
                    `Aplazado: ${input.reason.trim()}`,
            },
        })
        .eq("id", input.matchId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo aplazar el partido: ${error.message}`,
        );
    }

    return data as unknown as Match;
}

export async function resumePostponedMatch(
    matchId: string,
    scheduledAt?: string | null,
): Promise<Match> {
    const match = await getMatchById(matchId);

    if (!match) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (match.estado !== "aplazado") {
        throw new Error(
            "El partido no está aplazado.",
        );
    }

    return updateMatch(matchId, {
        estado: "pendiente",
        scheduledAt:
            scheduledAt ?? match.hora_programada,
    });
}

/* -------------------------------------------------------------------------- */
/* BRACKET PROGRESSION                                                        */
/* -------------------------------------------------------------------------- */

export async function propagateMatchWinner(
    matchId: string,
    winnerPairId: string,
): Promise<Match | null> {
    const match = await getMatchById(matchId);

    if (!match) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (!match.siguiente_match_id) {
        return null;
    }

    if (
        winnerPairId !== match.pair_1_id &&
        winnerPairId !== match.pair_2_id
    ) {
        throw new Error(
            "La pareja ganadora no pertenece al partido.",
        );
    }

    const nextMatch = await getMatchById(
        match.siguiente_match_id,
    );

    if (!nextMatch) {
        throw new Error(
            "El siguiente partido no existe.",
        );
    }

    if (match.siguiente_slot === 1) {
        return updateMatch(nextMatch.id, {
            pair1Id: winnerPairId,
        });
    }

    if (match.siguiente_slot === 2) {
        return updateMatch(nextMatch.id, {
            pair2Id: winnerPairId,
        });
    }

    throw new Error(
        "El slot del siguiente partido no está definido.",
    );
}

/* -------------------------------------------------------------------------- */
/* OPERATIONAL SUMMARY                                                        */
/* -------------------------------------------------------------------------- */

export async function getMatchOperationalSummary(
    tournamentId: string,
    categoryId?: string,
): Promise<MatchOperationalSummary> {
    const matches = await getMatches({
        tournamentId,
        categoryId,
    });

    return {
        total: matches.length,

        pending: matches.filter(
            (match) =>
                match.estado === "pendiente",
        ).length,

        live: matches.filter(
            (match) =>
                match.estado === "en_juego",
        ).length,

        finished: matches.filter(
            (match) =>
                match.estado === "finalizado",
        ).length,

        postponed: matches.filter(
            (match) =>
                match.estado === "aplazado",
        ).length,

        walkovers: matches.filter(
            (match) =>
                match.estado === "walkover",
        ).length,

        retired: matches.filter(
            (match) =>
                match.estado === "retirada",
        ).length,
    };
}

/* -------------------------------------------------------------------------- */
/* LIVE OPERATIONS                                                            */
/* -------------------------------------------------------------------------- */

export async function getNowPlayingMatches(
    tournamentId: string,
): Promise<MatchWithRelationsExtended[]> {
    return getMatches({
        tournamentId,
        estado: "en_juego",
    });
}

export async function getNextMatches(
    tournamentId: string,
    limit = 10,
): Promise<MatchWithRelationsExtended[]> {
    const matches = await getMatches({
        tournamentId,
        estado: "pendiente",
    });

    return matches.slice(
        0,
        Math.max(1, limit),
    );
}

/* -------------------------------------------------------------------------- */
/* ADMIN RESULT CORRECTION                                                    */
/* -------------------------------------------------------------------------- */

export async function correctMatchResult(
    input: EnterMatchResultInput,
): Promise<Match> {
    const match = await getMatchById(
        input.matchId,
    );

    if (!match) {
        throw new Error(
            "El partido no existe.",
        );
    }

    if (
        !match.pair_1_id ||
        !match.pair_2_id
    ) {
        throw new Error(
            "El partido no tiene dos parejas.",
        );
    }

    const format = getMatchFormat(
        match.fase,
    );

    const validation =
        validateMatchResult(
            input.resultado_json,
            match.pair_1_id,
            match.pair_2_id,
            format,
        );

    if (!validation.valid) {
        throw new Error(
            validation.errors.join(" "),
        );
    }

    const normalized =
        normalizeMatchResult(
            input.resultado_json,
            match.pair_1_id,
            match.pair_2_id,
            format,
        );

    if (!normalized.winner_pair_id) {
        throw new Error(
            "No se pudo determinar el ganador.",
        );
    }

    const supabase = await createClient();

    const now =
        new Date().toISOString();

    const { data, error } = await supabase
        .from("matches")
        .update({
            resultado_json: normalized,
            estado: "finalizado",
            hora_fin:
                match.hora_fin ?? now,
            fecha_modificacion: now,
        })
        .eq("id", input.matchId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo corregir el resultado: ${error.message}`,
        );
    }

    return data as unknown as Match;
}