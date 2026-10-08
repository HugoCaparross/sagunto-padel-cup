"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
    cancelRegistrationAdmin,
    checkInPlayerAdmin,
    confirmRegistrationAdmin,
    moveRegistrationToWaitingListAdmin,
    promoteRegistrationAdmin,
    requireAdminContext,
    writeAdminAuditLog,
} from "@/lib/services/admin";

import {
    markRegistrationPaymentPendingAdmin,
    verifyRegistrationPaymentAdmin,
} from "@/lib/services/registration-payments";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function readText(
    formData: FormData,
    key: string,
): string {
    const value =
        formData.get(key);

    return typeof value ===
        "string"
        ? value.trim()
        : "";
}

function safeReturnTo(
    value: string,
): string {
    try {
        const parsed = new URL(
            value ||
            "/admin/inscripciones",
            "http://localhost",
        );

        return (
            parsed.origin ===
            "http://localhost" &&
            parsed.pathname ===
            "/admin/inscripciones"
        )
            ? `${parsed.pathname}${parsed.search}`
            : "/admin/inscripciones";
    } catch {
        return "/admin/inscripciones";
    }
}

async function finish(
    returnTo: string,
    result:
        | "actualizada"
        | "error",
): Promise<never> {
    revalidatePath("/admin");

    revalidatePath(
        "/admin/inscripciones",
    );

    const url = new URL(
        returnTo,
        "http://localhost",
    );

    url.searchParams.set(
        "resultado",
        result,
    );

    redirect(
        `${url.pathname}${url.search}`,
    );
}

/* -------------------------------------------------------------------------- */
/* CANCELAR INSCRIPCIÓN                                                       */
/* -------------------------------------------------------------------------- */

export async function cancelRegistrationAction(
    formData: FormData,
): Promise<void> {
    const registrationId =
        readText(
            formData,
            "registrationId",
        );

    const returnTo =
        safeReturnTo(
            readText(
                formData,
                "returnTo",
            ),
        );

    if (!registrationId) {
        await finish(
            returnTo,
            "error",
        );
    }

    try {
        await requireAdminContext();

        await cancelRegistrationAdmin(
            registrationId,
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
                    "registration_cancelled",
            },
        });
    } catch (error) {
        console.error(
            "[Admin] No se pudo cancelar la inscripción",
            error,
        );

        await finish(
            returnTo,
            "error",
        );
    }

    await finish(
        returnTo,
        "actualizada",
    );
}

/* -------------------------------------------------------------------------- */
/* PROMOVER DESDE LISTA DE ESPERA                                             */
/* -------------------------------------------------------------------------- */

export async function promoteWaitingRegistrationAction(
    formData: FormData,
): Promise<void> {
    const registrationId =
        readText(
            formData,
            "registrationId",
        );

    const returnTo =
        safeReturnTo(
            readText(
                formData,
                "returnTo",
            ),
        );

    if (!registrationId) {
        await finish(
            returnTo,
            "error",
        );
    }

    try {
        await requireAdminContext();

        await promoteRegistrationAdmin(
            registrationId,
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
                    "registration_promoted_from_waiting_list",
            },
        });
    } catch (error) {
        console.error(
            "[Admin] No se pudo promover manualmente la inscripción",
            error,
        );

        await finish(
            returnTo,
            "error",
        );
    }

    await finish(
        returnTo,
        "actualizada",
    );
}

/* -------------------------------------------------------------------------- */
/* MOVER A LISTA DE ESPERA                                                    */
/* -------------------------------------------------------------------------- */

export async function moveRegistrationToWaitingListAction(
    formData: FormData,
): Promise<void> {
    const registrationId =
        readText(
            formData,
            "registrationId",
        );

    const returnTo =
        safeReturnTo(
            readText(
                formData,
                "returnTo",
            ),
        );

    if (!registrationId) {
        await finish(
            returnTo,
            "error",
        );
    }

    try {
        await requireAdminContext();

        await moveRegistrationToWaitingListAdmin(
            registrationId,
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
                    "registration_moved_to_waiting_list",
            },
        });
    } catch (error) {
        console.error(
            "[Admin] No se pudo mover la inscripción a lista de espera",
            error,
        );

        await finish(
            returnTo,
            "error",
        );
    }

    await finish(
        returnTo,
        "actualizada",
    );
}

