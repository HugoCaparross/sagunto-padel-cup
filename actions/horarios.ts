"use server";

import { z } from "zod";
import { type Categoria, type Cuadro } from "@/lib/constantes";
import {
    detectarConflictos,
    planificar,
    type Asignacion,
    type Colocado,
    type Pista,
    type Ventana,
} from "@/lib/horarios/planificador";
import {
    aMinutos,
    desdeInstante,
    diasEntre,
    instanteMadrid,
} from "@/lib/horarios/tiempo";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

// ---------------------------------------------------------
// TIPOS PÚBLICOS
// ---------------------------------------------------------
export type FilaHorario = {
    id: string;
    categoria: Categoria;
    fase: "grupo" | "eliminatoria";
    formato: string;
    cuadro: Cuadro | null;
    ronda: string;
    orden: number;
    textoA: string;
    textoB: string;
    jugadores: string[];
    dependeDe: string[];
    duracionMin: number;
    pistaId: string | null;
    fecha: string | null;
    inicioMin: number | null;
};

export type DatosHorarios = {
    prueba: {
        fechaInicio: string;
        fechaFin: string;
        horaInicio: string;
        horaFin: string;
        descansoMin: number;
        plazasMaximas: number;
        duracion: { grupo: number; fase_final: number; final: number };
    };
    pistas: { id: string; numero: number }[];
    partidos: FilaHorario[];
};

export type AccionSimple = { ok: true } | { ok: false; error: string };

export type ResultadoPlan =
    | {
        ok: true;
        asignaciones: Asignacion[];
        sinAsignar: { partidoId: string; motivo: string }[];
    }
    | { ok: false; error: string };

// ---------------------------------------------------------
// INTERNOS
// ---------------------------------------------------------
type PruebaFila = {
    id: string;
    fecha_inicio: string;
    fecha_fin: string;
    hora_inicio: string;
    hora_fin: string;
    plazas_maximas: number;
    descanso_min: number;
    duracion_grupo_min: number;
    duracion_fase_final_min: number;
    duracion_final_min: number;
};

type PartidoFila = {
    id: string;
    categoria: Categoria;
    fase: "grupo" | "eliminatoria";
    formato: string;
    cuadro: Cuadro | null;
    grupo: string | null;
    ronda: string | null;
    inscripcion_a: string | null;
    inscripcion_b: string | null;
    origen_a: string | null;
    origen_b: string | null;
    pista_id: string | null;
    inicio: string | null;
    duracion_min: number | null;
    orden: number;
};

const esquemaPrueba = z.object({ pruebaId: z.uuid() });

const esquemaPlanificar = z.object({
    pruebaId: z.uuid(),
    incluirEliminatorias: z.boolean(),
});

const esquemaAsignacion = z.object({
    partidoId: z.uuid(),
    pistaId: z.uuid().nullable(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    inicioMin: z.number().int().min(0).max(1439).nullable(),
    duracionMin: z.number().int().min(5).max(300),
});

const esquemaGuardar = z.object({
    pruebaId: z.uuid(),
    asignaciones: z.array(esquemaAsignacion).max(300),
});

const esquemaConfigurar = z.object({
    pruebaId: z.uuid(),
    pistas: z.number().int().min(1).max(20),
    plazasMaximas: z.number().int().min(3).max(200),
    descansoMin: z.number().int().min(0).max(60),
    duracionGrupoMin: z.number().int().min(20).max(180),
    duracionFaseFinalMin: z.number().int().min(20).max(180),
    duracionFinalMin: z.number().int().min(20).max(240),
});

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
    admin: ReturnType<typeof crearClienteAdmin>,
    p: {
        usuarioId: string;
        accion: string;
        registroId: string;
        antes: unknown;
        despues: unknown;
        motivo?: string;
    }
): Promise<string | null> {
    const { error } = await admin.from("auditoria").insert({
        usuario_id: p.usuarioId,
        accion: p.accion,
        tabla: "partidos",
        registro_id: p.registroId,
        antes: p.antes,
        despues: p.despues,
        motivo: p.motivo ?? null,
    });
    return error ? `No se pudo registrar la auditoría: ${error.message}` : null;
}

