"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirOrganizador } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import { aCsv } from "@/lib/ajustes/exportar";
import { cargarListadoJugadores } from "@/lib/jugadores/admin-datos";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type AccionAjustes = { ok: true } | { ok: false; error: string };

export type Exportacion =
    | { ok: true; nombre: string; contenido: string }
    | { ok: false; error: string };

const RECURSOS = ["jugadores", "inscripciones", "puntos", "auditoria"] as const;
type Recurso = (typeof RECURSOS)[number];

const esquemaExportar = z.object({ recurso: z.enum(RECURSOS) });

const esquemaRol = z.object({
    perfilId: z.uuid(),
    rol: z.enum(["jugador", "organizador"]),
    motivo: z.string().trim().min(10, "El motivo debe tener al menos 10 caracteres").max(500),
});

type InscripcionExport = { jugador_1: string; jugador_2: string | null };

function hoy(): string {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
}

// ---------------------------------------------------------
// 1. Exportar datos (queda registrado en auditoría)
// ---------------------------------------------------------
export async function exportarDatos(entrada: unknown): Promise<Exportacion> {
    try {
        const parseo = esquemaExportar.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const recurso: Recurso = parseo.data.recurso;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        let cabecera: string[];
        let filas: (string | number | boolean | null)[][];

        if (recurso === "jugadores") {
            const jugadores = await cargarListadoJugadores();
            cabecera = ["Nombre", "Email", "Rol", "Perfil público", "Perfil completo", "Inscripciones activas", "Pruebas", "Puntos", "Última inscripción"];
            filas = jugadores.map((j) => [
                j.nombre, j.email, j.rol, j.visible, j.onboardingCompleto,
                j.inscripcionesActivas, j.pruebasJugadas, j.puntos, j.ultimaActividad,
            ]);
        } else if (recurso === "inscripciones") {
            const { data, error } = await admin
                .from("inscripciones")
                .select("categoria, estado, checkin_at, created_at, jugador_1, jugador_2, prueba:pruebas(nombre)")
                .order("created_at", { ascending: true });
            if (error) return { ok: false, error: error.message };

            const nombres = await nombresDe(admin, data ?? []);
            cabecera = ["Prueba", "Categoría", "Estado", "Llegada", "Jugador 1", "Jugador 2", "Alta"];
            filas = (data ?? []).map((i) => [
                i.prueba?.[0]?.nombre ?? "", i.categoria, i.estado, i.checkin_at,
                nombres.get(i.jugador_1) ?? "", i.jugador_2 ? (nombres.get(i.jugador_2) ?? "") : "", i.created_at,
            ]);
        } else if (recurso === "puntos") {
            const { data, error } = await admin
                .from("puntos_prueba")
                .select("fecha, categoria, cuadro, ronda, puntos, jugador_id, prueba:pruebas(nombre)")
                .order("fecha", { ascending: true });
            if (error) return { ok: false, error: error.message };

            const nombres = await nombresDePerfiles(admin, [...new Set((data ?? []).map((p) => p.jugador_id))]);
            cabecera = ["Fecha", "Prueba", "Jugador", "Categoría", "Cuadro", "Ronda", "Puntos"];
            filas = (data ?? []).map((p) => [
                p.fecha, p.prueba?.[0]?.nombre ?? "", nombres.get(p.jugador_id) ?? "",
                p.categoria, p.cuadro, p.ronda, p.puntos,
            ]);
        } else {
            const { data, error } = await admin
                .from("auditoria")
                .select("created_at, usuario_id, accion, tabla, registro_id, motivo")
                .order("created_at", { ascending: false })
                .limit(5000);
            if (error) return { ok: false, error: error.message };

            const usuarioIds = [...new Set((data ?? []).flatMap((a) => a.usuario_id ? [a.usuario_id] : []))];
            const nombres = await nombresDePerfiles(admin, usuarioIds);
            cabecera = ["Fecha", "Usuario", "Acción", "Tabla", "Registro", "Motivo"];
            filas = (data ?? []).map((a) => [
                a.created_at, a.usuario_id ? (nombres.get(a.usuario_id) ?? "") : "Sistema",
                a.accion, a.tabla, a.registro_id, a.motivo,
            ]);
        }

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "exportar_datos",
            tabla: recurso,
            registroId: recurso,
            despues: { filas: filas.length },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        return {
            ok: true,
            nombre: `sagunto-${recurso}-${hoy()}.csv`,
            contenido: "\uFEFF" + aCsv(cabecera, filas),
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

async function nombresDePerfiles(
    admin: ReturnType<typeof crearClienteAdmin>,
    ids: string[]
): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    const limpios = ids.filter(Boolean);
    if (limpios.length === 0) return mapa;
    const { data } = await admin.from("perfiles").select("id, nombre").in("id", limpios);
    for (const p of (data ?? []) as { id: string; nombre: string }[]) {
        mapa.set(p.id, p.nombre || "Jugador");
    }
    return mapa;
}

async function nombresDe(
    admin: ReturnType<typeof crearClienteAdmin>,
    inscripciones: InscripcionExport[]
): Promise<Map<string, string>> {
    const ids = inscripciones.flatMap((i) => i.jugador_2 ? [i.jugador_1, i.jugador_2] : [i.jugador_1]);
    return nombresDePerfiles(admin, [...new Set(ids)]);
}

// ---------------------------------------------------------
// 2. Cambiar el rol de un jugador
// ---------------------------------------------------------
export async function cambiarRol(entrada: unknown): Promise<AccionAjustes> {
    try {
        const parseo = esquemaRol.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { perfilId, rol, motivo } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };

        if (perfilId === usuarioId && rol === "jugador") {
            return { ok: false, error: "No puedes quitarte tu propio rol de organizador" };
        }

        const admin = crearClienteAdmin();

        const { data: previo, error: errorPrevio } = await admin
            .from("perfiles")
            .select("rol")
            .eq("id", perfilId)
            .single<{ rol: string }>();
        if (errorPrevio || !previo) return { ok: false, error: "Perfil no encontrado" };

        if (previo.rol === rol) return { ok: true };

        const { error } = await admin.from("perfiles").update({ rol }).eq("id", perfilId);
        if (error) return { ok: false, error: error.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "cambiar_rol",
            tabla: "perfiles",
            registroId: perfilId,
            antes: { rol: previo.rol },
            despues: { rol },
            motivo,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        revalidatePath("/admin/ajustes");
        revalidatePath("/admin/jugadores");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}