/* -------------------------------------------------------------------------- */
/* VERIFICAR PAGO PRESENCIAL                                                  */
/* -------------------------------------------------------------------------- */

export async function verifyPaymentAction(
    formData: FormData,
): Promise<void> {
    const registrationId =
        readText(
            formData,
            "registrationId",
        );

    const method =
        readText(
            formData,
            "method",
        );

    const returnTo =
        safeReturnTo(
            readText(
                formData,
                "returnTo",
            ),
        );

    if (
        !registrationId ||
        ![
            "fisico",
            "transferencia",
            "otro",
        ].includes(method)
    ) {
        await finish(
            returnTo,
            "error",
        );
    }

    try {
        await verifyRegistrationPaymentAdmin(
            {
                registrationId,

                method:
                    method as
                    | "fisico"
                    | "transferencia"
                    | "otro",

                amount:
                    null,

                paymentDate:
                    null,

                note:
                    null,
            },
        );
    } catch (error) {
        console.error(
            "[Admin] No se pudo verificar el pago",
            error,
        );

        await finish(
            returnTo,
            "error",
        );
    }

    await finish(
        returnTo,
        "actualizada",
    );
}

/* -------------------------------------------------------------------------- */
/* DESMARCAR PAGO                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Devuelve el estado administrativo del pago a "pendiente".
 *
 * No realiza ningún reembolso.
 * No realiza ninguna operación bancaria.
 * No conecta con ningún proveedor de pagos.
 *
 * El servicio administrativo registra además la operación
 * en audit_log.
 */
export async function markPaymentPendingAction(
    formData: FormData,
): Promise<void> {
    const registrationId =
        readText(
            formData,
            "registrationId",
        );

    const returnTo =
        safeReturnTo(
            readText(
                formData,
                "returnTo",
            ),
        );

    if (!registrationId) {
        await finish(
            returnTo,
            "error",
        );
    }

    try {
        await markRegistrationPaymentPendingAdmin(
            registrationId,
        );
    } catch (error) {
        console.error(
            "[Admin] No se pudo devolver el pago a pendiente",
            error,
        );

        await finish(
            returnTo,
            "error",
        );
    }

    await finish(
        returnTo,
        "actualizada",
    );
}

/* -------------------------------------------------------------------------- */
/* CHECK-IN                                                                   */
/* -------------------------------------------------------------------------- */

export async function checkInAction(
    formData: FormData,
): Promise<void> {
    const registrationId =
        readText(
            formData,
            "registrationId",
        );

    const returnTo =
        safeReturnTo(
            readText(
                formData,
                "returnTo",
            ),
        );

    if (!registrationId) {
        await finish(
            returnTo,
            "error",
        );
    }

    try {
        await requireAdminContext();

        await checkInPlayerAdmin(
            registrationId,
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
                    "check_in_registered",
            },
        });
    } catch (error) {
        console.error(
            "[Admin] No se pudo registrar el check-in",
            error,
        );

        await finish(
            returnTo,
            "error",
        );
    }

    await finish(
        returnTo,
        "actualizada",
    );
}

/* -------------------------------------------------------------------------- */
/* CONFIRMAR INSCRIPCIÓN                                                      */
/* -------------------------------------------------------------------------- */

export async function confirmRegistrationAction(
    formData: FormData,
): Promise<void> {
    const registrationId =
        readText(
            formData,
            "registrationId",
        );

    const returnTo =
        safeReturnTo(
            readText(
                formData,
                "returnTo",
            ),
        );

    if (!registrationId) {
        await finish(
            returnTo,
            "error",
        );
    }

    try {
        await requireAdminContext();

        await confirmRegistrationAdmin(
            registrationId,
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
                    "registration_confirmed",
            },
        });
    } catch (error) {
        console.error(
            "[Admin] No se pudo confirmar la inscripción",
            error,
        );

        await finish(
            returnTo,
            "error",
        );
    }

    await finish(
        returnTo,
        "actualizada",
    );
}