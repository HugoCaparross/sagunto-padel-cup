"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    CATEGORIAS,
    CUADROS,
    ESTADOS_QUE_OCUPAN_PLAZA,
    type Categoria,
    type Cuadro,
} from "@/lib/constantes";
import type { SetJuego } from "@/lib/cuadros/clasificacion";
import { FASES_CUADRO, type FaseCuadro } from "@/lib/cuadros/formatos";
import {
    calcularPosiciones,
    type AutomaticoFinal,
    type EliminatoriaFinal,
    type ResultadoPosicion,
    type RondaPuntos,
    type RoundRobinFinal,
} from "@/lib/cuadros/posiciones";
import { puntosPara } from "@/lib/puntos/escala";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";
import { registrarPosicionFinal } from "@/actions/resultados";

type Admin = ReturnType<typeof crearClienteAdmin>;

export type PosicionPreview = {
    inscripcionId: string;
    texto: string;
    cuadro: Cuadro;
    ronda: RondaPuntos;
    puntosPorJugador: number;
};

export type PreviewCierre =
    | {
        ok: true;
        filas: PosicionPreview[];
        requiereMotivo: boolean;
        motivoDe: string;
    }
    | { ok: false; error: string; motivos?: string[] };

export type AccionCierre =
    | { ok: true; publicadas: number }
    | { ok: false; error: string; publicadas?: number };

const esquemaCategoria = z.object({
    pruebaId: z.uuid(),
    categoria: z.enum(CATEGORIAS),
});

const esquemaCierre = esquemaCategoria.extend({
    motivo: z
        .string()
        .trim()
        .min(10, "El motivo debe tener al menos 10 caracteres")
        .max(500)
        .optional(),
});

type InscritaFila = { id: string; jugador_1: string; jugador_2: string | null };

type PartidoFila = {
    id: string;
    fase: string;
    cuadro: Cuadro | null;
    grupo: string | null;
    ronda: string | null;
    inscripcion_a: string | null;
    inscripcion_b: string | null;
    ganador_id: string | null;
    resultado: SetJuego[] | null;
};

type CalculoBD =
    | { ok: true; inscritas: InscritaFila[]; resultados: ResultadoPosicion[] }
    | { ok: false; error: string; motivos?: string[] };

