import { CATEGORIAS, type Categoria } from "@/lib/constantes";
import {
    contarPartidos,
    MAX_PAREJAS_POR_CATEGORIA,
    type Conteo,
} from "@/lib/cuadros/formatos";

export type Formato = "grupo" | "fase_final" | "final";

export type ConfigHorario = {
    pistas: number;
    dias: number;
    minutosPorDia: number;              // p. ej. 240 para 9:00–13:00
    duracion: Record<Formato, number>;  // minutos de juego por partido
    descansoMin: number;                // margen entre partidos de una misma pista
};

export const CONFIG_POR_DEFECTO: ConfigHorario = {
    pistas: 4,
    dias: 2,
    minutosPorDia: 240,
    duracion: { grupo: 50, fase_final: 70, final: 100 },
    descansoMin: 10,
};

// Partidos de una categoría. Con menos de 3 parejas la categoría no se disputa.
export function partidosPara(parejas: number): Conteo | null {
    if (parejas < 3) return { grupo: 0, fase_final: 0, final: 0, total: 0 };
    return contarPartidos(parejas);
}

function costeCategoria(
    parejas: number,
    config: ConfigHorario
): { partidos: number; minutos: number } | null {
    const c = partidosPara(parejas);
    if (!c) return null;

    const minutos =
        c.grupo * config.duracion.grupo +
        c.fase_final * config.duracion.fase_final +
        c.final * config.duracion.final +
        c.total * config.descansoMin;

    return { partidos: c.total, minutos };
}

export function minutosDisponibles(
    config: ConfigHorario = CONFIG_POR_DEFECTO
): number {
    return config.pistas * config.dias * config.minutosPorDia;
}

export type Estimacion = {
    partidos: number;
    minutosNecesarios: number;
    minutosDisponibles: number;
    holguraMin: number;       // positivo: sobra tiempo; negativo: no cabe
    cabe: boolean;
    sinFormato: Categoria[];  // categorías con un número de parejas sin formato
};

// Estimación para un reparto real de parejas por categoría.
export function estimarPrueba(
    parejasPorCategoria: Partial<Record<Categoria, number>>,
    config: ConfigHorario = CONFIG_POR_DEFECTO
): Estimacion {
    let partidos = 0;
    let minutos = 0;
    const sinFormato: Categoria[] = [];

    for (const categoria of CATEGORIAS) {
        const parejas = parejasPorCategoria[categoria] ?? 0;
        const coste = costeCategoria(parejas, config);
        if (!coste) {
            sinFormato.push(categoria);
            continue;
        }
        partidos += coste.partidos;
        minutos += coste.minutos;
    }

    const disponibles = minutosDisponibles(config);
    const cabe = sinFormato.length === 0 && minutos <= disponibles;

    return {
        partidos,
        minutosNecesarios: minutos,
        minutosDisponibles: disponibles,
        holguraMin: disponibles - minutos,
        cabe,
        sinFormato,
    };
}

// Mayor número de parejas que caben si todas las categorías tienen el mismo número.
export function maximoParejasParejo(
    config: ConfigHorario = CONFIG_POR_DEFECTO
): { porCategoria: number; total: number } {
    let mejor = { porCategoria: 0, total: 0 };

    for (let n = 3; n <= MAX_PAREJAS_POR_CATEGORIA; n++) {
        const reparto = { primera: n, segunda: n, tercera: n, cuarta: n };
        const e = estimarPrueba(reparto, config);
        const total = n * CATEGORIAS.length;
        if (e.cabe && total > mejor.total) {
            mejor = { porCategoria: n, total };
        }
    }

    return mejor;
}