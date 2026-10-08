// src/lib/services/registration-payments.ts

import {
    getRegistrationById,
    markPaymentPending,
    verifyRegistrationPayment,
} from "@/lib/services/registrations";

import {
    requireAdminContext,
    writeAdminAuditLog,
} from "@/lib/services/admin";

import type {
    Registration,
} from "@/types/database";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export type RegistrationPaymentMethod =
    | "fisico"
    | "transferencia"
    | "otro";

export type VerifyRegistrationPaymentInput = {
    registrationId: string;
    method?: RegistrationPaymentMethod;
    amount?: number | null;
    paymentDate?: string | null;
    note?: string | null;
};

export type RegistrationPaymentResult = {
    registration: Registration;
    previousStatus:
    | "pendiente"
    | "verificado"
    | "rechazado"
    | "no_aplicable";
    newStatus:
    | "pendiente"
    | "verificado"
    | "rechazado"
    | "no_aplicable";
};

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * En Sagunto Padel Cup no existe ningún pago online.
 *
 * El jugador únicamente realiza la inscripción desde la web.
 * El pago se realiza presencialmente y el administrador lo verifica
 * manualmente desde el panel de administración.
 */
export const PAYMENT_NOTICE =
    "Inscripción realizada correctamente. El pago de la inscripción se realizará de forma presencial. La organización verificará manualmente el pago.";

export const DEFAULT_PAYMENT_METHOD =
    "fisico" as const;

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getPaymentStatus(
    registration: Registration,
):
    | "pendiente"
    | "verificado"
    | "rechazado"
    | "no_aplicable" {
    if (
        registration.payment_status ===
        "verificado"
    ) {
        return "verificado";
    }

    if (
        registration.payment_status ===
        "rechazado"
    ) {
        return "rechazado";
    }

    if (
        registration.payment_status ===
        "no_aplicable"
    ) {
        return "no_aplicable";
    }

    return "pendiente";
}

function assertRegistrationId(
    registrationId: string,
): void {
    if (!registrationId?.trim()) {
        throw new Error(
            "Falta el identificador de la inscripción.",
        );
    }
}

/* -------------------------------------------------------------------------- */
/* VERIFY PAYMENT                                                             */
/* -------------------------------------------------------------------------- */

export async function verifyRegistrationPaymentAdmin(
    input: VerifyRegistrationPaymentInput,
): Promise<RegistrationPaymentResult> {
    assertRegistrationId(
        input.registrationId,
    );

    await requireAdminContext();

    const current =
        await getRegistrationById(
            input.registrationId,
        );

    if (!current) {
        throw new Error(
            "La inscripción no existe.",
        );
    }

    const previousStatus =
        getPaymentStatus(
            current,
        );

    const updated =
        await verifyRegistrationPayment({
            registrationId:
                input.registrationId,

            method:
                input.method ??
                DEFAULT_PAYMENT_METHOD,

            amount:
                input.amount ??
                null,

            paymentDate:
                input.paymentDate ??
                null,

            note:
                input.note ??
                null,
        });

    const newStatus =
        getPaymentStatus(
            updated,
        );

    await writeAdminAuditLog({
        accion:
            "registration_update",

        entityType:
            "registration",

        entityId:
            input.registrationId,

        metadata: {
            operation:
                "payment_verified",

            previousPaymentStatus:
                previousStatus,

            newPaymentStatus:
                newStatus,

            paymentMethod:
                input.method ??
                DEFAULT_PAYMENT_METHOD,

            amount:
                input.amount ??
                null,

            paymentDate:
                input.paymentDate ??
                null,

            note:
                input.note ??
                null,
        },
    });

    return {
        registration:
            updated,

        previousStatus,

        newStatus,
    };
}

/* -------------------------------------------------------------------------- */
/* MARK PAYMENT AS PENDING                                                     */
/* -------------------------------------------------------------------------- */

export async function markRegistrationPaymentPendingAdmin(
    registrationId: string,
): Promise<RegistrationPaymentResult> {
    assertRegistrationId(
        registrationId,
    );

    await requireAdminContext();

    const current =
        await getRegistrationById(
            registrationId,
        );

    if (!current) {
        throw new Error(
            "La inscripción no existe.",
        );
    }

    const previousStatus =
        getPaymentStatus(
            current,
        );

    const updated =
        await markPaymentPending(
            registrationId,
        );

    const newStatus =
        getPaymentStatus(
            updated,
        );

    await writeAdminAuditLog({
        accion:
            "registration_update",

        entityType:
            "registration",

        entityId:
            registrationId,

        metadata: {
            operation:
                "payment_marked_pending",

            previousPaymentStatus:
                previousStatus,

            newPaymentStatus:
                newStatus,
        },
    });

    return {
        registration:
            updated,

        previousStatus,

        newStatus,
    };
}