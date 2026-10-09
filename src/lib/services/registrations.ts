// src/lib/services/registrations.ts

import { createClient } from "@/lib/supabase/server";

import type {
    Pair,
    Player,
    Registration,
    RegistrationStatus as DatabaseRegistrationStatus,
    Tournament,
    TournamentCategory,
} from "@/types/database";

/* -------------------------------------------------------------------------- */
/* DOMAIN TYPES                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Payment is external to SPC. These values are domain/UI values only.
 * The database stores the verification itself through fecha_pago.
 */
export type PaymentStatus =
    | "pendiente"
    | "verificado"
    | "rechazado"
    | "no_aplicable";

export type PartnerAvailability =
    | "buscando"
    | "encontrada"
    | "no_busca";

export type RegistrationStatus =
    DatabaseRegistrationStatus;

export type RegistrationFilters = {
    tournamentId?: string;
    categoryId?: string;
    playerId?: string;
    estado?: RegistrationStatus;
    paymentStatus?: PaymentStatus;
    checkIn?: boolean;
};

export type RegistrationWithRelationsExtended =
    Registration & {
        /**
         * Computed compatibility fields.
         * They are not columns in registrations.
         */
        categoria_id?: string | null;
        payment_status?: PaymentStatus;

        pair?: Pair | null;
        player?: Player | null;
        tournament?: Tournament | null;
        tournamentCategory?: TournamentCategory | null;
    };

export type CreateIndividualRegistrationInput = {
    tournamentId: string;
    categoryId: string;
    playerId: string;
    shirtSize?: string | null;
    partnerSearch?: boolean;
    partnerId?: string | null;
};

export type CompleteRegistrationInput = {
    registrationId: string;
    partnerId: string;
};

export type VerifyPaymentInput = {
    registrationId: string;
    method: "fisico" | "transferencia" | "otro";
    amount?: number | null;
    paymentDate?: string | null;
    note?: string | null;
};

export type RegistrationCapacity = {
    tournamentId: string;
    categoryId: string;
    maxCapacity: number | null;
    confirmed: number;
    pendingPayment: number;
    waitingList: number;
    available: number | null;
    isFull: boolean;
};

export type RegistrationSummary = {
    tournamentId: string;
    categoryId: string | null;
    total: number;
    confirmed: number;
    pendingPayment: number;
    waitingList: number;
    cancelled: number;
    paid: number;
    checkedIn: number;
};

export type RegistrationFlowState = {
    registrationId: string;
    hasPartner: boolean;
    registrationStatus: RegistrationStatus;
    paymentStatus: PaymentStatus;
    paymentVerified: boolean;
    checkedIn: boolean;
    canCompletePair: boolean;
    canCancel: boolean;
};

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

export const ACTIVE_REGISTRATION_STATUSES: RegistrationStatus[] = [
    "confirmada",
    "lista_espera",
    "pendiente_pago",
];

const CANCELLED_STATUS: RegistrationStatus = "cancelada";

const PARTNER_POOL_AVAILABILITY: PartnerAvailability[] = [
    "buscando",
    "encontrada",
    "no_busca",
];

/* -------------------------------------------------------------------------- */
/* INTERNAL HELPERS                                                           */
/* -------------------------------------------------------------------------- */

function assertId(value: string, label: string): void {
    if (!value?.trim()) {
        throw new Error(`Falta ${label}.`);
    }
}

function isActiveStatus(estado: RegistrationStatus): boolean {
    return ACTIVE_REGISTRATION_STATUSES.includes(estado);
}

function getPaymentStatus(
    registration: Pick<
        Registration,
        "fecha_pago" | "metodo_pago" | "payment_status"
    >,
): PaymentStatus {
    if (registration.payment_status === "verificado") {
        return "verificado";
    }

    if (registration.payment_status === "rechazado") {
        return "rechazado";
    }

    if (registration.payment_status === "no_aplicable") {
        return "no_aplicable";
    }

    return registration.fecha_pago
        ? "verificado"
        : "pendiente";
}

function withComputedFields(
    registration: Registration,
    relations?: {
        pair?: Pair | null;
        player?: Player | null;
        tournament?: Tournament | null;
        tournamentCategory?: TournamentCategory | null;
    },
): RegistrationWithRelationsExtended {
    const categoryId =
        relations?.pair?.categoria_id ??
        relations?.tournamentCategory?.categoria_id;

    return {
        ...registration,
        ...(categoryId
            ? {
                categoria_id: categoryId,
            }
            : {}),
        payment_status:
            getPaymentStatus(registration),
        pair:
            relations?.pair ??
            null,
        player:
            relations?.player ??
            null,
        tournament:
            relations?.tournament ??
            null,
        tournamentCategory:
            relations?.tournamentCategory ??
            null,
    };
}

