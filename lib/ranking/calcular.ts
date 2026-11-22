import {
    PRUEBAS_MINIMAS_MASTER,
    RONDAS,
    TOP_MASTER,
    VENTANA_RANKING_MESES,
    type Categoria,
    type Ronda,
} from "@/lib/constantes";
import {
    compararEstadisticas,
    type EstadisticasPareja,
} from "@/lib/ranking/desempate";

export type RegistroPuntos = {
    clave: string;        // identificador de la pareja
    pruebaId: string;
    fecha: string;        // yyyy-mm-dd
    categoria: Categoria;
    ronda: Ronda;
    puntos: number;
};

export type RegistroPartido = {
    clave: string;
    fecha: string;        // yyyy-mm-dd
    categoria: Categoria;
    ganado: boolean;
};

export type FilaRanking = EstadisticasPareja & {
    posicion: number;
    pruebasJugadas: number;
    partidos: number;
    porcentajeVictorias: number; // 0-100, un decimal
};

// Fecha de inicio de la ventana: 12 meses antes de la referencia.
export function inicioVentana(
    referencia: string,
    meses: number = VENTANA_RANKING_MESES
): string {
    const [anio, mes, dia] = referencia.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1 - meses, dia));
    return fecha.toISOString().slice(0, 10);
}

// Posiciones compartidas sobre una lista ya ordenada.
// Dos parejas empatadas en todos los criterios reciben la misma posición,
// y la siguiente salta el número (1, 1, 3...).
function calcularPosiciones<T extends EstadisticasPareja>(
    ordenadas: readonly T[]
): number[] {
    const posiciones: number[] = [];
    let posicionActual = 0;

    ordenadas.forEach((fila, i) => {
        if (i === 0 || compararEstadisticas(ordenadas[i - 1], fila) !== 0) {
            posicionActual = i + 1;
        }
        posiciones.push(posicionActual);
    });

    return posiciones;
}

type Acumulado = EstadisticasPareja & {
    pruebas: Set<string>;
    partidos: number;
};

type ParametrosCalculo = {
    categoria?: Categoria;
    referencia: string;
    puntos: RegistroPuntos[];
    partidos: RegistroPartido[];
};

// Ranking de una categoría en la fecha de referencia. El ranking general suma todas.
// El llamador debe excluir del array de puntos el Máster Final si no computa para el ranking de temporada.
export function calcularRanking(params: ParametrosCalculo & { categoria: Categoria }): FilaRanking[] {
    return calcularRankingFiltrado(params);
}

export function calcularRankingGeneral(
    params: Omit<ParametrosCalculo, "categoria">
): FilaRanking[] {
    return calcularRankingFiltrado(params);
}

function calcularRankingFiltrado(params: ParametrosCalculo): FilaRanking[] {
    const { categoria, referencia, puntos, partidos } = params;
    const inicio = inicioVentana(referencia);
    const enVentana = (fecha: string) => fecha > inicio && fecha <= referencia;

    const mapa = new Map<string, Acumulado>();

    const obtener = (clave: string): Acumulado => {
        let fila = mapa.get(clave);
        if (!fila) {
            fila = {
                clave,
                puntos: 0,
                primeros: 0,
                segundos: 0,
                terceros: 0,
                mejorRonda: null,
                victorias: 0,
                partidos: 0,
                pruebas: new Set(),
            };
            mapa.set(clave, fila);
        }
        return fila;
    };

    for (const r of puntos) {
        if ((categoria !== undefined && r.categoria !== categoria) || !enVentana(r.fecha)) continue;

        const fila = obtener(r.clave);
        fila.puntos += r.puntos;
        fila.pruebas.add(r.pruebaId);

        if (r.ronda === "campeon") fila.primeros++;
        if (r.ronda === "subcampeon") fila.segundos++;
        if (r.ronda === "semifinalista") fila.terceros++;

        const actual =
            fila.mejorRonda === null ? Infinity : RONDAS.indexOf(fila.mejorRonda);
        if (RONDAS.indexOf(r.ronda) < actual) fila.mejorRonda = r.ronda;
    }

    for (const p of partidos) {
        if ((categoria !== undefined && p.categoria !== categoria) || !enVentana(p.fecha)) continue;

        const fila = obtener(p.clave);
        fila.partidos++;
        if (p.ganado) fila.victorias++;
    }

    const ordenadas = [...mapa.values()].sort(compararEstadisticas);
    const posiciones = calcularPosiciones(ordenadas);

    return ordenadas.map((fila, i): FilaRanking => {
        const { pruebas, partidos: jugados, ...base } = fila;
        return {
            ...base,
            posicion: posiciones[i],
            pruebasJugadas: pruebas.size,
            partidos: jugados,
            porcentajeVictorias:
                jugados > 0 ? Math.round((base.victorias / jugados) * 1000) / 10 : 0,
        };
    });
}

// Clasificados directos al Máster Final de una categoría:
// se filtran las parejas con el mínimo de pruebas y se toma el top 6.
// Con empates en la frontera pueden entrar más de 6; lo decide el organizador.
export function clasificadosMaster(filas: FilaRanking[]): FilaRanking[] {
    const elegibles = filas.filter(
        (f) => f.pruebasJugadas >= PRUEBAS_MINIMAS_MASTER
    );
    const posiciones = calcularPosiciones(elegibles);

    return elegibles.filter((_, i) => posiciones[i] <= TOP_MASTER);
}