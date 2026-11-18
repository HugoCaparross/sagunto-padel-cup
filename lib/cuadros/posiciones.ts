import type { Cuadro } from "@/lib/constantes";
import {
    clasificarGrupo,
    type PartidoGrupo,
    type SetJuego,
} from "@/lib/cuadros/clasificacion";
import type { Ronda } from "@/lib/cuadros/formatos";

export type RondaPuntos =
    | "campeon"
    | "subcampeon"
    | "semifinalista"
    | "cuartos"
    | "octavos"
    | "dieciseisavos"
    | "participacion";

export type EliminatoriaFinal = {
    id: string;
    cuadro: Cuadro;
    ronda: Exclude<Ronda, "round_robin">;
    a: string | null;
    b: string | null;
    ganadorId: string | null;
};

export type RoundRobinFinal = {
    cuadro: Cuadro;
    a: string;
    b: string;
    sets: SetJuego[] | null;
    ganadorId: string | null;
};

export type AutomaticoFinal = {
    cuadro: Cuadro;
    inscripcionId: string | null;
};

export type ResultadoPosicion = {
    inscripcionId: string;
    cuadro: Cuadro;
    ronda: RondaPuntos;
};

export type CalculoPosiciones =
    | { ok: true; resultados: ResultadoPosicion[] }
    | { ok: false; motivos: string[] };

// Cuanto mayor es el rango, más pesa ese resultado para la posición final de la pareja.
const RANGO = {
    automatico: 0,
    round_robin: 1,
    cuartos: 2,
    semifinal: 3,
    final: 4,
} as const;

type Candidato = { rango: number; cuadro: Cuadro; ronda: RondaPuntos };

function posicionEnRoundRobin(posicion: number): RondaPuntos {
    if (posicion === 1) return "campeon";
    if (posicion === 2) return "subcampeon";
    if (posicion === 3) return "semifinalista";
    return "participacion";
}

export function calcularPosiciones(params: {
    inscripciones: string[];
    eliminatorias: EliminatoriaFinal[];
    roundRobin: RoundRobinFinal[];
    automaticos: AutomaticoFinal[];
}): CalculoPosiciones {
    const motivos = new Set<string>();
    const candidatos = new Map<string, Candidato[]>();

    const añadir = (id: string, c: Candidato) => {
        const lista = candidatos.get(id) ?? [];
        lista.push(c);
        candidatos.set(id, lista);
    };

    // 1. Campeones automáticos (un solo clasificado en su cuadro)
    for (const a of params.automaticos) {
        if (!a.inscripcionId) {
            motivos.add(`Falta asignar el campeón automático de ${a.cuadro}`);
            continue;
        }
        añadir(a.inscripcionId, {
            rango: RANGO.automatico,
            cuadro: a.cuadro,
            ronda: "campeon",
        });
    }

    // 2. Partidos de eliminatoria
    for (const p of params.eliminatorias) {
        if (!p.a || !p.b) {
            motivos.add(`Un partido de ${p.cuadro} no tiene las dos parejas`);
            continue;
        }
        if (!p.ganadorId) {
            motivos.add(`Falta el resultado de un partido de ${p.cuadro} (${p.ronda})`);
            continue;
        }
        if (p.ganadorId !== p.a && p.ganadorId !== p.b) {
            motivos.add(`El ganador de un partido de ${p.cuadro} no es una de sus parejas`);
            continue;
        }

        const perdedor = p.ganadorId === p.a ? p.b : p.a;

        if (p.ronda === "final") {
            añadir(p.ganadorId, { rango: RANGO.final, cuadro: p.cuadro, ronda: "campeon" });
            añadir(perdedor, { rango: RANGO.final, cuadro: p.cuadro, ronda: "subcampeon" });
        } else if (p.ronda === "semifinal") {
            añadir(perdedor, {
                rango: RANGO.semifinal,
                cuadro: p.cuadro,
                ronda: "semifinalista",
            });
        } else if (p.ronda === "cuartos") {
            añadir(perdedor, { rango: RANGO.cuartos, cuadro: p.cuadro, ronda: "cuartos" });
        }
    }

    // 3. Todos contra todos dentro de un cuadro
    const porCuadro = new Map<Cuadro, RoundRobinFinal[]>();
    for (const r of params.roundRobin) {
        const lista = porCuadro.get(r.cuadro) ?? [];
        lista.push(r);
        porCuadro.set(r.cuadro, lista);
    }

    for (const [cuadro, partidos] of porCuadro) {
        const ids = [...new Set(partidos.flatMap((p) => [p.a, p.b]))];
        const partidosGrupo: PartidoGrupo[] = partidos.map((p) => ({
            grupo: cuadro,
            inscripcionA: p.a,
            inscripcionB: p.b,
            sets: p.sets,
            ganadorId: p.ganadorId,
        }));

        const { filas, completo } = clasificarGrupo(cuadro, ids, partidosGrupo);
        if (!completo) {
            motivos.add(`El todos contra todos de ${cuadro} no está terminado`);
            continue;
        }

        for (const f of filas) {
            añadir(f.id, {
                rango: RANGO.round_robin,
                cuadro,
                ronda: posicionEnRoundRobin(f.posicion),
            });
        }
    }

    // 4. Cada pareja se queda con su resultado de mayor rango
    const resultados: ResultadoPosicion[] = [];
    for (const id of params.inscripciones) {
        const lista = candidatos.get(id) ?? [];
        if (lista.length === 0) {
            motivos.add("Hay parejas sin posición final en ningún cuadro");
            continue;
        }
        const mejor = lista.reduce((m, c) => (c.rango > m.rango ? c : m));
        resultados.push({ inscripcionId: id, cuadro: mejor.cuadro, ronda: mejor.ronda });
    }

    if (motivos.size > 0) return { ok: false, motivos: [...motivos] };
    return { ok: true, resultados };
}