// Carga el progreso histórico de un jugador. Solo se usa en servidor (clave de servicio).
import type { Cuadro } from "@/lib/constantes";
import {
    estadisticasJugador,
    type PartidoHistorial,
    type PuntoHistorial,
    type SetJuego,
} from "@/lib/estadisticas/calcular";
import { crearClienteAdmin } from "@/lib/supabase/server";
import {
    progresoDeJugador,
    type EstadisticasJugador,
    type ProgresoNivel,
} from "@/lib/xp/niveles";

type InscripcionFila = {
    id: string;
    jugador_1: string;
    jugador_2: string | null;
};

type PartidoFila = {
    id: string;
    prueba_id: string;
    inscripcion_a: string | null;
    inscripcion_b: string | null;
    ganador_id: string | null;
    resultado: SetJuego[] | null;
};

type PuntoFila = {
    jugador_id: string;
    prueba_id: string;
    ronda: string;
    cuadro: Cuadro;
    puntos: number;
};

// Estadísticas de todo el historial del jugador, sin ventana temporal.
export async function estadisticasHistoricas(
    jugadorId: string
): Promise<EstadisticasJugador> {
    const admin = crearClienteAdmin();

    const { data: insc, error: errorInsc } = await admin
        .from("inscripciones")
        .select("id, jugador_1, jugador_2");
    if (errorInsc) throw new Error(`Error leyendo inscripciones: ${errorInsc.message}`);

    const jugadoresDe = new Map<string, string[]>(
        ((insc ?? []) as InscripcionFila[]).map((i) => [
            i.id,
            [i.jugador_1, ...(i.jugador_2 ? [i.jugador_2] : [])],
        ])
    );

    const { data: partidosData, error: errorPartidos } = await admin
        .from("partidos")
        .select("id, prueba_id, inscripcion_a, inscripcion_b, ganador_id, resultado")
        .not("ganador_id", "is", null);
    if (errorPartidos) throw new Error(`Error leyendo partidos: ${errorPartidos.message}`);

    const partidos: PartidoHistorial[] = [];
    for (const p of (partidosData ?? []) as PartidoFila[]) {
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

    const { data: puntosData, error: errorPuntos } = await admin
        .from("puntos_prueba")
        .select("jugador_id, prueba_id, ronda, cuadro, puntos")
        .eq("jugador_id", jugadorId);
    if (errorPuntos) throw new Error(`Error leyendo puntos: ${errorPuntos.message}`);

    const filasPuntos = (puntosData ?? []) as PuntoFila[];

    const puntos: PuntoHistorial[] = filasPuntos.map((p) => ({
        jugadorId: p.jugador_id,
        pruebaId: p.prueba_id,
        ronda: p.ronda,
        cuadro: p.cuadro,
    }));

    const puntosHistoricos = filasPuntos.reduce((total, p) => total + p.puntos, 0);
    const base = estadisticasJugador(jugadorId, partidos, puntos);

    return {
        puntosHistoricos,
        pruebasJugadas: base.pruebasJugadas,
        partidos: base.partidos,
        porcentajeVictorias: base.porcentajeVictorias,
    };
}

// Nivel, tier y progreso de la barra a partir de todo el historial.
export async function progresoHistorico(jugadorId: string): Promise<ProgresoNivel> {
    const estadisticas = await estadisticasHistoricas(jugadorId);
    return progresoDeJugador(estadisticas);
}