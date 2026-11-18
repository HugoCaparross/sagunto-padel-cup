"use server";

import { z } from "zod";
import {
    CATEGORIAS,
    CUADROS,
    ESTADOS_QUE_OCUPAN_PLAZA,
    type Categoria,
    type Cuadro,
    type Ronda as RondaPuntos,
} from "@/lib/constantes";
import { plantillaPorDefecto } from "@/lib/cuadros/formatos";
import {
    consecuenciaPartido,
    escalaDeCuadro,
    proyectarPosicion,
    rondasAlcanzables,
    type Consecuencia,
    type FilaPartidoSim,
} from "@/lib/simulador/escenarios";
import { calcularRanking } from "@/lib/ranking/calcular";
import { cargarDatosRanking, hoyEnMadrid } from "@/lib/ranking/cargar";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

// ---------------------------------------------------------
// TIPOS PÚBLICOS
// ---------------------------------------------------------
export type EscenarioRonda = {
    ronda: RondaPuntos;
    etiqueta: string;
    puntos: number;                 // por jugador
    alcanzable: boolean;
    posicionProyectada: number | null;
};

export type CuadroSimulado = {
    cuadro: Cuadro;
    filas: EscenarioRonda[];
};

export type DatosSimulador = {
    inscripcionId: string;
    cuadroConfirmado: Cuadro | null;
    publicado: boolean;
    referencia: string;
    posicionActual: number | null;
    cuadros: CuadroSimulado[];
    proximoPartido: Consecuencia | null;
    avisos: string[];
};

export type ConsultaSimulador =
    | { ok: true; datos: DatosSimulador }
    | { ok: false; error: string };

// ---------------------------------------------------------
// INTERNOS
// ---------------------------------------------------------
const esquema = z.object({
    pruebaId: z.uuid(),
    categoria: z.enum(CATEGORIAS),
});

type FilaBD = {
    id: string;
    fase: "grupo" | "eliminatoria";
    ronda: string | null;
    cuadro: Cuadro | null;
    inscripcion_a: string | null;
    inscripcion_b: string | null;
    origen_a: string | null;
    origen_b: string | null;
    ganador_id: string | null;
};

