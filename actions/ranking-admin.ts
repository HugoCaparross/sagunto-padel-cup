"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirOrganizador } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type AccionRankingAdmin = { ok: true } | { ok: false; error: string };

const esquema = z.object({
    temporadaId: z.number().int().positive(),
    plazasAscenso: z.number().int().min(0).max(10),
    plazasDescenso: z.number().int().min(0).max(10),
});

// Cambia las plazas de ascenso y descenso de una temporada.
// Afecta a las propuestas que se generen a partir de ahora, no a las ya creadas.
export async function actualizarPlazasTemporada(entrada: unknown): Promise<AccionRankingAdmin> {
    try {
        const parseo = esquema.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: previa, error: errorPrevia } = await admin
            .from("temporadas")
            .select("plazas_ascenso, plazas_descenso")
            .eq("id", d.temporadaId)
            .single<{ plazas_ascenso: number; plazas_descenso: number }>();
        if (errorPrevia || !previa) return { ok: false, error: "Temporada no encontrada" };

        const { error } = await admin
            .from("temporadas")
            .update({
                plazas_ascenso: d.plazasAscenso,
                plazas_descenso: d.plazasDescenso,
            })
            .eq("id", d.temporadaId);
        if (error) return { ok: false, error: error.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "cambiar_plazas_temporada",
            tabla: "temporadas",
            registroId: String(d.temporadaId),
            antes: { ascenso: previa.plazas_ascenso, descenso: previa.plazas_descenso },
            despues: { ascenso: d.plazasAscenso, descenso: d.plazasDescenso },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        revalidatePath("/admin/ranking");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}