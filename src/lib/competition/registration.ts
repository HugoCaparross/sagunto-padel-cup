// src/lib/competition/registration.ts

import type {
    Pair,
    Registration,
} from "@/types/database";

import {
    PAYMENT_METHODS,
    PAYMENT_STATUSES,
    REGISTRATION_STATUSES,
} from "@/lib/constants";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type RegistrationStatus =
    (typeof REGISTRATION_STATUSES)[number];

export type PaymentStatus =
    (typeof PAYMENT_STATUSES)[number];

export type PaymentMethod =
    (typeof PAYMENT_METHODS)[number];

export type PartnerAvailability =
    | "buscando"
    | "encontrada"
    | "no_busca";

export type PartnerSelection =
    | {
        type: "existing";
        partnerId: string;
    }
    | {
        type: "pool";
        poolEntryId: string;
    }
    | {
        type: "none";
    };

export type RegistrationInput = {
    tournamentId: string;
    categoryId: string;
    playerId: string;

    partnerSelection: PartnerSelection;

    shirtSize?: string | null;
};

export type RegistrationValidation = {
    valid: boolean;
    errors: string[];
    warnings: string[];
};

export type PaymentVerificationInput = {
    registrationId: string;

    paymentMethod: PaymentMethod;

    amount?: number | null;

    paymentDate?: string | null;

    notes?: string | null;
};

export type CheckInInput = {
    registrationId: string;
    checkedIn: boolean;
};

export type CapacityState = {
    capacity: number | null;
    confirmed: number;
    waitingList: number;
    available: number | null;
    isFull: boolean;
};

/**
 * Datos mínimos necesarios para comprobar conflictos de inscripción.
 *
 * `categoria_id` no forma parte de la tabla `registrations`; la categoría
 * pertenece a la pareja (`pairs.categoria_id`). Por eso este tipo representa
 * una inscripción enriquecida con la categoría resuelta por la capa de
 * servicio/query.
 */
export type RegistrationCompetitionScope = {
    player_1_id: string | null;
    player_2_id: string | null;
    tournament_id: string;
    categoria_id: string;
    estado: RegistrationStatus;
};

/* -------------------------------------------------------------------------- */
/* STATUS HELPERS                                                             */
/* -------------------------------------------------------------------------- */

export function isRegistrationConfirmed(
    estado: RegistrationStatus,
): boolean {
    return estado === "confirmada";
}

export function isRegistrationPendingPayment(
    estado: RegistrationStatus,
): boolean {
    return estado === "pendiente_pago";
}

export function isRegistrationOnWaitingList(
    estado: RegistrationStatus,
): boolean {
    return estado === "lista_espera";
}

export function isRegistrationCancelled(
    estado: RegistrationStatus,
): boolean {
    return estado === "cancelada";
}

export function isPaymentVerified(
    estado: PaymentStatus,
): boolean {
    return estado === "verificado";
}

export function isPaymentPending(
    estado: PaymentStatus,
): boolean {
    return estado === "pendiente";
}

/* -------------------------------------------------------------------------- */
/* PARTNER STATUS                                                             */
/* -------------------------------------------------------------------------- */

export function isPairComplete(
    pair: Pick<
        Pair,
        "player_1_id" | "player_2_id"
    >,
): boolean {
    return Boolean(
        pair.player_1_id &&
        pair.player_2_id,
    );
}

export function isPairIncomplete(
    pair: Pick<
        Pair,
        "player_1_id" | "player_2_id"
    >,
): boolean {
    return !isPairComplete(pair);
}

/**
 * Returns the missing player slot.
 */
export function getMissingPartnerSlot(
    pair: Pick<
        Pair,
        "player_1_id" | "player_2_id"
    >,
): 1 | 2 | null {
    if (
        !pair.player_1_id &&
        pair.player_2_id
    ) {
        return 1;
    }

    if (
        pair.player_1_id &&
        !pair.player_2_id
    ) {
        return 2;
    }

    return null;
}

