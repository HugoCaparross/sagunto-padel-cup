import type { Categoria } from "@/lib/constantes";

// Lógica pura: sin base de datos. La usan la propuesta automática y el editor.

export const PASO_MIN = 5;

export type Ventana = { fecha: string; inicioMin: number; finMin: number };
export type Pista = { id: string; numero: number };

export type PartidoPlan = {
    id: string;
    categoria: Categoria;
    ronda: string;
    duracionMin: number;
    jugadores: string[];
    dependeDe: string[];
};

export type Colocado = {
    partidoId: string;
    pistaId: string;
    fecha: string;
    inicioMin: number;
    duracionMin: number;
    jugadores: string[];
    dependeDe: string[];
};

export type Asignacion = {
    partidoId: string;
    pistaId: string;
    fecha: string;
    inicioMin: number;
    finMin: number;
};

export type Plan = {
    asignaciones: Asignacion[];
    sinAsignar: { partidoId: string; motivo: string }[];
};

export type Conflicto = { partidoIds: string[]; mensaje: string };

type Intervalo = { ini: number; fin: number };

export type Ocupacion = {
    pistas: Map<string, Intervalo[]>;
    jugadores: Map<string, Intervalo[]>;
    finPartido: Map<string, number>;
};

const PRIORIDAD_CATEGORIA: Record<Categoria, number> = {
    primera: 0,
    segunda: 1,
    tercera: 2,
    cuarta: 3,
};

const ORDEN_RONDA: Record<string, number> = {
    grupo: 0,
    round_robin: 0,
    cuartos: 1,
    semifinal: 2,
    final: 3,
    automatico: 4,
};

// Minutos absolutos (UTC) para comparar partidos de días distintos.
export function absoluto(fecha: string, minuto: number): number {
    return Date.parse(`${fecha}T00:00:00Z`) / 60_000 + minuto;
}

const solapan = (a: Intervalo, b: Intervalo) => a.ini < b.fin && b.ini < a.fin;

function push(mapa: Map<string, Intervalo[]>, clave: string, v: Intervalo) {
    const lista = mapa.get(clave) ?? [];
    lista.push(v);
    mapa.set(clave, lista);
}

function colocar(ocup: Ocupacion, c: Colocado, descansoMin: number) {
    const ini = absoluto(c.fecha, c.inicioMin);
    const fin = ini + c.duracionMin;
    const reservado = { ini, fin: fin + descansoMin };
    push(ocup.pistas, c.pistaId, reservado);
    for (const j of c.jugadores) push(ocup.jugadores, j, reservado);
    ocup.finPartido.set(c.partidoId, fin);
}

export function construirOcupacion(colocados: Colocado[], descansoMin: number): Ocupacion {
    const ocup: Ocupacion = {
        pistas: new Map(),
        jugadores: new Map(),
        finPartido: new Map(),
    };
    for (const c of colocados) colocar(ocup, c, descansoMin);
    return ocup;
}

function libre(
    ocup: Ocupacion,
    pistaId: string,
    jugadores: string[],
    candidato: Intervalo
): boolean {
    if ((ocup.pistas.get(pistaId) ?? []).some((i) => solapan(i, candidato))) return false;
    return jugadores.every(
        (j) => !(ocup.jugadores.get(j) ?? []).some((i) => solapan(i, candidato))
    );
}

// Primer hueco válido para un partido: el más temprano y, a igual hora, la pista de número más bajo.
export function buscarHueco(params: {
    partido: PartidoPlan;
    ventanas: Ventana[];
    pistas: Pista[];
    ocup: Ocupacion;
    descansoMin: number;
    minimoAbs?: number;
    pistaFija?: string;
}): Asignacion | null {
    const {
        partido,
        ventanas,
        pistas,
        ocup,
        descansoMin,
        minimoAbs = Number.NEGATIVE_INFINITY,
        pistaFija,
    } = params;

    const pistasOrden = [...pistas]
        .sort((a, b) => a.numero - b.numero)
        .filter((p) => !pistaFija || p.id === pistaFija);

    const dur = partido.duracionMin;

    for (const v of ventanas) {
        for (let t = v.inicioMin; t + dur <= v.finMin; t += PASO_MIN) {
            const ini = absoluto(v.fecha, t);
            if (ini < minimoAbs) continue;

            const candidato = { ini, fin: ini + dur + descansoMin };
            for (const p of pistasOrden) {
                if (libre(ocup, p.id, partido.jugadores, candidato)) {
                    return {
                        partidoId: partido.id,
                        pistaId: p.id,
                        fecha: v.fecha,
                        inicioMin: t,
                        finMin: t + dur,
                    };
                }
            }
        }
    }
    return null;
}

