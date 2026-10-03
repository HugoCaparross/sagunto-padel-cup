"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
    checkInPlayerAdmin,
    confirmRegistrationPaymentAdmin,
    confirmRegistrationAdmin,
    cancelRegistrationAdmin,
    moveRegistrationToWaitingListAdmin,
    promoteRegistrationAdmin,
    writeAdminAuditLog,
} from "@/lib/services/admin";

function readText(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

function safeReturnTo(value: string): string {
    try {
        const parsed = new URL(value || "/admin/inscripciones", "http://localhost");
        return parsed.origin === "http://localhost" && parsed.pathname === "/admin/inscripciones"
            ? `${parsed.pathname}${parsed.search}`
            : "/admin/inscripciones";
    } catch {
        return "/admin/inscripciones";
    }
}

async function finish(returnTo: string, result: "actualizada" | "error" | "auditoria_error"): Promise<never> {
    revalidatePath("/admin");
    revalidatePath("/admin/inscripciones");
    const url = new URL(returnTo, "http://localhost");
    url.searchParams.set("resultado", result);
    redirect(`${url.pathname}${url.search}`);
}

async function writeRegistrationAudit(registrationId: string, operation: string, metadata: Record<string, unknown>): Promise<boolean> {
    try {
        await writeAdminAuditLog({ accion: "registration_update", entityType: "registration", entityId: registrationId, metadata: { operation, ...metadata } });
        return true;
    } catch (error) {
        console.error(`[Admin] La operacion ${operation} se completo, pero fallo la auditoria`, error);
        return false;
    }
}

export async function cancelRegistrationAction(formData: FormData): Promise<void> {
    const registrationId = readText(formData, "registrationId");
    const returnTo = safeReturnTo(readText(formData, "returnTo"));
    if (!registrationId) await finish(returnTo, "error");
    let previousStatus: string | undefined;
    try {
        const result = await cancelRegistrationAdmin(registrationId);
        previousStatus = result?.previous_status;
    } catch (error) {
        console.error("[Admin] No se pudo cancelar la inscripcion", error);
        await finish(returnTo, "error");
    }
    if (!await writeRegistrationAudit(registrationId, "cancel", { previousStatus, status: "cancelada" })) await finish(returnTo, "auditoria_error");
    await finish(returnTo, "actualizada");
}

export async function promoteWaitingRegistrationAction(formData: FormData): Promise<void> {
    const registrationId = readText(formData, "registrationId");
    const returnTo = safeReturnTo(readText(formData, "returnTo"));
    if (!registrationId) await finish(returnTo, "error");
    let previousStatus: string | undefined;
    try {
        const result = await promoteRegistrationAdmin(registrationId);
        previousStatus = result?.previous_status;
    } catch (error) {
        console.error("[Admin] No se pudo promover manualmente la inscripcion", error);
        await finish(returnTo, "error");
    }
    if (!await writeRegistrationAudit(registrationId, "manual_waiting_list_promotion", { previousStatus, status: "pendiente_pago" })) await finish(returnTo, "auditoria_error");
    await finish(returnTo, "actualizada");
}

export async function moveRegistrationToWaitingListAction(formData: FormData): Promise<void> {
    const registrationId = readText(formData, "registrationId");
    const returnTo = safeReturnTo(readText(formData, "returnTo"));
    if (!registrationId) await finish(returnTo, "error");
    let previousStatus: string | undefined;
    try {
        const result = await moveRegistrationToWaitingListAdmin(registrationId);
        previousStatus = result?.previous_status;
    } catch (error) {
        console.error("[Admin] No se pudo mover la inscripcion a lista de espera", error);
        await finish(returnTo, "error");
    }
    if (!await writeRegistrationAudit(registrationId, "moved_to_waiting_list", { previousStatus, status: "lista_espera" })) await finish(returnTo, "auditoria_error");
    await finish(returnTo, "actualizada");
}

export async function verifyPaymentAction(formData: FormData): Promise<void> {
    const registrationId = readText(formData, "registrationId");
    const method = readText(formData, "method");
    const returnTo = safeReturnTo(readText(formData, "returnTo"));
    if (!registrationId || !["fisico", "transferencia", "otro"].includes(method)) {
        await finish(returnTo, "error");
    }

    try {
        await confirmRegistrationPaymentAdmin({
            registrationId,
            method: method as "fisico" | "transferencia" | "otro",
            amount: null,
            paymentDate: null,
            note: null,
        });
    } catch (error) {
        console.error("[Admin] No se pudo verificar el pago", error);
        await finish(returnTo, "error");
    }

    if (!await writeRegistrationAudit(registrationId, "payment_verified", { method, status: "verificado" })) await finish(returnTo, "auditoria_error");

    await finish(returnTo, "actualizada");
}

export async function checkInAction(formData: FormData): Promise<void> {
    const registrationId = readText(formData, "registrationId");
    const returnTo = safeReturnTo(readText(formData, "returnTo"));
    if (!registrationId) await finish(returnTo, "error");

    try {
        await checkInPlayerAdmin(registrationId);
    } catch (error) {
        console.error("[Admin] No se pudo registrar el check-in", error);
        await finish(returnTo, "error");
    }

    if (!await writeRegistrationAudit(registrationId, "check_in", { checkedIn: true })) await finish(returnTo, "auditoria_error");

    await finish(returnTo, "actualizada");
}

export async function confirmRegistrationAction(formData: FormData): Promise<void> {
    const registrationId = readText(formData, "registrationId");
    const returnTo = safeReturnTo(readText(formData, "returnTo"));
    if (!registrationId) await finish(returnTo, "error");

    try {
        await confirmRegistrationAdmin(registrationId);
    } catch (error) {
        console.error("[Admin] No se pudo confirmar la inscripción", error);
        await finish(returnTo, "error");
    }

    if (!await writeRegistrationAudit(registrationId, "registration_confirmed", { status: "confirmada" })) await finish(returnTo, "auditoria_error");

    await finish(returnTo, "actualizada");
}
