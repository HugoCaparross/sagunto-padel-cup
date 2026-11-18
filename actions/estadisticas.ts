"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Cuadro } from "@/lib/constantes";
import {
    duelos,
    estadisticasJugador,
    type EstadisticasJugador,
    type ModoDuelo,
    type PartidoHistorial,
    type PuntoHistorial,
    type ResultadoDuelo,
    type SetJuego,
} from "@/lib/estadisticas/calcular";
import {
    DATOS_DEPORTIVOS_VACIOS,
    esquemaDatosDeportivos,
    type DatosDeportivos,
} from "@/lib/validadores/datos-deportivos";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

export type PerfilEstadistico = {
    id: string;
    nombre: string;
    visible: boolean;
    datosDeportivos: DatosDeportivos | null;
    estadisticas: EstadisticasJugador;
};

export type ConsultaPerfil =
    | { ok: true; perfil: PerfilEstadistico }
    | { ok: false; error: string };

export type ConsultaDuelos =
    | {
        ok: true;
        resultado: ResultadoDuelo;
        nombresA: string[];
        nombresB: string[];
    }
    | { ok: false; error: string };

export type AccionDatos = { ok: true } | { ok: false; error: string };

type Admin = ReturnType<typeof crearClienteAdmin>;

const esquemaPerfil = z.object({ jugadorId: z.uuid() });

const esquemaDuelos = z.object({
    ladoA: z.array(z.uuid()).min(1).max(2),
    ladoB: z.array(z.uuid()).min(1).max(2),
    modo: z.enum(["contiene", "exacto"]),
});

// ---------------------------------------------------------
// INTERNOS
// ---------------------------------------------------------
function leer<T>(
    nombre: string,
    r: { data: unknown[] | null; error: { message: string } | null }
): T[] {
    if (r.error) throw new Error(`Error leyendo ${nombre}: ${r.error.message}`);
    return (r.data ?? []) as T[];
}

async function usuarioActual(): Promise<string | null> {
    const supabase = await crearClienteServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
}

async function esOrganizador(usuarioId: string | null): Promise<boolean> {
    if (!usuarioId) return false;
    const supabase = await crearClienteServidor();
    const { data } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", usuarioId)
        .single();
    return data?.rol === "organizador";
}

type PerfilFila = {
    id: string;
    nombre: string;
    visibilidad_publica: boolean;
    datos_deportivos: unknown;
};

// Carga todo el historial de resultados terminados.
async function cargarHistorial(admin: Admin): Promise<{
    partidos: PartidoHistorial[];
    puntos: PuntoHistorial[];
    perfiles: Map<string, PerfilFila>;
}> {
    const inscripciones = leer<{ id: string; jugador_1: string; jugador_2: string | null }>(
        "inscripciones",
        await admin.from("inscripciones").select("id, jugador_1, jugador_2")
    );
    const jugadoresDe = new Map<string, string[]>(
        inscripciones.map((i) => [
            i.id,
            [i.jugador_1, ...(i.jugador_2 ? [i.jugador_2] : [])],
        ])
    );

    const partidosFila = leer<{
        id: string;
        prueba_id: string;
        inscripcion_a: string | null;
        inscripcion_b: string | null;
        ganador_id: string | null;
        resultado: SetJuego[] | null;
    }>(
        "partidos",
        await admin
            .from("partidos")
            .select("id, prueba_id, inscripcion_a, inscripcion_b, ganador_id, resultado")
            .not("ganador_id", "is", null)
    );

    const partidos: PartidoHistorial[] = [];
    for (const p of partidosFila) {
        if (!p.inscripcion_a || !p.inscripcion_b || !p.ganador_id) continue;
        partidos.push({
            id: p.id,
            pruebaId: p.prueba_id,
            ladoA: jugadoresDe.get(p.inscripcion_a) ?? [],
            ladoB: jugadoresDe.get(p.inscripcion_b) ?? [],
            sets: p.resultado ?? [],
            ganador: p.ganador_id === p.inscripcion_a ? "A" : "B",
        });
    }

    const puntosFila = leer<{
        inscripcion_id: string;
        jugador_id: string;
        prueba_id: string;
        ronda: string;
        cuadro: Cuadro;
    }>(
        "puntos_prueba",
        await admin
            .from("puntos_prueba")
            .select("inscripcion_id, jugador_id, prueba_id, ronda, cuadro")
    );
    const puntos: PuntoHistorial[] = puntosFila.map((p) => ({
        jugadorId: p.jugador_id,
        pruebaId: p.prueba_id,
        ronda: p.ronda,
        cuadro: p.cuadro,
    }));

    const perfiles = new Map<string, PerfilFila>(
        leer<PerfilFila>(
            "perfiles",
            await admin
                .from("perfiles")
                .select("id, nombre, visibilidad_publica, datos_deportivos")
        ).map((p) => [p.id, p])
    );

    return { partidos, puntos, perfiles };
}

