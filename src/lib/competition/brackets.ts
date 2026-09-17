import type {
    Bracket,
    Pair,
} from "@/types/database";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type BracketTier =
    | "oro"
    | "plata"
    | "bronce";

export type BracketRound =
    | "semis"
    | "final"
    | "cuartos"
    | "octavos";

export type BracketSlot = {
    slot: number;
    pairId: string | null;
    seed?: number | null;
    source?: BracketSource | null;
};

export type BracketSource =
    | {
        type: "group";
        groupId: string;
        position: number;
    }
    | {
        type: "match";
        matchId: string;
        result: "winner" | "loser";
    }
    | {
        type: "seed";
        seed: number;
    };

export type BracketMatch = {
    id: string;
    tier: BracketTier;
    round: BracketRound;

    position: number;

    pair1Id: string | null;
    pair2Id: string | null;

    pair1Source?: BracketSource | null;
    pair2Source?: BracketSource | null;

    nextMatchId?: string | null;
    nextSlot?: 1 | 2 | null;

    status:
    | "pendiente"
    | "en_juego"
    | "finalizado";
};

export type GeneratedBracket = {
    tier: BracketTier;
    pairCount: number;
    matches: BracketMatch[];
    championPairId: string | null;
};

export type TournamentBrackets = {
    oro: GeneratedBracket | null;
    plata: GeneratedBracket | null;
    bronce: GeneratedBracket | null;
};

/* -------------------------------------------------------------------------- */
/* SERIALIZED STRUCTURE                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Representación JSON-safe que se almacena en brackets.estructura_json.
 *
 * Se define aquí porque representa específicamente la estructura
 * interna generada por este módulo.
 */
export type SerializedBracket = {
    tier: BracketTier;
    pairCount: number;

    matches: Array<{
        id: string;
        round: BracketRound;
        position: number;

        pair1Id: string | null;
        pair2Id: string | null;

        pair1Source: BracketSource | null;
        pair2Source: BracketSource | null;

        nextMatchId: string | null;
        nextSlot: 1 | 2 | null;

        status:
        | "pendiente"
        | "en_juego"
        | "finalizado";
    }>;
};

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const TIERS: BracketTier[] = [
    "oro",
    "plata",
    "bronce",
];

/* -------------------------------------------------------------------------- */
/* IDS                                                                        */
/* -------------------------------------------------------------------------- */

function createMatchId(
    tier: BracketTier,
    round: BracketRound,
    position: number,
): string {
    return `bracket-${tier}-${round}-${position}`;
}

/* -------------------------------------------------------------------------- */
/* BASIC VALIDATION                                                           */
/* -------------------------------------------------------------------------- */

function uniqueIds(
    ids: string[],
): boolean {
    return new Set(ids).size === ids.length;
}

function assertUniquePairIds(
    pairIds: string[],
): void {
    if (!uniqueIds(pairIds)) {
        throw new Error(
            "Una pareja no puede aparecer dos veces en el mismo cuadro.",
        );
    }
}

function assertMinimumPairs(
    pairIds: string[],
): void {
    if (pairIds.length < 2) {
        throw new Error(
            "Un cuadro eliminatorio necesita al menos 2 parejas.",
        );
    }
}

/* -------------------------------------------------------------------------- */
/* GENERIC MATCH CREATION                                                     */
/* -------------------------------------------------------------------------- */

function createKnockoutMatch(params: {
    tier: BracketTier;
    round: BracketRound;
    position: number;
    pair1Id?: string | null;
    pair2Id?: string | null;
    pair1Source?: BracketSource | null;
    pair2Source?: BracketSource | null;
}): BracketMatch {
    return {
        id: createMatchId(
            params.tier,
            params.round,
            params.position,
        ),

        tier: params.tier,
        round: params.round,
        position: params.position,

        pair1Id: params.pair1Id ?? null,
        pair2Id: params.pair2Id ?? null,

        pair1Source:
            params.pair1Source ?? null,

        pair2Source:
            params.pair2Source ?? null,

        nextMatchId: null,
        nextSlot: null,

        status: "pendiente",
    };
}

