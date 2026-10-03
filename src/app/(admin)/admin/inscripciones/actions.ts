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

async function finish(returnTo: string, result: "actualizada" | "error"): Promise<never> {
    revalidatePath("/admin");
    revalidatePath("/admin/inscripciones");
    const url = new URL(returnTo, "http://localhost");
    url.searchParams.set("resultado", result);
    redirect(`${url.pathname}${url.search}`);
}

export async function cancelRegistrationAction(formData: FormData): Promise<void> {
    const registrationId = readText(formData, "registrationId");
    const returnTo = safeReturnTo(readText(formData, "returnTo"));
    if (!registrationId) await finish(returnTo, "error");
    try {
        await cancelRegistrationAdmin(registrationId);
    } catch (error) {
        console.error("[Admin] No se pudo cancelar la inscripcion", error);
        await finish(returnTo, "error");
    }
    await finish(returnTo, "actualizada");
}

export async function promoteWaitingRegistrationAction(formData: FormData): Promise<void> {
    const registrationId = readText(formData, "registrationId");
    const returnTo = safeReturnTo(readText(formData, "returnTo"));
    if (!registrationId) await finish(returnTo, "error");
    try {
        await promoteRegistrationAdmin(registrationId);
    } catch (error) {
        console.error("[Admin] No se pudo promover manualmente la inscripcion", error);
        await finish(returnTo, "error");
    }
    await finish(returnTo, "actualizada");
}

export async function moveRegistrationToWaitingListAction(formData: FormData): Promise<void> {
    const registrationId = readText(formData, "registrationId");
    const returnTo = safeReturnTo(readText(formData, "returnTo"));
    if (!registrationId) await finish(returnTo, "error");
    try {
        await moveRegistrationToWaitingListAdmin(registrationId);
    } catch (error) {
        console.error("[Admin] No se pudo mover la inscripcion a lista de espera", error);
        await finish(returnTo, "error");
    }
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

    await finish(returnTo, "actualizada");
}
