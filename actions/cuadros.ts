"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    CATEGORIAS,
    CUADROS,
    ESTADOS_QUE_OCUPAN_PLAZA,
    type Categoria,
    type Cuadro,
} from "@/lib/constantes";
import {
    aParticipantesLlave,
    clasificarGrupo,
    type FilaClasificacion,
    type PartidoGrupo,
    type SetJuego,
} from "@/lib/cuadros/clasificacion";
import {
    MAX_PAREJAS_POR_CATEGORIA,
    MIN_PAREJAS_CATEGORIA,
    FASES_CUADRO,
    enfrentamientos,
    plantillaPorDefecto,
    tamanosGrupos,
    validarLlaves,
    vueltasDeGrupo,
    type AutomaticoEntrada,
    type ContextoLlaves,
    type Incidencia,
    type LadoEntrada,
    type PartidoEntrada,
    type FaseCuadro,
} from "@/lib/cuadros/formatos";
import {
    sortearGrupos,
    sortearLlave,
    type ParejaSorteo,
    type ParticipanteLlave,
} from "@/lib/cuadros/sorteo";
import { calcularRanking } from "@/lib/ranking/calcular";
import { cargarDatosRanking, hoyEnMadrid } from "@/lib/ranking/cargar";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

// ---------------------------------------------------------
// TIPOS PÚBLICOS
// ---------------------------------------------------------
export type AccionCuadros =
    | { ok: true; partidos: number; avisos: string[] }
    | { ok: false; error: string; incidencias?: Incidencia[] };

export type AccionSimple = { ok: true } | { ok: false; error: string };

export type AccionSorteo =
    | { ok: true; cruces: [string, string][] }
    | { ok: false; error: string };

export type EstadoCuadroValor = "sin_generar" | "generado" | "desactualizado";

export type EstadoCuadro =
    | {
        ok: true;
        estado: EstadoCuadroValor;
        participantes: number;
        altas: string[];
        bajas: string[];
        conResultados: boolean;
    }
    | { ok: false; error: string };

export type InscripcionEditor = {
    inscripcionId: string;
    grupo: string;
    posicion: number;
    texto: string;
};

export type DatosEditor = {
    parejas: number;
    bloqueado: boolean;
    sugerida: boolean;
    grupos: { letra: string; completo: boolean; filas: FilaClasificacion[] }[];
    inscripciones: InscripcionEditor[];
    partidos: PartidoEntrada[];
    automaticos: AutomaticoEntrada[];
    contexto: ContextoLlaves;
};

// ---------------------------------------------------------
// INTERNOS
// ---------------------------------------------------------
type Admin = ReturnType<typeof crearClienteAdmin>;
type Inscrita = { id: string; jugador_1: string; jugador_2: string | null };

type FilaBD = {
    id: string;
    fase: "grupo" | "eliminatoria";
    formato: string;
    cuadro: Cuadro | null;
    grupo: string | null;
    ronda: string | null;
    inscripcion_a: string | null;
    inscripcion_b: string | null;
    origen_a: string | null;
    origen_b: string | null;
    ganador_id: string | null;
    resultado: SetJuego[] | null;
    orden: number;
};

const COLUMNAS_PARTIDO =
    "id, fase, formato, cuadro, grupo, ronda, inscripcion_a, inscripcion_b, origen_a, origen_b, ganador_id, resultado, orden";

const MOTIVO = z
    .string()
    .trim()
    .min(10, "El motivo debe tener al menos 10 caracteres")
    .max(500);

const esquemaCategoria = z.object({
    pruebaId: z.uuid(),
    categoria: z.enum(CATEGORIAS),
});

const esquemaRehacer = z.object({
    pruebaId: z.uuid(),
    categoria: z.enum(CATEGORIAS),
    motivo: MOTIVO.optional(),
});

const esquemaBaja = z.object({
    inscripcionId: z.uuid(),
    motivo: MOTIVO.optional(),
});

const esquemaLado = z.discriminatedUnion("tipo", [
    z.object({ tipo: z.literal("pareja"), inscripcionId: z.uuid() }),
    z.object({ tipo: z.literal("ganador"), partidoId: z.string().min(1).max(64) }),
    z.object({ tipo: z.literal("perdedor"), partidoId: z.string().min(1).max(64) }),
]);