function duracionPorDefecto(formato: string, prueba: PruebaFila): number {
    if (formato === "grupo") return prueba.duracion_grupo_min;
    if (formato === "final") return prueba.duracion_final_min;
    return prueba.duracion_fase_final_min;
}

function ventanasDe(prueba: DatosHorarios["prueba"]): Ventana[] {
    return diasEntre(prueba.fechaInicio, prueba.fechaFin).map((fecha) => ({
        fecha,
        inicioMin: aMinutos(prueba.horaInicio),
        finMin: aMinutos(prueba.horaFin),
    }));
}

// ---------------------------------------------------------
// 1. Datos del editor
// ---------------------------------------------------------
export async function obtenerDatosHorarios(
    entrada: unknown
): Promise<{ ok: true; datos: DatosHorarios } | { ok: false; error: string }> {
    try {
        const parseo = esquemaPrueba.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId } = parseo.data;

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: prueba, error: errorPrueba } = await admin
            .from("pruebas")
            .select(
                "id, fecha_inicio, fecha_fin, hora_inicio, hora_fin, plazas_maximas, descanso_min, duracion_grupo_min, duracion_fase_final_min, duracion_final_min"
            )
            .eq("id", pruebaId)
            .single();
        if (errorPrueba || !prueba) return { ok: false, error: "Prueba no encontrada" };
        const p = prueba as PruebaFila;

        const { data: pistas, error: errorPistas } = await admin
            .from("pistas")
            .select("id, numero")
            .eq("prueba_id", pruebaId)
            .order("numero", { ascending: true });
        if (errorPistas) return { ok: false, error: errorPistas.message };

        const { data: partidos, error: errorPartidos } = await admin
            .from("partidos")
            .select(
                "id, categoria, fase, formato, cuadro, grupo, ronda, inscripcion_a, inscripcion_b, origen_a, origen_b, pista_id, inicio, duracion_min, orden"
            )
            .eq("prueba_id", pruebaId)
            .order("orden", { ascending: true });
        if (errorPartidos) return { ok: false, error: errorPartidos.message };

        const { data: insc, error: errorInsc } = await admin
            .from("inscripciones")
            .select("id, jugador_1, jugador_2")
            .eq("prueba_id", pruebaId);
        if (errorInsc) return { ok: false, error: errorInsc.message };

        const jugadoresDe = new Map<string, string[]>(
            (insc ?? []).map((i) => [
                i.id as string,
                [i.jugador_1 as string, ...(i.jugador_2 ? [i.jugador_2 as string] : [])],
            ])
        );

        const todosJugadores = [...new Set([...jugadoresDe.values()].flat())];
        const nombres = new Map<string, string>();
        if (todosJugadores.length > 0) {
            const { data: perfiles } = await admin
                .from("perfiles")
                .select("id, nombre")
                .in("id", todosJugadores);
            for (const pf of (perfiles ?? []) as { id: string; nombre: string }[]) {
                nombres.set(pf.id, pf.nombre || "Jugador");
            }
        }

        const textoPareja = (ins: string | null, origen: string | null): string => {
            if (ins) {
                const texto = (jugadoresDe.get(ins) ?? [])
                    .map((id) => nombres.get(id) ?? "Jugador")
                    .join(" / ");
                return texto || "Pareja";
            }
            if (origen) {
                return origen.startsWith("ganador:")
                    ? "Ganador de otro partido"
                    : "Perdedor de otro partido";
            }
            return "Por definir";
        };

        const depDe = (origen: string | null): string | null =>
            origen && origen.includes(":") ? origen.split(":")[1] : null;

        const filas: FilaHorario[] = ((partidos ?? []) as PartidoFila[]).map((f) => {
            const instante = f.inicio ? desdeInstante(f.inicio) : null;
            const jugadores = [
                ...(f.inscripcion_a ? (jugadoresDe.get(f.inscripcion_a) ?? []) : []),
                ...(f.inscripcion_b ? (jugadoresDe.get(f.inscripcion_b) ?? []) : []),
            ];
            return {
                id: f.id,
                categoria: f.categoria,
                fase: f.fase,
                formato: f.formato,
                cuadro: f.cuadro,
                ronda: f.ronda ?? "grupo",
                orden: f.orden,
                textoA: textoPareja(f.inscripcion_a, f.origen_a),
                textoB: textoPareja(f.inscripcion_b, f.origen_b),
                jugadores,
                dependeDe: [depDe(f.origen_a), depDe(f.origen_b)].filter(
                    (x): x is string => Boolean(x)
                ),
                duracionMin: f.duracion_min ?? duracionPorDefecto(f.formato, p),
                pistaId: f.pista_id,
                fecha: instante?.fecha ?? null,
                inicioMin: instante?.minutos ?? null,
            };
        });

        return {
            ok: true,
            datos: {
                prueba: {
                    fechaInicio: p.fecha_inicio,
                    fechaFin: p.fecha_fin,
                    horaInicio: p.hora_inicio,
                    horaFin: p.hora_fin,
                    descansoMin: p.descanso_min,
                    plazasMaximas: p.plazas_maximas,
                    duracion: {
                        grupo: p.duracion_grupo_min,
                        fase_final: p.duracion_fase_final_min,
                        final: p.duracion_final_min,
                    },
                },
                pistas: (pistas ?? []) as { id: string; numero: number }[],
                partidos: filas,
            },
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 2. Propuesta automática (no guarda nada)
// Por defecto solo programa la fase de grupos. Las eliminatorias
// se pueden incluir, y se colocan cuando sus partidos de origen tienen horario.
// ---------------------------------------------------------
export async function planificarHorarios(entrada: unknown): Promise<ResultadoPlan> {
    try {
        const parseo = esquemaPlanificar.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, incluirEliminatorias } = parseo.data;

        const datos = await obtenerDatosHorarios({ pruebaId });
        if (!datos.ok) return datos;
        const { prueba, pistas, partidos } = datos.datos;

        const fijados: Colocado[] = [];
        for (const f of partidos) {
            if (f.pistaId && f.fecha && f.inicioMin !== null) {
                fijados.push({
                    partidoId: f.id,
                    pistaId: f.pistaId,
                    fecha: f.fecha,
                    inicioMin: f.inicioMin,
                    duracionMin: f.duracionMin,
                    jugadores: f.jugadores,
                    dependeDe: f.dependeDe,
                });
            }
        }

        const pendientes = partidos.filter(
            (f) => !f.pistaId && (incluirEliminatorias || f.fase === "grupo")
        );

        const plan = planificar({
            partidos: pendientes.map((f) => ({
                id: f.id,
                categoria: f.categoria,
                ronda: f.ronda,
                duracionMin: f.duracionMin,
                jugadores: f.jugadores,
                dependeDe: f.dependeDe,
            })),
            pistas: pistas as Pista[],
            ventanas: ventanasDe(prueba),
            descansoMin: prueba.descansoMin,
            fijados,
        });

        return { ok: true, asignaciones: plan.asignaciones, sinAsignar: plan.sinAsignar };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 3. Guardar horarios
// Valida conflictos sobre el conjunto completo antes de escribir.
// Pista nula = partido sin horario.
// ---------------------------------------------------------
export async function guardarHorarios(entrada: unknown): Promise<AccionSimple> {
    try {
        const parseo = esquemaGuardar.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, asignaciones } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };

        const datos = await obtenerDatosHorarios({ pruebaId });
        if (!datos.ok) return datos;
        const { prueba, pistas, partidos } = datos.datos;

        const porId = new Map(partidos.map((f) => [f.id, f]));
        const cambiosPorId = new Map(asignaciones.map((a) => [a.partidoId, a]));

        for (const a of asignaciones) {
            if (!porId.has(a.partidoId)) {
                return { ok: false, error: "Un partido no pertenece a esta prueba" };
            }
            if (a.pistaId && !pistas.some((p) => p.id === a.pistaId)) {
                return { ok: false, error: "Una pista no pertenece a esta prueba" };
            }
            if (a.pistaId && (!a.fecha || a.inicioMin === null)) {
                return { ok: false, error: "Un partido con pista necesita fecha y hora" };
            }
        }

        const finales: Colocado[] = [];
        for (const f of partidos) {
            const c = cambiosPorId.get(f.id);
            const pistaId = c ? c.pistaId : f.pistaId;
            if (!pistaId) continue;

            const fecha = c ? c.fecha : f.fecha;
            const inicioMin = c ? c.inicioMin : f.inicioMin;
            if (!fecha || inicioMin === null) {
                return { ok: false, error: "Falta fecha u hora en un partido con pista" };
            }

            finales.push({
                partidoId: f.id,
                pistaId,
                fecha,
                inicioMin,
                duracionMin: c ? c.duracionMin : f.duracionMin,
                jugadores: f.jugadores,
                dependeDe: f.dependeDe,
            });
        }

        const conflictos = detectarConflictos(finales, prueba.descansoMin);
        if (conflictos.length > 0) {
            return {
                ok: false,
                error: [...new Set(conflictos.map((c) => c.mensaje))].join(". "),
            };
        }

        const admin = crearClienteAdmin();

        for (const a of asignaciones) {
            const fila =
                a.pistaId && a.fecha && a.inicioMin !== null
                    ? {
                        pista_id: a.pistaId,
                        inicio: instanteMadrid(a.fecha, a.inicioMin),
                        fin: instanteMadrid(a.fecha, a.inicioMin + a.duracionMin),
                        duracion_min: a.duracionMin,
                    }
                    : {
                        pista_id: null,
                        inicio: null,
                        fin: null,
                        duracion_min: a.duracionMin,
                    };

            const { error } = await admin.from("partidos").update(fila).eq("id", a.partidoId);
            if (error) return { ok: false, error: error.message };
        }

        const errorAuditoria = await auditar(admin, {
            usuarioId,
            accion: "guardar_horarios",
            registroId: pruebaId,
            antes: null,
            despues: { partidosActualizados: asignaciones.length },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 4. Configuración de la prueba: pistas, plazas, descanso y duraciones
// Añadir pistas es libre. Quitar pistas exige que no tengan partidos.
// ---------------------------------------------------------
export async function configurarPrueba(entrada: unknown): Promise<AccionSimple> {
    try {
        const parseo = esquemaConfigurar.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { error: errorPrueba } = await admin
            .from("pruebas")
            .update({
                plazas_maximas: d.plazasMaximas,
                descanso_min: d.descansoMin,
                duracion_grupo_min: d.duracionGrupoMin,
                duracion_fase_final_min: d.duracionFaseFinalMin,
                duracion_final_min: d.duracionFinalMin,
            })
            .eq("id", d.pruebaId);
        if (errorPrueba) return { ok: false, error: errorPrueba.message };

        const { data: actuales, error: errorActuales } = await admin
            .from("pistas")
            .select("id, numero")
            .eq("prueba_id", d.pruebaId);
        if (errorActuales) return { ok: false, error: errorActuales.message };

        const lista = (actuales ?? []) as { id: string; numero: number }[];
        const maximo = lista.reduce((m, p) => Math.max(m, p.numero), 0);

        if (d.pistas > maximo) {
            const nuevas = Array.from({ length: d.pistas - maximo }, (_, i) => ({
                prueba_id: d.pruebaId,
                numero: maximo + i + 1,
            }));
            const { error } = await admin.from("pistas").insert(nuevas);
            if (error) return { ok: false, error: error.message };
        }

        if (d.pistas < maximo) {
            const sobrantes = lista.filter((p) => p.numero > d.pistas);
            const ids = sobrantes.map((p) => p.id);

            const { data: usadas, error: errorUsadas } = await admin
                .from("partidos")
                .select("id")
                .in("pista_id", ids)
                .limit(1);
            if (errorUsadas) return { ok: false, error: errorUsadas.message };
            if ((usadas ?? []).length > 0) {
                return {
                    ok: false,
                    error: "Hay partidos asignados a pistas que quieres quitar. Libéralos antes.",
                };
            }

            const { error } = await admin.from("pistas").delete().in("id", ids);
            if (error) return { ok: false, error: error.message };
        }

        const errorAuditoria = await auditar(admin, {
            usuarioId,
            accion: "configurar_prueba",
            registroId: d.pruebaId,
            antes: { pistas: maximo },
            despues: {
                pistas: d.pistas,
                plazasMaximas: d.plazasMaximas,
                descansoMin: d.descansoMin,
                duraciones: {
                    grupo: d.duracionGrupoMin,
                    fase_final: d.duracionFaseFinalMin,
                    final: d.duracionFinalMin,
                },
            },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}
