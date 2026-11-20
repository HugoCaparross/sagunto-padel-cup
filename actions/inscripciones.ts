"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
    ESTADOS_QUE_OCUPAN_PLAZA,
    ETIQUETAS_CATEGORIA,
    type Categoria,
} from "@/lib/constantes";
import { notificarInscripcion } from "@/lib/email/notificaciones";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";
import {
    esquemaCrearInscripcion,
    esquemaInscripcionId,
} from "@/lib/validadores/inscripcion";

export type AccionInscripcion =
    | { ok: true; estado?: string }
    | { ok: false; error: string };

export type FilaBuscaPareja = {
    id: string;
    categoria: Categoria;
    nombre: string;
};

type FilaInscripcion = {
    id: string;
    prueba_id: string;
    categoria: Categoria;
    jugador_1: string;
    jugador_2: string | null;
    estado: string;
};

async function exigirSesion() {
    const supabase = await crearClienteServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { supabase, userId: user.id };
}

// Si el jugador tiene categoría asignada para la temporada, solo puede inscribirse en ella.
async function errorElegibilidad(
    cliente: SupabaseClient,
    jugadorId: string,
    temporadaId: number,
    categoria: Categoria
): Promise<string | null> {
    const { data } = await cliente
        .from("categorias_temporada")
        .select("categoria")
        .eq("temporada_id", temporadaId)
        .eq("jugador_id", jugadorId)
        .maybeSingle();

    if (data && data.categoria !== categoria) {
        const esperada = ETIQUETAS_CATEGORIA[data.categoria as Categoria];
        return `Para esta temporada solo puedes inscribirte en ${esperada}`;
    }
    return null;
}

