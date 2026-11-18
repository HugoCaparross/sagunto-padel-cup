import { RONDAS, type Cuadro } from "@/lib/constantes";

export type SetJuego = [number, number];
export type Lado = "A" | "B";

export type PartidoHistorial = {
    id: string;
    pruebaId: string;
    ladoA: string[];   // ids de jugadores del lado A
    ladoB: string[];   // ids de jugadores del lado B
    sets: SetJuego[];
    ganador: Lado;
};

export type PuntoHistorial = {
    jugadorId: string;
    pruebaId: string;
    ronda: string;
    cuadro: Cuadro;
};

export type MejorResultado = {
    pruebaId: string;
    ronda: string;
    cuadro: Cuadro;
};

export type EstadisticasJugador = {
    pruebasJugadas: number;
    partidos: number;
    victorias: number;
    derrotas: number;
    porcentajeVictorias: number; // 0-100, un decimal
    setsGanados: number;
    setsPerdidos: number;
    juegosGanados: number;
    juegosPerdidos: number;
    mejorResultado: MejorResultado | null;
};

export type ModoDuelo = "contiene" | "exacto";

export type ResultadoDuelo = {
    partidos: number;
    victoriasA: number;
    victoriasB: number;
};

const ORDEN_CUADRO: Cuadro[] = ["oro", "plata", "bronce"];

function contiene(lado: string[], bando: string[]): boolean {
    return bando.every((id) => lado.includes(id));
}

function mismoConjunto(a: string[], b: string[]): boolean {
    return a.length === b.length && contiene(a, b);
}

// Estadísticas de un jugador a partir de todo el historial.
export function estadisticasJugador(
    jugadorId: string,
    partidos: PartidoHistorial[],
    puntos: PuntoHistorial[]
): EstadisticasJugador {
    let victorias = 0;
    let derrotas = 0;
    let setsGanados = 0;
    let setsPerdidos = 0;
    let juegosGanados = 0;
    let juegosPerdidos = 0;

    for (const p of partidos) {
        const enA = p.ladoA.includes(jugadorId);
        const enB = p.ladoB.includes(jugadorId);
        if (!enA && !enB) continue;

        const ganoLado = enA ? "A" : "B";
        if (p.ganador === ganoLado) victorias++;
        else derrotas++;

        for (const [x, y] of p.sets) {
            const mios = enA ? x : y;
            const suyos = enA ? y : x;
            juegosGanados += mios;
            juegosPerdidos += suyos;
            if (mios > suyos) setsGanados++;
            else if (suyos > mios) setsPerdidos++;
        }
    }

    const propios = puntos.filter((p) => p.jugadorId === jugadorId);
    const pruebasJugadas = new Set(propios.map((p) => p.pruebaId)).size;

    let mejor: (MejorResultado & { rango: number }) | null = null;
    for (const p of propios) {
        const rango = RONDAS.indexOf(p.ronda as (typeof RONDAS)[number]);
        if (rango < 0) continue;

        const mejorQueActual =
            !mejor ||
            rango < mejor.rango ||
            (rango === mejor.rango &&
                ORDEN_CUADRO.indexOf(p.cuadro) < ORDEN_CUADRO.indexOf(mejor.cuadro));

        if (mejorQueActual) {
            mejor = { pruebaId: p.pruebaId, ronda: p.ronda, cuadro: p.cuadro, rango };
        }
    }

    const total = victorias + derrotas;

    return {
        pruebasJugadas,
        partidos: total,
        victorias,
        derrotas,
        porcentajeVictorias: total > 0 ? Math.round((victorias / total) * 1000) / 10 : 0,
        setsGanados,
        setsPerdidos,
        juegosGanados,
        juegosPerdidos,
        mejorResultado: mejor
            ? { pruebaId: mejor.pruebaId, ronda: mejor.ronda, cuadro: mejor.cuadro }
            : null,
    };
}

// Enfrentamientos entre dos bandos (1 o 2 jugadores cada uno).
// "contiene": el bando A está en un lado y el B en el otro, con cualquier compañero.
// "exacto": los lados coinciden exactamente con los bandos (misma pareja).
// Devuelve null si los bandos están vacíos o comparten algún jugador.
export function duelos(
    partidos: PartidoHistorial[],
    bandoA: string[],
    bandoB: string[],
    modo: ModoDuelo
): ResultadoDuelo | null {
    if (bandoA.length === 0 || bandoB.length === 0) return null;
    if (bandoA.some((id) => bandoB.includes(id))) return null;

    const encaja = (lado: string[], bando: string[]) =>
        modo === "exacto" ? mismoConjunto(lado, bando) : contiene(lado, bando);

    let total = 0;
    let victoriasA = 0;
    let victoriasB = 0;

    for (const p of partidos) {
        const aEnA = encaja(p.ladoA, bandoA) && encaja(p.ladoB, bandoB);
        const aEnB = encaja(p.ladoB, bandoA) && encaja(p.ladoA, bandoB);
        if (!aEnA && !aEnB) continue;

        total++;
        const ganoA = aEnA ? p.ganador === "A" : p.ganador === "B";
        if (ganoA) victoriasA++;
        else victoriasB++;
    }

    return { partidos: total, victoriasA, victoriasB };
}