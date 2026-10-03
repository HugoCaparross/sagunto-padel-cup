"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assignMatchCourtAdmin, updateMatchScheduleAdmin } from "@/lib/services/admin";

function text(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
}

async function finish(result: "actualizada" | "error"): Promise<never> {
    revalidatePath("/admin/competicion");
    redirect(`/admin/competicion?resultado=${result}`);
}

export async function scheduleMatchAction(formData: FormData): Promise<void> {
    const matchId = text(formData, "matchId");
    const scheduledAt = text(formData, "scheduledAt");
    const date = new Date(scheduledAt);
    if (!matchId || !scheduledAt || !Number.isFinite(date.getTime())) await finish("error");
    try {
        await updateMatchScheduleAdmin(matchId, date.toISOString());
    } catch (error) {
        console.error("[Admin] No se pudo programar el partido", error);
        await finish("error");
    }
    await finish("actualizada");
}

export async function assignCourtAction(formData: FormData): Promise<void> {
    const matchId = text(formData, "matchId");
    const court = text(formData, "court");
    const parsed = Number(court);
    if (!matchId || !Number.isInteger(parsed) || parsed < 1 || parsed > 99) await finish("error");
    try {
        await assignMatchCourtAdmin(matchId, parsed);
    } catch (error) {
        console.error("[Admin] No se pudo asignar la pista", error);
        await finish("error");
    }
    await finish("actualizada");
}