// ---------------------------------------------------------
// 1. Crear inscripción (en solitario, a la espera de pareja)
// El trigger validar_inscripcion comprueba jugador repetido y plazas de la prueba.
// ---------------------------------------------------------
export async function crearInscripcion(
    entrada: unknown
): Promise<AccionInscripcion> {
    try {
        const parseo = esquemaCrearInscripcion.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria } = parseo.data;

        const sesion = await exigirSesion();
        if (!sesion) return { ok: false, error: "Inicia sesión para inscribirte" };
        const { supabase, userId } = sesion;

        const { data: prueba } = await supabase
            .from("pruebas")
            .select("temporada_id, estado")
            .eq("id", pruebaId)
            .single();
        if (!prueba) return { ok: false, error: "Prueba no encontrada" };
        if (prueba.estado !== "abierta") {
            return { ok: false, error: "Las inscripciones de esta prueba no están abiertas" };
        }

        const errorCategoria = await errorElegibilidad(
            supabase,
            userId,
            prueba.temporada_id,
            categoria
        );
        if (errorCategoria) return { ok: false, error: errorCategoria };

        const { data, error } = await supabase
            .from("inscripciones")
            .insert({
                prueba_id: pruebaId,
                categoria,
                jugador_1: userId,
                jugador_2: null,
                estado: "pendiente",
            })
            .select("id, estado")
            .single<{ id: string; estado: string }>();
        if (error) return { ok: false, error: error.message };

        // El trigger puede haberla dejado en lista de espera: el email refleja el estado real
        await notificarInscripcion(data.id, "registrada");

        revalidatePath("/cuenta/inscripciones");
        revalidatePath("/buscar-pareja");
        return { ok: true, estado: data.estado };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 2. Unirse a una inscripción que busca pareja
// Usa la clave de servicio porque RLS no deja ver ni editar inscripciones ajenas.
// No envía email: el jugador que se une ya lo sabe en el momento.
// ---------------------------------------------------------
export async function unirseAInscripcion(
    entrada: unknown
): Promise<AccionInscripcion> {
    try {
        const parseo = esquemaInscripcionId.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { inscripcionId } = parseo.data;

        const sesion = await exigirSesion();
        if (!sesion) return { ok: false, error: "Inicia sesión para continuar" };
        const { userId } = sesion;

        const admin = crearClienteAdmin();

        const { data: insc } = await admin
            .from("inscripciones")
            .select("id, prueba_id, categoria, jugador_1, jugador_2, estado")
            .eq("id", inscripcionId)
            .single<FilaInscripcion & { estado: string }>();
        if (!insc) return { ok: false, error: "Inscripción no encontrada" };
        if (insc.jugador_2) return { ok: false, error: "Esta inscripción ya tiene pareja" };
        if (insc.estado === "retirada") {
            return { ok: false, error: "Esta inscripción está retirada" };
        }
        if (insc.jugador_1 === userId) {
            return { ok: false, error: "No puedes emparejarte contigo mismo" };
        }

        const { data: prueba } = await admin
            .from("pruebas")
            .select("temporada_id, estado")
            .eq("id", insc.prueba_id)
            .single();
        if (!prueba || prueba.estado !== "abierta") {
            return { ok: false, error: "Las inscripciones de esta prueba no están abiertas" };
        }

        const { data: propias } = await admin
            .from("inscripciones")
            .select("id")
            .eq("prueba_id", insc.prueba_id)
            .neq("estado", "retirada")
            .or(`jugador_1.eq.${userId},jugador_2.eq.${userId}`)
            .limit(1);
        if (propias && propias.length > 0) {
            return { ok: false, error: "Ya estás inscrito en esta prueba" };
        }

        const errorCategoria = await errorElegibilidad(
            admin,
            userId,
            prueba.temporada_id,
            insc.categoria
        );
        if (errorCategoria) return { ok: false, error: errorCategoria };

        // La condición is null evita que dos personas se unan a la vez
        const { data: actualizada, error } = await admin
            .from("inscripciones")
            .update({ jugador_2: userId })
            .eq("id", insc.id)
            .is("jugador_2", null)
            .select("id")
            .maybeSingle();
        if (error) return { ok: false, error: error.message };
        if (!actualizada) {
            return { ok: false, error: "Otra persona se ha unido a esta pareja antes que tú" };
        }

        revalidatePath("/cuenta/inscripciones");
        revalidatePath("/buscar-pareja");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 3. Retirar la inscripción (de la pareja completa)
// Libera la plaza, promociona a la primera de la lista de espera y avisa por email.
// ---------------------------------------------------------
export async function retirarInscripcion(
    entrada: unknown
): Promise<AccionInscripcion> {
    try {
        const parseo = esquemaInscripcionId.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { inscripcionId } = parseo.data;

        const sesion = await exigirSesion();
        if (!sesion) return { ok: false, error: "Inicia sesión para continuar" };
        const { supabase } = sesion;

        // RLS solo deja ver la inscripción si eres uno de sus jugadores
        const { data: insc } = await supabase
            .from("inscripciones")
            .select("id, prueba_id, categoria, estado")
            .eq("id", inscripcionId)
            .maybeSingle<{ id: string; prueba_id: string; categoria: Categoria; estado: string }>();
        if (!insc) return { ok: false, error: "No encontrada o no es tuya" };
        if (insc.estado === "retirada") return { ok: false, error: "Ya estaba retirada" };

        const { data: prueba } = await supabase
            .from("pruebas")
            .select("estado")
            .eq("id", insc.prueba_id)
            .single();
        if (prueba?.estado === "en_curso" || prueba?.estado === "finalizada") {
            return { ok: false, error: "No puedes retirarte de una prueba que ya ha empezado" };
        }

        // RLS permite el cambio solo a 'retirada' y solo si eres jugador de la inscripción
        const { data: retirada, error } = await supabase
            .from("inscripciones")
            .update({ estado: "retirada" })
            .eq("id", insc.id)
            .select("id")
            .maybeSingle();
        if (error) return { ok: false, error: error.message };
        if (!retirada) return { ok: false, error: "No se pudo completar la retirada" };

        let promovidaId: string | null = null;

        // Si la inscripción ocupaba plaza, entra el siguiente de la lista de espera
        const ocupabaPlaza = (ESTADOS_QUE_OCUPAN_PLAZA as readonly string[]).includes(insc.estado);
        if (ocupabaPlaza) {
            const admin = crearClienteAdmin();
            const { data: siguiente } = await admin
                .from("inscripciones")
                .select("id")
                .eq("prueba_id", insc.prueba_id)
                .eq("categoria", insc.categoria)
                .eq("estado", "lista_espera")
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle<{ id: string }>();

            if (siguiente) {
                const { error: errorPromo } = await admin
                    .from("inscripciones")
                    .update({ estado: "pendiente" })
                    .eq("id", siguiente.id);
                if (!errorPromo) promovidaId = siguiente.id;
            }
        }

        await notificarInscripcion(insc.id, "baja");
        if (promovidaId) await notificarInscripcion(promovidaId, "promocion");

        revalidatePath("/cuenta/inscripciones");
        revalidatePath("/buscar-pareja");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 4. Tablón de búsqueda de pareja
// Nombre visible solo si el jugador tiene visibilidad pública.
// ---------------------------------------------------------
export async function listarBuscaPareja(
    pruebaId: string
): Promise<{ ok: true; filas: FilaBuscaPareja[] } | { ok: false; error: string }> {
    try {
        const parseo = z.uuid().safeParse(pruebaId);
        if (!parseo.success) return { ok: false, error: "Prueba no válida" };

        const sesion = await exigirSesion();
        if (!sesion) return { ok: false, error: "Inicia sesión para ver el tablón" };
        const { userId } = sesion;

        const admin = crearClienteAdmin();

        const { data: insc, error } = await admin
            .from("inscripciones")
            .select("id, categoria, jugador_1")
            .eq("prueba_id", parseo.data)
            .is("jugador_2", null)
            .in("estado", ["pendiente", "lista_espera"]);
        if (error) return { ok: false, error: error.message };

        const propias = ((insc ?? []) as { id: string; categoria: Categoria; jugador_1: string }[]).filter(
            (i) => i.jugador_1 !== userId
        );
        if (propias.length === 0) return { ok: true, filas: [] };

        const idsJugadores = [...new Set(propias.map((i) => i.jugador_1))];
        const { data: perfiles } = await admin
            .from("perfiles")
            .select("id, nombre, visibilidad_publica")
            .in("id", idsJugadores);

        const mapa = new Map(
            (perfiles ?? []).map((p) => [
                p.id as string,
                p.visibilidad_publica ? (p.nombre as string) : "Jugador privado",
            ])
        );

        return {
            ok: true,
            filas: propias.map((i) => ({
                id: i.id,
                categoria: i.categoria,
                nombre: mapa.get(i.jugador_1) ?? "Jugador privado",
            })),
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}