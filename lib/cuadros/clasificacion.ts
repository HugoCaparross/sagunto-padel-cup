import type { ParticipanteLlave } from "@/lib/cuadros/sorteo";

export type SetJuego = [number, number];

export type PartidoGrupo = {
    grupo: string;
    inscripcionA: string;
    inscripcionB: string;
    sets: SetJuego[] | null;
    ganadorId: string | null;
};

export type Criterio =
    | "victorias"
    | "juegos_ganados"
    | "juegos_perdidos"
    | "directo"
    | "sorteo";

export type FilaClasificacion = {
    id: string;
    grupo: string;
    posicion: number;
    partidos: number;
    victorias: number;
    derrotas: number;
    juegosGanados: number;
    juegosPerdidos: number;
    criterio: Criterio; // criterio que separó a esta pareja de la siguiente
};

type Estadistica = {
    id: string;
    partidos: number;
    victorias: number;
    derrotas: number;
    juegosGanados: number;
    juegosPerdidos: number;
};

type Contexto = {
    stats: Map<string, Estadistica>;
    partidos: PartidoGrupo[];
    criterios: Map<string, Criterio>;
    azar: () => number;
};

type Paso = "juegos_ganados" | "juegos_perdidos";

// Partido terminado: tiene sets y ganador.
function jugado(
    p: PartidoGrupo
): p is PartidoGrupo & { sets: SetJuego[]; ganadorId: string } {
    return p.sets !== null && p.ganadorId !== null;
}

function estadistica(ctx: Contexto, id: string): Estadistica {
    const s = ctx.stats.get(id);
    if (!s) throw new Error(`Pareja ${id} no pertenece al grupo`);
    return s;
}

// Victorias y juegos de cada pareja, usando solo partidos terminados.
function construirEstadisticas(
    ids: string[],
    partidos: PartidoGrupo[]
): Map<string, Estadistica> {
    const mapa = new Map<string, Estadistica>(
        ids.map((id): [string, Estadistica] => [
            id,
            {
                id,
                partidos: 0,
                victorias: 0,
                derrotas: 0,
                juegosGanados: 0,
                juegosPerdidos: 0,
            },
        ])
    );

    for (const p of partidos) {
        if (!jugado(p)) continue;

        const a = mapa.get(p.inscripcionA);
        const b = mapa.get(p.inscripcionB);
        if (!a || !b) throw new Error("Partido con una pareja fuera del grupo");
        if (p.ganadorId !== a.id && p.ganadorId !== b.id) {
            throw new Error("El ganador no es una de las parejas del partido");
        }

        let juegosA = 0;
        let juegosB = 0;
        for (const [x, y] of p.sets) {
            juegosA += x;
            juegosB += y;
        }

        a.partidos++;
        b.partidos++;
        a.juegosGanados += juegosA;
        a.juegosPerdidos += juegosB;
        b.juegosGanados += juegosB;
        b.juegosPerdidos += juegosA;

        if (p.ganadorId === a.id) {
            a.victorias++;
            b.derrotas++;
        } else {
            b.victorias++;
            a.derrotas++;
        }
    }

    return mapa;
}

// Resultado del partido entre dos parejas. Null si no se ha jugado.
function enfrentamientoDirecto(
    x: string,
    y: string,
    partidos: PartidoGrupo[]
): string | null {
    for (const p of partidos) {
        if (!jugado(p)) continue;
        const entreELLas =
            (p.inscripcionA === x && p.inscripcionB === y) ||
            (p.inscripcionA === y && p.inscripcionB === x);
        if (entreELLas) return p.ganadorId;
    }
    return null;
}