/* -------------------------------------------------------------------------- */
/* 3 PAIRS                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Official 3-pair structure:
 *
 * Group:
 *   1st
 *   2nd
 *   3rd
 *
 * Only the top two access Gold.
 *
 * There is no Gold semifinal.
 * The two qualified pairs go directly to a Gold final.
 *
 * The third pair does not enter Gold.
 *
 * Silver/Bronze are intentionally not forced here because the supplied
 * competition rules do not define a complete 3-pair Silver/Bronze structure.
 */
export function createThreePairGoldBracket(
    groupId: string,
): GeneratedBracket {
    const final = createKnockoutMatch({
        tier: "oro",
        round: "final",
        position: 1,

        pair1Source: {
            type: "group",
            groupId,
            position: 1,
        },

        pair2Source: {
            type: "group",
            groupId,
            position: 2,
        },
    });

    return {
        tier: "oro",
        pairCount: 2,
        matches: [final],
        championPairId: null,
    };
}

/* -------------------------------------------------------------------------- */
/* 4 PAIRS                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Official 4-pair structure:
 *
 * Semifinal 1:
 *   1st vs 4th
 *
 * Semifinal 2:
 *   2nd vs 3rd
 *
 * Winners → Gold final
 * Losers  → Silver final
 *
 * No Bronze bracket.
 */
export function createFourPairBrackets(
    groupId: string,
): TournamentBrackets {
    const goldSemi1 = createKnockoutMatch({
        tier: "oro",
        round: "semis",
        position: 1,

        pair1Source: {
            type: "group",
            groupId,
            position: 1,
        },

        pair2Source: {
            type: "group",
            groupId,
            position: 4,
        },
    });

    const goldSemi2 = createKnockoutMatch({
        tier: "oro",
        round: "semis",
        position: 2,

        pair1Source: {
            type: "group",
            groupId,
            position: 2,
        },

        pair2Source: {
            type: "group",
            groupId,
            position: 3,
        },
    });

    const goldFinal = createKnockoutMatch({
        tier: "oro",
        round: "final",
        position: 1,

        pair1Source: {
            type: "match",
            matchId: goldSemi1.id,
            result: "winner",
        },

        pair2Source: {
            type: "match",
            matchId: goldSemi2.id,
            result: "winner",
        },
    });

    const silverFinal = createKnockoutMatch({
        tier: "plata",
        round: "final",
        position: 1,

        pair1Source: {
            type: "match",
            matchId: goldSemi1.id,
            result: "loser",
        },

        pair2Source: {
            type: "match",
            matchId: goldSemi2.id,
            result: "loser",
        },
    });

    goldSemi1.nextMatchId = goldFinal.id;
    goldSemi1.nextSlot = 1;

    goldSemi2.nextMatchId = goldFinal.id;
    goldSemi2.nextSlot = 2;

    return {
        oro: {
            tier: "oro",
            pairCount: 4,
            matches: [
                goldSemi1,
                goldSemi2,
                goldFinal,
            ],
            championPairId: null,
        },

        plata: {
            tier: "plata",
            pairCount: 2,
            matches: [silverFinal],
            championPairId: null,
        },

        bronce: null,
    };
}


/* -------------------------------------------------------------------------- */
/* 5 PAIRS                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Official 5-pair structure:
 *
 * Group:
 *   1st, 2nd, 3rd, 4th, 5th
 *
 * The group stage is a complete round robin.
 * The 5th pair is eliminated after the group stage.
 *
 * Gold semifinals:
 *   1st vs 4th
 *   2nd vs 3rd
 *
 * Winners → Gold final
 * Losers  → Silver final
 *
 * There is no Bronze bracket.
 */
