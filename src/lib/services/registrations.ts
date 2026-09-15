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
    | "no_requerido";

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
    registration: Pick<Registration, "fecha_pago" | "metodo_pago">,
): PaymentStatus {
    if (registration.fecha_pago) {
        return "verificado";
    }

    if (!registration.metodo_pago) {
        return "pendiente";
    }

    return "pendiente";
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
        ...(categoryId ? { categoria_id: categoryId } : {}),
        payment_status: getPaymentStatus(registration),
        pair: relations?.pair ?? null,
        player: relations?.player ?? null,
        tournament: relations?.tournament ?? null,
        tournamentCategory:
            relations?.tournamentCategory ?? null,
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
        query = query.eq("tournament_id", tournamentId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(
            `No se pudieron buscar las parejas del jugador: ${error.message}`,
        );
    }

    return (data ?? []).map((pair) => pair.id);
}

async function getRegistrationCategoryIds(
    registrations: Registration[],
): Promise<Map<string, string>> {
    const pairIds = Array.from(
        new Set(
            registrations
                .map((registration) => registration.pair_id)
                .filter(Boolean),
        ),
    );

    if (pairIds.length === 0) {
        return new Map();
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("pairs")
        .select("id, categoria_id")
        .in("id", pairIds);

    if (error) {
        throw new Error(
            `No se pudieron obtener las categorías de las parejas: ${error.message}`,
        );
    }

    return new Map(
        (data ?? []).map((pair) => [
            pair.id,
            pair.categoria_id,
        ]),
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
                .map((registration) => registration.pair_id)
                .filter(Boolean),
        ),
    );

    const tournamentIds = Array.from(
        new Set(
            registrations
                .map((registration) => registration.tournament_id)
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
            : Promise.resolve({ data: [], error: null }),

        tournamentIds.length > 0
            ? supabase
                .from("tournaments")
                .select("*")
                .in("id", tournamentIds)
            : Promise.resolve({ data: [], error: null }),
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

    const pairs = (pairsResult.data ?? []) as Pair[];
    const tournaments =
        (tournamentsResult.data ?? []) as Tournament[];

    const categoryIds = Array.from(
        new Set(pairs.map((pair) => pair.categoria_id)),
    );

    const tournamentCategoryMap = new Map<string, TournamentCategory>();

    if (categoryIds.length > 0 && tournamentIds.length > 0) {
        const { data, error } = await supabase
            .from("tournament_categories")
            .select("*")
            .in("tournament_id", tournamentIds)
            .in("categoria_id", categoryIds);

        if (error) {
            throw new Error(
                `No se pudieron obtener las configuraciones de categoría: ${error.message}`,
            );
        }

        for (const item of (data ?? []) as TournamentCategory[]) {
            tournamentCategoryMap.set(
                `${item.tournament_id}:${item.categoria_id}`,
                item,
            );
        }
    }

    const playerIds = Array.from(
        new Set(
            pairs.flatMap((pair) =>
                [pair.player_1_id, pair.player_2_id].filter(
                    (id): id is string => Boolean(id),
                ),
            ),
        ),
    );

    const playersMap = new Map<string, Player>();

    if (playerIds.length > 0) {
        const { data, error } = await supabase
            .from("players")
            .select("*")
            .in("id", playerIds);

        if (error) {
            throw new Error(
                `No se pudieron obtener los jugadores: ${error.message}`,
            );
        }

        for (const player of (data ?? []) as Player[]) {
            playersMap.set(player.id, player);
        }
    }

    const pairsMap = new Map(
        pairs.map((pair) => [pair.id, pair]),
    );

    const tournamentsMap = new Map(
        tournaments.map((tournament) => [
            tournament.id,
            tournament,
        ]),
    );

    return registrations.map((registration) => {
        const pair = pairsMap.get(registration.pair_id) ?? null;
        const tournament =
            tournamentsMap.get(registration.tournament_id) ?? null;

        const categoryId = pair?.categoria_id ?? null;

        const tournamentCategory =
            pair && categoryId
                ? tournamentCategoryMap.get(
                    `${registration.tournament_id}:${categoryId}`,
                ) ?? null
                : null;

        const player =
            pair?.player_1_id
                ? playersMap.get(pair.player_1_id) ?? null
                : null;

        return withComputedFields(registration, {
            pair,
            player,
            tournament,
            tournamentCategory,
        });
    });
}

function normalizePartnerAvailability(
    value: PartnerAvailability | null | undefined,
): PartnerAvailability {
    if (value && PARTNER_POOL_AVAILABILITY.includes(value)) {
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
        .order("created_at", {
            ascending: false,
        });

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
        const pairIds = await getPairIdsForPlayer(
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

    const { data, error } = await query;

    if (error) {
        throw new Error(
            `No se pudieron obtener las inscripciones: ${error.message}`,
        );
    }

    const registrations =
        (data ?? []) as Registration[];

    let enriched = await enrichRegistrations(
        registrations,
    );

    if (filters.categoryId) {
        enriched = enriched.filter(
            (registration) =>
                registration.categoria_id ===
                filters.categoryId,
        );
    }

    if (filters.paymentStatus) {
        enriched = enriched.filter(
            (registration) =>
                getPaymentStatus(registration) ===
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

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("id", registrationId)
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo obtener la inscripción: ${error.message}`,
        );
    }

    if (!data) {
        return null;
    }

    const enriched = await enrichRegistrations([
        data as Registration,
    ]);

    return enriched[0] ?? null;
}

export async function getPlayerRegistration(
    playerId: string,
    tournamentId: string,
): Promise<RegistrationWithRelationsExtended | null> {
    const registrations = await getRegistrations({
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
        isActiveStatus(registration.estado),
    );
}

export async function hasPlayerRegisteredInCategory(
    playerId: string,
    tournamentId: string,
    categoryId: string,
): Promise<boolean> {
    const registrations = await getRegistrations({
        playerId,
        tournamentId,
        categoryId,
    });

    return registrations.some((registration) =>
        isActiveStatus(registration.estado),
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

    const supabase = await createClient();

    const { data: player, error: playerError } =
        await supabase
            .from("players")
            .select("id, estado, onboarding_completado")
            .eq("id", playerId)
            .maybeSingle();

    if (playerError) {
        throw new Error(
            `No se pudo comprobar el jugador: ${playerError.message}`,
        );
    }

    if (!player) {
        return {
            eligible: false,
            reason: "El jugador no existe.",
        };
    }

    if (player.estado !== "activo") {
        return {
            eligible: false,
            reason: "El jugador no está activo.",
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

    return { eligible: true };
}

/* -------------------------------------------------------------------------- */
/* CAPACITY                                                                   */
/* -------------------------------------------------------------------------- */

export async function getRegistrationCapacity(
    tournamentId: string,
    categoryId: string,
): Promise<RegistrationCapacity> {
    assertId(tournamentId, "tournamentId");
    assertId(categoryId, "categoryId");

    const supabase = await createClient();

    const {
        data: tournamentCategory,
        error: categoryError,
    } = await supabase
        .from("tournament_categories")
        .select("*")
        .eq("tournament_id", tournamentId)
        .eq("categoria_id", categoryId)
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

    const { data: pairs, error: pairsError } =
        await supabase
            .from("pairs")
            .select("id")
            .eq("tournament_id", tournamentId)
            .eq("categoria_id", categoryId);

    if (pairsError) {
        throw new Error(
            `No se pudieron obtener las parejas de la categoría: ${pairsError.message}`,
        );
    }

    const pairIds = (pairs ?? []).map(
        (pair) => pair.id,
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
                tournamentCategory.cupo_maximo === 0,
        };
    }

    const { data: registrations, error } =
        await supabase
            .from("registrations")
            .select("estado, pair_id")
            .in("pair_id", pairIds);

    if (error) {
        throw new Error(
            `No se pudieron obtener las inscripciones de la categoría: ${error.message}`,
        );
    }

    const active =
        registrations ?? [];

    const confirmed = active.filter(
        (item) =>
            item.estado === "confirmada",
    ).length;

    const pendingPayment = active.filter(
        (item) =>
            item.estado === "pendiente_pago",
    ).length;

    const waitingList = active.filter(
        (item) =>
            item.estado === "lista_espera",
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
                maxCapacity - occupied,
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
        availability?: PartnerAvailability | null;
    },
): Promise<void> {
    assertId(input.playerId, "playerId");
    assertId(input.tournamentId, "tournamentId");
    assertId(input.categoryId, "categoryId");

    const supabase = await createClient();

    const { data: existing, error: existingError } =
        await supabase
            .from("partner_pool")
            .select("id")
            .eq("player_id", input.playerId)
            .eq("tournament_id", input.tournamentId)
            .eq("categoria_id", input.categoryId)
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
    const { error } = await supabase
        .from("partner_pool")
        .insert({
            player_id: input.playerId,
            tournament_id: input.tournamentId,
            categoria_id: input.categoryId,
            disponible: true,
            disponibilidad: input.availability ?? "buscando",
        });

    if (error) {
        throw new Error(
            `No se pudo añadir el jugador a la bolsa de parejas: ${error.message}`,
        );
    }
}

export async function removePlayerFromPartnerPool(
    playerId: string,
    tournamentId: string,
    categoryId: string,
): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("partner_pool")
        .delete()
        .eq("player_id", playerId)
        .eq("tournament_id", tournamentId)
        .eq("categoria_id", categoryId);

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
    const supabase = await createClient();

    const { data, error } = await supabase
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
        .eq("tournament_id", tournamentId)
        .eq("categoria_id", categoryId)
        .eq("disponible", true)
        .order("fecha_publicacion", {
            ascending: true,
        });

    if (error) {
        throw new Error(
            `No se pudo obtener la bolsa de parejas: ${error.message}`,
        );
    }

    const playerIds = (data ?? []).map(
        (item) => item.player_id,
    );

    const playersMap = new Map<string, Player>();

    if (playerIds.length > 0) {
        const {
            data: players,
            error: playersError,
        } = await supabase
            .from("players")
            .select("*")
            .in("id", playerIds);

        if (playersError) {
            throw new Error(
                `No se pudieron obtener los jugadores de la bolsa de parejas: ${playersError.message}`,
            );
        }

        for (const player of (players ?? []) as Player[]) {
            playersMap.set(player.id, player);
        }
    }

    return (data ?? []).map(
        (item) => ({
            id: item.id,
            playerId: item.player_id,
            player:
                playersMap.get(item.player_id) ??
                null,
            availability:
                normalizePartnerAvailability(
                    item.disponible
                        ? ((item.disponibilidad ?? "buscando") as PartnerAvailability)
                        : "no_busca",
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
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("pairs")
        .insert({
            tournament_id: input.tournamentId,
            categoria_id: input.categoryId,
            player_1_id: input.playerId,
            player_2_id: null,
            estado: "incompleta",
            cabeza_de_serie: false,
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

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("pairs")
        .insert({
            tournament_id: input.tournamentId,
            categoria_id: input.categoryId,
            player_1_id: input.player1Id,
            player_2_id: input.player2Id,
            estado: "pendiente_pago",
            cabeza_de_serie: false,
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
    assertId(input.registrationId, "registrationId");
    assertId(input.partnerId, "partnerId");

    const registration =
        await getRegistrationById(
            input.registrationId,
        );

    if (!registration) {
        throw new Error(
            "La inscripción no existe.",
        );
    }

    const pair = registration.pair;

    if (!pair) {
        throw new Error(
            "No se pudo obtener la pareja.",
        );
    }

    if (
        pair.player_2_id &&
        pair.player_2_id !== input.partnerId
    ) {
        throw new Error(
            "La pareja ya está completa.",
        );
    }

    if (
        pair.player_1_id === input.partnerId
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

    await validatePairPlayers(
        pair.tournament_id,
        pair.player_1_id,
        input.partnerId,
    );

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("pairs")
        .update({
            player_2_id: input.partnerId,
            estado: "pendiente_pago",
        })
        .eq("id", pair.id)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo completar la pareja: ${error.message}`,
        );
    }

    await removePlayerFromPartnerPool(
        input.partnerId,
        pair.tournament_id,
        pair.categoria_id,
    );

    return data as Pair;
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

    const supabase = await createClient();

    const {
        data: tournament,
        error: tournamentError,
    } = await supabase
        .from("tournaments")
        .select("id, estado")
        .eq("id", input.tournamentId)
        .maybeSingle();

    if (tournamentError) {
        throw new Error(
            `No se pudo comprobar el torneo: ${tournamentError.message}`,
        );
    }

    if (!tournament) {
        throw new Error(
            "El torneo no existe.",
        );
    }

    if (
        tournament.estado !==
        "inscripciones_abiertas"
    ) {
        throw new Error(
            "Las inscripciones no están abiertas.",
        );
    }

    const {
        data: tournamentCategory,
        error: categoryError,
    } = await supabase
        .from("tournament_categories")
        .select("*")
        .eq("tournament_id", input.tournamentId)
        .eq("categoria_id", input.categoryId)
        .eq("enabled", true)
        .maybeSingle();

    if (categoryError) {
        throw new Error(
            `No se pudo comprobar la categoría: ${categoryError.message}`,
        );
    }

    if (!tournamentCategory) {
        throw new Error(
            "La categoría no está disponible para este torneo.",
        );
    }

    const capacity =
        await getRegistrationCapacity(
            input.tournamentId,
            input.categoryId,
        );

    const hasSpace =
        capacity.maxCapacity === null ||
        (
            capacity.available !== null &&
            capacity.available > 0
        );

    const registrationStatus: RegistrationStatus =
        hasSpace
            ? "pendiente_pago"
            : "lista_espera";

    if (input.partnerId) {
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

        const pair =
            await createCompletePair({
                tournamentId:
                    input.tournamentId,
                categoryId:
                    input.categoryId,
                player1Id:
                    input.playerId,
                player2Id:
                    input.partnerId,
            });

        return createRegistrationRecord({
            tournamentId:
                input.tournamentId,
            pairId:
                pair.id,
            estado:
                registrationStatus,
            shirtSize:
                input.shirtSize,
        });
    }

    const pair =
        await createIncompletePair({
            tournamentId:
                input.tournamentId,
            categoryId:
                input.categoryId,
            playerId:
                input.playerId,
        });

    const registration =
        await createRegistrationRecord({
            tournamentId:
                input.tournamentId,
            pairId:
                pair.id,
            estado:
                registrationStatus,
            shirtSize:
                input.shirtSize,
        });

    if (input.partnerSearch) {
        await addPlayerToPartnerPool({
            playerId:
                input.playerId,
            tournamentId:
                input.tournamentId,
            categoryId:
                input.categoryId,
        });
    }

    return registration;
}

async function createRegistrationRecord(
    input: {
        tournamentId: string;
        pairId: string;
        estado: RegistrationStatus;
        shirtSize?: string | null;
    },
): Promise<Registration> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .insert({
            tournament_id:
                input.tournamentId,
            pair_id:
                input.pairId,
            estado:
                input.estado,
            metodo_pago:
                "fisico",
            fecha_pago:
                null,
            importe:
                null,
            talla_camiseta:
                input.shirtSize ?? null,
            qr_code:
                null,
            checked_in:
                false,
        })
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo crear la inscripción: ${error.message}`,
        );
    }

    return data as Registration;
}

/* -------------------------------------------------------------------------- */
/* REGISTRATION STATUS                                                        */
/* -------------------------------------------------------------------------- */

export async function updateRegistrationStatus(
    registrationId: string,
    estado: RegistrationStatus,
): Promise<Registration> {
    assertId(registrationId, "registrationId");

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
            "Una inscripción cancelada no puede modificarse desde esta operación.",
        );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .update({
            estado,
        })
        .eq("id", registrationId)
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

/**
 * Records external payment verification.
 *
 * No payment gateway is launched here.
 */
export async function verifyRegistrationPayment(
    input: VerifyPaymentInput,
): Promise<Registration> {
    assertId(
        input.registrationId,
        "registrationId",
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

    if (
        registration.estado ===
        CANCELLED_STATUS
    ) {
        throw new Error(
            "No se puede verificar el pago de una inscripción cancelada.",
        );
    }

    if (
        input.amount !== undefined &&
        input.amount !== null &&
        (
            !Number.isFinite(
                input.amount,
            ) ||
            input.amount < 0
        )
    ) {
        throw new Error(
            "El importe del pago no es válido.",
        );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .update({
            metodo_pago:
                input.method,
            fecha_pago:
                input.paymentDate ??
                new Date().toISOString(),
            importe:
                input.amount ?? null,
            estado:
                "confirmada",
        })
        .eq("id", input.registrationId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo verificar el pago: ${error.message}`,
        );
    }

    return data as Registration;
}

export async function markPaymentPending(
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

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .update({
            fecha_pago: null,
            metodo_pago: "fisico",
        })
        .eq("id", registrationId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo actualizar el estado del pago: ${error.message}`,
        );
    }

    return data as Registration;
}

/* -------------------------------------------------------------------------- */
/* CHECK-IN                                                                   */
/* -------------------------------------------------------------------------- */

export async function checkInRegistration(
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
        registration.estado !==
        "confirmada"
    ) {
        throw new Error(
            "Solo una inscripción confirmada puede hacer check-in.",
        );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .update({
            checked_in: true,
        })
        .eq("id", registrationId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo registrar el check-in: ${error.message}`,
        );
    }

    return data as Registration;
}