/* -------------------------------------------------------------------------- */
/* REGISTRATION VALIDATION                                                    */
/* -------------------------------------------------------------------------- */

export function validateRegistrationInput(
    input: RegistrationInput,
): RegistrationValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!input.tournamentId) {
        errors.push(
            "Debes indicar el torneo.",
        );
    }

    if (!input.categoryId) {
        errors.push(
            "Debes indicar la categoría.",
        );
    }

    if (!input.playerId) {
        errors.push(
            "Debes indicar el jugador.",
        );
    }

    if (
        input.partnerSelection.type ===
        "existing" &&
        !input.partnerSelection.partnerId
    ) {
        errors.push(
            "La pareja seleccionada no es válida.",
        );
    }

    if (
        input.partnerSelection.type ===
        "pool" &&
        !input.partnerSelection.poolEntryId
    ) {
        errors.push(
            "La solicitud de pareja no es válida.",
        );
    }

    if (
        input.partnerSelection.type ===
        "existing" &&
        input.partnerSelection.partnerId ===
        input.playerId
    ) {
        errors.push(
            "No puedes seleccionarte a ti mismo como pareja.",
        );
    }

    if (
        input.partnerSelection.type ===
        "none"
    ) {
        warnings.push(
            "La inscripción se iniciará sin pareja.",
        );
    }

    return {
        valid:
            errors.length === 0,
        errors,
        warnings,
    };
}

/* -------------------------------------------------------------------------- */
/* PARTNER SELECTION                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Validates an existing partner.
 *
 * Eligibility checks such as category and tournament availability are
 * performed by the service layer against current Supabase data.
 */
export function validateExistingPartner(
    playerId: string,
    partnerId: string,
): boolean {
    if (
        !playerId ||
        !partnerId
    ) {
        return false;
    }

    return (
        playerId !==
        partnerId
    );
}

/**
 * Creates the normalized partner selection estado.
 */
export function createPartnerSelection(
    selection:
        | {
            type: "existing";
            partnerId: string;
        }
        | {
            type: "pool";
            poolEntryId: string;
        }
        | null,
): PartnerSelection {
    if (!selection) {
        return {
            type: "none",
        };
    }

    if (
        selection.type ===
        "existing"
    ) {
        if (
            !selection.partnerId
        ) {
            throw new Error(
                "Falta el jugador de la pareja.",
            );
        }

        return {
            type: "existing",
            partnerId:
                selection.partnerId,
        };
    }

    if (
        !selection.poolEntryId
    ) {
        throw new Error(
            "Falta la solicitud de pareja.",
        );
    }

    return {
        type: "pool",
        poolEntryId:
            selection.poolEntryId,
    };
}

/* -------------------------------------------------------------------------- */
/* PARTNER POOL                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Determines whether a player can enter the partner pool.
 */
export function canEnterPartnerPool(
    params: {
        playerId: string;
        tournamentId: string;
        categoryId: string;
        availability?: PartnerAvailability;
    },
): boolean {
    if (
        !params.playerId ||
        !params.tournamentId ||
        !params.categoryId
    ) {
        return false;
    }

    if (
        params.availability ===
        "no_busca"
    ) {
        return false;
    }

    return true;
}

/**
 * Normalizes partner-pool availability.
 */