export function createFivePairBrackets(
    groupId: string,
): TournamentBrackets {
    const goldSemi1 = createKnockoutMatch({
        tier: "oro",
        round: "semis",
        position: 1,
        pair1Source: {
            type: "group",
            groupId,
            position: 1,
        },
        pair2Source: {
            type: "group",
            groupId,
            position: 4,
        },
    });

    const goldSemi2 = createKnockoutMatch({
        tier: "oro",
        round: "semis",
        position: 2,
        pair1Source: {
            type: "group",
            groupId,
            position: 2,
        },
        pair2Source: {
            type: "group",
            groupId,
            position: 3,
        },
    });

    const goldFinal = createKnockoutMatch({
        tier: "oro",
        round: "final",
        position: 1,
        pair1Source: {
            type: "match",
            matchId: goldSemi1.id,
            result: "winner",
        },
        pair2Source: {
            type: "match",
            matchId: goldSemi2.id,
            result: "winner",
        },
    });

    const silverFinal = createKnockoutMatch({
        tier: "plata",
        round: "final",
        position: 1,
        pair1Source: {
            type: "match",
            matchId: goldSemi1.id,
            result: "loser",
        },
        pair2Source: {
            type: "match",
            matchId: goldSemi2.id,
            result: "loser",
        },
    });

    goldSemi1.nextMatchId = goldFinal.id;
    goldSemi1.nextSlot = 1;
    goldSemi2.nextMatchId = goldFinal.id;
    goldSemi2.nextSlot = 2;

    return {
        oro: {
            tier: "oro",
            pairCount: 4,
            matches: [goldSemi1, goldSemi2, goldFinal],
            championPairId: null,
        },
        plata: {
            tier: "plata",
            pairCount: 2,
            matches: [silverFinal],
            championPairId: null,
        },
        bronce: null,
    };
}

/* -------------------------------------------------------------------------- */
/* 6 PAIRS                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Official 6-pair structure:
 *
 * Two groups of three, each in complete round robin.
 *
 * Gold semifinals:
 *   1A vs 2B
 *   1B vs 2A
 *
 * Winners → Gold final
 * Losers  → Silver final
 *
 * Bronze:
 *   3A vs 3B
 */
export function createSixPairBrackets(
    groupAId: string,
    groupBId: string,
): TournamentBrackets {
    const goldSemi1 = createKnockoutMatch({
        tier: "oro",
        round: "semis",
        position: 1,
        pair1Source: {
            type: "group",
            groupId: groupAId,
            position: 1,
        },
        pair2Source: {
            type: "group",
            groupId: groupBId,
            position: 2,
        },
    });

    const goldSemi2 = createKnockoutMatch({
        tier: "oro",
        round: "semis",
        position: 2,
        pair1Source: {
            type: "group",
            groupId: groupBId,
            position: 1,
        },
        pair2Source: {
            type: "group",
            groupId: groupAId,
            position: 2,
        },
    });

    const goldFinal = createKnockoutMatch({
        tier: "oro",
        round: "final",
        position: 1,
        pair1Source: {
            type: "match",
            matchId: goldSemi1.id,
            result: "winner",
        },
        pair2Source: {
            type: "match",
            matchId: goldSemi2.id,
            result: "winner",
        },
    });

    const silverFinal = createKnockoutMatch({
        tier: "plata",
        round: "final",
        position: 1,
        pair1Source: {
            type: "match",
            matchId: goldSemi1.id,
            result: "loser",
        },
        pair2Source: {
            type: "match",
            matchId: goldSemi2.id,
            result: "loser",
        },
    });

    const bronzeFinal = createKnockoutMatch({
        tier: "bronce",
        round: "final",
        position: 1,
        pair1Source: {
            type: "group",
            groupId: groupAId,
            position: 3,
        },
        pair2Source: {
            type: "group",
            groupId: groupBId,
            position: 3,
        },
    });

    goldSemi1.nextMatchId = goldFinal.id;
    goldSemi1.nextSlot = 1;
    goldSemi2.nextMatchId = goldFinal.id;
    goldSemi2.nextSlot = 2;

    return {
        oro: {
            tier: "oro",
            pairCount: 4,
            matches: [goldSemi1, goldSemi2, goldFinal],
            championPairId: null,
        },
        plata: {
            tier: "plata",
            pairCount: 2,
            matches: [silverFinal],
            championPairId: null,
        },
        bronce: {
            tier: "bronce",
            pairCount: 2,
            matches: [bronzeFinal],
            championPairId: null,
        },
    };
}