async function getPairIdsForPlayer(
    playerId: string,
    tournamentId?: string,
): Promise<string[]> {
    const supabase = await createClient();

    let query = supabase
        .from("pairs")
        .select("id")
        .or(
            [
                `player_1_id.eq.${playerId}`,
                `player_2_id.eq.${playerId}`,
            ].join(","),
        );

    if (tournamentId) {
        query = query.eq(
            "tournament_id",
            tournamentId,
        );
    }

    const {
        data,
        error,
    } = await query;

    if (error) {
        throw new Error(
            `No se pudieron buscar las parejas del jugador: ${error.message}`,
        );
    }

    return (data ?? []).map(
        (pair) => pair.id,
    );
}

async function enrichRegistrations(
    registrations: Registration[],
): Promise<RegistrationWithRelationsExtended[]> {
    if (registrations.length === 0) {
        return [];
    }

    const supabase = await createClient();

    const pairIds = Array.from(
        new Set(
            registrations
                .map(
                    (registration) =>
                        registration.pair_id,
                )
                .filter(Boolean),
        ),
    );

    const tournamentIds = Array.from(
        new Set(
            registrations
                .map(
                    (registration) =>
                        registration.tournament_id,
                )
                .filter(Boolean),
        ),
    );

    const [
        pairsResult,
        tournamentsResult,
    ] = await Promise.all([
        pairIds.length > 0
            ? supabase
                .from("pairs")
                .select("*")
                .in("id", pairIds)
            : Promise.resolve({
                data: [],
                error: null,
            }),

        tournamentIds.length > 0
            ? supabase
                .from("tournaments")
                .select("*")
                .in(
                    "id",
                    tournamentIds,
                )
            : Promise.resolve({
                data: [],
                error: null,
            }),
    ]);

    if (pairsResult.error) {
        throw new Error(
            `No se pudieron obtener las parejas: ${pairsResult.error.message}`,
        );
    }

    if (tournamentsResult.error) {
        throw new Error(
            `No se pudieron obtener los torneos: ${tournamentsResult.error.message}`,
        );
    }

    const pairs =
        (pairsResult.data ?? []) as Pair[];

    const tournaments =
        (tournamentsResult.data ?? []) as Tournament[];

    const categoryIds = Array.from(
        new Set(
            pairs.map(
                (pair) =>
                    pair.categoria_id,
            ),
        ),
    );

    const tournamentCategoryMap =
        new Map<string, TournamentCategory>();

    if (
        categoryIds.length > 0 &&
        tournamentIds.length > 0
    ) {
        const {
            data,
            error,
        } = await supabase
            .from("tournament_categories")
            .select("*")
            .in(
                "tournament_id",
                tournamentIds,
            )
            .in(
                "categoria_id",
                categoryIds,
            );

        if (error) {
            throw new Error(
                `No se pudieron obtener las configuraciones de categoría: ${error.message}`,
            );
        }

        for (
            const item of
            (data ?? []) as TournamentCategory[]
        ) {
            tournamentCategoryMap.set(
                `${item.tournament_id}:${item.categoria_id}`,
                item,
            );
        }
    }

    const playerIds = Array.from(
        new Set(
            pairs.flatMap(
                (pair) =>
                    [
                        pair.player_1_id,
                        pair.player_2_id,
                    ].filter(
                        (
                            id,
                        ): id is string =>
                            Boolean(id),
                    ),
            ),
        ),
    );

    const playersMap =
        new Map<string, Player>();

    if (playerIds.length > 0) {
        const {
            data,
            error,
        } = await supabase
            .from("players")
            .select("*")
            .in(
                "id",
                playerIds,
            );

        if (error) {
            throw new Error(
                `No se pudieron obtener los jugadores: ${error.message}`,
            );
        }

        for (
            const player of
            (data ?? []) as Player[]
        ) {
            playersMap.set(
                player.id,
                player,
            );
        }
    }

    const pairsMap = new Map(
        pairs.map(
            (pair) => [
                pair.id,
                pair,
            ],
        ),
    );

    const tournamentsMap = new Map(
        tournaments.map(
            (tournament) => [
                tournament.id,
                tournament,
            ],
        ),
    );

    return registrations.map(
        (registration) => {
            const pair =
                pairsMap.get(
                    registration.pair_id,
                ) ?? null;

            const tournament =
                tournamentsMap.get(
                    registration.tournament_id,
                ) ?? null;

            const categoryId =
                pair?.categoria_id ??
                null;

            const tournamentCategory =
                pair && categoryId
                    ? tournamentCategoryMap.get(
                        `${registration.tournament_id}:${categoryId}`,
                    ) ?? null
                    : null;

            const player =
                pair?.player_1_id
                    ? playersMap.get(
                        pair.player_1_id,
                    ) ?? null
                    : null;

            return withComputedFields(
                registration,
                {
                    pair,
                    player,
                    tournament,
                    tournamentCategory,
                },
            );
        },
    );
}

function normalizePartnerAvailability(
    value: string | null | undefined,
): PartnerAvailability {
    if (
        value === "buscando" ||
        value === "encontrada" ||
        value === "no_busca"
    ) {
        return value;
    }

    return "buscando";
}

/* -------------------------------------------------------------------------- */
/* STATUS HELPERS                                                             */
/* -------------------------------------------------------------------------- */

