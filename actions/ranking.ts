"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CATEGORIAS, type Categoria } from "@/lib/constantes";
import { calcularRanking, type FilaRanking } from "@/lib/ranking/calcular";
import { cargarDatosRanking } from "@/lib/ranking/cargar";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

export type AccionRanking =
    | { ok: true; total?: number }
    | { ok: false; error: string };

// Categoría a la que asciende cada una (la primera no tiene superior)
const SUPERIOR: Partial<Record<Categoria, Categoria>> = {
    segunda: "primera",
    tercera: "segunda",
    cuarta: "tercera",
};

// Categoría a la que desciende cada una (la cuarta no tiene inferior)
const INFERIOR: Partial<Record<Categoria, Categoria>> = {
    primera: "segunda",
    segunda: "tercera",
    tercera: "cuarta",
};

const esquemaGenerar = z.object({
    temporadaCerradaId: z.number().int().positive(),
    temporadaDestinoId: z.number().int().positive(),
    referencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
});

const esquemaConfirmar = z.object({
    propuestaId: z.uuid(),
});

const esquemaModificar = z.object({
    propuestaId: z.uuid(),
    categoriaFinal: z.enum(CATEGORIAS),
    motivo: z.string().trim().min(10, "El motivo debe tener al menos 10 caracteres").max(500),
});

type FilaPropuesta = {
    id: string;
    temporada_id: number;
    temporada_destino_id: number;
    jugador_id: string;
    tipo: "ascenso" | "descenso";
    categoria_origen: Categoria;
    categoria_propuesta: Categoria;
    estado: "pendiente" | "confirmada" | "modificada";
};

type NuevaPropuesta = Omit<FilaPropuesta, "id" | "estado"> & {
    posicion: number;
    empate_en_frontera: boolean;
};

// Comprueba sesión y rol en el servidor.
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

async function auditar(params: {
    usuarioId: string;
    accion: string;
    registroId: string;
    antes: unknown;
    despues: unknown;
    motivo?: string;
}): Promise<string | null> {
    const admin = crearClienteAdmin();
    const { error } = await admin.from("auditoria").insert({
        usuario_id: params.usuarioId,
        accion: params.accion,
        tabla: "propuestas_categoria",
        registro_id: params.registroId,
        antes: params.antes,
        despues: params.despues,
        motivo: params.motivo ?? null,
    });
    return error ? `No se pudo registrar la auditoría: ${error.message}` : null;
}

// Parejas que ascienden: todas las que quedan dentro de las plazas.
// Si el último puesto está empatado con el siguiente, se marca.
function cortePorArriba(filas: FilaRanking[], n: number) {
    const jugadores = filas.filter((f) => f.posicion <= n);
    const empate =
        filas.length > n && filas[n - 1].posicion === filas[n].posicion;
    return { jugadores, empate };
}

// Parejas que descienden: las últimas n, con empates en la frontera incluidos.
function cortePorAbajo(filas: FilaRanking[], n: number) {
    const inicio = filas.length - n;
    if (inicio <= 0) return { jugadores: filas, empate: false };

    const posicionCorte = filas[inicio].posicion;
    const empate = filas[inicio - 1].posicion === posicionCorte;
    const jugadores = filas.filter((f) => f.posicion >= posicionCorte);
    return { jugadores, empate };
}