/* -------------------------------------------------------------------------- */
/* 8 PAIRS                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Official 8-pair structure:
 *
 * Two groups of four.
 *
 * Gold:
 *   1A vs 2B
 *   1B vs 2A
 *   → Gold final
 *
 * Silver:
 *   3A vs 3B
 *
 * Bronze:
 *   4A vs 4B
 */
export function createEightPairBrackets(
    groupAId: string,
    groupBId: string,
): TournamentBrackets {
    const goldSemi1 = createKnockoutMatch({
        tier: "oro",
        round: "semis",
        position: 1,

        pair1Source: {
            type: "group",
            groupId: groupAId,
            position: 1,
        },

        pair2Source: {
            type: "group",
            groupId: groupBId,
            position: 2,
        },
    });

    const goldSemi2 = createKnockoutMatch({
        tier: "oro",
        round: "semis",
        position: 2,

        pair1Source: {
            type: "group",
            groupId: groupBId,
            position: 1,
        },

        pair2Source: {
            type: "group",
            groupId: groupAId,
            position: 2,
        },
    });

    const goldFinal = createKnockoutMatch({
        tier: "oro",
        round: "final",
        position: 1,

        pair1Source: {
            type: "match",
            matchId: goldSemi1.id,
            result: "winner",
        },

        pair2Source: {
            type: "match",
            matchId: goldSemi2.id,
            result: "winner",
        },
    });

    const silverFinal = createKnockoutMatch({
        tier: "plata",
        round: "final",
        position: 1,

        pair1Source: {
            type: "group",
            groupId: groupAId,
            position: 3,
        },

        pair2Source: {
            type: "group",
            groupId: groupBId,
            position: 3,
        },
    });

    const bronzeFinal = createKnockoutMatch({
        tier: "bronce",
        round: "final",
        position: 1,

        pair1Source: {
            type: "group",
            groupId: groupAId,
            position: 4,
        },

        pair2Source: {
            type: "group",
            groupId: groupBId,
            position: 4,
        },
    });

    goldSemi1.nextMatchId = goldFinal.id;
    goldSemi1.nextSlot = 1;

    goldSemi2.nextMatchId = goldFinal.id;
    goldSemi2.nextSlot = 2;

    return {
        oro: {
            tier: "oro",
            pairCount: 4,
            matches: [
                goldSemi1,
                goldSemi2,
                goldFinal,
            ],
            championPairId: null,
        },

        plata: {
            tier: "plata",
            pairCount: 2,
            matches: [silverFinal],
            championPairId: null,
        },

        bronce: {
            tier: "bronce",
            pairCount: 2,
            matches: [bronzeFinal],
            championPairId: null,
        },
    };
}

/* -------------------------------------------------------------------------- */
/* RESOLVED BRACKET CREATION                                                  */
/* -------------------------------------------------------------------------- */

export function resolveBracketSources(
    bracket: GeneratedBracket,
    sourceResolver: (
        source: BracketSource,
    ) => string | null,
): GeneratedBracket {
    const matches = bracket.matches.map(
        (match) => ({
            ...match,

            pair1Id:
                match.pair1Id ??
                (
                    match.pair1Source
                        ? sourceResolver(
                            match.pair1Source,
                        )
                        : null
                ),

            pair2Id:
                match.pair2Id ??
                (
                    match.pair2Source
                        ? sourceResolver(
                            match.pair2Source,
                        )
                        : null
                ),
        }),
    );

    return {
        ...bracket,
        matches,
    };
}

/* -------------------------------------------------------------------------- */
/* GENERAL GENERATOR                                                          */
/* -------------------------------------------------------------------------- */

