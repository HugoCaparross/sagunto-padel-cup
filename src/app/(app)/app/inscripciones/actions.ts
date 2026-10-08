"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
    cancelRegistrationAdmin,
    checkInPlayerAdmin,
    confirmRegistrationAdmin,
    confirmRegistrationPaymentAdmin,
    markRegistrationPaymentPendingAdmin,
    moveRegistrationToWaitingListAdmin,
    promoteRegistrationAdmin,
} from "@/lib/services/admin";

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
        const parsed =
            new URL(
                value ||
                "/admin/inscripciones",
                "http://localhost",
            );

        if (
            parsed.origin ===
            "http://localhost" &&
            parsed.pathname ===
            "/admin/inscripciones"
        ) {
            return `${parsed.pathname}${parsed.search}`;
        }

        return "/admin/inscripciones";
    } catch {
        return "/admin/inscripciones";
    }
}

async function finish(
    returnTo: string,
    result:
        | "actualizada"
        | "error",
    registrationId?: string,
): Promise<never> {
    revalidatePath(
        "/admin",
    );

    revalidatePath(
        "/admin/inscripciones",
    );

    if (registrationId) {
        revalidatePath(
            `/admin/inscripciones/${registrationId}`,
        );
    }

    const url =
        new URL(
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
        await cancelRegistrationAdmin(
            registrationId,
        );
    } catch (error) {
        console.error(
            "[Admin] No se pudo cancelar la inscripción",
            error,
        );

        await finish(
            returnTo,
            "error",
            registrationId,
        );
    }

    await finish(
        returnTo,
        "actualizada",
        registrationId,
    );
}

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
        await promoteRegistrationAdmin(
            registrationId,
        );
    } catch (error) {
        console.error(
            "[Admin] No se pudo promover manualmente la inscripción",
            error,
        );

        await finish(
            returnTo,
            "error",
            registrationId,
        );
    }

    await finish(
        returnTo,
        "actualizada",
        registrationId,
    );
}

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
        await moveRegistrationToWaitingListAdmin(
            registrationId,
        );
    } catch (error) {
        console.error(
            "[Admin] No se pudo mover la inscripción a lista de espera",
            error,
        );

        await finish(
            returnTo,
            "error",
            registrationId,
        );
    }

    await finish(
        returnTo,
        "actualizada",
        registrationId,
    );
}

/**
 * Marca el pago como verificado.
 *
 * IMPORTANTE:
 * El pago de SPC es presencial/manual.
 * Esta acción no inicia ningún gateway,
 * checkout ni operación bancaria.
 */
export async function verifyPaymentAction(
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
        await confirmRegistrationPaymentAdmin(
            {
                registrationId,

                method: "fisico",

                amount: null,

                paymentDate: null,

                note: null,
            },
        );
    } catch (error) {
        console.error(
            "[Admin] No se pudo verificar el pago presencial",
            error,
        );

        await finish(
            returnTo,
            "error",
            registrationId,
        );
    }

    await finish(
        returnTo,
        "actualizada",
        registrationId,
    );
}

/**
 * Revierte la verificación manual del pago.
 *
 * No borra la inscripción.
 * No modifica la pareja.
 * No inicia ningún reembolso.
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
            registrationId,
        );
    }

    await finish(
        returnTo,
        "actualizada",
        registrationId,
    );
}

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
        await checkInPlayerAdmin(
            registrationId,
        );
    } catch (error) {
        console.error(
            "[Admin] No se pudo registrar el check-in",
            error,
        );

        await finish(
            returnTo,
            "error",
            registrationId,
        );
    }

    await finish(
        returnTo,
        "actualizada",
        registrationId,
    );
}

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
        await confirmRegistrationAdmin(
            registrationId,
        );
    } catch (error) {
        console.error(
            "[Admin] No se pudo confirmar la inscripción",
            error,
        );

        await finish(
            returnTo,
            "error",
            registrationId,
        );
    }

    await finish(
        returnTo,
        "actualizada",
        registrationId,
    );
}