// Simula tu pareja en una prueba y categoría: escenarios por cuadro y consecuencia del próximo partido.
export async function simularTorneo(entrada: unknown): Promise<ConsultaSimulador> {
    try {
        const parseo = esquema.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { pruebaId, categoria } = parseo.data;

        const supabase = await crearClienteServidor();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return { ok: false, error: "Inicia sesión para simular tus resultados" };

        const admin = crearClienteAdmin();

        const { data: prueba } = await admin
            .from("pruebas")
            .select("estado")
            .eq("id", pruebaId)
            .maybeSingle();
        if (!prueba) return { ok: false, error: "Prueba no encontrada" };

        const { data: inscData, error: errorInsc } = await admin
            .from("inscripciones")
            .select("id, jugador_1, jugador_2")
            .eq("prueba_id", pruebaId)
            .eq("categoria", categoria)
            .neq("estado", "retirada")
            .or(`jugador_1.eq.${user.id},jugador_2.eq.${user.id}`)
            .maybeSingle();
        if (errorInsc) return { ok: false, error: errorInsc.message };
        if (!inscData) {
            return { ok: false, error: "No estás inscrito en esta prueba y categoría" };
        }

        const insc = inscData as { id: string; jugador_1: string; jugador_2: string | null };
        const jugadores = [insc.jugador_1, insc.jugador_2].filter((x): x is string =>
            Boolean(x)
        );

        const { data: activasData } = await admin
            .from("inscripciones")
            .select("id")
            .eq("prueba_id", pruebaId)
            .eq("categoria", categoria)
            .in("estado", [...ESTADOS_QUE_OCUPAN_PLAZA]);
        const n = (activasData ?? []).length;

        const { data: partidosData, error: errorPartidos } = await admin
            .from("partidos")
            .select(
                "id, fase, ronda, cuadro, inscripcion_a, inscripcion_b, origen_a, origen_b, ganador_id"
            )
            .eq("prueba_id", pruebaId)
            .eq("categoria", categoria)
            .order("orden", { ascending: true });
        if (errorPartidos) return { ok: false, error: errorPartidos.message };

        const bd = (partidosData ?? []) as FilaBD[];
        const filas: FilaPartidoSim[] = bd.map((p) => ({
            id: p.id,
            fase: p.fase,
            ronda: p.ronda ?? "grupo",
            cuadro: p.cuadro,
            a: p.inscripcion_a,
            b: p.inscripcion_b,
            origenA: p.origen_a,
            origenB: p.origen_b,
            ganadorId: p.ganador_id,
        }));

        const cuadroConfirmado =
            filas.find((f) => (f.a === insc.id || f.b === insc.id) && f.cuadro)?.cuadro ??
            null;

        const { data: publicadosData } = await admin
            .from("puntos_prueba")
            .select("id")
            .eq("inscripcion_id", insc.id)
            .limit(1);
        const publicado = (publicadosData ?? []).length > 0;

        // Rondas de cada cuadro: reales si existen, si no, de la plantilla según el número de parejas
        const plantilla = n >= 3 ? plantillaPorDefecto(n) : null;

        const rondasDe = (cuadro: Cuadro): string[] => {
            const reales = filas
                .filter((f) => f.fase === "eliminatoria" && f.cuadro === cuadro)
                .map((f) => f.ronda);
            if (reales.length > 0) return reales;
            if (!plantilla) return [];
            return [
                ...plantilla.partidos.filter((p) => p.cuadro === cuadro).map((p) => p.ronda),
                ...plantilla.automaticos
                    .filter((a) => a.cuadro === cuadro)
                    .map(() => "automatico"),
            ];
        };

        const referencia = hoyEnMadrid();
        const base = await cargarDatosRanking();
        const actual = calcularRanking({
            categoria,
            referencia,
            puntos: base.puntos,
            partidos: base.partidos,
        });
        const posicionActual = actual.find((f) => f.clave === user.id)?.posicion ?? null;

        const puedeProyectar = !publicado && prueba.estado !== "finalizada";

        const candidatos: Cuadro[] = cuadroConfirmado ? [cuadroConfirmado] : [...CUADROS];

        const cuadros: CuadroSimulado[] = candidatos.map((cuadro) => {
            const alcanzables = rondasAlcanzables(rondasDe(cuadro));
            const escala = escalaDeCuadro(categoria, cuadro, alcanzables);

            return {
                cuadro,
                filas: escala.map((f) => {
                    const proyeccion =
                        puedeProyectar && f.alcanzable
                            ? proyectarPosicion({
                                categoria,
                                referencia,
                                base: { puntos: base.puntos, partidos: base.partidos },
                                jugadores,
                                ronda: f.ronda,
                                cuadro,
                                pruebaSimulada: "simulacion",
                                consultante: user.id,
                            })
                            : null;

                    return {
                        ronda: f.ronda,
                        etiqueta: f.etiqueta,
                        puntos: f.puntos,
                        alcanzable: f.alcanzable,
                        posicionProyectada: proyeccion?.posicionProyectada ?? null,
                    };
                }),
            };
        });

        const pendiente = filas.find(
            (f) =>
                f.fase === "eliminatoria" &&
                !f.ganadorId &&
                f.ronda !== "automatico" &&
                (f.a === insc.id || f.b === insc.id)
        );
        const proximoPartido = pendiente ? consecuenciaPartido(pendiente, filas) : null;

        const avisos: string[] = [];
        if (publicado) {
            avisos.push(
                "Los puntos de esta categoría ya están publicados: la simulación no los suma de nuevo."
            );
        }
        if (prueba.estado === "finalizada") {
            avisos.push("La prueba está finalizada: no se proyecta el ranking.");
        }
        if (!cuadroConfirmado) {
            avisos.push(
                "Tu cuadro depende de tu posición en el grupo. Se muestran los tres cuadros posibles."
            );
        }

        return {
            ok: true,
            datos: {
                inscripcionId: insc.id,
                cuadroConfirmado,
                publicado,
                referencia,
                posicionActual,
                cuadros,
                proximoPartido,
                avisos,
            },
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}