export function createOfficialBrackets(params: {
    pairCount: number;
    groupIds: string[];
}): TournamentBrackets {
    const {
        pairCount,
        groupIds,
    } = params;

    if (!Number.isInteger(pairCount) || pairCount < 2) {
        throw new Error(
            "El número de parejas debe ser un entero mayor o igual que 2.",
        );
    }

    if (groupIds.some((id) => !id?.trim())) {
        throw new Error("Todos los identificadores de grupo son obligatorios.");
    }

    if (pairCount === 3) {
        if (groupIds.length !== 1) {
            throw new Error(
                "La estructura de 3 parejas necesita un único grupo.",
            );
        }

        return {
            oro: createThreePairGoldBracket(
                groupIds[0],
            ),

            plata: null,
            bronce: null,
        };
    }

    if (pairCount === 4) {
        if (groupIds.length !== 1) {
            throw new Error(
                "La estructura de 4 parejas necesita un único grupo.",
            );
        }

        return createFourPairBrackets(
            groupIds[0],
        );
    }

    if (pairCount === 5) {
        if (groupIds.length !== 1) {
            throw new Error(
                "La estructura de 5 parejas necesita un único grupo.",
            );
        }

        return createFivePairBrackets(groupIds[0]);
    }

    if (pairCount === 6) {
        if (groupIds.length !== 2) {
            throw new Error(
                "La estructura de 6 parejas necesita dos grupos.",
            );
        }

        return createSixPairBrackets(
            groupIds[0],
            groupIds[1],
        );
    }

    if (pairCount === 8) {
        if (groupIds.length !== 2) {
            throw new Error(
                "La estructura de 8 parejas necesita dos grupos.",
            );
        }

        return createEightPairBrackets(
            groupIds[0],
            groupIds[1],
        );
    }

    return createGenericBrackets(
        pairCount,
        groupIds,
    );
}

/* -------------------------------------------------------------------------- */
/* GENERIC FALLBACK                                                           */
/* -------------------------------------------------------------------------- */

export function createGenericBrackets(
    pairCount: number,
    groupIds: string[],
): TournamentBrackets {
    if (pairCount < 2) {
        return {
            oro: null,
            plata: null,
            bronce: null,
        };
    }

    const nextPowerOfTwo =
        2 ** Math.ceil(
            Math.log2(pairCount),
        );

    const rounds =
        Math.log2(nextPowerOfTwo);

    const matches: BracketMatch[] = [];

    for (
        let roundIndex = 0;
        roundIndex < rounds;
        roundIndex += 1
    ) {
        const matchCount =
            nextPowerOfTwo /
            2 ** (roundIndex + 1);

        const round =
            getRoundFromMatchCount(
                matchCount,
                rounds,
            );

        for (
            let position = 1;
            position <= matchCount;
            position += 1
        ) {
            matches.push(
                createKnockoutMatch({
                    tier: "oro",
                    round,
                    position,
                }),
            );
        }
    }

    return {
        oro: {
            tier: "oro",
            pairCount,
            matches,
            championPairId: null,
        },

        plata: null,
        bronce: null,
    };
}

function getRoundFromMatchCount(
    matchCount: number,
    totalRounds: number,
): BracketRound {
    if (matchCount === 1) {
        return "final";
    }

    if (
        matchCount === 2 &&
        totalRounds >= 2
    ) {
        return "semis";
    }

    if (
        matchCount === 4 &&
        totalRounds >= 3
    ) {
        return "cuartos";
    }

    return "octavos";
}

/* -------------------------------------------------------------------------- */
/* BRACKET VALIDATION                                                          */
/* -------------------------------------------------------------------------- */

export function validateBracket(
    bracket: GeneratedBracket,
): boolean {
    if (!TIERS.includes(bracket.tier)) {
        return false;
    }

    if (
        !Number.isInteger(
            bracket.pairCount,
        ) ||
        bracket.pairCount < 2
    ) {
        return false;
    }

    if (bracket.matches.length === 0) {
        return false;
    }

    const matchIds =
        bracket.matches.map(
            (match) => match.id,
        );

    if (!uniqueIds(matchIds)) {
        return false;
    }

    /*
     * Una pareja aparece legítimamente en varias rondas del mismo cuadro
     * (semifinal → final). La unicidad se valida dentro de cada partido,
     * no globalmente en todo el cuadro.
     */
    return bracket.matches.every(
        (match) =>
            !match.pair1Id ||
            !match.pair2Id ||
            match.pair1Id !== match.pair2Id,
    );
}

