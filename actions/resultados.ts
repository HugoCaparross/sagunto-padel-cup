"use server";

import { revalidatePath } from "next/cache";
import { puntosPara } from "@/lib/puntos/escala";
import type { Categoria, Cuadro, Ronda } from "@/lib/constantes";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";
import {
    esquemaPosicionFinal,
    esquemaResultadoPartido,
} from "@/lib/validadores/resultado";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

// Comprueba sesión y rol en el servidor. Nunca confiar en lo que envía el cliente.
async function exigirOrganizador() {
    const supabase = await crearClienteServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .single();
    if (perfil?.rol !== "organizador") return null;

    return { supabase, usuarioId: user.id };
}

// La auditoría solo se escribe con la secret key: el cliente no tiene permiso.
async function auditar(params: {
    usuarioId: string;
    accion: string;
    tabla: string;
    registroId: string;
    antes: unknown;
    despues: unknown;
    motivo?: string;
}): Promise<string | null> {
    const admin = crearClienteAdmin();
    const { error } = await admin.from("auditoria").insert({
        usuario_id: params.usuarioId,
        accion: params.accion,
        tabla: params.tabla,
        registro_id: params.registroId,
        antes: params.antes,
        despues: params.despues,
        motivo: params.motivo ?? null,
    });
    return error ? `No se pudo registrar la auditoría: ${error.message}` : null;
}

// Gana la pareja que suma más sets. Null si hay empate en sets.
function ganadorDeSets(sets: [number, number][]): "a" | "b" | null {
    let a = 0;
    let b = 0;
    for (const [x, y] of sets) {
        if (x > y) a++;
        else b++;
    }
    if (a === b) return null;
    return a > b ? "a" : "b";
}

// ---------------------------------------------------------
// 1. Resultado de un partido (grupos y eliminatorias)
// ---------------------------------------------------------
export async function registrarResultadoPartido(
    entrada: unknown
): Promise<ResultadoAccion> {
    const parseo = esquemaResultadoPartido.safeParse(entrada);
    if (!parseo.success) {
        return { ok: false, error: parseo.error.issues[0].message };
    }
    const { partidoId, sets, motivo } = parseo.data;

    const org = await exigirOrganizador();
    if (!org) return { ok: false, error: "No autorizado" };
    const { supabase, usuarioId } = org;

    const { data: partido, error: errorPartido } = await supabase
        .from("partidos")
        .select("id, prueba_id, inscripcion_a, inscripcion_b, resultado, ganador_id")
        .eq("id", partidoId)
        .single();
    if (errorPartido || !partido) {
        return { ok: false, error: "Partido no encontrado" };
    }
    if (!partido.inscripcion_a || !partido.inscripcion_b) {
        return { ok: false, error: "El partido no tiene dos parejas asignadas" };
    }

    const { data: prueba } = await supabase
        .from("pruebas")
        .select("estado")
        .eq("id", partido.prueba_id)
        .single();

    const esCorreccion = partido.ganador_id !== null;
    const pruebaCerrada = prueba?.estado === "finalizada";
    if ((esCorreccion || pruebaCerrada) && !motivo) {
        return {
            ok: false,
            error: "Corregir un resultado ya registrado requiere un motivo",
        };
    }

    const ganador = ganadorDeSets(sets);
    if (!ganador) {
        return { ok: false, error: "El partido no puede terminar empatado en sets" };
    }
    const ganadorId =
        ganador === "a" ? partido.inscripcion_a : partido.inscripcion_b;

    const { error: errorUpdate } = await supabase
        .from("partidos")
        .update({ resultado: sets, ganador_id: ganadorId })
        .eq("id", partidoId);
    if (errorUpdate) return { ok: false, error: errorUpdate.message };

    const errorAuditoria = await auditar({
        usuarioId,
        accion: esCorreccion ? "corregir_resultado" : "registrar_resultado",
        tabla: "partidos",
        registroId: partidoId,
        antes: { resultado: partido.resultado, ganador_id: partido.ganador_id },
        despues: { resultado: sets, ganador_id: ganadorId },
        motivo,
    });
    if (errorAuditoria) return { ok: false, error: errorAuditoria };

    revalidatePath("/ranking");
    revalidatePath("/jugadores");
    return { ok: true };
}

// ---------------------------------------------------------
// 2. Posición final de una pareja (genera puntos por jugador)
// ---------------------------------------------------------
export async function registrarPosicionFinal(
    entrada: unknown
): Promise<ResultadoAccion> {
    const parseo = esquemaPosicionFinal.safeParse(entrada);
    if (!parseo.success) {
        return { ok: false, error: parseo.error.issues[0].message };
    }
    const { pruebaId, inscripcionId, categoria, cuadro, ronda, motivo } =
        parseo.data;

    const org = await exigirOrganizador();
    if (!org) return { ok: false, error: "No autorizado" };
    const { supabase, usuarioId } = org;

    const { data: inscripcion, error: errorInsc } = await supabase
        .from("inscripciones")
        .select("id, prueba_id, categoria, jugador_1, jugador_2")
        .eq("id", inscripcionId)
        .single();
    if (errorInsc || !inscripcion) {
        return { ok: false, error: "Inscripción no encontrada" };
    }
    if (
        inscripcion.prueba_id !== pruebaId ||
        inscripcion.categoria !== categoria
    ) {
        return {
            ok: false,
            error: "La inscripción no pertenece a esa prueba o categoría",
        };
    }

    const { data: prueba } = await supabase
        .from("pruebas")
        .select("fecha_fin, estado")
        .eq("id", pruebaId)
        .single();
    if (!prueba) return { ok: false, error: "Prueba no encontrada" };

    const { data: previas } = await supabase
        .from("puntos_prueba")
        .select("jugador_id, categoria, cuadro, ronda, puntos")
        .eq("inscripcion_id", inscripcionId);

    const esCorreccion = (previas?.length ?? 0) > 0;
    const pruebaCerrada = prueba.estado === "finalizada";
    if ((esCorreccion || pruebaCerrada) && !motivo) {
        return {
            ok: false,
            error: "Corregir una posición ya registrada requiere un motivo",
        };
    }

    // Los puntos salen de la escala del servidor, nunca del cliente
    const puntos = puntosPara(
        categoria as Categoria,
        cuadro as Cuadro,
        ronda as Ronda
    );

    const jugadores = [inscripcion.jugador_1, inscripcion.jugador_2].filter(
        (j): j is string => Boolean(j)
    );

    const filas = jugadores.map((jugador_id) => ({
        inscripcion_id: inscripcionId,
        jugador_id,
        prueba_id: pruebaId,
        categoria,
        cuadro,
        ronda,
        puntos,
        fecha: prueba.fecha_fin,
    }));

    const { error: errorUpsert } = await supabase
        .from("puntos_prueba")
        .upsert(filas, { onConflict: "inscripcion_id,jugador_id" });
    if (errorUpsert) return { ok: false, error: errorUpsert.message };

    const errorAuditoria = await auditar({
        usuarioId,
        accion: esCorreccion ? "corregir_posicion" : "registrar_posicion",
        tabla: "puntos_prueba",
        registroId: inscripcionId,
        antes: previas ?? null,
        despues: filas,
        motivo,
    });
    if (errorAuditoria) return { ok: false, error: errorAuditoria };

    revalidatePath("/ranking");
    revalidatePath("/jugadores");
    return { ok: true };
}