export async function undoCheckInRegistration(
    registrationId: string,
): Promise<Registration> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .update({
            checked_in: false,
        })
        .eq("id", registrationId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo revertir el check-in: ${error.message}`,
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
        !canCancelRegistration(
            registration.estado,
        )
    ) {
        throw new Error(
            "La inscripción ya está cancelada.",
        );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .update({
            estado:
                CANCELLED_STATUS,
        })
        .eq("id", registrationId)
        .select("*")
        .single();

    if (error) {
        throw new Error(
            `No se pudo cancelar la inscripción: ${error.message}`,
        );
    }

    const pair = registration.pair;

    if (pair) {
        const playerIds = [
            pair.player_1_id,
            pair.player_2_id,
        ].filter(
            (id): id is string =>
                Boolean(id),
        );

        for (const playerId of playerIds) {
            await removePlayerFromPartnerPool(
                playerId,
                registration.tournament_id,
                pair.categoria_id,
            );
        }
    }

    return data as Registration;
}

/* -------------------------------------------------------------------------- */
/* WAITING LIST                                                               */
/* -------------------------------------------------------------------------- */

export async function promoteFromWaitingList(
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
        registration.estado !==
        "lista_espera"
    ) {
        throw new Error(
            "La inscripción no está en lista de espera.",
        );
    }

    const categoryId =
        registration.categoria_id ??
        registration.pair?.categoria_id;

    if (!categoryId) {
        throw new Error(
            "No se pudo determinar la categoría de la inscripción.",
        );
    }

    const capacity =
        await getRegistrationCapacity(
            registration.tournament_id,
            categoryId,
        );

    if (capacity.isFull) {
        throw new Error(
            "La categoría continúa completa.",
        );
    }

    return updateRegistrationStatus(
        registrationId,
        "pendiente_pago",
    );
}

export async function promoteWaitingList(
    tournamentId: string,
    categoryId: string,
): Promise<Registration[]> {
    const capacity =
        await getRegistrationCapacity(
            tournamentId,
            categoryId,
        );

    if (
        capacity.available === null ||
        capacity.available <= 0
    ) {
        return [];
    }

    const waiting =
        await getRegistrations({
            tournamentId,
            categoryId,
            estado:
                "lista_espera",
        });

    const amount =
        Math.min(
            capacity.available,
            waiting.length,
        );

    const promoted: Registration[] = [];

    for (
        let index = 0;
        index < amount;
        index += 1
    ) {
        const registration =
            await promoteFromWaitingList(
                waiting[index].id,
            );

        promoted.push(registration);
    }

    return promoted;
}

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
/* QR                                                                        */
/* -------------------------------------------------------------------------- */

export async function getRegistrationByQrCode(
    qrCode: string,
): Promise<RegistrationWithRelationsExtended | null> {
    if (!qrCode.trim()) {
        return null;
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .eq("qr_code", qrCode.trim())
        .maybeSingle();

    if (error) {
        throw new Error(
            `No se pudo buscar el QR de la inscripción: ${error.message}`,
        );
    }

    if (!data) {
        return null;
    }

    const enriched = await enrichRegistrations([
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

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("registrations")
        .update({
            qr_code: token,
        })
        .eq("id", registrationId)
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
    assertId(tournamentId, "tournamentId");
    assertId(player1Id, "player1Id");

    const playerIds = [
        player1Id,
        player2Id,
    ].filter(
        (id): id is string =>
            Boolean(id),
    );

    if (
        new Set(playerIds).size !==
        playerIds.length
    ) {
        throw new Error(
            "Una pareja no puede contener el mismo jugador dos veces.",
        );
    }

    const supabase = await createClient();

    for (const playerId of playerIds) {
        const { data: pairs, error } =
            await supabase
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
    const pair = registration.pair;

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