export function isActiveRegistration(
    estado: RegistrationStatus,
): boolean {
    return isActiveStatus(estado);
}

export function canCancelRegistration(
    estado: RegistrationStatus,
): boolean {
    return estado !== CANCELLED_STATUS;
}

export function isPaymentVerified(
    paymentStatus: PaymentStatus,
): boolean {
    return paymentStatus === "verificado";
}

/* -------------------------------------------------------------------------- */
/* QUERY                                                                      */
/* -------------------------------------------------------------------------- */

export async function getRegistrations(
    filters: RegistrationFilters = {},
): Promise<RegistrationWithRelationsExtended[]> {
    const supabase = await createClient();

    let query = supabase
        .from("registrations")
        .select("*")
        .order(
            "updated_at",
            {
                ascending: false,
            },
        );

    if (filters.tournamentId) {
        query = query.eq(
            "tournament_id",
            filters.tournamentId,
        );
    }

    if (filters.estado) {
        query = query.eq(
            "estado",
            filters.estado,
        );
    }

    if (filters.checkIn !== undefined) {
        query = query.eq(
            "checked_in",
            filters.checkIn,
        );
    }

    if (filters.playerId) {
        const pairIds =
            await getPairIdsForPlayer(
                filters.playerId,
                filters.tournamentId,
            );

        if (pairIds.length === 0) {
            return [];
        }

        query = query.in(
            "pair_id",
            pairIds,
        );
    }

    const {
        data,
        error,
    } = await query;

    if (error) {
        throw new Error(
            `No se pudieron obtener las inscripciones: ${error.message}`,
        );
    }

    const registrations =
        (data ?? []) as Registration[];

    let enriched =
        await enrichRegistrations(
            registrations,
        );

    if (filters.categoryId) {
        enriched =
            enriched.filter(
                (registration) =>
                    registration.categoria_id ===
                    filters.categoryId,
            );
    }

    if (filters.paymentStatus) {
        enriched =
            enriched.filter(
                (registration) =>
                    getPaymentStatus(
                        registration,
                    ) ===
                    filters.paymentStatus,
            );
    }

    return enriched;
}

/* -------------------------------------------------------------------------- */
/* SINGLE REGISTRATION                                                        */
/* -------------------------------------------------------------------------- */

