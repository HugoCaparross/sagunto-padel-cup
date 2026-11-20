"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    CATEGORIAS,
    ESTADOS_QUE_OCUPAN_PLAZA,
    type Categoria,
    type EstadoInscripcion,
    type EstadoPrueba,
} from "@/lib/constantes";
import { exigirOrganizador } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import { notificarInscripcion } from "@/lib/email/notificaciones";
import { ESTADOS_CON_INSCRITOS_PUBLICOS } from "@/lib/pruebas/transiciones";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type AccionInscrito = { ok: true } | { ok: false; error: string };

export type FilaInscrito = {
    inscripcionId: string;
    categoria: Categoria;
    texto: string;
    ocupaPlaza: boolean;
    estado: EstadoInscripcion | null; // solo se rellena para el organizador
};

export type ConsultaInscritos =
    | { ok: true; filas: FilaInscrito[]; esOrganizador: boolean }
    | { ok: false; error: string };

const esquemaId = z.object({ inscripcionId: z.uuid() });

const esquemaListar = z.object({
    pruebaId: z.uuid(),
    categoria: z.enum(CATEGORIAS).optional(),
});

type Admin = ReturnType<typeof crearClienteAdmin>;

type InscritaFila = {
    id: string;
    categoria: Categoria;
    jugador_1: string;
    jugador_2: string | null;
    estado: EstadoInscripcion;
};

// Cambia el estado de una inscripción solo si está en uno de los estados permitidos.
async function cambiarEstadoInscripcion(p: {
    inscripcionId: string;
    desde: EstadoInscripcion[];
    hasta: EstadoInscripcion;
    accion: string;
    mensajeError: string;
}): Promise<AccionInscrito> {
    const usuarioId = await exigirOrganizador();
    if (!usuarioId) return { ok: false, error: "No autorizado" };
    const admin: Admin = crearClienteAdmin();

    const { data: insc, error } = await admin
        .from("inscripciones")
        .select("id, estado")
        .eq("id", p.inscripcionId)
        .maybeSingle<{ id: string; estado: EstadoInscripcion }>();
    if (error) return { ok: false, error: error.message };
    if (!insc) return { ok: false, error: "Inscripción no encontrada" };
    if (!p.desde.includes(insc.estado)) return { ok: false, error: p.mensajeError };

    const { error: errorUpdate } = await admin
        .from("inscripciones")
        .update({ estado: p.hasta })
        .eq("id", p.inscripcionId);
    if (errorUpdate) return { ok: false, error: errorUpdate.message };

    const errorAuditoria = await registrarAuditoria({
        usuarioId,
        accion: p.accion,
        tabla: "inscripciones",
        registroId: p.inscripcionId,
        antes: { estado: insc.estado },
        despues: { estado: p.hasta },
    });
    if (errorAuditoria) return { ok: false, error: errorAuditoria };

    revalidatePath("/admin/inscripciones");
    revalidatePath("/admin/pruebas");
    revalidatePath("/cuenta/inscripciones");
    return { ok: true };
}

// ---------------------------------------------------------
// 1. Confirmar una inscripción pendiente (avisa por email)
// ---------------------------------------------------------
export async function confirmarInscripcion(entrada: unknown): Promise<AccionInscrito> {
    try {
        const parseo = esquemaId.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { inscripcionId } = parseo.data;

        const res = await cambiarEstadoInscripcion({
            inscripcionId,
            desde: ["pendiente"],
            hasta: "confirmada",
            accion: "confirmar_inscripcion",
            mensajeError: "Solo se confirman inscripciones pendientes",
        });

        if (res.ok) await notificarInscripcion(inscripcionId, "confirmada");
        return res;
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 2. Marcar como pagada en la prueba (pago en efectivo, sin importe guardado)
// No envía email: el pago se da en persona el día de la prueba.
// ---------------------------------------------------------
export async function marcarPagadaEnPrueba(entrada: unknown): Promise<AccionInscrito> {
    try {
        const parseo = esquemaId.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };

        return await cambiarEstadoInscripcion({
            inscripcionId: parseo.data.inscripcionId,
            desde: ["pendiente", "confirmada"],
            hasta: "pagada_en_prueba",
            accion: "marcar_pagada_en_prueba",
            mensajeError: "Solo se marcan como pagadas las inscripciones pendientes o confirmadas",
        });
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 3. Lista de inscritos
// Organizador: todo, con estado y nombres completos.
// Público: solo cuando las inscripciones están cerradas, y nombres según visibilidad.
// ---------------------------------------------------------
export async function listarInscritos(entrada: unknown): Promise<ConsultaInscritos> {
    try {
        const parseo = esquemaListar.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria } = parseo.data;

        const esOrganizador = (await exigirOrganizador()) !== null;
        const admin: Admin = crearClienteAdmin();

        const { data: prueba, error: errorPrueba } = await admin
            .from("pruebas")
            .select("estado")
            .eq("id", pruebaId)
            .maybeSingle<{ estado: EstadoPrueba }>();
        if (errorPrueba) return { ok: false, error: errorPrueba.message };
        if (!prueba) return { ok: false, error: "Prueba no encontrada" };

        if (!esOrganizador && !ESTADOS_CON_INSCRITOS_PUBLICOS.includes(prueba.estado)) {
            return {
                ok: false,
                error: "Los inscritos se publicarán cuando se cierren las inscripciones",
            };
        }

        const base = admin
            .from("inscripciones")
            .select("id, categoria, jugador_1, jugador_2, estado")
            .eq("prueba_id", pruebaId)
            .neq("estado", "retirada")
            .order("created_at", { ascending: true });

        const { data, error } = categoria ? await base.eq("categoria", categoria) : await base;
        if (error) return { ok: false, error: error.message };

        const filasBD = (data ?? []) as InscritaFila[];

        const ids = [
            ...new Set(
                filasBD.flatMap((i) =>
                    [i.jugador_1, i.jugador_2].filter((x): x is string => Boolean(x))
                )
            ),
        ];

        const perfiles = new Map<string, { nombre: string; visible: boolean }>();
        if (ids.length > 0) {
            const { data: pf, error: errorPf } = await admin
                .from("perfiles")
                .select("id, nombre, visibilidad_publica")
                .in("id", ids);
            if (errorPf) return { ok: false, error: errorPf.message };

            for (const p of (pf ?? []) as {
                id: string;
                nombre: string;
                visibilidad_publica: boolean;
            }[]) {
                perfiles.set(p.id, { nombre: p.nombre, visible: p.visibilidad_publica });
            }
        }

        const nombre = (id: string): string => {
            const p = perfiles.get(id);
            if (!p) return "Jugador";
            if (esOrganizador || p.visible) return p.nombre || "Jugador";
            return "Jugador privado";
        };

        const filas: FilaInscrito[] = filasBD.map((i) => ({
            inscripcionId: i.id,
            categoria: i.categoria,
            texto: i.jugador_2
                ? `${nombre(i.jugador_1)} / ${nombre(i.jugador_2)}`
                : `${nombre(i.jugador_1)} (sin pareja)`,
            ocupaPlaza: (ESTADOS_QUE_OCUPAN_PLAZA as readonly string[]).includes(i.estado),
            estado: esOrganizador ? i.estado : null,
        }));

        return { ok: true, filas, esOrganizador };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}