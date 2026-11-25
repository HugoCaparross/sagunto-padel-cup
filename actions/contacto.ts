"use server";

import { revalidatePath } from "next/cache";
import { exigirOrganizador, usuarioActual } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import {
    esquemaActualizarContacto,
    esquemaContacto,
    esquemaFiltroContacto,
    type EstadoContacto,
    type TipoContacto,
} from "@/lib/validadores/contacto";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

export type AccionContacto = { ok: true } | { ok: false; error: string };

export type ContactoFila = {
    id: string;
    tipo: TipoContacto;
    nombre: string;
    email: string;
    mensaje: string;
    estado: EstadoContacto;
    notasInternas: string | null;
    identificado: boolean;
    createdAt: string;
    respondidaAt: string | null;
};

type Fila = {
    id: string;
    tipo: TipoContacto;
    nombre: string;
    email: string;
    mensaje: string;
    estado: EstadoContacto;
    notas_internas: string | null;
    perfil_id: string | null;
    created_at: string;
    respondida_at: string | null;
};

const MAX_MENSAJES_POR_HORA = 3;

// ---------------------------------------------------------
// 1. Envío público (consulta, sugerencia o patrocinio)
// Las sugerencias exigen sesión. Las consultas pueden ser anónimas.
// ---------------------------------------------------------
export async function enviarContacto(entrada: unknown): Promise<AccionContacto> {
    try {
        const parseo = esquemaContacto.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        // Campo trampa relleno: se trata como enviado sin guardar nada
        if (d.web && d.web.length > 0) return { ok: true };

        const usuarioId = await usuarioActual();
        if (d.tipo === "sugerencia" && !usuarioId) {
            return { ok: false, error: "Inicia sesión para enviar una sugerencia" };
        }

        const email = d.email.toLowerCase();
        const admin = crearClienteAdmin();

        const hace1Hora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count, error: errorConteo } = await admin
            .from("contactos")
            .select("id", { count: "exact", head: true })
            .eq("email", email)
            .gte("created_at", hace1Hora);
        if (errorConteo) return { ok: false, error: errorConteo.message };

        if ((count ?? 0) >= MAX_MENSAJES_POR_HORA) {
            return {
                ok: false,
                error: "Has enviado varios mensajes seguidos. Inténtalo más tarde.",
            };
        }

        // Versión vigente de la política de privacidad en el momento del envío
        const { data: privacidad, error: errorPrivacidad } = await admin
            .from("documentos_legales")
            .select("id")
            .eq("tipo", "privacidad")
            .eq("vigente", true)
            .maybeSingle();
        if (errorPrivacidad) return { ok: false, error: errorPrivacidad.message };
        if (!privacidad) {
            return {
                ok: false,
                error: "El formulario no está disponible: falta publicar la política de privacidad",
            };
        }

        const { error } = await admin.from("contactos").insert({
            tipo: d.tipo,
            nombre: d.nombre,
            email,
            mensaje: d.mensaje,
            perfil_id: usuarioId,
            consentimiento_at: new Date().toISOString(),
            documento_privacidad_id: privacidad.id,
        });
        if (error) return { ok: false, error: error.message };

        revalidatePath("/admin/contactos");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 2. Bandeja del organizador
// ---------------------------------------------------------
export async function listarContactos(
    entrada: unknown = {}
): Promise<{ ok: true; filas: ContactoFila[] } | { ok: false; error: string }> {
    try {
        const parseo = esquemaFiltroContacto.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };

        const supabase = await crearClienteServidor();
        const base = supabase
            .from("contactos")
            .select(
                "id, tipo, nombre, email, mensaje, estado, notas_internas, perfil_id, created_at, respondida_at"
            )
            .order("created_at", { ascending: false })
            .limit(200);

        const { data, error } = parseo.data.estado
            ? await base.eq("estado", parseo.data.estado)
            : await base;
        if (error) return { ok: false, error: error.message };

        const filas = ((data ?? []) as unknown as Fila[]).map(
            (f): ContactoFila => ({
                id: f.id,
                tipo: f.tipo,
                nombre: f.nombre,
                email: f.email,
                mensaje: f.mensaje,
                estado: f.estado,
                notasInternas: f.notas_internas,
                identificado: f.perfil_id !== null,
                createdAt: f.created_at,
                respondidaAt: f.respondida_at,
            })
        );

        return { ok: true, filas };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 3. Cambiar estado o notas internas
// El mensaje original no se puede editar ni borrar desde el panel.
// ---------------------------------------------------------
export async function actualizarContacto(entrada: unknown): Promise<AccionContacto> {
    try {
        const parseo = esquemaActualizarContacto.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };

        const supabase = await crearClienteServidor();

        const { data: previo, error: errorPrevio } = await supabase
            .from("contactos")
            .select("estado, notas_internas, respondida_at")
            .eq("id", d.id)
            .single();
        if (errorPrevio || !previo) return { ok: false, error: "Contacto no encontrado" };

        const cambios: {
            estado?: EstadoContacto;
            notas_internas?: string | null;
            respondida_at?: string;
        } = {};

        if (d.estado) {
            cambios.estado = d.estado;
            if (d.estado === "respondida" && !previo.respondida_at) {
                cambios.respondida_at = new Date().toISOString();
            }
        }
        if (d.notasInternas !== undefined) {
            cambios.notas_internas = d.notasInternas;
        }

        if (Object.keys(cambios).length === 0) return { ok: true };

        const { error } = await supabase.from("contactos").update(cambios).eq("id", d.id);
        if (error) return { ok: false, error: error.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "actualizar_contacto",
            tabla: "contactos",
            registroId: d.id,
            antes: { estado: previo.estado },
            despues: { estado: cambios.estado ?? previo.estado },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        revalidatePath("/admin/contactos");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}