export async function getRegistrationById(
    registrationId: string,
): Promise<RegistrationWithRelationsExtended | null> {
    if (!registrationId) {
        return null;
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("registrations")
        .select("*")
        .eq(
            "id",
            registrationId,
        )
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo obtener la inscripción: ${error.message}`,
        );
    }

    if (!data) {
        return null;
    }

    const enriched =
        await enrichRegistrations([
            data as Registration,
        ]);

    return enriched[0] ?? null;
}

export async function getPlayerRegistration(
    playerId: string,
    tournamentId: string,
): Promise<RegistrationWithRelationsExtended | null> {
    const registrations =
        await getRegistrations({
            playerId,
            tournamentId,
        });

    return registrations[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* DUPLICATE / ELIGIBILITY                                                    */
/* -------------------------------------------------------------------------- */

export async function hasPlayerRegisteredForTournament(
    playerId: string,
    tournamentId: string,
): Promise<boolean> {
    const registration =
        await getPlayerRegistration(
            playerId,
            tournamentId,
        );

    return Boolean(
        registration &&
        isActiveStatus(
            registration.estado,
        ),
    );
}

export async function hasPlayerRegisteredInCategory(
    playerId: string,
    tournamentId: string,
    categoryId: string,
): Promise<boolean> {
    const registrations =
        await getRegistrations({
            playerId,
            tournamentId,
            categoryId,
        });

    return registrations.some(
        (registration) =>
            isActiveStatus(
                registration.estado,
            ),
    );
}

/**
 * A player cannot participate in two categories in the same tournament.
 */
export async function validatePlayerTournamentEligibility(
    playerId: string,
    tournamentId: string,
): Promise<{
    eligible: boolean;
    reason?: string;
}> {
    if (!playerId || !tournamentId) {
        return {
            eligible: false,
            reason:
                "Jugador y torneo son obligatorios.",
        };
    }

    const supabase =
        await createClient();

    const {
        data: player,
        error: playerError,
    } = await supabase
        .from("players")
        .select(
            "id, estado, onboarding_completado",
        )
        .eq(
            "id",
            playerId,
        )
        .maybeSingle();

    if (playerError) {
        throw new Error(
            `No se pudo comprobar el jugador: ${playerError.message}`,
        );
    }

    if (!player) {
        return {
            eligible: false,
            reason:
                "El jugador no existe.",
        };
    }

    if (player.estado !== "activo") {
        return {
            eligible: false,
            reason:
                "El jugador no está activo.",
        };
    }

    if (!player.onboarding_completado) {
        return {
            eligible: false,
            reason:
                "El perfil del jugador no está completado.",
        };
    }

    const alreadyRegistered =
        await hasPlayerRegisteredForTournament(
            playerId,
            tournamentId,
        );

    if (alreadyRegistered) {
        return {
            eligible: false,
            reason:
                "El jugador ya está inscrito en este torneo.",
        };
    }

    return {
        eligible: true,
    };
}

/* -------------------------------------------------------------------------- */
/* CAPACITY                                                                   */
/* -------------------------------------------------------------------------- */

export async function getRegistrationCapacity(
    tournamentId: string,
    categoryId: string,
): Promise<RegistrationCapacity> {
    assertId(
        tournamentId,
        "tournamentId",
    );

    assertId(
        categoryId,
        "categoryId",
    );

    const supabase =
        await createClient();

    const {
        data: tournamentCategory,
        error: categoryError,
    } = await supabase
        .from("tournament_categories")
        .select("*")
        .eq(
            "tournament_id",
            tournamentId,
        )
        .eq(
            "categoria_id",
            categoryId,
        )
        .maybeSingle();

    if (categoryError) {
        throw new Error(
            `No se pudo obtener la capacidad de la categoría: ${categoryError.message}`,
        );
    }

    if (!tournamentCategory) {
        throw new Error(
            "La categoría no está configurada para este torneo.",
        );
    }

    const {
        data: pairs,
        error: pairsError,
    } = await supabase
        .from("pairs")
        .select(
            "id, estado, player_1_id, player_2_id",
        )
        .eq(
            "tournament_id",
            tournamentId,
        )
        .eq(
            "categoria_id",
            categoryId,
        );

    if (pairsError) {
        throw new Error(
            `No se pudieron obtener las parejas de la categoría: ${pairsError.message}`,
        );
    }

    const allPairs =
        pairs ?? [];

    const capacityPairs =
        allPairs.filter(
            (pair) =>
                (
                    pair.estado ===
                    "confirmada" ||
                    pair.estado ===
                    "pendiente_pago"
                ) &&
                pair.player_1_id !== null &&
                pair.player_2_id !== null,
        );

    const capacityPairIds =
        new Set(
            capacityPairs.map(
                (pair) =>
                    pair.id,
            ),
        );

    const pairIds =
        allPairs.map(
            (pair) =>
                pair.id,
        );

    if (pairIds.length === 0) {
        return {
            tournamentId,
            categoryId,
            maxCapacity:
                tournamentCategory.cupo_maximo,
            confirmed: 0,
            pendingPayment: 0,
            waitingList: 0,
            available:
                tournamentCategory.cupo_maximo,
            isFull:
                tournamentCategory.cupo_maximo ===
                0,
        };
    }

    const {
        data: registrations,
        error,
    } = await supabase
        .from("registrations")
        .select(
            "estado, pair_id",
        )
        .in(
            "pair_id",
            pairIds,
        );

    if (error) {
        throw new Error(
            `No se pudieron obtener las inscripciones de la categoría: ${error.message}`,
        );
    }

    const active =
        registrations ?? [];

    const reservations =
        active.filter(
            (item) =>
                capacityPairIds.has(
                    item.pair_id,
                ) &&
                (
                    item.estado ===
                    "confirmada" ||
                    item.estado ===
                    "pendiente_pago"
                ),
        );

    const confirmed =
        reservations.filter(
            (item) =>
                item.estado ===
                "confirmada",
        ).length;

    const pendingPayment =
        reservations.filter(
            (item) =>
                item.estado ===
                "pendiente_pago",
        ).length;

    const waitingList =
        active.filter(
            (item) =>
                item.estado ===
                "lista_espera",
        ).length;

    const maxCapacity =
        tournamentCategory.cupo_maximo;

    const occupied =
        confirmed +
        pendingPayment;

    const available =
        maxCapacity === null
            ? null
            : Math.max(
                0,
                maxCapacity -
                occupied,
            );

    return {
        tournamentId,
        categoryId,
        maxCapacity,
        confirmed,
        pendingPayment,
        waitingList,
        available,
        isFull:
            maxCapacity !== null &&
            available === 0,
    };
}

/* -------------------------------------------------------------------------- */
/* PARTNER POOL                                                               */
/* -------------------------------------------------------------------------- */

export async function addPlayerToPartnerPool(
    input: {
        playerId: string;
        tournamentId: string;
        categoryId: string;
        availability?:
        | PartnerAvailability
        | null;
    },
): Promise<void> {
    assertId(
        input.playerId,
        "playerId",
    );

    assertId(
        input.tournamentId,
        "tournamentId",
    );

    assertId(
        input.categoryId,
        "categoryId",
    );

    const supabase =
        await createClient();

    const {
        data: existing,
        error: existingError,
    } = await supabase
        .from("partner_pool")
        .select("id")
        .eq(
            "player_id",
            input.playerId,
        )
        .eq(
            "tournament_id",
            input.tournamentId,
        )
        .eq(
            "categoria_id",
            input.categoryId,
        )
        .maybeSingle();

    if (existingError) {
        throw new Error(
            `No se pudo comprobar la bolsa de parejas: ${existingError.message}`,
        );
    }

    if (existing) {
        return;
    }

    /**
     * The database stores a boolean availability flag.
     * The richer domain availability value is intentionally kept at the
     * service boundary and normalized to "available" here.
     */
    const { error } =
        await supabase
            .from("partner_pool")
            .insert({
                player_id:
                    input.playerId,
                tournament_id:
                    input.tournamentId,
                categoria_id:
                    input.categoryId,
                disponible: true,
                disponibilidad:
                    input.availability ??
                    "buscando",
            });

    if (error) {
        throw new Error(
            `No se pudo añadir al jugador a la bolsa de parejas: ${error.message}`,
        );
    }
}

export async function removePlayerFromPartnerPool(
    playerId: string,
    tournamentId: string,
    categoryId: string,
): Promise<void> {
    const supabase =
        await createClient();

    const {
        error,
    } = await supabase
        .from("partner_pool")
        .delete()
        .eq(
            "player_id",
            playerId,
        )
        .eq(
            "tournament_id",
            tournamentId,
        )
        .eq(
            "categoria_id",
            categoryId,
        );

    if (error) {
        throw new Error(
            `No se pudo retirar al jugador de la bolsa de parejas: ${error.message}`,
        );
    }
}

export async function getPartnerPool(
    tournamentId: string,
    categoryId: string,
): Promise<
    Array<{
        id: string;
        playerId: string;
        player: Player | null;
        availability: PartnerAvailability;
    }>
> {
    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("partner_pool")
        .select(
            `
            id,
            player_id,
            disponible,
            disponibilidad,
            fecha_publicacion
        `,
        )
        .eq(
            "tournament_id",
            tournamentId,
        )
        .eq(
            "categoria_id",
            categoryId,
        )
        .eq(
            "disponible",
            true,
        )
        .order(
            "fecha_publicacion",
            {
                ascending: true,
            },
        );

    if (error) {
        throw new Error(
            `No se pudo obtener la bolsa de parejas: ${error.message}`,
        );
    }

    const playerIds =
        (data ?? []).map(
            (item) =>
                item.player_id,
        );

    const playersMap =
        new Map<string, Player>();

    if (playerIds.length > 0) {
        const {
            data: players,
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
                `No se pudieron obtener los jugadores de la bolsa de parejas: ${playersError.message}`,
            );
        }

        for (
            const player of
            (players ?? []) as Player[]
        ) {
            playersMap.set(
                player.id,
                player,
            );
        }
    }

    return (data ?? []).map(
        (item) => ({
            id: item.id,
            playerId: item.player_id,
            player:
                playersMap.get(
                    item.player_id,
                ) ?? null,
            availability:
                normalizePartnerAvailability(
                    item.disponibilidad,
                ),
        }),
    );
}

/* -------------------------------------------------------------------------- */
/* PAIR CREATION                                                              */
/* -------------------------------------------------------------------------- */

export async function createIncompletePair(
    input: {
        tournamentId: string;
        categoryId: string;
        playerId: string;
    },
): Promise<Pair> {
    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("pairs")
        .insert({
            tournament_id:
                input.tournamentId,
            categoria_id:
                input.categoryId,
            player_1_id:
                input.playerId,
            player_2_id:
                null,
            estado:
                "incompleta",
            cabeza_de_serie:
                false,
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear la pareja: ${error.message}`,
        );
    }

    return data as Pair;
}