export function validateTournamentBrackets(
    brackets: TournamentBrackets,
): boolean {
    return (
        (!brackets.oro ||
            validateBracket(brackets.oro)) &&
        (!brackets.plata ||
            validateBracket(brackets.plata)) &&
        (!brackets.bronce ||
            validateBracket(brackets.bronce))
    );
}

/* -------------------------------------------------------------------------- */
/* BRACKET PROGRESSION                                                         */
/* -------------------------------------------------------------------------- */

export function advanceBracketMatch(
    bracket: GeneratedBracket,
    matchId: string,
    winnerPairId: string,
    loserPairId: string,
): GeneratedBracket {
    const matchIndex =
        bracket.matches.findIndex(
            (match) => match.id === matchId,
        );

    if (matchIndex === -1) {
        throw new Error(
            `No existe el partido ${matchId} en el cuadro.`,
        );
    }

    const match =
        bracket.matches[matchIndex];

    if (
        winnerPairId !== match.pair1Id &&
        winnerPairId !== match.pair2Id
    ) {
        throw new Error(
            "El ganador no pertenece al partido.",
        );
    }

    if (
        loserPairId !== match.pair1Id &&
        loserPairId !== match.pair2Id
    ) {
        throw new Error(
            "El perdedor no pertenece al partido.",
        );
    }

    const updatedMatches =
        bracket.matches.map(
            (current) => ({
                ...current,
            }),
        );

    const currentIndex =
        updatedMatches.findIndex(
            (current) =>
                current.id === matchId,
        );

    updatedMatches[currentIndex].status =
        "finalizado";

    const nextMatchId =
        updatedMatches[currentIndex]
            .nextMatchId;

    const nextSlot =
        updatedMatches[currentIndex]
            .nextSlot;

    if (
        !nextMatchId ||
        !nextSlot
    ) {
        return {
            ...bracket,
            matches: updatedMatches,
            championPairId:
                winnerPairId,
        };
    }

    const nextMatchIndex =
        updatedMatches.findIndex(
            (current) =>
                current.id === nextMatchId,
        );

    if (nextMatchIndex === -1) {
        throw new Error(
            `No existe el siguiente partido ${nextMatchId}.`,
        );
    }

    if (nextSlot === 1) {
        updatedMatches[
            nextMatchIndex
        ].pair1Id = winnerPairId;
    } else {
        updatedMatches[
            nextMatchIndex
        ].pair2Id = winnerPairId;
    }

    return {
        ...bracket,
        matches: updatedMatches,
    };
}


export type BracketOutcome = {
    winnerPairId: string;
    loserPairId: string;
};

/**
 * Applies a completed match to every downstream slot represented by the
 * generated bracket. This is necessary for SPC because a semifinal can feed
 * both Gold (winner) and Silver (loser).
 */
export function advanceBracketOutcome(
    bracket: GeneratedBracket,
    matchId: string,
    outcome: BracketOutcome,
): GeneratedBracket {
    const match = bracket.matches.find((item) => item.id === matchId);
    if (!match) throw new Error(`No existe el partido ${matchId} en el cuadro.`);
    if (!outcome.winnerPairId || !outcome.loserPairId || outcome.winnerPairId === outcome.loserPairId) {
        throw new Error("El resultado del partido no es válido.");
    }
    if (![match.pair1Id, match.pair2Id].includes(outcome.winnerPairId) ||
        ![match.pair1Id, match.pair2Id].includes(outcome.loserPairId)) {
        throw new Error("El resultado contiene parejas que no pertenecen al partido.");
    }

    const matches = bracket.matches.map((item) => ({ ...item }));
    const current = matches.find((item) => item.id === matchId)!;
    current.status = "finalizado";

    for (const target of matches) {
        if (target.pair1Source?.type === "match" && target.pair1Source.matchId === matchId) {
            target.pair1Id = target.pair1Source.result === "winner" ? outcome.winnerPairId : outcome.loserPairId;
        }
        if (target.pair2Source?.type === "match" && target.pair2Source.matchId === matchId) {
            target.pair2Id = target.pair2Source.result === "winner" ? outcome.winnerPairId : outcome.loserPairId;
        }
    }

    const championPairId = match.round === "final"
        ? outcome.winnerPairId
        : bracket.championPairId;
    return { ...bracket, matches, championPairId };
}

