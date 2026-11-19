"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    CATEGORIAS,
    ESTADOS_PRUEBA,
    ESTADOS_QUE_OCUPAN_PLAZA,
    type Categoria,
    type EstadoPrueba,
} from "@/lib/constantes";
import { exigirOrganizador } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import { slugificar } from "@/lib/formato";
import { REQUISITOS, type TipoDocumento } from "@/lib/legal/requisitos";
import { requiereMotivo, transicionPermitida } from "@/lib/pruebas/transiciones";
import { esquemaCrearPrueba } from "@/lib/validadores/prueba";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type AccionPrueba =
    | { ok: true }
    | { ok: false; error: string; pendientes?: string[] };

export type AccionCrearPrueba =
    | { ok: true; id: string; slug: string }
    | { ok: false; error: string };

export type PruebaAdminFila = {
    id: string;
    slug: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    sede: string;
    estado: EstadoPrueba;
    esMaster: boolean;
    precioCentimos: number;
    plazasMaximas: number;
    ocupadas: number;
    categorias: Categoria[];
};

type Admin = ReturnType<typeof crearClienteAdmin>;

type PruebaRow = {
    id: string;
    slug: string;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    sede: string;
    estado: EstadoPrueba;
    es_master: boolean;
    precio_pareja_centimos: number;
    plazas_maximas: number;
};

const esquemaCambiar = z.object({
    pruebaId: z.uuid(),
    estado: z.enum(ESTADOS_PRUEBA),
    motivo: z
        .string()
        .trim()
        .min(10, "El motivo debe tener al menos 10 caracteres")
        .max(500)
        .optional(),
});

function hoyEnMadrid(): string {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
}

// ---------------------------------------------------------
// LISTADO
// ---------------------------------------------------------
export async function listarPruebasAdmin(): Promise<
    { ok: true; pruebas: PruebaAdminFila[] } | { ok: false; error: string }
> {
    try {
        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: pruebas, error } = await admin
            .from("pruebas")
            .select(
                "id, slug, nombre, fecha_inicio, fecha_fin, sede, estado, es_master, precio_pareja_centimos, plazas_maximas"
            )
            .order("fecha_inicio", { ascending: true });
        if (error) return { ok: false, error: error.message };

        const { data: categorias, error: errorCats } = await admin
            .from("prueba_categorias")
            .select("prueba_id, categoria");
        if (errorCats) return { ok: false, error: errorCats.message };

        const { data: inscritas, error: errorInsc } = await admin
            .from("inscripciones")
            .select("prueba_id")
            .in("estado", [...ESTADOS_QUE_OCUPAN_PLAZA]);
        if (errorInsc) return { ok: false, error: errorInsc.message };

        const ocupadas = new Map<string, number>();
        for (const i of (inscritas ?? []) as { prueba_id: string }[]) {
            ocupadas.set(i.prueba_id, (ocupadas.get(i.prueba_id) ?? 0) + 1);
        }

        const categoriasDe = new Map<string, Categoria[]>();
        for (const c of (categorias ?? []) as { prueba_id: string; categoria: Categoria }[]) {
            const lista = categoriasDe.get(c.prueba_id) ?? [];
            lista.push(c.categoria);
            categoriasDe.set(c.prueba_id, lista);
        }

        const filas = ((pruebas ?? []) as unknown as PruebaRow[]).map((p): PruebaAdminFila => ({
            id: p.id,
            slug: p.slug,
            nombre: p.nombre,
            fechaInicio: p.fecha_inicio,
            fechaFin: p.fecha_fin,
            sede: p.sede,
            estado: p.estado,
            esMaster: p.es_master,
            precioCentimos: p.precio_pareja_centimos,
            plazasMaximas: p.plazas_maximas,
            ocupadas: ocupadas.get(p.id) ?? 0,
            categorias: CATEGORIAS.filter((c) => (categoriasDe.get(p.id) ?? []).includes(c)),
        }));

        return { ok: true, pruebas: filas };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// CREAR
// Asigna la temporada activa. Si falla la creación de categorías, borra la prueba.
// ---------------------------------------------------------
export async function crearPrueba(entrada: unknown): Promise<AccionCrearPrueba> {
    try {
        const parseo = esquemaCrearPrueba.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: temporada, error: errorTemp } = await admin
            .from("temporadas")
            .select("id")
            .eq("activa", true)
            .maybeSingle<{ id: number }>();
        if (errorTemp) return { ok: false, error: errorTemp.message };
        if (!temporada) return { ok: false, error: "No hay una temporada activa" };

        const slug = d.slug ?? slugificar(d.nombre);
        if (!slug) return { ok: false, error: "No se pudo generar un slug con ese nombre" };

        const { data: prueba, error } = await admin
            .from("pruebas")
            .insert({
                temporada_id: temporada.id,
                slug,
                nombre: d.nombre,
                fecha_inicio: d.fechaInicio,
                fecha_fin: d.fechaFin,
                hora_inicio: d.horaInicio,
                hora_fin: d.horaFin,
                sede: d.sede,
                sede_url: d.sedeUrl ?? null,
                precio_pareja_centimos: d.precioCentimos,
                es_master: d.esMaster,
                estado: "proxima",
                plazas_maximas: d.plazasMaximas,
            })
            .select("id")
            .single<{ id: string }>();
        if (error) {
            return {
                ok: false,
                error: error.code === "23505" ? "Ya existe una prueba con ese slug" : error.message,
            };
        }

        const { error: errorCats } = await admin
            .from("prueba_categorias")
            .insert(d.categorias.map((c) => ({ prueba_id: prueba.id, categoria: c })));
        if (errorCats) {
            await admin.from("pruebas").delete().eq("id", prueba.id);
            return { ok: false, error: errorCats.message };
        }

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "crear_prueba",
            tabla: "pruebas",
            registroId: prueba.id,
            despues: { nombre: d.nombre, slug, categorias: d.categorias, plazas: d.plazasMaximas },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        revalidatePath("/admin/pruebas");
        revalidatePath("/calendario");
        revalidatePath("/");
        return { ok: true, id: prueba.id, slug };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// CAMBIO DE ESTADO
// ---------------------------------------------------------
async function condicionesPara(
    admin: Admin,
    prueba: { id: string; fecha_inicio: string },
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
        if ((count ?? 0) > 0) pendientes.push(`Quedan ${count} partidos sin resultado`);
    }

    return pendientes;
}

export async function cambiarEstadoPrueba(entrada: unknown): Promise<AccionPrueba> {
    try {
        const parseo = esquemaCambiar.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, estado: hasta, motivo } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: prueba, error } = await admin
            .from("pruebas")
            .select("id, slug, estado, fecha_inicio")
            .eq("id", pruebaId)
            .single<{ id: string; slug: string; estado: EstadoPrueba; fecha_inicio: string }>();
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