// Último recurso: solo se usa si ningún criterio separa a las parejas.
// Se marca como "sorteo" para que el organizador lo vea en la clasificación.
function sortear(ids: string[], ctx: Contexto): string[] {
    const copia = [...ids];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(ctx.azar() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    for (const id of copia) ctx.criterios.set(id, "sorteo");
    return copia;
}

// Empate de dos parejas: gana el enfrentamiento directo.
function ordenarPareja(ids: [string, string], ctx: Contexto): string[] {
    const ganador = enfrentamientoDirecto(ids[0], ids[1], ctx.partidos);
    if (!ganador) return sortear(ids, ctx);

    const perdedor = ganador === ids[0] ? ids[1] : ids[0];
    ctx.criterios.set(ganador, "directo");
    ctx.criterios.set(perdedor, "directo");
    return [ganador, perdedor];
}

function metrica(s: Estadistica, paso: Paso): number {
    return paso === "juegos_ganados" ? s.juegosGanados : -s.juegosPerdidos;
}

// Ordena parejas empatadas en victorias.
// Con 3 o más: juegos ganados, luego juegos perdidos.
// Con 2: enfrentamiento directo. Si no quedan criterios: sorteo.
function ordenarEmpatados(
    ids: string[],
    ctx: Contexto,
    paso: Paso | null
): string[] {
    if (ids.length === 1) return ids;
    if (ids.length === 2) return ordenarPareja([ids[0], ids[1]], ctx);
    if (paso === null) return sortear(ids, ctx);

    const ordenados = [...ids].sort(
        (a, b) =>
            metrica(estadistica(ctx, b), paso) - metrica(estadistica(ctx, a), paso)
    );

    const bloques: string[][] = [];
    for (const id of ordenados) {
        const ultimo = bloques[bloques.length - 1];
        if (
            ultimo &&
            metrica(estadistica(ctx, ultimo[0]), paso) ===
            metrica(estadistica(ctx, id), paso)
        ) {
            ultimo.push(id);
        } else {
            bloques.push([id]);
        }
    }

    const siguiente: Paso | null =
        paso === "juegos_ganados" ? "juegos_perdidos" : null;

    return bloques.flatMap((bloque) => {
        if (bloque.length === 1) {
            ctx.criterios.set(bloque[0], paso);
            return bloque;
        }
        return ordenarEmpatados(bloque, ctx, siguiente);
    });
}

// Clasificación de un grupo.
// completo = false mientras queden partidos por jugar; la clasificación es provisional.
export function clasificarGrupo(
    grupo: string,
    ids: string[],
    partidos: PartidoGrupo[],
    azar: () => number = Math.random
): { filas: FilaClasificacion[]; completo: boolean } {
    const delGrupo = partidos.filter((p) => p.grupo === grupo);

    const ctx: Contexto = {
        stats: construirEstadisticas(ids, delGrupo),
        partidos: delGrupo,
        criterios: new Map(),
        azar,
    };

    // Primero victorias. Las parejas empatadas pasan al desempate por juegos.
    const porVictorias = [...ids].sort(
        (a, b) =>
            estadistica(ctx, b).victorias - estadistica(ctx, a).victorias
    );

    const bloques: string[][] = [];
    for (const id of porVictorias) {
        const ultimo = bloques[bloques.length - 1];
        if (
            ultimo &&
            estadistica(ctx, ultimo[0]).victorias ===
            estadistica(ctx, id).victorias
        ) {
            ultimo.push(id);
        } else {
            bloques.push([id]);
        }
    }

    const orden = bloques.flatMap((bloque) => {
        if (bloque.length === 1) {
            ctx.criterios.set(bloque[0], "victorias");
            return bloque;
        }
        return ordenarEmpatados(bloque, ctx, "juegos_ganados");
    });

    const filas: FilaClasificacion[] = orden.map((id, i) => {
        const s = estadistica(ctx, id);
        return {
            id,
            grupo,
            posicion: i + 1,
            partidos: s.partidos,
            victorias: s.victorias,
            derrotas: s.derrotas,
            juegosGanados: s.juegosGanados,
            juegosPerdidos: s.juegosPerdidos,
            criterio: ctx.criterios.get(id) ?? "victorias",
        };
    });

    const completo = ids.every((a, i) =>
        ids.slice(i + 1).every((b) =>
            delGrupo.some(
                (p) =>
                    jugado(p) &&
                    ((p.inscripcionA === a && p.inscripcionB === b) ||
                        (p.inscripcionA === b && p.inscripcionB === a))
            )
        )
    );

    return { filas, completo };
}

// Convierte la clasificación en participantes para sortearLlave.
// puntosPorInscripcion: suma de los puntos del ranking de los dos jugadores.
export function aParticipantesLlave(
    filas: FilaClasificacion[],
    puntosPorInscripcion: Map<string, number>
): ParticipanteLlave[] {
    return filas.map((f) => ({
        id: f.id,
        grupo: f.grupo,
        posicion: f.posicion,
        puntos: puntosPorInscripcion.get(f.id) ?? 0,
    }));
}