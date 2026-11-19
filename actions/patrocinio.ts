"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirOrganizador } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import { instanteMadrid } from "@/lib/horarios/tiempo";
import {
    esquemaActivo,
    esquemaAsignacion,
    esquemaEliminarPremio,
    esquemaPatrocinador,
    esquemaPremio,
} from "@/lib/validadores/patrocinio";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type AccionPatrocinio = { ok: true; id?: string } | { ok: false; error: string };

function mensaje(e: unknown): string {
    return e instanceof Error ? e.message : "Error inesperado";
}

function refrescar() {
    revalidatePath("/admin/patrocinio");
    revalidatePath("/patrocinadores");
    revalidatePath("/patrocinadores/historico");
    revalidatePath("/premios");
}

// ---------------------------------------------------------
// Patrocinadores
// ---------------------------------------------------------
export async function guardarPatrocinador(entrada: unknown): Promise<AccionPatrocinio> {
    try {
        const parseo = esquemaPatrocinador.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const fila = {
            nombre: d.nombre,
            logo_url: d.logoUrl,
            web_url: d.webUrl,
            tipo: d.tipo,
        };

        if (d.id) {
            const { error } = await admin.from("patrocinadores").update(fila).eq("id", d.id);
            if (error) return { ok: false, error: error.message };

            const errorAuditoria = await registrarAuditoria({
                usuarioId,
                accion: "editar_patrocinador",
                tabla: "patrocinadores",
                registroId: d.id,
                despues: fila,
            });
            if (errorAuditoria) return { ok: false, error: errorAuditoria };

            refrescar();
            return { ok: true, id: d.id };
        }

        const { data, error } = await admin
            .from("patrocinadores")
            .insert({ ...fila, activo: true })
            .select("id")
            .single<{ id: string }>();
        if (error) return { ok: false, error: error.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "crear_patrocinador",
            tabla: "patrocinadores",
            registroId: data.id,
            despues: fila,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        refrescar();
        return { ok: true, id: data.id };
    } catch (e) {
        return { ok: false, error: mensaje(e) };
    }
}

export async function cambiarActivoPatrocinador(entrada: unknown): Promise<AccionPatrocinio> {
    try {
        const parseo = esquemaActivo.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { id, activo } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { error } = await admin.from("patrocinadores").update({ activo }).eq("id", id);
        if (error) return { ok: false, error: error.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: activo ? "activar_patrocinador" : "desactivar_patrocinador",
            tabla: "patrocinadores",
            registroId: id,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        refrescar();
        return { ok: true };
    } catch (e) {
        return { ok: false, error: mensaje(e) };
    }
}

// Asigna o quita un patrocinador de una prueba.
export async function asignarPatrocinador(entrada: unknown): Promise<AccionPatrocinio> {
    try {
        const parseo = esquemaAsignacion.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, patrocinadorId, asignar } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        if (asignar) {
            const { error } = await admin
                .from("prueba_patrocinadores")
                .upsert(
                    { prueba_id: pruebaId, patrocinador_id: patrocinadorId },
                    { onConflict: "prueba_id,patrocinador_id" }
                );
            if (error) return { ok: false, error: error.message };
        } else {
            const { error } = await admin
                .from("prueba_patrocinadores")
                .delete()
                .eq("prueba_id", pruebaId)
                .eq("patrocinador_id", patrocinadorId);
            if (error) return { ok: false, error: error.message };
        }

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: asignar ? "asignar_patrocinador" : "quitar_patrocinador",
            tabla: "prueba_patrocinadores",
            registroId: `${pruebaId}:${patrocinadorId}`,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        refrescar();
        return { ok: true };
    } catch (e) {
        return { ok: false, error: mensaje(e) };
    }
}

// ---------------------------------------------------------
// Premios
// ---------------------------------------------------------
// Crea o sustituye el premio de una prueba, categoría y cuadro.
export async function guardarPremio(entrada: unknown): Promise<AccionPatrocinio> {
    try {
        const parseo = esquemaPremio.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const fila = {
            prueba_id: d.pruebaId,
            categoria: d.categoria,
            cuadro: d.cuadro,
            descripcion: d.descripcion,
            revelar_at: d.revelarEl ? instanteMadrid(d.revelarEl, 0) : null,
        };

        const { data, error } = await admin
            .from("premios")
            .upsert(fila, { onConflict: "prueba_id,categoria,cuadro" })
            .select("id")
            .single<{ id: string }>();
        if (error) return { ok: false, error: error.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "guardar_premio",
            tabla: "premios",
            registroId: data.id,
            despues: fila,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        refrescar();
        return { ok: true, id: data.id };
    } catch (e) {
        return { ok: false, error: mensaje(e) };
    }
}

export async function eliminarPremio(entrada: unknown): Promise<AccionPatrocinio> {
    try {
        const parseo = esquemaEliminarPremio.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { id, motivo } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: previo, error: errorPrevio } = await admin
            .from("premios")
            .select("prueba_id, categoria, cuadro, descripcion, revelar_at")
            .eq("id", id)
            .maybeSingle();
        if (errorPrevio) return { ok: false, error: errorPrevio.message };
        if (!previo) return { ok: false, error: "Premio no encontrado" };

        const { error } = await admin.from("premios").delete().eq("id", id);
        if (error) return { ok: false, error: error.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "eliminar_premio",
            tabla: "premios",
            registroId: id,
            antes: previo,
            motivo,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        refrescar();
        return { ok: true };
    } catch (e) {
        return { ok: false, error: mensaje(e) };
    }
}