const esquemaPartido = z.object({
    id: z.string().min(1).max(64),
    cuadro: z.enum(CUADROS),
    ronda: z.enum(FASES_CUADRO),
    formato: z.enum(["fase_final", "final"]),
    orden: z.number().int().min(0),
    a: esquemaLado.nullable(),
    b: esquemaLado.nullable(),
});

const esquemaAutomatico = z.object({
    cuadro: z.enum(CUADROS),
    inscripcionId: z.uuid().nullable(),
});

const esquemaGuardar = z.object({
    pruebaId: z.uuid(),
    categoria: z.enum(CATEGORIAS),
    partidos: z.array(esquemaPartido).max(80),
    automaticos: z.array(esquemaAutomatico).max(12),
    motivo: MOTIVO.optional(),
});

const esquemaGrupos = z.object({
    pruebaId: z.uuid(),
    categoria: z.enum(CATEGORIAS),
    grupos: z
        .array(
            z.object({
                letra: z.string().regex(/^[A-Z]$/),
                ids: z.array(z.uuid()).min(3).max(6),
            })
        )
        .min(1)
        .max(2),
});

// Devuelve el id del organizador, o null si no lo es.
async function exigirOrganizador(): Promise<string | null> {
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
    return perfil?.rol === "organizador" ? user.id : null;
}

async function auditar(
    admin: Admin,
    p: {
        usuarioId: string;
        accion: string;
        tabla: string;
        registroId: string;
        antes: unknown;
        despues: unknown;
        motivo?: string;
    }
): Promise<string | null> {
    const { error } = await admin.from("auditoria").insert({
        usuario_id: p.usuarioId,
        accion: p.accion,
        tabla: p.tabla,
        registro_id: p.registroId,
        antes: p.antes,
        despues: p.despues,
        motivo: p.motivo ?? null,
    });
    return error ? `No se pudo registrar la auditoría: ${error.message}` : null;
}

function mismoConjunto(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const conjuntoA = new Set(a);
    return b.every((x) => conjuntoA.has(x));
}

// Parejas que participan: todas las activas (pendiente, confirmada, pagada en prueba).
async function inscripcionesParticipantes(
    admin: Admin,
    pruebaId: string,
    categoria: Categoria
): Promise<Inscrita[]> {
    const { data, error } = await admin
        .from("inscripciones")
        .select("id, jugador_1, jugador_2")
        .eq("prueba_id", pruebaId)
        .eq("categoria", categoria)
        .in("estado", [...ESTADOS_QUE_OCUPAN_PLAZA])
        .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Inscrita[];
}

async function nombresDe(admin: Admin, ids: string[]): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    if (ids.length === 0) return mapa;
    const { data } = await admin.from("perfiles").select("id, nombre").in("id", ids);
    for (const p of (data ?? []) as { id: string; nombre: string }[]) {
        mapa.set(p.id, p.nombre || "Jugador");
    }
    return mapa;
}

function textoPareja(i: Inscrita, nombres: Map<string, string>): string {
    const uno = nombres.get(i.jugador_1) ?? "Jugador";
    if (!i.jugador_2) return `${uno} (sin pareja)`;
    return `${uno} / ${nombres.get(i.jugador_2) ?? "Jugador"}`;
}

// Puntos de la pareja: suma de los puntos del ranking de sus dos jugadores.
async function puntosPorInscripcion(
    inscritas: Inscrita[],
    categoria: Categoria
): Promise<Map<string, number>> {
    const { puntos, partidos } = await cargarDatosRanking();
    const filas = calcularRanking({
        categoria,
        referencia: hoyEnMadrid(),
        puntos,
        partidos,
    });
    const porJugador = new Map(filas.map((f) => [f.clave, f.puntos]));

    const salida = new Map<string, number>();
    for (const i of inscritas) {
        const suma =
            (porJugador.get(i.jugador_1) ?? 0) +
            (i.jugador_2 ? (porJugador.get(i.jugador_2) ?? 0) : 0);
        salida.set(i.id, suma);
    }
    return salida;
}

