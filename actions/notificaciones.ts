"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { darDeBajaInscripcion } from "@/actions/cuadros";
import { exigirOrganizador } from "@/lib/auth/organizador";
import { ESTADOS_QUE_OCUPAN_PLAZA } from "@/lib/constantes";
import { notificarInscripcion } from "@/lib/email/notificaciones";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type AccionBaja = { ok: true } | { ok: false; error: string };

const esquema = z.object({
    inscripcionId: z.uuid(),
    motivo: z
        .string()
        .trim()
        .min(10, "El motivo debe tener al menos 10 caracteres")
        .max(500)
        .optional(),
});

// Baja de una inscripción por el organizador, con aviso a los jugadores.
// Si la baja libera una plaza, avisa también a la primera pareja de la lista de espera.
export async function darDeBajaConAviso(entrada: unknown): Promise<AccionBaja> {
    const parseo = esquema.safeParse(entrada);
    if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
    const { inscripcionId } = parseo.data;

    if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };

    const admin = crearClienteAdmin();

    const { data: insc } = await admin
        .from("inscripciones")
        .select("prueba_id, categoria, estado")
        .eq("id", inscripcionId)
        .maybeSingle<{ prueba_id: string; categoria: string; estado: string }>();
    if (!insc) return { ok: false, error: "Inscripción no encontrada" };

    // Quién entrará si la baja libera una plaza (se calcula antes de hacerla)
    let siguienteId: string | null = null;
    const ocupaba = (ESTADOS_QUE_OCUPAN_PLAZA as readonly string[]).includes(insc.estado);
    if (ocupaba) {
        const { data: sig } = await admin
            .from("inscripciones")
            .select("id")
            .eq("prueba_id", insc.prueba_id)
            .eq("categoria", insc.categoria)
            .eq("estado", "lista_espera")
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle<{ id: string }>();
        siguienteId = sig?.id ?? null;
    }

    const res = await darDeBajaInscripcion(parseo.data);
    if (!res.ok) return res;

    await notificarInscripcion(inscripcionId, "baja");
    if (siguienteId) await notificarInscripcion(siguienteId, "promocion");

    revalidatePath("/admin/inscripciones");
    revalidatePath("/admin/pruebas");
    return { ok: true };
}