export async function createCompletePair(
    input: {
        tournamentId: string;
        categoryId: string;
        player1Id: string;
        player2Id: string;
    },
): Promise<Pair> {
    if (
        input.player1Id ===
        input.player2Id
    ) {
        throw new Error(
            "Un jugador no puede formar pareja consigo mismo.",
        );
    }

    await validatePairPlayers(
        input.tournamentId,
        input.player1Id,
        input.player2Id,
    );

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("pairs")
        .insert({
            tournament_id:
                input.tournamentId,
            categoria_id:
                input.categoryId,
            player_1_id:
                input.player1Id,
            player_2_id:
                input.player2Id,
            estado:
                "pendiente_pago",
            cabeza_de_serie:
                false,
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear la pareja: ${error.message}`,
        );
    }

    return data as Pair;
}

export async function completePair(
    input: CompleteRegistrationInput,
): Promise<Pair> {
    assertId(
        input.registrationId,
        "registrationId",
    );

    assertId(
        input.partnerId,
        "partnerId",
    );

    const registration =
        await getRegistrationById(
            input.registrationId,
        );

    if (!registration) {
        throw new Error(
            "La inscripción no existe.",
        );
    }

    const pair =
        registration.pair;

    if (!pair) {
        throw new Error(
            "No se pudo obtener la pareja.",
        );
    }

    if (
        pair.player_2_id &&
        pair.player_2_id !==
        input.partnerId
    ) {
        throw new Error(
            "La pareja ya está completa.",
        );
    }

    if (
        pair.player_1_id ===
        input.partnerId
    ) {
        throw new Error(
            "El jugador ya pertenece a la pareja.",
        );
    }

    if (!pair.player_1_id) {
        throw new Error(
            "La pareja no tiene un jugador principal válido.",
        );
    }

    if (
        pair.estado !==
        "incompleta"
    ) {
        throw new Error(
            "Esta pareja ya no está disponible para completarse.",
        );
    }

    await validatePairPlayers(
        pair.tournament_id,
        pair.player_1_id,
        input.partnerId,
    );

    const supabase =
        await createClient();

    /*
     * El Partner Pool se reclama mediante una función PostgreSQL SECURITY
     * DEFINER para que la operación sea atómica y pueda retirar del pool a
     * un jugador distinto del usuario que está completando la pareja.
     *
     * No hacemos primero un UPDATE de pairs y después un DELETE de
     * partner_pool porque dos usuarios podrían intentar seleccionar al mismo
     * jugador simultáneamente.
     *
     * La función de BD hace ambas operaciones dentro de una única transacción
     * y solamente uno de los intentos puede reclamar la entrada.
     *
     * El tipo generado de Supabase puede no contener todavía este RPC.
     * Por eso el estrechamiento está limitado exclusivamente a esta llamada.
     */
    const rpc =
        supabase.rpc as unknown as (
            functionName: string,
            args: {
                p_pair_id: string;
                p_partner_id: string;
            },
        ) => Promise<{
            data: unknown;
            error:
            | {
                message: string;
            }
            | null;
        }>;

    const {
        data: claimedData,
        error: claimError,
    } = await rpc(
        "claim_partner_pool_for_pair",
        {
            p_pair_id:
                pair.id,
            p_partner_id:
                input.partnerId,
        },
    );

    if (claimError) {
        throw new Error(
            claimError.message,
        );
    }

    const claimedPair =
        Array.isArray(
            claimedData,
        )
            ? claimedData[0]
            : claimedData;

    if (!claimedPair) {
        throw new Error(
            "El jugador seleccionado ya no está disponible en el Partner Pool.",
        );
    }

    return claimedPair as Pair;
}

/* -------------------------------------------------------------------------- */
/* CREATE REGISTRATION                                                        */
/* -------------------------------------------------------------------------- */

export async function createIndividualRegistration(
    input: CreateIndividualRegistrationInput,
): Promise<Registration> {
    const eligibility =
        await validatePlayerTournamentEligibility(
            input.playerId,
            input.tournamentId,
        );

    if (!eligibility.eligible) {
        throw new Error(
            eligibility.reason ??
            "El jugador no puede inscribirse.",
        );
    }

    if (input.partnerId) {
        if (input.partnerId === input.playerId) {
            throw new Error(
                "Un jugador no puede formar pareja consigo mismo.",
            );
        }

        const partnerEligibility =
            await validatePlayerTournamentEligibility(
                input.partnerId,
                input.tournamentId,
            );

        if (!partnerEligibility.eligible) {
            throw new Error(
                partnerEligibility.reason ??
                "El jugador seleccionado como pareja no puede participar.",
            );
        }
    }

    const supabase = await createClient();

    /*
     * La creación de pareja + inscripción + decisión de capacidad se ejecuta
     * en registrar_pareja dentro de una única transacción PostgreSQL.
     * No calculamos aquí el estado final porque una lectura previa no protege
     * contra dos inscripciones concurrentes.
     */
    const rpc = supabase.rpc as unknown as (
        functionName: string,
        args: {
            p_tournament_id: string;
            p_categoria_id: string;
            p_player_1_id: string;
            p_player_2_id: string | null;
            p_talla_camiseta: string | null;
        },
    ) => Promise<{
        data: unknown;
        error: { message: string } | null;
    }>;

    const { data: result, error: rpcError } = await rpc(
        "registrar_pareja",
        {
            p_tournament_id: input.tournamentId,
            p_categoria_id: input.categoryId,
            p_player_1_id: input.playerId,
            p_player_2_id: input.partnerId ?? null,
            p_talla_camiseta: input.shirtSize ?? null,
        },
    );

    if (rpcError) {
        throw new Error(
            `No se pudo crear la inscripción: ${rpcError.message}`,
        );
    }

    const rpcRow = Array.isArray(result)
        ? result[0] as { pair_id?: string; estado_final?: string } | undefined
        : result as { pair_id?: string; estado_final?: string } | null;

    if (!rpcRow?.pair_id) {
        throw new Error(
            "La operación de inscripción no devolvió una pareja válida.",
        );
    }

    const { data: registrationData, error: registrationError } = await supabase
        .from("registrations")
        .select("*")
        .eq("pair_id", rpcRow.pair_id)
        .eq("tournament_id", input.tournamentId)
        .maybeSingle();

    if (registrationError) {
        throw new Error(
            `La pareja se creó, pero no se pudo recuperar la inscripción: ${registrationError.message}`,
        );
    }

    if (!registrationData) {
        throw new Error(
            "La pareja se creó, pero no se encontró su inscripción.",
        );
    }

    if (
        input.partnerSearch &&
        !input.partnerId
    ) {
        await addPlayerToPartnerPool({
            playerId: input.playerId,
            tournamentId: input.tournamentId,
            categoryId: input.categoryId,
            availability: "buscando",
        });
    }

    return registrationData as Registration;
}

/* -------------------------------------------------------------------------- */
/* UPDATE STATUS                                                              */
/* -------------------------------------------------------------------------- */

export async function updateRegistrationStatus(
    registrationId: string,
    status: RegistrationStatus,
): Promise<Registration> {
    assertId(
        registrationId,
        "registrationId",
    );

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("registrations")
        .update({
            estado: status,
        })
        .eq(
            "id",
            registrationId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar el estado de la inscripción: ${error.message}`,
        );
    }

    return data as Registration;
}