// Propuesta automática para los partidos que reciben pista.
// Los ya colocados (fijados) se respetan y no se mueven.
export function planificar(params: {
    partidos: PartidoPlan[];
    pistas: Pista[];
    ventanas: Ventana[];
    descansoMin: number;
    fijados: Colocado[];
}): Plan {
    const ocup = construirOcupacion(params.fijados, params.descansoMin);

    const ordenados = [...params.partidos].sort(
        (a, b) =>
            PRIORIDAD_CATEGORIA[a.categoria] - PRIORIDAD_CATEGORIA[b.categoria] ||
            (ORDEN_RONDA[a.ronda] ?? 9) - (ORDEN_RONDA[b.ronda] ?? 9)
    );

    const asignaciones: Asignacion[] = [];
    const sinAsignar: Plan["sinAsignar"] = [];

    for (const p of ordenados) {
        if (p.dependeDe.some((d) => !ocup.finPartido.has(d))) {
            sinAsignar.push({
                partidoId: p.id,
                motivo: "Depende de partidos que aún no tienen horario",
            });
            continue;
        }

        const minimoAbs = Math.max(
            Number.NEGATIVE_INFINITY,
            ...p.dependeDe.map((d) => (ocup.finPartido.get(d) ?? 0) + params.descansoMin)
        );

        const hueco = buscarHueco({
            partido: p,
            ventanas: params.ventanas,
            pistas: params.pistas,
            ocup,
            descansoMin: params.descansoMin,
            minimoAbs,
        });

        if (!hueco) {
            sinAsignar.push({
                partidoId: p.id,
                motivo: "No hay hueco libre con las pistas y el horario actuales",
            });
            continue;
        }

        asignaciones.push(hueco);
        colocar(
            ocup,
            {
                partidoId: p.id,
                pistaId: hueco.pistaId,
                fecha: hueco.fecha,
                inicioMin: hueco.inicioMin,
                duracionMin: p.duracionMin,
                jugadores: p.jugadores,
                dependeDe: p.dependeDe,
            },
            params.descansoMin
        );
    }

    return { asignaciones, sinAsignar };
}

// Revisa un conjunto de partidos ya colocados. Devuelve los conflictos que impiden guardar.
export function detectarConflictos(items: Colocado[], descansoMin: number): Conflicto[] {
    const out: Conflicto[] = [];

    const rango = (c: Colocado): Intervalo => {
        const ini = absoluto(c.fecha, c.inicioMin);
        return { ini, fin: ini + c.duracionMin };
    };

    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const a = items[i];
            const b = items[j];
            const ra = rango(a);
            const rb = rango(b);

            if (a.pistaId === b.pistaId && solapan(ra, rb)) {
                out.push({
                    partidoIds: [a.partidoId, b.partidoId],
                    mensaje: "Dos partidos se solapan en la misma pista",
                });
            }

            const comparten = a.jugadores.some((x) => b.jugadores.includes(x));
            if (
                comparten &&
                solapan(
                    { ini: ra.ini, fin: ra.fin + descansoMin },
                    { ini: rb.ini, fin: rb.fin + descansoMin }
                )
            ) {
                out.push({
                    partidoIds: [a.partidoId, b.partidoId],
                    mensaje: "Un jugador tiene dos partidos sin el descanso mínimo",
                });
            }
        }
    }

    const porId = new Map(items.map((c) => [c.partidoId, c]));
    for (const c of items) {
        for (const d of c.dependeDe) {
            const origen = porId.get(d);
            if (!origen) continue;
            if (rango(origen).fin + descansoMin > absoluto(c.fecha, c.inicioMin)) {
                out.push({
                    partidoIds: [d, c.partidoId],
                    mensaje: "Un partido empieza antes de que termine el partido que le da origen",
                });
            }
        }
    }

    return out;
}