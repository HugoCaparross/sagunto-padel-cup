import {
    ETIQUETAS_RONDA,
    RONDAS,
    type Categoria,
    type Cuadro,
    type Ronda as RondaPuntos,
} from "@/lib/constantes";
import { puntosPara } from "@/lib/puntos/escala";
import {
    calcularRanking,
    type RegistroPartido,
    type RegistroPuntos,
} from "@/lib/ranking/calcular";

const NOMBRE_CUADRO: Record<Cuadro, string> = {
    oro: "oro",
    plata: "plata",
    bronce: "bronce",
};

// ---------------------------------------------------------
// TIPOS
// ---------------------------------------------------------
export type FilaPartidoSim = {
    id: string;
    fase: "grupo" | "eliminatoria";
    ronda: string;              // grupo | round_robin | cuartos | semifinal | final | automatico
    cuadro: Cuadro | null;
    a: string | null;           // id de inscripción
    b: string | null;
    origenA: string | null;     // "ganador:<id>" | "perdedor:<id>"
    origenB: string | null;
    ganadorId: string | null;
};

export type FilaEscala = {
    ronda: RondaPuntos;
    etiqueta: string;
    puntos: number;             // por jugador
    alcanzable: boolean;
};

export type Consecuencia = {
    partidoId: string;
    cuadro: Cuadro;
    ronda: string;
    siGana: string;
    siPierde: { ronda: RondaPuntos | null; texto: string };
};

export type ProyeccionPosicion = {
    posicionActual: number | null;
    posicionProyectada: number | null;
};

// ---------------------------------------------------------
// RONDAS ALCANZABLES
// Deducidas de las rondas que existen en el cuadro (reales o de plantilla).
// ---------------------------------------------------------
export function rondasAlcanzables(rondas: readonly string[]): Set<RondaPuntos> {
    const r = new Set(rondas);
    const salida = new Set<RondaPuntos>(["participacion"]);

    if (r.has("final") || r.has("automatico") || r.has("round_robin")) {
        salida.add("campeon");
    }
    if (r.has("final") || r.has("round_robin")) {
        salida.add("subcampeon");
    }
    if (r.has("semifinal") || r.has("round_robin") || r.has("cuartos")) {
        salida.add("semifinalista");
    }
    if (r.has("cuartos")) {
        salida.add("cuartos");
    }

    return salida;
}

// ---------------------------------------------------------
// ESCALA DE UN CUADRO
// ---------------------------------------------------------
export function escalaDeCuadro(
    categoria: Categoria,
    cuadro: Cuadro,
    alcanzables: Set<RondaPuntos>
): FilaEscala[] {
    return RONDAS.map((ronda) => ({
        ronda,
        etiqueta: ETIQUETAS_RONDA[ronda],
        puntos: puntosPara(categoria, cuadro, ronda),
        alcanzable: alcanzables.has(ronda),
    }));
}

// ---------------------------------------------------------
// CONSECUENCIA DEL PRÓXIMO PARTIDO
// Solo para partidos de eliminatoria sin resultado.
// ---------------------------------------------------------
export function consecuenciaPartido(
    partido: FilaPartidoSim,
    todos: FilaPartidoSim[]
): Consecuencia | null {
    if (partido.fase !== "eliminatoria" || !partido.cuadro || partido.ganadorId) {
        return null;
    }

    const cuadro = partido.cuadro;
    const nombre = NOMBRE_CUADRO[cuadro];
    const id = partido.id;

    if (partido.ronda === "final") {
        return {
            partidoId: id,
            cuadro,
            ronda: partido.ronda,
            siGana: `Serías campeón de ${nombre}`,
            siPierde: { ronda: "subcampeon", texto: `Subcampeón de ${nombre}` },
        };
    }

    if (partido.ronda === "semifinal") {
        const hayFinal = todos.some(
            (p) => p.origenA === `ganador:${id}` || p.origenB === `ganador:${id}`
        );
        return {
            partidoId: id,
            cuadro,
            ronda: partido.ronda,
            siGana: hayFinal ? `Pasas a la final de ${nombre}` : "Pasas a la final",
            siPierde: {
                ronda: "semifinalista",
                texto:
                    cuadro === "oro"
                        ? "Semifinalista de oro. Juegas la final de plata: si la ganas, serías campeón de plata"
                        : `Semifinalista de ${nombre}`,
            },
        };
    }

    if (partido.ronda === "cuartos") {
        return {
            partidoId: id,
            cuadro,
            ronda: partido.ronda,
            siGana: "Pasas a semifinales",
            siPierde: { ronda: "cuartos", texto: "Cuartofinalista" },
        };
    }

    if (partido.ronda === "round_robin") {
        return {
            partidoId: id,
            cuadro,
            ronda: partido.ronda,
            siGana: "Sumas una victoria en el todos contra todos",
            siPierde: {
                ronda: null,
                texto: "Tu posición depende de los demás partidos del cuadro",
            },
        };
    }

    return null;
}

// ---------------------------------------------------------
// PROYECCIÓN DE POSICIÓN EN EL RANKING
// Suma los puntos simulados a los ya publicados, sin escribir nada.
// ---------------------------------------------------------
export function proyectarPosicion(params: {
    categoria: Categoria;
    referencia: string;
    base: { puntos: RegistroPuntos[]; partidos: RegistroPartido[] };
    jugadores: string[];
    ronda: RondaPuntos;
    cuadro: Cuadro;
    pruebaSimulada: string;
    consultante: string;
}): ProyeccionPosicion {
    const {
        categoria,
        referencia,
        base,
        jugadores,
        ronda,
        cuadro,
        pruebaSimulada,
        consultante,
    } = params;

    const puntos = puntosPara(categoria, cuadro, ronda);

    const simulados: RegistroPuntos[] = jugadores.map((clave) => ({
        clave,
        pruebaId: pruebaSimulada,
        fecha: referencia,
        categoria,
        ronda,
        puntos,
    }));

    const actual = calcularRanking({
        categoria,
        referencia,
        puntos: base.puntos,
        partidos: base.partidos,
    });

    const proyectado = calcularRanking({
        categoria,
        referencia,
        puntos: [...base.puntos, ...simulados],
        partidos: base.partidos,
    });

    return {
        posicionActual: actual.find((f) => f.clave === consultante)?.posicion ?? null,
        posicionProyectada:
            proyectado.find((f) => f.clave === consultante)?.posicion ?? null,
    };
}