/* -------------------------------------------------------------------------- */
/* PAYMENT                                                                    */
/* -------------------------------------------------------------------------- */

export async function markPaymentPending(
    registrationId: string,
): Promise<Registration> {
    assertId(
        registrationId,
        "registrationId",
    );

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("registrations")
        .update({
            fecha_pago: null,
        })
        .eq(
            "id",
            registrationId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo marcar el pago como pendiente: ${error.message}`,
        );
    }

    return data as Registration;
}

export async function verifyPayment(
    input: VerifyPaymentInput,
): Promise<Registration> {
    assertId(
        input.registrationId,
        "registrationId",
    );

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("registrations")
        .update({
            metodo_pago: input.method,
            importe: input.amount ?? null,
            fecha_pago:
                input.paymentDate ??
                new Date().toISOString(),
        })
        .eq(
            "id",
            input.registrationId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo verificar el pago: ${error.message}`,
        );
    }

    return data as Registration;
}

/* -------------------------------------------------------------------------- */
/* CHECK-IN                                                                   */
/* -------------------------------------------------------------------------- */

export async function markRegistrationCheckedIn(
    registrationId: string,
    checkedIn = true,
): Promise<Registration> {
    assertId(
        registrationId,
        "registrationId",
    );

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("registrations")
        .update({
            checked_in: checkedIn,
        })
        .eq(
            "id",
            registrationId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar el check-in: ${error.message}`,
        );
    }

    return data as Registration;
}

/* -------------------------------------------------------------------------- */
/* CANCELLATION                                                               */
/* -------------------------------------------------------------------------- */

export async function cancelRegistration(
    registrationId: string,
): Promise<Registration> {
    assertId(
        registrationId,
        "registrationId",
    );

    const supabase =
        await createClient();

    const {
        error,
    } = await supabase.rpc(
        "admin_cancel_registration",
        {
            p_registration_id:
                registrationId,
        },
    );

    if (error) {
        throw new Error(
            `No se pudo cancelar la inscripcion: ${error.message}`,
        );
    }

    const registration =
        await getRegistrationById(
            registrationId,
        );

    if (!registration) {
        throw new Error(
            "La inscripcion se cancelo, pero no se pudo volver a consultar.",
        );
    }

    return registration;
}

/* -------------------------------------------------------------------------- */
/* WAITING LIST                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Automatic or non-transactional wait-list promotion is intentionally not
 * exposed. Admin promotion runs through admin_promote_waiting_registration,
 * which serializes capacity checks and requires an explicit selected entry.
 */

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

export async function getRegistrationSummary(
    tournamentId: string,
    categoryId?: string,
): Promise<RegistrationSummary> {
    const registrations =
        await getRegistrations({
            tournamentId,
            categoryId,
        });

    return {
        tournamentId,
        categoryId:
            categoryId ?? null,

        total:
            registrations.length,

        confirmed:
            registrations.filter(
                (registration) =>
                    registration.estado ===
                    "confirmada",
            ).length,

        pendingPayment:
            registrations.filter(
                (registration) =>
                    registration.estado ===
                    "pendiente_pago",
            ).length,

        waitingList:
            registrations.filter(
                (registration) =>
                    registration.estado ===
                    "lista_espera",
            ).length,

        cancelled:
            registrations.filter(
                (registration) =>
                    registration.estado ===
                    CANCELLED_STATUS,
            ).length,

        paid:
            registrations.filter(
                (registration) =>
                    getPaymentStatus(
                        registration,
                    ) ===
                    "verificado",
            ).length,

        checkedIn:
            registrations.filter(
                (registration) =>
                    registration.checked_in,
            ).length,
    };
}

/* -------------------------------------------------------------------------- */
/* QR                                                                         */
/* -------------------------------------------------------------------------- */

export async function getRegistrationByQrCode(
    qrCode: string,
): Promise<RegistrationWithRelationsExtended | null> {
    if (!qrCode.trim()) {
        return null;
    }

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("registrations")
        .select("*")
        .eq(
            "qr_code",
            qrCode.trim(),
        )
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo buscar el QR de la inscripción: ${error.message}`,
        );
    }

    if (!data) {
        return null;
    }

    const enriched =
        await enrichRegistrations([
            data as Registration,
        ]);

    return enriched[0] ?? null;
}