export function normalizePartnerAvailability(
    value:
        | PartnerAvailability
        | null
        | undefined,
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
/* REGISTRATION CREATION                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Creates the initial domain estado for an inscription.
 *
 * Payment remains external. Therefore a new registration starts with
 * payment pending and never launches an online checkout.
 */
export function createRegistrationState(
    input: RegistrationInput,
) {
    const validation =
        validateRegistrationInput(
            input,
        );

    if (
        !validation.valid
    ) {
        throw new Error(
            validation.errors.join(
                " ",
            ),
        );
    }

    const hasPartner =
        input.partnerSelection.type ===
        "existing";

    return {
        tournamentId:
            input.tournamentId,

        categoryId:
            input.categoryId,

        playerId:
            input.playerId,

        partnerSelection:
            input.partnerSelection,

        estado:
            "pendiente_pago" as const,

        paymentStatus:
            "pendiente" as const,

        paymentMethod:
            null as
            | PaymentMethod
            | null,

        paymentDate:
            null as
            | string
            | null,

        paymentAmount:
            null as
            | number
            | null,

        shirtSize:
            input.shirtSize ??
            null,

        pairComplete:
            hasPartner,

        createdAt:
            new Date().toISOString(),
    };
}

/* -------------------------------------------------------------------------- */
/* REGISTRATION STATUS                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Determines the initial registration estado.
 *
 * If there is no complete pair, the player remains in an incomplete
 * registration estado until a partner is found.
 */
export function resolveInitialRegistrationStatus(
    params: {
        pairComplete: boolean;
        paymentStatus: PaymentStatus;
        hasCapacity: boolean;
    },
): RegistrationStatus {
    if (
        !params.hasCapacity
    ) {
        return "lista_espera";
    }

    if (
        !params.pairComplete
    ) {
        return "pendiente_pago";
    }

    if (
        params.paymentStatus !==
        "verificado"
    ) {
        return "pendiente_pago";
    }

    return "confirmada";
}

/**
 * Recalculates registration estado after a relevant estado change.
 */
export function resolveRegistrationStatus(
    params: {
        pairComplete: boolean;
        paymentStatus: PaymentStatus;
        hasCapacity: boolean;
        cancelled?: boolean;
    },
): RegistrationStatus {
    if (
        params.cancelled
    ) {
        return "cancelada";
    }

    if (
        !params.hasCapacity
    ) {
        return "lista_espera";
    }

    if (
        !params.pairComplete
    ) {
        return "pendiente_pago";
    }

    if (
        params.paymentStatus !==
        "verificado"
    ) {
        return "pendiente_pago";
    }

    return "confirmada";
}

/* -------------------------------------------------------------------------- */
/* PAYMENT                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Validates a payment verification request.
 *
 * There is intentionally no "online" payment method.
 */
export function validatePaymentVerification(
    input: PaymentVerificationInput,
): boolean {
    if (
        !input.registrationId
    ) {
        return false;
    }

    if (
        !PAYMENT_METHODS.includes(
            input.paymentMethod,
        )
    ) {
        return false;
    }

    if (
        input.amount !==
        undefined &&
        input.amount !== null
    ) {
        if (
            !Number.isFinite(
                input.amount,
            ) ||
            input.amount < 0
        ) {
            return false;
        }
    }

    if (
        input.paymentDate
    ) {
        const timestamp =
            new Date(
                input.paymentDate,
            ).getTime();

        if (
            !Number.isFinite(
                timestamp,
            )
        ) {
            return false;
        }
    }

    return true;
}

/**
 * Generates the estado resulting from manual payment verification.
 *
 * Only the service/admin layer is allowed to persist this change.
 */
export function verifyPayment(
    registration: Pick<
        Registration,
        "estado"
    >,
    input: PaymentVerificationInput,
) {
    if (
        !validatePaymentVerification(
            input,
        )
    ) {
        throw new Error(
            "Los datos de verificación del pago no son válidos.",
        );
    }

    if (
        registration.estado ===
        "cancelada"
    ) {
        throw new Error(
            "No se puede verificar el pago de una inscripción cancelada.",
        );
    }

    return {
        paymentStatus:
            "verificado" as const,

        paymentMethod:
            input.paymentMethod,

        paymentAmount:
            input.amount ??
            null,

        paymentDate:
            input.paymentDate ??
            new Date().toISOString(),

        notes:
            input.notes?.trim() ||
            null,
    };
}

/**
 * Marks a payment as rejected.
 */
export function rejectPayment(
    registration: Pick<
        Registration,
        "estado"
    >,
    reason?: string,
) {
    if (
        registration.estado ===
        "cancelada"
    ) {
        throw new Error(
            "La inscripción ya está cancelada.",
        );
    }

    return {
        paymentStatus:
            "rechazado" as const,

        paymentRejectionReason:
            reason?.trim() ||
            null,
    };
}

/**
 * Resets a rejected/pending payment to pending.
 */
export function resetPaymentToPending() {
    return {
        paymentStatus:
            "pendiente" as const,

        paymentMethod:
            null,

        paymentDate:
            null,
    };
}

/* -------------------------------------------------------------------------- */
/* CAPACITY                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Calculates the current capacity estado.
 *
 * Capacity is intentionally nullable because some tournaments may be
 * configured without a fixed maximum.
 */
export function calculateCapacityState(
    registrations: Array<
        Pick<
            Registration,
            "estado"
        >
    >,
    capacity: number | null,
): CapacityState {
    const confirmed =
        registrations.filter(
            (
                registration,
            ) =>
                registration.estado ===
                "confirmada",
        ).length;

    const waitingList =
        registrations.filter(
            (
                registration,
            ) =>
                registration.estado ===
                "lista_espera",
        ).length;

    if (
        capacity === null
    ) {
        return {
            capacity: null,
            confirmed,
            waitingList,
            available: null,
            isFull: false,
        };
    }

    const available =
        Math.max(
            capacity -
            confirmed,
            0,
        );

    return {
        capacity,
        confirmed,
        waitingList,
        available,
        isFull:
            confirmed >=
            capacity,
    };
}

export function hasRegistrationCapacity(
    registrations: Array<
        Pick<
            Registration,
            "estado"
        >
    >,
    capacity: number | null,
): boolean {
    if (
        capacity === null
    ) {
        return true;
    }

    const confirmed =
        registrations.filter(
            (
                registration,
            ) =>
                registration.estado ===
                "confirmada",
        ).length;

    return (
        confirmed <
        capacity
    );
}

/* -------------------------------------------------------------------------- */
/* WAITING LIST                                                               */
/* -------------------------------------------------------------------------- */

export function shouldJoinWaitingList(
    params: {
        capacity: number | null;
        confirmed: number;
    },
): boolean {
    if (
        params.capacity ===
        null
    ) {
        return false;
    }

    return (
        params.confirmed >=
        params.capacity
    );
}

/**
 * Determines the next registration to promote from the waiting list.
 *
 * FIFO based on creation timestamp.
 */
export function sortWaitingList<
    T extends {
        estado: string;
        created_at?:
        | string
        | null;
    },
>(
    registrations: T[],
): T[] {
    return [...registrations]
        .filter(
            (
                registration,
            ) =>
                registration.estado ===
                "lista_espera",
        )
        .sort(
            (
                a,
                b,
            ) => {
                const aTime =
                    a.created_at
                        ? new Date(
                            a.created_at,
                        ).getTime()
                        : 0;

                const bTime =
                    b.created_at
                        ? new Date(
                            b.created_at,
                        ).getTime()
                        : 0;

                return (
                    aTime -
                    bTime
                );
            },
        );
}

/* -------------------------------------------------------------------------- */
/* CHECK-IN                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Only confirmed registrations should normally be checked in.
 */
export function validateCheckIn(
    registration: Pick<
        Registration,
        "estado"
    >,
): boolean {
    return (
        registration.estado ===
        "confirmada"
    );
}

export function processCheckIn(
    registration: Pick<
        Registration,
        "estado"
    >,
    checkedIn: boolean,
) {
    if (
        !validateCheckIn(
            registration,
        )
    ) {
        throw new Error(
            "Solo se puede hacer check-in de una inscripción confirmada.",
        );
    }

    return {
        checkedIn,

        checkedInAt:
            checkedIn
                ? new Date().toISOString()
                : null,
    };
}

/* -------------------------------------------------------------------------- */
/* CANCELLATION                                                               */
/* -------------------------------------------------------------------------- */

export function cancelRegistration(
    registration: Pick<
        Registration,
        "estado"
    >,
) {
    if (
        registration.estado ===
        "cancelada"
    ) {
        throw new Error(
            "La inscripción ya está cancelada.",
        );
    }

    return {
        estado:
            "cancelada" as const,

        cancelledAt:
            new Date().toISOString(),
    };
}

/* -------------------------------------------------------------------------- */
/* PARTNER COMPLETION                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Adds a partner to an incomplete pair.
 *
 * The service layer must verify that the partner is eligible and available
 * before persisting this change.
 */
export function completePair(
    pair: Pick<
        Pair,
        "player_1_id" | "player_2_id"
    >,
    partnerId: string,
) {
    if (!partnerId) {
        throw new Error(
            "Falta el jugador que completa la pareja.",
        );
    }

    if (
        pair.player_1_id ===
        partnerId ||
        pair.player_2_id ===
        partnerId
    ) {
        throw new Error(
            "Ese jugador ya pertenece a la pareja.",
        );
    }

    if (
        isPairComplete(pair)
    ) {
        throw new Error(
            "La pareja ya está completa.",
        );
    }

    if (
        !pair.player_1_id
    ) {
        return {
            player_1_id:
                partnerId,

            player_2_id:
                null,
        };
    }

    return {
        player_1_id:
            pair.player_1_id,

        player_2_id:
            partnerId,
    };
}

/* -------------------------------------------------------------------------- */
/* ELIGIBILITY                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Basic registration eligibility.
 *
 * More advanced checks — category approval, tournament estado,
 * duplicate registration, category conflicts and player estado —
 * belong to the service layer because they require current database data.
 */
export function validateBasicEligibility(
    params: {
        playerId: string;
        tournamentId: string;
        categoryId: string;
        tournamentOpen: boolean;
        playerActive: boolean;
    },
): RegistrationValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (
        !params.playerId
    ) {
        errors.push(
            "El jugador no es válido.",
        );
    }

    if (
        !params.tournamentId
    ) {
        errors.push(
            "El torneo no es válido.",
        );
    }

    if (
        !params.categoryId
    ) {
        errors.push(
            "La categoría no es válida.",
        );
    }

    if (
        !params.tournamentOpen
    ) {
        errors.push(
            "Las inscripciones no están abiertas.",
        );
    }

    if (
        !params.playerActive
    ) {
        errors.push(
            "El jugador no está activo.",
        );
    }

    return {
        valid:
            errors.length === 0,
        errors,
        warnings,
    };
}

