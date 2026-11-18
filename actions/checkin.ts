"use server";

import { z } from "zod";
import {
    ESTADOS_QUE_OCUPAN_PLAZA,
    type Categoria,
    type EstadoInscripcion,
    type EstadoPrueba,
} from "@/lib/constantes";
import { exigirOrganizador, usuarioActual } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import { motivoNoCheckin } from "@/lib/checkin/reglas";
import { hoyEnMadrid } from "@/lib/ranking/cargar";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

export type FichaCheckin = {
    inscripcionId: string;
    pruebaNombre: string;
    fechaInicio: string;
    fechaFin: string;
    estadoPrueba: EstadoPrueba;
    categoria: Categoria;
    texto: string;
    estado: EstadoInscripcion;
    checkinAt: string | null;
    puedeRegistrar: boolean;
    motivoBloqueo: string | null;
    puedePagar: boolean;
};

export type AccionCheckin =
    | { ok: true; yaRegistrado: boolean }
    | { ok: false; error: string };

export type TokenCheckin = { token: string; checkinAt: string | null };

type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string };

const esquemaToken = z.object({ token: z.uuid() });
const esquemaInscripcion = z.object({ inscripcionId: z.uuid() });

type FilaCheckin = {
    id: string;
    categoria: Categoria;
    estado: EstadoInscripcion;
    checkin_at: string | null;
    jugador_1: string;
    jugador_2: string | null;
    prueba: {
        nombre: string;
        fecha_inicio: string;
        fecha_fin: string;
        estado: EstadoPrueba;
    } | null;
};

// Carga la inscripción por su token y calcula si se puede fichar.
async function cargarFicha(token: string): Promise<Resultado<FichaCheckin>> {
    const admin = crearClienteAdmin();

    const { data, error } = await admin
        .from("inscripciones")
        .select(
            "id, categoria, estado, checkin_at, jugador_1, jugador_2, prueba:pruebas(nombre, fecha_inicio, fecha_fin, estado)"
        )
        .eq("checkin_token", token)
        .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Código de check-in no válido" };

    const fila = data as unknown as FilaCheckin;
    if (!fila.prueba) return { ok: false, error: "La prueba de esta inscripción no existe" };

    const ids = [fila.jugador_1, fila.jugador_2].filter((x): x is string => Boolean(x));
    const { data: perfiles, error: errorPerfiles } = await admin
        .from("perfiles")
        .select("id, nombre")
        .in("id", ids);
    if (errorPerfiles) return { ok: false, error: errorPerfiles.message };

    const nombre = new Map<string, string>(
        (perfiles ?? []).map((p) => [p.id, p.nombre || "Jugador"])
    );
    const uno = nombre.get(fila.jugador_1) ?? "Jugador";
    const texto = fila.jugador_2
        ? `${uno} / ${nombre.get(fila.jugador_2) ?? "Jugador"}`
        : `${uno} (sin pareja)`;

    const motivo = motivoNoCheckin({
        estadoPrueba: fila.prueba.estado,
        fechaInicio: fila.prueba.fecha_inicio,
        fechaFin: fila.prueba.fecha_fin,
        hoy: hoyEnMadrid(),
        estadoInscripcion: fila.estado,
    });

    return {
        ok: true,
        datos: {
            inscripcionId: fila.id,
            pruebaNombre: fila.prueba.nombre,
            fechaInicio: fila.prueba.fecha_inicio,
            fechaFin: fila.prueba.fecha_fin,
            estadoPrueba: fila.prueba.estado,
            categoria: fila.categoria,
            texto,
            estado: fila.estado,
            checkinAt: fila.checkin_at,
            puedeRegistrar: fila.checkin_at === null && motivo === null,
            motivoBloqueo: fila.checkin_at === null ? motivo : null,
            puedePagar: fila.estado === "pendiente" || fila.estado === "confirmada",
        },
    };
}

// ---------------------------------------------------------
// 1. Ficha para el organizador (lo que ve al escanear el QR)
// ---------------------------------------------------------
export async function obtenerFichaCheckin(entrada: unknown): Promise<Resultado<FichaCheckin>> {
    try {
        const parseo = esquemaToken.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };
        return await cargarFicha(parseo.data.token);
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 2. Registrar la llegada de la pareja
// ---------------------------------------------------------
export async function registrarCheckin(entrada: unknown): Promise<AccionCheckin> {
    try {
        const parseo = esquemaToken.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };

        const ficha = await cargarFicha(parseo.data.token);
        if (!ficha.ok) return ficha;
        const f = ficha.datos;

        if (f.checkinAt) return { ok: true, yaRegistrado: true };
        if (!f.puedeRegistrar) {
            return { ok: false, error: f.motivoBloqueo ?? "No se puede registrar el check-in" };
        }

        const admin = crearClienteAdmin();
        const ahora = new Date().toISOString();

        // Solo escribe si nadie ha fichado antes: evita sobrescribir una hora ya guardada
        const { data, error } = await admin
            .from("inscripciones")
            .update({ checkin_at: ahora })
            .eq("id", f.inscripcionId)
            .is("checkin_at", null)
            .select("id")
            .maybeSingle();
        if (error) return { ok: false, error: error.message };
        if (!data) return { ok: true, yaRegistrado: true };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "registrar_checkin",
            tabla: "inscripciones",
            registroId: f.inscripcionId,
            antes: null,
            despues: { checkinAt: ahora },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        return { ok: true, yaRegistrado: false };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 3. Código QR del jugador (solo para quien forma parte de la inscripción)
// ---------------------------------------------------------
export async function obtenerTokenCheckin(entrada: unknown): Promise<Resultado<TokenCheckin>> {
    try {
        const parseo = esquemaInscripcion.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };

        const usuarioId = await usuarioActual();
        if (!usuarioId) return { ok: false, error: "Inicia sesión para ver tu código" };

        const supabase = await crearClienteServidor();
        const { data, error } = await supabase
            .from("inscripciones")
            .select("checkin_token, checkin_at, estado, jugador_1, jugador_2")
            .eq("id", parseo.data.inscripcionId)
            .maybeSingle();
        if (error) return { ok: false, error: error.message };
        if (!data) return { ok: false, error: "Inscripción no encontrada" };

        const esMiembro = data.jugador_1 === usuarioId || data.jugador_2 === usuarioId;
        if (!esMiembro) return { ok: false, error: "Esta inscripción no es tuya" };
        if (data.estado === "retirada") return { ok: false, error: "La inscripción está retirada" };

        return {
            ok: true,
            datos: { token: data.checkin_token, checkinAt: data.checkin_at },
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}