export async function generateRegistrationQr(
    registrationId: string,
): Promise<Registration> {
    const registration =
        await getRegistrationById(
            registrationId,
        );

    if (!registration) {
        throw new Error(
            "La inscripción no existe.",
        );
    }

    if (registration.qr_code) {
        return registration;
    }

    const token =
        `SPC-${registration.id}-${crypto.randomUUID()}`;

    const supabase =
        await createClient();

    const {
        data,
        error,
    } = await supabase
        .from("registrations")
        .update({
            qr_code:
                token,
        })
        .eq(
            "id",
            registrationId,
        )
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo generar el QR de la inscripción: ${error.message}`,
        );
    }

    return data as Registration;
}

/* -------------------------------------------------------------------------- */
/* PAIR SAFETY                                                                */
/* -------------------------------------------------------------------------- */

export async function validatePairPlayers(
    tournamentId: string,
    player1Id: string,
    player2Id?: string | null,
): Promise<void> {
    assertId(
        tournamentId,
        "tournamentId",
    );

    assertId(
        player1Id,
        "player1Id",
    );

    const playerIds = [
        player1Id,
        player2Id,
    ].filter(
        (
            id,
        ): id is string =>
            Boolean(id),
    );

    if (
        new Set(
            playerIds,
        ).size !==
        playerIds.length
    ) {
        throw new Error(
            "Una pareja no puede contener el mismo jugador dos veces.",
        );
    }

    const supabase =
        await createClient();

    for (
        const playerId of
        playerIds
    ) {
        const {
            data: pairs,
            error,
        } = await supabase
            .from("pairs")
            .select(
                "id, estado, tournament_id",
            )
            .eq(
                "tournament_id",
                tournamentId,
            )
            .or(
                [
                    `player_1_id.eq.${playerId}`,
                    `player_2_id.eq.${playerId}`,
                ].join(","),
            );

        if (error) {
            throw new Error(
                `No se pudo comprobar la disponibilidad del jugador: ${error.message}`,
            );
        }

        const activePair =
            (pairs ?? []).find(
                (pair) =>
                    pair.estado !==
                    "incompleta",
            );

        if (activePair) {
            throw new Error(
                "Uno de los jugadores ya pertenece a una pareja activa en este torneo.",
            );
        }
    }
}

/* -------------------------------------------------------------------------- */
/* ADMIN OVERRIDE                                                             */
/* -------------------------------------------------------------------------- */

export async function adminConfirmRegistration(
    registrationId: string,
): Promise<Registration> {
    const registration =
        await getRegistrationById(
            registrationId,
        );

    if (!registration) {
        throw new Error(
            "La inscripción no existe.",
        );
    }

    if (
        registration.estado ===
        CANCELLED_STATUS
    ) {
        throw new Error(
            "No se puede confirmar una inscripción cancelada.",
        );
    }

    if (
        !registration.pair?.player_1_id ||
        !registration.pair?.player_2_id
    ) {
        throw new Error(
            "No se puede confirmar una inscripción con la pareja incompleta.",
        );
    }

    const paymentStatus =
        registration.payment_status ??
        getPaymentStatus(
            registration,
        );

    if (
        paymentStatus !==
        "verificado" &&
        paymentStatus !==
        "no_aplicable"
    ) {
        throw new Error(
            "El pago debe estar verificado antes de confirmar la inscripción.",
        );
    }

    return updateRegistrationStatus(
        registrationId,
        "confirmada",
    );
}

/* -------------------------------------------------------------------------- */
/* FLOW STATE                                                                 */
/* -------------------------------------------------------------------------- */

export function getRegistrationFlowState(
    registration: RegistrationWithRelationsExtended,
): RegistrationFlowState {
    const pair =
        registration.pair;

    const hasPartner =
        Boolean(
            pair?.player_1_id &&
            pair?.player_2_id,
        );

    const paymentStatus =
        registration.payment_status ??
        getPaymentStatus(
            registration,
        );

    return {
        registrationId:
            registration.id,

        hasPartner,

        registrationStatus:
            registration.estado,

        paymentStatus,

        paymentVerified:
            paymentStatus ===
            "verificado",

        checkedIn:
            registration.checked_in,

        canCompletePair:
            !hasPartner &&
            registration.estado !==
            CANCELLED_STATUS,

        canCancel:
            canCancelRegistration(
                registration.estado,
            ),
    };
}

export async function verifyRegistrationPayment(
    input: VerifyPaymentInput,
): Promise<Registration> {
    assertId(input.registrationId, "registrationId");

    const registration = await getRegistrationById(
        input.registrationId,
    );

    if (!registration) {
        throw new Error("La inscripción no existe.");
    }

    if (registration.estado === CANCELLED_STATUS) {
        throw new Error(
            "No se puede verificar el pago de una inscripción cancelada.",
        );
    }

    if (
        input.amount !== undefined &&
        input.amount !== null &&
        (
            !Number.isFinite(input.amount) ||
            input.amount < 0
        )
    ) {
        throw new Error("El importe del pago no es válido.");
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .update({
            metodo_pago: input.method,
            fecha_pago:
                input.paymentDate ??
                new Date().toISOString(),
            importe: input.amount ?? null,
            payment_status: "verificado",
        })
        .eq("id", input.registrationId)
        .neq("estado", CANCELLED_STATUS)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo verificar el pago: ${error.message}`,
        );
    }

    return data as Registration;
}