/* -------------------------------------------------------------------------- */
/* DUPLICATE REGISTRATION                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Determines whether a player is already registered in the same
 * tournament and category.
 *
 * The category is resolved from the associated pair and is therefore
 * represented explicitly by `RegistrationCompetitionScope`.
 */
export function hasDuplicateRegistration(
    registrations: RegistrationCompetitionScope[],
    params: {
        tournamentId: string;
        categoryId: string;
        playerId: string;
    },
): boolean {
    return registrations.some(
        (
            registration,
        ) => {
            if (
                registration.tournament_id !==
                params.tournamentId
            ) {
                return false;
            }

            if (
                registration.categoria_id !==
                params.categoryId
            ) {
                return false;
            }

            if (
                registration.estado ===
                "cancelada"
            ) {
                return false;
            }

            return (
                registration.player_1_id ===
                params.playerId ||
                registration.player_2_id ===
                params.playerId
            );
        },
    );
}

/* -------------------------------------------------------------------------- */
/* PLAYER CATEGORY CONFLICT                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A player cannot compete in multiple categories simultaneously
 * within the same tournament.
 *
 * Category is supplied by the associated pair.
 */
export function hasCategoryConflict(
    registrations: RegistrationCompetitionScope[],
    params: {
        tournamentId: string;
        categoryId: string;
        playerId: string;
    },
): boolean {
    return registrations.some(
        (
            registration,
        ) => {
            if (
                registration.tournament_id !==
                params.tournamentId
            ) {
                return false;
            }

            if (
                registration.categoria_id ===
                params.categoryId
            ) {
                return false;
            }

            if (
                registration.estado ===
                "cancelada"
            ) {
                return false;
            }

            return (
                registration.player_1_id ===
                params.playerId ||
                registration.player_2_id ===
                params.playerId
            );
        },
    );
}