/* -------------------------------------------------------------------------- */
/* CHAMPION                                                                    */
/* -------------------------------------------------------------------------- */

export function getBracketChampion(
    bracket: GeneratedBracket,
): string | null {
    if (bracket.championPairId) {
        return bracket.championPairId;
    }

    const final = bracket.matches.find(
        (match) =>
            match.round === "final",
    );

    if (
        !final ||
        final.status !== "finalizado"
    ) {
        return null;
    }

    return null;
}

/* -------------------------------------------------------------------------- */
/* POSITION → SOURCE                                                           */
/* -------------------------------------------------------------------------- */

export function groupPositionSource(
    groupId: string,
    position: number,
): BracketSource {
    if (
        !groupId ||
        !Number.isInteger(position) ||
        position < 1
    ) {
        throw new Error(
            "Origen de grupo no válido.",
        );
    }

    return {
        type: "group",
        groupId,
        position,
    };
}

export function matchResultSource(
    matchId: string,
    result: "winner" | "loser",
): BracketSource {
    if (!matchId) {
        throw new Error(
            "Falta matchId.",
        );
    }

    return {
        type: "match",
        matchId,
        result,
    };
}

/* -------------------------------------------------------------------------- */
/* SERIALIZATION                                                               */
/* -------------------------------------------------------------------------- */

export function serializeBracket(
    bracket: GeneratedBracket,
): SerializedBracket {
    return {
        tier: bracket.tier,

        pairCount: bracket.pairCount,

        matches: bracket.matches.map(
            (match) => ({
                id: match.id,

                round: match.round,

                position: match.position,

                pair1Id: match.pair1Id,

                pair2Id: match.pair2Id,

                pair1Source:
                    match.pair1Source ?? null,

                pair2Source:
                    match.pair2Source ?? null,

                nextMatchId:
                    match.nextMatchId ?? null,

                nextSlot:
                    match.nextSlot ?? null,

                status: match.status,
            }),
        ),
    };
}

/* -------------------------------------------------------------------------- */
/* DISPLAY HELPERS                                                             */
/* -------------------------------------------------------------------------- */

export function getBracketTierLabel(
    tier: BracketTier,
): string {
    switch (tier) {
        case "oro":
            return "Oro";

        case "plata":
            return "Plata";

        case "bronce":
            return "Bronce";
    }
}

export function getBracketRoundLabel(
    round: BracketRound,
): string {
    switch (round) {
        case "octavos":
            return "Octavos de final";

        case "cuartos":
            return "Cuartos de final";

        case "semis":
            return "Semifinales";

        case "final":
            return "Final";
    }
}

/* -------------------------------------------------------------------------- */
/* OFFICIAL STRUCTURE SUMMARY                                                  */
/* -------------------------------------------------------------------------- */

export function getOfficialBracketDescription(
    pairCount: number,
): string {
    switch (pairCount) {
        case 3:
            return (
                "Las dos primeras parejas acceden a la final de Oro."
            );

        case 4:
            return (
                "Semifinales de Oro 1ª-4ª y 2ª-3ª. " +
                "Los perdedores disputan la final de Plata."
            );

        case 5:
            return (
                "Todos contra todos; 1ª-4ª y 2ª-3ª forman semifinales de Oro. " +
                "Los perdedores disputan la final de Plata y la 5ª pareja queda eliminada."
            );

        case 6:
            return (
                "Dos grupos de 3; semifinales de Oro cruzadas 1A-2B y 1B-2A. " +
                "Los perdedores disputan Plata y los terceros Bronce."
            );

        case 8:
            return (
                "Semifinales de Oro cruzadas entre grupos. " +
                "Los terceros disputan Plata y los cuartos disputan Bronce."
            );

        default:
            return (
                "Cuadro eliminatorio configurable."
            );
    }
}