function puedeVerPerfil(
    perfil: PerfilFila,
    usuarioId: string | null,
    organizador: boolean
): boolean {
    return perfil.visibilidad_publica || organizador || usuarioId === perfil.id;
}

function datosSeguros(valor: unknown): DatosDeportivos | null {
    const parseo = esquemaDatosDeportivos.safeParse(valor);
    return parseo.success ? parseo.data : null;
}

// ---------------------------------------------------------
// 1. Datos deportivos del propio jugador
// ---------------------------------------------------------
export async function actualizarDatosDeportivos(entrada: unknown): Promise<AccionDatos> {
    try {
        const parseo = esquemaDatosDeportivos.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };

        const usuarioId = await usuarioActual();
        if (!usuarioId) return { ok: false, error: "Inicia sesión para editar tus datos" };

        const supabase = await crearClienteServidor();
        const { error } = await supabase
            .from("perfiles")
            .update({ datos_deportivos: parseo.data })
            .eq("id", usuarioId);
        if (error) return { ok: false, error: error.message };

        revalidatePath("/cuenta/perfil");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 2. Perfil estadístico de un jugador
// Público si tiene visibilidad activada; si no, solo lo ve él o un organizador.
// ---------------------------------------------------------
export async function obtenerPerfilEstadistico(entrada: unknown): Promise<ConsultaPerfil> {
    try {
        const parseo = esquemaPerfil.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { jugadorId } = parseo.data;

        const admin = crearClienteAdmin();
        const { partidos, puntos, perfiles } = await cargarHistorial(admin);

        const perfil = perfiles.get(jugadorId);
        if (!perfil) return { ok: false, error: "Jugador no encontrado" };

        const usuarioId = await usuarioActual();
        const organizador = await esOrganizador(usuarioId);
        if (!puedeVerPerfil(perfil, usuarioId, organizador)) {
            return { ok: false, error: "Este perfil es privado" };
        }

        const visible = perfil.visibilidad_publica;
        return {
            ok: true,
            perfil: {
                id: perfil.id,
                nombre: perfil.nombre || "Jugador",
                visible,
                datosDeportivos: visible ? datosSeguros(perfil.datos_deportivos) : null,
                estadisticas: estadisticasJugador(jugadorId, partidos, puntos),
            },
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 3. Enfrentamientos entre dos bandos
// Las cifras se muestran siempre. Los nombres de un jugador privado se ocultan.
// ---------------------------------------------------------
export async function obtenerEnfrentamientos(entrada: unknown): Promise<ConsultaDuelos> {
    try {
        const parseo = esquemaDuelos.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { ladoA, ladoB, modo } = parseo.data as {
            ladoA: string[];
            ladoB: string[];
            modo: ModoDuelo;
        };

        const admin = crearClienteAdmin();
        const { partidos, perfiles } = await cargarHistorial(admin);

        const resultado = duelos(partidos, ladoA, ladoB, modo);
        if (!resultado) {
            return { ok: false, error: "Los dos bandos no pueden estar vacíos ni compartir jugadores" };
        }

        const usuarioId = await usuarioActual();
        const organizador = await esOrganizador(usuarioId);

        const nombreDe = (id: string): string => {
            const perfil = perfiles.get(id);
            if (!perfil) return "Jugador";
            return puedeVerPerfil(perfil, usuarioId, organizador)
                ? perfil.nombre || "Jugador"
                : "Jugador privado";
        };

        return {
            ok: true,
            resultado,
            nombresA: ladoA.map(nombreDe),
            nombresB: ladoB.map(nombreDe),
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}