/* -------------------------------------------------------------------------- */
/* REGISTRATION SUMMARY                                                       */
/* -------------------------------------------------------------------------- */

export function getRegistrationSummary(
    registration: {
        estado: RegistrationStatus;
        paymentStatus?:
        | PaymentStatus
        | undefined;
        pairComplete: boolean;
    },
) {
    const paymentStatus =
        registration.paymentStatus ??
        "pendiente";

    return {
        estado:
            registration.estado,

        paymentStatus,

        pairComplete:
            registration.pairComplete,

        isConfirmed:
            registration.estado ===
            "confirmada",

        isWaiting:
            registration.estado ===
            "lista_espera",

        isPendingPayment:
            paymentStatus ===
            "pendiente",

        needsPartner:
            !registration.pairComplete,

        needsPaymentVerification:
            paymentStatus !==
            "verificado",
    };
}

/* -------------------------------------------------------------------------- */
/* ADMIN PAYMENT LABELS                                                       */
/* -------------------------------------------------------------------------- */

export function getPaymentStatusLabel(
    estado: PaymentStatus,
): string {
    switch (estado) {
        case "pendiente":
            return "Pago pendiente";

        case "verificado":
            return "Pago verificado";

        case "rechazado":
            return "Pago rechazado";

        case "no_requerido":
            return "Pago no requerido";
    }
}

