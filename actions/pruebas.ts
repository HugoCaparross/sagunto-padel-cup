"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ESTADOS_PRUEBA, type EstadoPrueba } from "@/lib/constantes";
import { exigirOrganizador } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import { REQUISITOS, type TipoDocumento } from "@/lib/legal/requisitos";
import { requiereMotivo, transicionPermitida } from "@/lib/pruebas/transiciones";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type AccionPrueba =
    | { ok: true }
    | { ok: false; error: string; pendientes?: string[] };

const esquema = z.object({
    pruebaId: z.uuid(),
    estado: z.enum(ESTADOS_PRUEBA),
    motivo: z
        .string()
        .trim()
        .min(10, "El motivo debe tener al menos 10 caracteres")
        .max(500)
        .optional(),
});

type Admin = ReturnType<typeof crearClienteAdmin>;

type PruebaFila = {
    id: string;
    slug: string;
    estado: EstadoPrueba;
    fecha_inicio: string;
};

function hoyEnMadrid(): string {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
}

// Lo que falta para entrar en un estado. Lista vacía = se puede cambiar.
async function condicionesPara(
    admin: Admin,
    prueba: PruebaFila,
    hasta: EstadoPrueba
): Promise<string[]> {
    const pendientes: string[] = [];

    if (hasta === "abierta") {
        if (prueba.fecha_inicio < hoyEnMadrid()) {
            pendientes.push("La prueba ya ha empezado: no se puede abrir la inscripción");
        }

        const { data: vigentes, error: errorDocs } = await admin
            .from("documentos_legales")
            .select("tipo")
            .eq("vigente", true);
        if (errorDocs) throw new Error(errorDocs.message);

        const publicados = new Set((vigentes ?? []).map((v) => v.tipo as TipoDocumento));
        for (const r of REQUISITOS) {
            if (!publicados.has(r.tipo)) pendientes.push(`Falta publicar: ${r.nombre}`);
        }

        const { count: pistas, error: errorPistas } = await admin
            .from("pistas")
            .select("id", { count: "exact", head: true })
            .eq("prueba_id", prueba.id);
        if (errorPistas) throw new Error(errorPistas.message);
        if ((pistas ?? 0) === 0) pendientes.push("Define al menos una pista");

        const { count: categorias, error: errorCats } = await admin
            .from("prueba_categorias")
            .select("categoria", { count: "exact", head: true })
            .eq("prueba_id", prueba.id);
        if (errorCats) throw new Error(errorCats.message);
        if ((categorias ?? 0) === 0) pendientes.push("Define las categorías de la prueba");
    }

    if (hasta === "finalizada") {
        // Los campeones automáticos no tienen partido, así que no cuentan
        const { count, error } = await admin
            .from("partidos")
            .select("id", { count: "exact", head: true })
            .eq("prueba_id", prueba.id)
            .is("ganador_id", null)
            .or("ronda.is.null,ronda.neq.automatico");
        if (error) throw new Error(error.message);
        if ((count ?? 0) > 0) {
            pendientes.push(`Quedan ${count} partidos sin resultado`);
        }
    }

    return pendientes;
}

export async function cambiarEstadoPrueba(entrada: unknown): Promise<AccionPrueba> {
    try {
        const parseo = esquema.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, estado: hasta, motivo } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: prueba, error } = await admin
            .from("pruebas")
            .select("id, slug, estado, fecha_inicio")
            .eq("id", pruebaId)
            .single<PruebaFila>();
        if (error || !prueba) return { ok: false, error: "Prueba no encontrada" };

        const desde = prueba.estado;
        if (desde === hasta) return { ok: true };

        if (!transicionPermitida(desde, hasta)) {
            return { ok: false, error: `No se puede pasar de ${desde} a ${hasta}` };
        }
        if (requiereMotivo(desde, hasta) && !motivo) {
            return { ok: false, error: "Reabrir las inscripciones requiere un motivo" };
        }

        const pendientes = await condicionesPara(admin, prueba, hasta);
        if (pendientes.length > 0) {
            return { ok: false, error: "Todavía no se puede cambiar el estado", pendientes };
        }

        const { error: errorUpdate } = await admin
            .from("pruebas")
            .update({ estado: hasta })
            .eq("id", pruebaId);
        if (errorUpdate) return { ok: false, error: errorUpdate.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "cambiar_estado_prueba",
            tabla: "pruebas",
            registroId: pruebaId,
            antes: { estado: desde },
            despues: { estado: hasta },
            motivo,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        revalidatePath("/");
        revalidatePath("/calendario");
        revalidatePath(`/pruebas/${prueba.slug}`);
        revalidatePath("/admin/pruebas");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}