function propuestasDeCategoria(params: {
    categoria: Categoria;
    filas: FilaRanking[];
    plazasAscenso: number;
    plazasDescenso: number;
    temporadaId: number;
    temporadaDestinoId: number;
}): NuevaPropuesta[] {
    const {
        categoria,
        filas,
        plazasAscenso,
        plazasDescenso,
        temporadaId,
        temporadaDestinoId,
    } = params;

    const salida: NuevaPropuesta[] = [];
    const ascienden = new Set<string>();

    const superior = SUPERIOR[categoria];
    if (superior && plazasAscenso > 0 && filas.length > 0) {
        const { jugadores, empate } = cortePorArriba(filas, plazasAscenso);
        for (const f of jugadores) {
            ascienden.add(f.clave);
            salida.push({
                temporada_id: temporadaId,
                temporada_destino_id: temporadaDestinoId,
                jugador_id: f.clave,
                tipo: "ascenso",
                categoria_origen: categoria,
                categoria_propuesta: superior,
                posicion: f.posicion,
                empate_en_frontera: empate,
            });
        }
    }

    const inferior = INFERIOR[categoria];
    if (inferior && plazasDescenso > 0 && filas.length > 0) {
        const { jugadores, empate } = cortePorAbajo(filas, plazasDescenso);
        for (const f of jugadores) {
            if (ascienden.has(f.clave)) continue; // nunca subir y bajar a la vez
            salida.push({
                temporada_id: temporadaId,
                temporada_destino_id: temporadaDestinoId,
                jugador_id: f.clave,
                tipo: "descenso",
                categoria_origen: categoria,
                categoria_propuesta: inferior,
                posicion: f.posicion,
                empate_en_frontera: empate,
            });
        }
    }

    return salida;
}

// ---------------------------------------------------------
// 1. Generar propuestas al cerrar temporada
// Sustituye las pendientes anteriores de la misma temporada.
// ---------------------------------------------------------
export async function generarPropuestas(entrada: unknown): Promise<AccionRanking> {
    const parseo = esquemaGenerar.safeParse(entrada);
    if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
    const { temporadaCerradaId, temporadaDestinoId, referencia } = parseo.data;

    const org = await exigirOrganizador();
    if (!org) return { ok: false, error: "No autorizado" };
    const { supabase, usuarioId } = org;

    const { data: temporada, error: errorTemporada } = await supabase
        .from("temporadas")
        .select("id, plazas_ascenso, plazas_descenso")
        .eq("id", temporadaCerradaId)
        .single();
    if (errorTemporada || !temporada) {
        return { ok: false, error: "Temporada no encontrada" };
    }

    const { data: destino } = await supabase
        .from("temporadas")
        .select("id")
        .eq("id", temporadaDestinoId)
        .single();
    if (!destino) return { ok: false, error: "Temporada de destino no encontrada" };

    const { puntos, partidos } = await cargarDatosRanking();

    const nuevas: NuevaPropuesta[] = [];
    for (const categoria of CATEGORIAS) {
        const filas = calcularRanking({ categoria, referencia, puntos, partidos });
        nuevas.push(
            ...propuestasDeCategoria({
                categoria,
                filas,
                plazasAscenso: temporada.plazas_ascenso,
                plazasDescenso: temporada.plazas_descenso,
                temporadaId: temporadaCerradaId,
                temporadaDestinoId,
            })
        );
    }

    const { error: errorBorrado } = await supabase
        .from("propuestas_categoria")
        .delete()
        .eq("temporada_id", temporadaCerradaId)
        .eq("estado", "pendiente");
    if (errorBorrado) return { ok: false, error: errorBorrado.message };

    if (nuevas.length > 0) {
        const { error: errorInsert } = await supabase
            .from("propuestas_categoria")
            .insert(nuevas);
        if (errorInsert) return { ok: false, error: errorInsert.message };
    }

    const errorAuditoria = await auditar({
        usuarioId,
        accion: "generar_propuestas",
        registroId: String(temporadaCerradaId),
        antes: null,
        despues: { referencia, total: nuevas.length },
    });
    if (errorAuditoria) return { ok: false, error: errorAuditoria };

    revalidatePath("/admin/ranking");
    return { ok: true, total: nuevas.length };
}