export function getRegistrationStatusLabel(
    estado: RegistrationStatus,
): string {
    switch (estado) {
        case "confirmada":
            return "Confirmada";

        case "lista_espera":
            return "Lista de espera";

        case "pendiente_pago":
            return "Pendiente de pago";

        case "cancelada":
            return "Cancelada";
    }
}

/* -------------------------------------------------------------------------- */
/* STATE MACHINE                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Valid registration estado transitions.
 */
export function canTransitionRegistrationStatus(
    from: RegistrationStatus,
    to: RegistrationStatus,
): boolean {
    if (
        from === to
    ) {
        return true;
    }

    const transitions: Record<
        RegistrationStatus,
        RegistrationStatus[]
    > = {
        pendiente_pago: [
            "confirmada",
            "lista_espera",
            "cancelada",
        ],

        lista_espera: [
            "pendiente_pago",
            "confirmada",
            "cancelada",
        ],

        confirmada: [
            "cancelada",
            "lista_espera",
        ],

        cancelada: [],
    };

    return transitions[
        from
    ].includes(to);
}

/* -------------------------------------------------------------------------- */
/* CONSTANT CHECK                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Ensures the domain constants remain synchronized with the expected
 * registration states.
 */
export function validateRegistrationConstants(): boolean {
    return (
        REGISTRATION_STATUSES.includes(
            "confirmada",
        ) &&
        REGISTRATION_STATUSES.includes(
            "lista_espera",
        ) &&
        REGISTRATION_STATUSES.includes(
            "pendiente_pago",
        ) &&
        REGISTRATION_STATUSES.includes(
            "cancelada",
        ) &&
        PAYMENT_STATUSES.includes(
            "pendiente",
        ) &&
        PAYMENT_STATUSES.includes(
            "verificado",
        ) &&
        PAYMENT_STATUSES.includes(
            "rechazado",
        )
    );
}