// Devuelve el id del organizador, o null si no lo es.
async function exigirOrganizador(): Promise<boolean> {
    const supabase = await crearClienteServidor();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .single();
    return perfil?.rol === "organizador";
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

// Lee las parejas y los partidos de la categoría y calcula las posiciones finales.
async function calcularBD(
    admin: Admin,
    pruebaId: string,
    categoria: Categoria
): Promise<CalculoBD> {
    const { data: insc, error: errorInsc } = await admin
        .from("inscripciones")
        .select("id, jugador_1, jugador_2")
        .eq("prueba_id", pruebaId)
        .eq("categoria", categoria)
        .in("estado", [...ESTADOS_QUE_OCUPAN_PLAZA]);
    if (errorInsc) return { ok: false, error: errorInsc.message };

    const inscritas = (insc ?? []) as InscritaFila[];
    if (inscritas.length === 0) {
        return { ok: false, error: "No hay parejas inscritas en esta categoría" };
    }

    const { data: partidos, error: errorPartidos } = await admin
        .from("partidos")
        .select(
            "id, fase, cuadro, grupo, ronda, inscripcion_a, inscripcion_b, ganador_id, resultado"
        )
        .eq("prueba_id", pruebaId)
        .eq("categoria", categoria)
        .order("orden", { ascending: true });
    if (errorPartidos) return { ok: false, error: errorPartidos.message };

    const filas = (partidos ?? []) as unknown as PartidoFila[];

    const grupo = filas.filter((f) => f.fase === "grupo");
    if (grupo.length === 0) return { ok: false, error: "Primero genera la fase de grupos" };
    if (grupo.some((f) => !f.ganador_id)) {
        return { ok: false, error: "Faltan resultados de la fase de grupos" };
    }

    const eliminatorias: EliminatoriaFinal[] = [];
    const roundRobin: RoundRobinFinal[] = [];
    const automaticos: AutomaticoFinal[] = [];

    for (const f of filas) {
        if (f.fase !== "eliminatoria" || !f.cuadro || !f.ronda) continue;

        if (f.ronda === "automatico") {
            automaticos.push({ cuadro: f.cuadro, inscripcionId: f.inscripcion_a });
            continue;
        }

        if (f.ronda === "round_robin") {
            if (f.inscripcion_a && f.inscripcion_b) {
                roundRobin.push({
                    cuadro: f.cuadro,
                    a: f.inscripcion_a,
                    b: f.inscripcion_b,
                    sets: f.resultado,
                    ganadorId: f.ganador_id,
                });
            }
            continue;
        }

        if (!(FASES_CUADRO as readonly string[]).includes(f.ronda)) continue;

        eliminatorias.push({
            id: f.id,
            cuadro: f.cuadro,
            ronda: f.ronda as Exclude<FaseCuadro, "round_robin">,
            a: f.inscripcion_a,
            b: f.inscripcion_b,
            ganadorId: f.ganador_id,
        });
    }

    const calculo = calcularPosiciones({
        inscripciones: inscritas.map((i) => i.id),
        eliminatorias,
        roundRobin,
        automaticos,
    });

    if (!calculo.ok) {
        return {
            ok: false,
            error: "Hay pendientes antes de publicar las posiciones",
            motivos: calculo.motivos,
        };
    }

    return { ok: true, inscritas, resultados: calculo.resultados };
}

// Hace falta motivo si ya hay puntos publicados o la prueba está finalizada.
async function requiereMotivo(
    admin: Admin,
    pruebaId: string,
    inscripcionIds: string[]
): Promise<{ requiere: boolean; razon: string }> {
    const { data: prueba } = await admin
        .from("pruebas")
        .select("estado")
        .eq("id", pruebaId)
        .single();
    if (prueba?.estado === "finalizada") {
        return { requiere: true, razon: "La prueba está marcada como finalizada" };
    }

    if (inscripcionIds.length > 0) {
        const { data: previos } = await admin
            .from("puntos_prueba")
            .select("id")
            .in("inscripcion_id", inscripcionIds)
            .limit(1);
        if ((previos ?? []).length > 0) {
            return { requiere: true, razon: "Ya hay puntos publicados para esta categoría" };
        }
    }

    return { requiere: false, razon: "" };
}

// ---------------------------------------------------------
// 1. Vista previa (no escribe nada)
// ---------------------------------------------------------
export async function calcularPosicionesCategoria(entrada: unknown): Promise<PreviewCierre> {
    try {
        const parseo = esquemaCategoria.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria } = parseo.data;

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const calc = await calcularBD(admin, pruebaId, categoria);
        if (!calc.ok) return calc;

        const todosLosJugadores = [
            ...new Set(
                calc.inscritas.flatMap((i) =>
                    [i.jugador_1, i.jugador_2].filter((x): x is string => Boolean(x))
                )
            ),
        ];
        const nombres = await nombresDe(admin, todosLosJugadores);
        const porId = new Map(calc.inscritas.map((i) => [i.id, i]));

        const filas: PosicionPreview[] = [];
        for (const r of calc.resultados) {
            const i = porId.get(r.inscripcionId);
            if (!i) continue;
            const texto = i.jugador_2
                ? `${nombres.get(i.jugador_1) ?? "Jugador"} / ${nombres.get(i.jugador_2) ?? "Jugador"}`
                : `${nombres.get(i.jugador_1) ?? "Jugador"} (sin pareja)`;

            filas.push({
                inscripcionId: r.inscripcionId,
                texto,
                cuadro: r.cuadro,
                ronda: r.ronda,
                puntosPorJugador: puntosPara(categoria, r.cuadro, r.ronda),
            });
        }

        filas.sort(
            (x, y) =>
                CUADROS.indexOf(x.cuadro) - CUADROS.indexOf(y.cuadro) ||
                y.puntosPorJugador - x.puntosPorJugador
        );

        const motivo = await requiereMotivo(
            admin,
            pruebaId,
            calc.inscritas.map((i) => i.id)
        );

        return {
            ok: true,
            filas,
            requiereMotivo: motivo.requiere,
            motivoDe: motivo.razon,
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 2. Publicar las posiciones y los puntos
// Usa registrarPosicionFinal para cada pareja, así cada cambio queda en auditoría.
// Es repetible: si se vuelve a publicar, reemplaza los puntos anteriores.
// ---------------------------------------------------------
export async function cerrarCategoria(entrada: unknown): Promise<AccionCierre> {
    try {
        const parseo = esquemaCierre.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria, motivo } = parseo.data;

        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const calc = await calcularBD(admin, pruebaId, categoria);
        if (!calc.ok) {
            return {
                ok: false,
                error: [calc.error, ...(calc.motivos ?? [])].join(". "),
            };
        }

        const req = await requiereMotivo(
            admin,
            pruebaId,
            calc.inscritas.map((i) => i.id)
        );
        if (req.requiere && !motivo) {
            return {
                ok: false,
                error: `${req.razon}. Indica un motivo para publicar de nuevo.`,
            };
        }

        let publicadas = 0;
        for (const r of calc.resultados) {
            const res = await registrarPosicionFinal({
                pruebaId,
                inscripcionId: r.inscripcionId,
                categoria,
                cuadro: r.cuadro,
                ronda: r.ronda,
                motivo,
            });
            if (!res.ok) {
                return {
                    ok: false,
                    error: `Publicadas ${publicadas} de ${calc.resultados.length}: ${res.error}`,
                    publicadas,
                };
            }
            publicadas++;
        }

        revalidatePath("/admin/pruebas");
        revalidatePath("/ranking");
        revalidatePath("/jugadores");
        return { ok: true, publicadas };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}