async function leerPartidos(
    admin: Admin,
    pruebaId: string,
    categoria: Categoria
): Promise<FilaBD[]> {
    const { data, error } = await admin
        .from("partidos")
        .select(COLUMNAS_PARTIDO)
        .eq("prueba_id", pruebaId)
        .eq("categoria", categoria)
        .order("orden", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as FilaBD[];
}

// Clasificación de cada grupo, a partir de los partidos de grupo.
function clasificarTodos(grupoRows: FilaBD[]) {
    const partidosGrupo: PartidoGrupo[] = grupoRows.map((p) => ({
        grupo: p.grupo ?? "",
        inscripcionA: p.inscripcion_a ?? "",
        inscripcionB: p.inscripcion_b ?? "",
        sets: p.resultado,
        ganadorId: p.ganador_id,
    }));

    const letras = [...new Set(grupoRows.map((p) => p.grupo ?? ""))].sort();

    return letras.map((letra) => {
        const ids = [
            ...new Set(
                grupoRows
                    .filter((p) => p.grupo === letra)
                    .flatMap((p) => [p.inscripcion_a ?? "", p.inscripcion_b ?? ""])
            ),
        ].filter(Boolean);
        const { filas, completo } = clasificarGrupo(letra, ids, partidosGrupo);
        return { letra, completo, filas };
    });
}

function duelosDe(grupoRows: FilaBD[]): [string, string][] {
    return grupoRows
        .filter((r) => r.inscripcion_a && r.inscripcion_b)
        .map((r) => [r.inscripcion_a as string, r.inscripcion_b as string]);
}

function contextoLlaves(
    inscritas: Inscrita[],
    clasif: FilaClasificacion[],
    duelos: [string, string][],
    puntos: Map<string, number>
): ContextoLlaves {
    const grupoDe: Record<string, string> = {};
    const posicionDe: Record<string, number> = {};
    for (const f of clasif) {
        grupoDe[f.id] = f.grupo;
        posicionDe[f.id] = f.posicion;
    }

    const topDos = [...inscritas]
        .sort((a, b) => (puntos.get(b.id) ?? 0) - (puntos.get(a.id) ?? 0))
        .slice(0, 2)
        .map((i) => i.id);

    return {
        activas: inscritas.map((i) => i.id),
        grupoDe,
        posicionDe,
        duelosGrupo: duelos,
        topDos,
    };
}

// Convierte una plaza guardada en una entrada del editor.
// Si hay origen (partido anterior), se prefiere para conservar la referencia.
function ladoDesdeBD(
    inscripcion: string | null,
    origen: string | null
): LadoEntrada | null {
    if (origen) {
        const [tipo, partidoId] = origen.split(":");
        if ((tipo === "ganador" || tipo === "perdedor") && partidoId) {
            return { tipo, partidoId };
        }
    }
    if (inscripcion) return { tipo: "pareja", inscripcionId: inscripcion };
    return null;
}

// Valor que toma una plaza con origen "ganador:X" o "perdedor:X", si ya se conoce.
function valorDeOrigen(origen: string, porId: Map<string, FilaBD>): string | null {
    const [tipo, idOrigen] = origen.split(":");
    const origenPartido = porId.get(idOrigen);
    if (!origenPartido?.ganador_id) return null;

    if (tipo === "ganador") return origenPartido.ganador_id;
    if (tipo === "perdedor") {
        return origenPartido.inscripcion_a === origenPartido.ganador_id
            ? origenPartido.inscripcion_b
            : origenPartido.inscripcion_a;
    }
    return null;
}

// Crea la fase de grupos con sorteo y registra el cuadro.
// Solo se ejecuta si la categoría no tiene resultados.
async function crearFaseGrupos(
    admin: Admin,
    pruebaId: string,
    categoria: Categoria
): Promise<{ ok: true; partidos: number } | { ok: false; error: string }> {
    const inscritas = await inscripcionesParticipantes(admin, pruebaId, categoria);
    const n = inscritas.length;
    if (n < MIN_PAREJAS_CATEGORIA) {
        return { ok: false, error: "Hacen falta al menos 3 parejas inscritas" };
    }
    if (n > MAX_PAREJAS_POR_CATEGORIA) {
        return { ok: false, error: `Máximo ${MAX_PAREJAS_POR_CATEGORIA} parejas por categoría` };
    }

    const tamanos = tamanosGrupos(n);
    if (!tamanos) return { ok: false, error: `No hay formato de grupos para ${n} parejas` };

    const { data: existentes, error: errorExistentes } = await admin
        .from("partidos")
        .select("id, ganador_id")
        .eq("prueba_id", pruebaId)
        .eq("categoria", categoria);
    if (errorExistentes) return { ok: false, error: errorExistentes.message };

    if ((existentes ?? []).some((p) => p.ganador_id)) {
        return {
            ok: false,
            error: "Hay resultados registrados en esta categoría. Usa Rehacer cuadro indicando el motivo.",
        };
    }

    if ((existentes ?? []).length > 0) {
        const { error } = await admin
            .from("partidos")
            .delete()
            .eq("prueba_id", pruebaId)
            .eq("categoria", categoria);
        if (error) return { ok: false, error: error.message };
    }

    const puntos = await puntosPorInscripcion(inscritas, categoria);
    const parejas: ParejaSorteo[] = inscritas.map((i) => ({
        id: i.id,
        puntos: puntos.get(i.id) ?? 0,
    }));

    const grupos = sortearGrupos(parejas, tamanos);

    const filas = grupos.flatMap((ids, g) => {
        const letra = String.fromCharCode(65 + g);
        return enfrentamientos(ids, vueltasDeGrupo(tamanos[g])).map(([a, b], orden) => ({
            id: randomUUID(),
            prueba_id: pruebaId,
            categoria,
            fase: "grupo" as const,
            formato: "grupo" as const,
            cuadro: null,
            grupo: letra,
            ronda: null,
            inscripcion_a: a,
            inscripcion_b: b,
            origen_a: null,
            origen_b: null,
            orden,
        }));
    });

    const { error } = await admin.from("partidos").insert(filas);
    if (error) return { ok: false, error: error.message };

    const { error: errorCuadro } = await admin.from("cuadros").upsert(
        {
            prueba_id: pruebaId,
            categoria,
            estado: "generado",
            participantes: inscritas.map((i) => i.id),
            generado_at: new Date().toISOString(),
        },
        { onConflict: "prueba_id,categoria" }
    );
    if (errorCuadro) return { ok: false, error: errorCuadro.message };

    return { ok: true, partidos: filas.length };
}

// ---------------------------------------------------------
// 1. Fase de grupos (sorteo automático)
// ---------------------------------------------------------
export async function generarFaseGrupos(entrada: unknown): Promise<AccionCuadros> {
    try {
        const parseo = esquemaCategoria.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria } = parseo.data;

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };

        const creado = await crearFaseGrupos(crearClienteAdmin(), pruebaId, categoria);
        if (!creado.ok) return creado;

        revalidatePath("/admin/pruebas");
        return { ok: true, partidos: creado.partidos, avisos: [] };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 2. Rehacer el cuadro de una categoría (sorteo nuevo de grupos)
// Borra partidos, llaves y puntos de la categoría. Si hay resultados, exige motivo.
// ---------------------------------------------------------
export async function rehacerCategoria(entrada: unknown): Promise<AccionCuadros> {
    try {
        const parseo = esquemaRehacer.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria, motivo } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const previos = await leerPartidos(admin, pruebaId, categoria);
        const conResultados = previos.filter((p) => p.ganador_id !== null).length;

        if (conResultados > 0 && !motivo) {
            return {
                ok: false,
                error: "Hay resultados registrados en esta categoría. Indica el motivo para borrarlos y rehacer el cuadro.",
            };
        }

        const { data: inscripciones, error: errorInsc } = await admin
            .from("inscripciones")
            .select("id")
            .eq("prueba_id", pruebaId)
            .eq("categoria", categoria);
        if (errorInsc) return { ok: false, error: errorInsc.message };

        const idsCategoria = (inscripciones ?? []).map((i) => i.id);
        let puntosBorrados = 0;

        if (idsCategoria.length > 0) {
            const { data: puntosPrevios, error: errorPuntos } = await admin
                .from("puntos_prueba")
                .select("id")
                .in("inscripcion_id", idsCategoria);
            if (errorPuntos) return { ok: false, error: errorPuntos.message };

            puntosBorrados = (puntosPrevios ?? []).length;
            if (puntosBorrados > 0) {
                const { error } = await admin
                    .from("puntos_prueba")
                    .delete()
                    .in("inscripcion_id", idsCategoria);
                if (error) return { ok: false, error: error.message };
            }
        }

        const { error: errorBorrado } = await admin
            .from("partidos")
            .delete()
            .eq("prueba_id", pruebaId)
            .eq("categoria", categoria);
        if (errorBorrado) return { ok: false, error: errorBorrado.message };

        const creado = await crearFaseGrupos(admin, pruebaId, categoria);
        if (!creado.ok) return creado;

        const errorAuditoria = await auditar(admin, {
            usuarioId,
            accion: "rehacer_cuadro",
            tabla: "cuadros",
            registroId: `${pruebaId}:${categoria}`,
            antes: { partidos: previos.length, conResultados, puntos: puntosBorrados },
            despues: { partidos: creado.partidos },
            motivo,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        revalidatePath("/admin/pruebas");
        return { ok: true, partidos: creado.partidos, avisos: [] };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 3. Editar grupos a mano
// Reconstruye los partidos de grupo con la distribución indicada.
// Requiere que no haya resultados de grupo. Borra las llaves, porque dependen de los grupos.
// ---------------------------------------------------------
export async function guardarGrupos(entrada: unknown): Promise<AccionCuadros> {
    try {
        const parseo = esquemaGrupos.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria, grupos } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const inscritas = await inscripcionesParticipantes(admin, pruebaId, categoria);
        const tamanos = tamanosGrupos(inscritas.length);
        if (!tamanos) {
            return { ok: false, error: `No hay formato de grupos para ${inscritas.length} parejas` };
        }

        if (
            grupos.length !== tamanos.length ||
            grupos.some((g, i) => g.ids.length !== tamanos[i])
        ) {
            return {
                ok: false,
                error: `Los grupos deben tener ${tamanos.join(" y ")} parejas`,
            };
        }

        const enviados = grupos.flatMap((g) => g.ids);
        if (new Set(enviados).size !== enviados.length) {
            return { ok: false, error: "Una pareja aparece más de una vez" };
        }
        if (!mismoConjunto(enviados, inscritas.map((i) => i.id))) {
            return { ok: false, error: "Los grupos deben incluir exactamente las parejas inscritas" };
        }

        const rows = await leerPartidos(admin, pruebaId, categoria);
        if (rows.some((r) => r.ganador_id)) {
            return {
                ok: false,
                error: "Hay resultados registrados en esta categoría. Usa Rehacer cuadro indicando el motivo.",
            };
        }

        const hayLlaves = rows.some((r) => r.fase === "eliminatoria");

        const { error: errorBorrado } = await admin
            .from("partidos")
            .delete()
            .eq("prueba_id", pruebaId)
            .eq("categoria", categoria);
        if (errorBorrado) return { ok: false, error: errorBorrado.message };

        const filas = grupos.flatMap((g) =>
            enfrentamientos(g.ids, vueltasDeGrupo(g.ids.length)).map(([a, b], orden) => ({
                id: randomUUID(),
                prueba_id: pruebaId,
                categoria,
                fase: "grupo" as const,
                formato: "grupo" as const,
                cuadro: null,
                grupo: g.letra,
                ronda: null,
                inscripcion_a: a,
                inscripcion_b: b,
                origen_a: null,
                origen_b: null,
                orden,
            }))
        );

        const { error: errorInsert } = await admin.from("partidos").insert(filas);
        if (errorInsert) return { ok: false, error: errorInsert.message };

        const { error: errorCuadro } = await admin.from("cuadros").upsert(
            {
                prueba_id: pruebaId,
                categoria,
                estado: "generado",
                participantes: enviados,
                generado_at: new Date().toISOString(),
            },
            { onConflict: "prueba_id,categoria" }
        );
        if (errorCuadro) return { ok: false, error: errorCuadro.message };

        const errorAuditoria = await auditar(admin, {
            usuarioId,
            accion: "editar_grupos",
            tabla: "partidos",
            registroId: `${pruebaId}:${categoria}`,
            antes: { partidos: rows.length },
            despues: {
                grupos: grupos.map((g) => ({ letra: g.letra, ids: g.ids })),
                partidos: filas.length,
            },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        revalidatePath("/admin/pruebas");
        return {
            ok: true,
            partidos: filas.length,
            avisos: hayLlaves ? ["Se han borrado las llaves: vuelve a generarlas"] : [],
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 4. Dar de baja una inscripción (también de última hora)
// Si ocupaba plaza, entra el primero de la lista de espera.
// El trigger marca el cuadro como desactualizado.
// ---------------------------------------------------------
export async function darDeBajaInscripcion(entrada: unknown): Promise<AccionSimple> {
    try {
        const parseo = esquemaBaja.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { inscripcionId, motivo } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: insc, error: errorLectura } = await admin
            .from("inscripciones")
            .select("id, prueba_id, categoria, estado")
            .eq("id", inscripcionId)
            .single();
        if (errorLectura || !insc) return { ok: false, error: "Inscripción no encontrada" };
        if (insc.estado === "retirada") return { ok: false, error: "Ya estaba retirada" };

        const { error: errorUpdate } = await admin
            .from("inscripciones")
            .update({ estado: "retirada" })
            .eq("id", insc.id);
        if (errorUpdate) return { ok: false, error: errorUpdate.message };

        const ocupaba = (ESTADOS_QUE_OCUPAN_PLAZA as readonly string[]).includes(insc.estado);
        let promovidaId: string | null = null;

        if (ocupaba) {
            const { data: siguiente } = await admin
                .from("inscripciones")
                .select("id")
                .eq("prueba_id", insc.prueba_id)
                .eq("categoria", insc.categoria)
                .eq("estado", "lista_espera")
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle();

            if (siguiente) {
                const { error } = await admin
                    .from("inscripciones")
                    .update({ estado: "pendiente" })
                    .eq("id", siguiente.id);
                if (error) return { ok: false, error: error.message };
                promovidaId = siguiente.id;
            }
        }

        const errorAuditoria = await auditar(admin, {
            usuarioId,
            accion: "dar_de_baja",
            tabla: "inscripciones",
            registroId: insc.id,
            antes: { estado: insc.estado },
            despues: { estado: "retirada", promovida: promovidaId },
            motivo,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        revalidatePath("/admin/pruebas");
        revalidatePath("/admin/inscripciones");
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 5. Estado del cuadro: qué ha cambiado desde el último sorteo
// ---------------------------------------------------------
export async function estadoCuadro(entrada: unknown): Promise<EstadoCuadro> {
    try {
        const parseo = esquemaCategoria.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria } = parseo.data;

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const actuales = (await inscripcionesParticipantes(admin, pruebaId, categoria)).map(
            (i) => i.id
        );

        const { data: cuadro, error: errorCuadro } = await admin
            .from("cuadros")
            .select("estado, participantes")
            .eq("prueba_id", pruebaId)
            .eq("categoria", categoria)
            .maybeSingle();
        if (errorCuadro) return { ok: false, error: errorCuadro.message };

        const registrados = (cuadro?.participantes ?? []) as string[];
        const estado = (cuadro?.estado ?? "sin_generar") as EstadoCuadroValor;

        const partidos = await leerPartidos(admin, pruebaId, categoria);

        return {
            ok: true,
            estado,
            participantes: actuales.length,
            altas: actuales.filter((id) => !registrados.includes(id)),
            bajas: registrados.filter((id) => !actuales.includes(id)),
            conResultados: partidos.some((p) => p.ganador_id !== null),
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 6. Datos para los editores de grupos y de llaves
// Devuelve las llaves guardadas o, si no hay, la plantilla sugerida.
// ---------------------------------------------------------
export async function obtenerEditorLlaves(
    entrada: unknown
): Promise<{ ok: true; datos: DatosEditor } | { ok: false; error: string }> {
    try {
        const parseo = esquemaCategoria.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria } = parseo.data;

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const inscritas = await inscripcionesParticipantes(admin, pruebaId, categoria);
        if (inscritas.length < MIN_PAREJAS_CATEGORIA) {
            return { ok: false, error: "Hacen falta al menos 3 parejas inscritas" };
        }

        const rows = await leerPartidos(admin, pruebaId, categoria);
        const grupoRows = rows.filter((r) => r.fase === "grupo");
        const elimRows = rows.filter((r) => r.fase === "eliminatoria" && r.ronda !== "automatico");
        const autoRows = rows.filter((r) => r.fase === "eliminatoria" && r.ronda === "automatico");

        const puntos = await puntosPorInscripcion(inscritas, categoria);
        const grupos = clasificarTodos(grupoRows);
        const clasif = grupos.flatMap((g) => g.filas);

        const nombres = await nombresDe(
            admin,
            [...new Set(inscritas.flatMap((i) => [i.jugador_1, i.jugador_2].filter(Boolean) as string[]))]
        );

        const inscripciones: InscripcionEditor[] = inscritas.map((i) => {
            const f = clasif.find((c) => c.id === i.id);
            const sufijo = f ? ` · ${f.posicion}.º ${f.grupo}` : "";
            return {
                inscripcionId: i.id,
                grupo: f?.grupo ?? "",
                posicion: f?.posicion ?? 0,
                texto: `${textoPareja(i, nombres)}${sufijo}`,
            };
        });

        const sugerida = elimRows.length === 0;
        const plantilla = plantillaPorDefecto(inscritas.length);

        const partidos: PartidoEntrada[] = sugerida
            ? (plantilla?.partidos ?? [])
            : elimRows.map((r) => ({
                id: r.id,
                cuadro: r.cuadro as Cuadro,
                ronda: r.ronda as FaseCuadro,
                formato: r.formato as "fase_final" | "final",
                orden: r.orden,
                a: ladoDesdeBD(r.inscripcion_a, r.origen_a),
                b: ladoDesdeBD(r.inscripcion_b, r.origen_b),
            }));

        const automaticos: AutomaticoEntrada[] = sugerida
            ? (plantilla?.automaticos ?? [])
            : autoRows.map((r) => ({
                cuadro: r.cuadro as Cuadro,
                inscripcionId: r.inscripcion_a,
            }));

        return {
            ok: true,
            datos: {
                parejas: inscritas.length,
                bloqueado: elimRows.some((r) => r.ganador_id !== null),
                sugerida,
                grupos: grupos.map(({ letra, completo, filas }) => ({ letra, completo, filas })),
                inscripciones,
                partidos,
                automaticos,
                contexto: contextoLlaves(inscritas, clasif, duelosDe(grupoRows), puntos),
            },
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 7. Sugerir sorteo de cuartos (solo con 10 parejas)
// Devuelve los cruces sin guardar: el editor los aplica y el organizador puede cambiarlos.
// Las parejas son las que ocupan posiciones 1.ª a 4.ª de cada grupo de 5.
// ---------------------------------------------------------
export async function sortearCuartos(entrada: unknown): Promise<AccionSorteo> {
    try {
        const parseo = esquemaCategoria.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria } = parseo.data;

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const inscritas = await inscripcionesParticipantes(admin, pruebaId, categoria);
        if (inscritas.length !== 10) {
            return { ok: false, error: "Los cuartos solo se sortean con 10 parejas" };
        }

        const rows = await leerPartidos(admin, pruebaId, categoria);
        const grupoRows = rows.filter((r) => r.fase === "grupo");
        if (grupoRows.length === 0) return { ok: false, error: "Primero genera la fase de grupos" };
        if (grupoRows.some((r) => !r.ganador_id)) {
            return { ok: false, error: "Faltan resultados de la fase de grupos" };
        }

        const puntos = await puntosPorInscripcion(inscritas, categoria);
        const clasif = clasificarTodos(grupoRows).flatMap((g) => g.filas);
        const oro: ParticipanteLlave[] = aParticipantesLlave(clasif, puntos).filter(
            (p) => p.posicion <= 4
        );
        if (oro.length !== 8) {
            return { ok: false, error: "No se pueden identificar las 8 parejas de cuartos" };
        }

        const cruces = sortearLlave(oro, { primeroVsSegundo: true });
        if (!cruces) {
            return { ok: false, error: "No se encontró un sorteo válido. Repítelo." };
        }

        return { ok: true, cruces };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 8. Guardar las llaves editadas
// Sustituye todos los partidos de fase final de la categoría.
// Las referencias (ganador/perdedor) se traducen a ids nuevos.
// ---------------------------------------------------------
export async function guardarLlaves(entrada: unknown): Promise<AccionCuadros> {
    try {
        const parseo = esquemaGuardar.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria, partidos, automaticos, motivo } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const inscritas = await inscripcionesParticipantes(admin, pruebaId, categoria);
        const rows = await leerPartidos(admin, pruebaId, categoria);
        const grupoRows = rows.filter((r) => r.fase === "grupo");
        const elimRows = rows.filter((r) => r.fase === "eliminatoria" && r.ronda !== "automatico");

        if (grupoRows.length === 0) {
            return { ok: false, error: "Primero genera la fase de grupos" };
        }

        const bloqueado = elimRows.some((r) => r.ganador_id !== null);
        if (bloqueado && !motivo) {
            return {
                ok: false,
                error: "Hay resultados en la fase final. Indica un motivo para rehacer las llaves.",
            };
        }

        const puntos = await puntosPorInscripcion(inscritas, categoria);
        const grupos = clasificarTodos(grupoRows);
        const clasif = grupos.flatMap((g) => g.filas);
        const contexto = contextoLlaves(inscritas, clasif, duelosDe(grupoRows), puntos);

        const incidencias = validarLlaves(partidos, automaticos, contexto);
        const errores = incidencias.filter((i) => i.nivel === "error");
        if (errores.length > 0) {
            return { ok: false, error: "Hay errores en las llaves", incidencias: errores };
        }

        const idReal = new Map<string, string>(partidos.map((p) => [p.id, randomUUID()]));
        const resolver = (id: string): string => {
            const real = idReal.get(id);
            if (!real) throw new Error("Referencia a un partido que no existe");
            return real;
        };

        const ladoBD = (l: LadoEntrada | null) => {
            if (!l) return { inscripcion: null, origen: null };
            if (l.tipo === "pareja") return { inscripcion: l.inscripcionId, origen: null };
            return { inscripcion: null, origen: `${l.tipo}:${resolver(l.partidoId)}` };
        };

        const filasPartidos = partidos.map((p) => {
            const a = ladoBD(p.a);
            const b = ladoBD(p.b);
            return {
                id: resolver(p.id),
                prueba_id: pruebaId,
                categoria,
                fase: "eliminatoria" as const,
                formato: p.formato,
                cuadro: p.cuadro,
                grupo: null,
                ronda: p.ronda,
                inscripcion_a: a.inscripcion,
                origen_a: a.origen,
                inscripcion_b: b.inscripcion,
                origen_b: b.origen,
                orden: p.orden,
            };
        });

        const filasAutomaticos = automaticos
            .filter((a) => a.inscripcionId)
            .map((a, orden) => ({
                id: randomUUID(),
                prueba_id: pruebaId,
                categoria,
                fase: "eliminatoria" as const,
                formato: "fase_final" as const,
                cuadro: a.cuadro,
                grupo: null,
                ronda: "automatico",
                inscripcion_a: a.inscripcionId,
                origen_a: null,
                inscripcion_b: null,
                origen_b: null,
                orden,
            }));

        const { error: errorBorrado } = await admin
            .from("partidos")
            .delete()
            .eq("prueba_id", pruebaId)
            .eq("categoria", categoria)
            .eq("fase", "eliminatoria");
        if (errorBorrado) return { ok: false, error: errorBorrado.message };

        const todas = [...filasPartidos, ...filasAutomaticos];
        if (todas.length > 0) {
            const { error } = await admin.from("partidos").insert(todas);
            if (error) return { ok: false, error: error.message };
        }

        if (bloqueado) {
            const errorAuditoria = await auditar(admin, {
                usuarioId,
                accion: "rehacer_llaves",
                tabla: "partidos",
                registroId: `${pruebaId}:${categoria}`,
                antes: elimRows.map((r) => ({ id: r.id, ganador: r.ganador_id, resultado: r.resultado })),
                despues: { partidos: todas.length },
                motivo,
            });
            if (errorAuditoria) return { ok: false, error: errorAuditoria };
        }

        const avisos = incidencias.filter((i) => i.nivel === "aviso").map((i) => i.mensaje);
        if (grupos.some((g) => !g.completo)) {
            avisos.unshift("Hay grupos sin terminar: las posiciones pueden cambiar");
        }

        revalidatePath("/admin/pruebas");
        return { ok: true, partidos: todas.length, avisos };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 9. Avanzar las llaves
// Rellena las plazas cuyo origen (ganador/perdedor) ya tiene resultado.
// ---------------------------------------------------------
export async function avanzarCuadros(entrada: unknown): Promise<AccionCuadros> {
    try {
        const parseo = esquemaCategoria.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria } = parseo.data;

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const rows = await leerPartidos(admin, pruebaId, categoria);
        const elim = rows.filter((r) => r.fase === "eliminatoria" && r.ronda !== "automatico");
        const porId = new Map(elim.map((f) => [f.id, f]));
        let actualizados = 0;

        for (const f of elim) {
            const cambios: { inscripcion_a?: string; inscripcion_b?: string } = {};

            if (!f.inscripcion_a && f.origen_a) {
                const v = valorDeOrigen(f.origen_a, porId);
                if (v) cambios.inscripcion_a = v;
            }
            if (!f.inscripcion_b && f.origen_b) {
                const v = valorDeOrigen(f.origen_b, porId);
                if (v) cambios.inscripcion_b = v;
            }

            if (Object.keys(cambios).length > 0) {
                const { error } = await admin.from("partidos").update(cambios).eq("id", f.id);
                if (error) return { ok: false, error: error.message };
                actualizados++;
            }
        }

        revalidatePath("/admin/pruebas");
        return { ok: true, partidos: actualizados, avisos: [] };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}