// ---------------------------------------------------------
// 2. Confirmar una propuesta tal como está
// ---------------------------------------------------------
export async function confirmarPropuesta(entrada: unknown): Promise<AccionRanking> {
    const parseo = esquemaConfirmar.safeParse(entrada);
    if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };

    const org = await exigirOrganizador();
    if (!org) return { ok: false, error: "No autorizado" };
    const { supabase, usuarioId } = org;

    const { data: propuesta, error: errorLectura } = await supabase
        .from("propuestas_categoria")
        .select("id, temporada_id, temporada_destino_id, jugador_id, tipo, categoria_origen, categoria_propuesta, estado")
        .eq("id", parseo.data.propuestaId)
        .single<FilaPropuesta>();
    if (errorLectura || !propuesta) return { ok: false, error: "Propuesta no encontrada" };

    if (propuesta.estado !== "pendiente") {
        return {
            ok: false,
            error: "La propuesta ya está resuelta. Para cambiarla, usa Modificar con motivo.",
        };
    }

    const { error: errorUpdate } = await supabase
        .from("propuestas_categoria")
        .update({
            estado: "confirmada",
            categoria_final: propuesta.categoria_propuesta,
            resuelta_por: usuarioId,
            resuelta_at: new Date().toISOString(),
        })
        .eq("id", propuesta.id);
    if (errorUpdate) return { ok: false, error: errorUpdate.message };

    const { error: errorCategoria } = await supabase
        .from("categorias_temporada")
        .upsert(
            {
                temporada_id: propuesta.temporada_destino_id,
                jugador_id: propuesta.jugador_id,
                categoria: propuesta.categoria_propuesta,
                origen: propuesta.tipo,
            },
            { onConflict: "temporada_id,jugador_id" }
        );
    if (errorCategoria) return { ok: false, error: errorCategoria.message };

    const errorAuditoria = await auditar({
        usuarioId,
        accion: "confirmar_propuesta",
        registroId: propuesta.id,
        antes: { estado: "pendiente", categoria: propuesta.categoria_origen },
        despues: { estado: "confirmada", categoria: propuesta.categoria_propuesta },
    });
    if (errorAuditoria) return { ok: false, error: errorAuditoria };

    revalidatePath("/admin/ranking");
    return { ok: true };
}

// ---------------------------------------------------------
// 3. Modificar una propuesta (también sirve para corregir una ya confirmada)
// Si la categoría final es la de origen, el jugador se mantiene.
// ---------------------------------------------------------
export async function modificarPropuesta(entrada: unknown): Promise<AccionRanking> {
    const parseo = esquemaModificar.safeParse(entrada);
    if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
    const { propuestaId, categoriaFinal, motivo } = parseo.data;

    const org = await exigirOrganizador();
    if (!org) return { ok: false, error: "No autorizado" };
    const { supabase, usuarioId } = org;

    const { data: propuesta, error: errorLectura } = await supabase
        .from("propuestas_categoria")
        .select("id, temporada_id, temporada_destino_id, jugador_id, tipo, categoria_origen, categoria_propuesta, estado, categoria_final")
        .eq("id", propuestaId)
        .single<FilaPropuesta & { categoria_final: Categoria | null }>();
    if (errorLectura || !propuesta) return { ok: false, error: "Propuesta no encontrada" };

    const { error: errorUpdate } = await supabase
        .from("propuestas_categoria")
        .update({
            estado: "modificada",
            categoria_final: categoriaFinal,
            motivo,
            resuelta_por: usuarioId,
            resuelta_at: new Date().toISOString(),
        })
        .eq("id", propuesta.id);
    if (errorUpdate) return { ok: false, error: errorUpdate.message };

    const { error: errorCategoria } = await supabase
        .from("categorias_temporada")
        .upsert(
            {
                temporada_id: propuesta.temporada_destino_id,
                jugador_id: propuesta.jugador_id,
                categoria: categoriaFinal,
                origen: "manual",
            },
            { onConflict: "temporada_id,jugador_id" }
        );
    if (errorCategoria) return { ok: false, error: errorCategoria.message };

    const errorAuditoria = await auditar({
        usuarioId,
        accion: "modificar_propuesta",
        registroId: propuesta.id,
        antes: {
            estado: propuesta.estado,
            categoria: propuesta.categoria_final ?? propuesta.categoria_propuesta,
        },
        despues: { estado: "modificada", categoria: categoriaFinal },
        motivo,
    });
    if (errorAuditoria) return { ok: false, error: errorAuditoria };

    revalidatePath("/admin/ranking");
    return { ok: true };
}