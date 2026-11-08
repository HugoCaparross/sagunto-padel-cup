// Plantillas de competición del Sistema de Juego 2026 (formatos de 3 a 10 parejas).
// Cada plantilla define los grupos, los cruces de cuadro y el destino de cada puesto.
// Las posiciones de grupo (pos) se resuelven con la clasificación real de cada grupo.

import type { Seed } from "./scoring";

export type Subgroup = "oro" | "plata" | "bronce";
export type Placement = 1 | 2 | 3 | 33; // 33 = participación inicial
export type Outcome = { subgroup: Subgroup; placement: Placement };

export type Ref =
    | { kind: "pos"; group: string; pos: number }
    | { kind: "winner"; match: string }
    | { kind: "loser"; match: string };

export type BracketMatch = {
    id: string;
    stage: "semi" | "final";
    label: string;
    subgroup: Subgroup;
    a: Ref;
    b: Ref;
    /** "continue": la pareja sigue compitiendo en otro partido del cuadro. */
    onWinner: Outcome | "continue";
    onLoser: Outcome | "continue";
};

export type GroupSpec = { id: string; size: number; rounds: 1 | 2 };

export type Template = {
    parejas: number;
    nombre: string;
    groups: GroupSpec[];
    /** Orden de juego: el índice define la secuencia de resolución. */
    bracket: BracketMatch[];
    /** Parejas que no llegan a ningún cuadro, con su puesto fijo. */
    direct: { ref: Ref; outcome: Outcome }[];
};

const pos = (group: string, p: number): Ref => ({ kind: "pos", group, pos: p });
const W = (match: string): Ref => ({ kind: "winner", match });
const L = (match: string): Ref => ({ kind: "loser", match });
const out = (subgroup: Subgroup, placement: Placement): Outcome => ({ subgroup, placement });

const ORO1 = out("oro", 1);
const ORO2 = out("oro", 2);
const ORO3 = out("oro", 3);
const PLA1 = out("plata", 1);
const PLA2 = out("plata", 2);
const PLA3 = out("plata", 3);
const BRO1 = out("bronce", 1);
const BRO2 = out("bronce", 2);
const NONE = out("bronce", 33); // participación inicial (subgrupo inferior)

const TEMPLATES: Record<number, Template> = {
    3: {
        parejas: 3,
        nombre: "Liguilla de 3",
        groups: [{ id: "A", size: 3, rounds: 2 }],
        bracket: [
            { id: "F_ORO", stage: "final", label: "Final Oro", subgroup: "oro", a: pos("A", 1), b: pos("A", 2), onWinner: ORO1, onLoser: ORO2 },
        ],
        direct: [{ ref: pos("A", 3), outcome: PLA1 }],
    },

    4: {
        parejas: 4,
        nombre: "Liguilla de 4",
        groups: [{ id: "A", size: 4, rounds: 1 }],
        bracket: [
            { id: "SF_1", stage: "semi", label: "Semifinal 1", subgroup: "oro", a: pos("A", 1), b: pos("A", 4), onWinner: "continue", onLoser: "continue" },
            { id: "SF_2", stage: "semi", label: "Semifinal 2", subgroup: "oro", a: pos("A", 2), b: pos("A", 3), onWinner: "continue", onLoser: "continue" },
            { id: "F_ORO", stage: "final", label: "Final Oro", subgroup: "oro", a: W("SF_1"), b: W("SF_2"), onWinner: ORO1, onLoser: ORO2 },
            { id: "F_PLATA", stage: "final", label: "Final Plata", subgroup: "plata", a: L("SF_1"), b: L("SF_2"), onWinner: PLA1, onLoser: PLA2 },
        ],
        direct: [],
    },

    5: {
        parejas: 5,
        nombre: "Liguilla de 5",
        groups: [{ id: "A", size: 5, rounds: 1 }],
        bracket: [
            { id: "SF_1", stage: "semi", label: "Semifinal 1", subgroup: "oro", a: pos("A", 1), b: pos("A", 4), onWinner: "continue", onLoser: "continue" },
            { id: "SF_2", stage: "semi", label: "Semifinal 2", subgroup: "oro", a: pos("A", 2), b: pos("A", 3), onWinner: "continue", onLoser: "continue" },
            { id: "F_ORO", stage: "final", label: "Final Oro", subgroup: "oro", a: W("SF_1"), b: W("SF_2"), onWinner: ORO1, onLoser: ORO2 },
            { id: "F_PLATA", stage: "final", label: "Final Plata", subgroup: "plata", a: L("SF_1"), b: L("SF_2"), onWinner: PLA1, onLoser: PLA2 },
        ],
        direct: [{ ref: pos("A", 5), outcome: out("bronce", 1) }],
    },

    6: {
        parejas: 6,
        nombre: "Dos grupos de 3",
        groups: [
            { id: "A", size: 3, rounds: 2 },
            { id: "B", size: 3, rounds: 2 },
        ],
        bracket: [
            { id: "F_ORO", stage: "final", label: "Final Oro", subgroup: "oro", a: pos("A", 1), b: pos("B", 1), onWinner: ORO1, onLoser: ORO2 },
            { id: "F_PLATA", stage: "final", label: "Final Plata", subgroup: "plata", a: pos("A", 2), b: pos("B", 2), onWinner: PLA1, onLoser: PLA2 },
            { id: "F_BRONCE", stage: "final", label: "Final Bronce", subgroup: "bronce", a: pos("A", 3), b: pos("B", 3), onWinner: BRO1, onLoser: BRO2 },
        ],
        direct: [],
    },

    7: {
        parejas: 7,
        nombre: "Grupo de 4 y grupo de 3",
        groups: [
            { id: "A", size: 4, rounds: 1 },
            { id: "B", size: 3, rounds: 2 },
        ],
        bracket: [
            { id: "SF_ORO_1", stage: "semi", label: "Semifinal Oro 1", subgroup: "oro", a: pos("A", 1), b: pos("B", 2), onWinner: "continue", onLoser: ORO3 },
            { id: "SF_ORO_2", stage: "semi", label: "Semifinal Oro 2", subgroup: "oro", a: pos("B", 1), b: pos("A", 2), onWinner: "continue", onLoser: ORO3 },
            { id: "F_ORO", stage: "final", label: "Final Oro", subgroup: "oro", a: W("SF_ORO_1"), b: W("SF_ORO_2"), onWinner: ORO1, onLoser: ORO2 },
            { id: "F_PLATA", stage: "final", label: "Final Plata", subgroup: "plata", a: pos("A", 3), b: pos("B", 3), onWinner: PLA1, onLoser: PLA2 },
        ],
        direct: [{ ref: pos("A", 4), outcome: NONE }],
    },

    8: {
        parejas: 8,
        nombre: "Dos grupos de 4",
        groups: [
            { id: "A", size: 4, rounds: 1 },
            { id: "B", size: 4, rounds: 1 },
        ],
        bracket: [
            { id: "SF_ORO_1", stage: "semi", label: "Semifinal Oro 1", subgroup: "oro", a: pos("A", 1), b: pos("B", 2), onWinner: "continue", onLoser: "continue" },
            { id: "SF_ORO_2", stage: "semi", label: "Semifinal Oro 2", subgroup: "oro", a: pos("B", 1), b: pos("A", 2), onWinner: "continue", onLoser: "continue" },
            { id: "SF_PLATA_1", stage: "semi", label: "Semifinal Plata 1", subgroup: "plata", a: pos("A", 3), b: pos("B", 3), onWinner: "continue", onLoser: PLA3 },
            { id: "SF_PLATA_2", stage: "semi", label: "Semifinal Plata 2", subgroup: "plata", a: L("SF_ORO_1"), b: L("SF_ORO_2"), onWinner: "continue", onLoser: PLA3 },
            { id: "F_ORO", stage: "final", label: "Final Oro", subgroup: "oro", a: W("SF_ORO_1"), b: W("SF_ORO_2"), onWinner: ORO1, onLoser: ORO2 },
            { id: "F_PLATA", stage: "final", label: "Final Plata", subgroup: "plata", a: W("SF_PLATA_1"), b: W("SF_PLATA_2"), onWinner: PLA1, onLoser: PLA2 },
            { id: "F_BRONCE", stage: "final", label: "Final Bronce", subgroup: "bronce", a: pos("A", 4), b: pos("B", 4), onWinner: BRO1, onLoser: BRO2 },
        ],
        direct: [],
    },

    9: {
        parejas: 9,
        nombre: "Grupo de 4 y grupo de 5",
        groups: [
            { id: "A", size: 4, rounds: 1 },
            { id: "B", size: 5, rounds: 1 },
        ],
        bracket: [
            { id: "SF_ORO_1", stage: "semi", label: "Semifinal Oro 1", subgroup: "oro", a: pos("A", 1), b: pos("B", 2), onWinner: "continue", onLoser: ORO3 },
            { id: "SF_ORO_2", stage: "semi", label: "Semifinal Oro 2", subgroup: "oro", a: pos("B", 1), b: pos("A", 2), onWinner: "continue", onLoser: ORO3 },
            { id: "SF_PLATA_1", stage: "semi", label: "Semifinal Plata 1", subgroup: "plata", a: pos("A", 3), b: pos("B", 4), onWinner: "continue", onLoser: PLA3 },
            { id: "SF_PLATA_2", stage: "semi", label: "Semifinal Plata 2", subgroup: "plata", a: pos("B", 3), b: pos("A", 4), onWinner: "continue", onLoser: PLA3 },
            { id: "F_ORO", stage: "final", label: "Final Oro", subgroup: "oro", a: W("SF_ORO_1"), b: W("SF_ORO_2"), onWinner: ORO1, onLoser: ORO2 },
            { id: "F_PLATA", stage: "final", label: "Final Plata", subgroup: "plata", a: W("SF_PLATA_1"), b: W("SF_PLATA_2"), onWinner: PLA1, onLoser: PLA2 },
        ],
        direct: [{ ref: pos("B", 5), outcome: NONE }],
    },

    10: {
        parejas: 10,
        nombre: "Dos grupos de 5",
        groups: [
            { id: "A", size: 5, rounds: 1 },
            { id: "B", size: 5, rounds: 1 },
        ],
        bracket: [
            { id: "SF_ORO_1", stage: "semi", label: "Semifinal Oro 1", subgroup: "oro", a: pos("A", 1), b: pos("B", 2), onWinner: "continue", onLoser: ORO3 },
            { id: "SF_ORO_2", stage: "semi", label: "Semifinal Oro 2", subgroup: "oro", a: pos("B", 1), b: pos("A", 2), onWinner: "continue", onLoser: ORO3 },
            { id: "SF_PLATA_1", stage: "semi", label: "Semifinal Plata 1", subgroup: "plata", a: pos("A", 3), b: pos("B", 4), onWinner: "continue", onLoser: PLA3 },
            { id: "SF_PLATA_2", stage: "semi", label: "Semifinal Plata 2", subgroup: "plata", a: pos("B", 3), b: pos("A", 4), onWinner: "continue", onLoser: PLA3 },
            { id: "F_ORO", stage: "final", label: "Final Oro", subgroup: "oro", a: W("SF_ORO_1"), b: W("SF_ORO_2"), onWinner: ORO1, onLoser: ORO2 },
            { id: "F_PLATA", stage: "final", label: "Final Plata", subgroup: "plata", a: W("SF_PLATA_1"), b: W("SF_PLATA_2"), onWinner: PLA1, onLoser: PLA2 },
            { id: "F_BRONCE", stage: "final", label: "Final Bronce", subgroup: "bronce", a: pos("A", 5), b: pos("B", 5), onWinner: BRO1, onLoser: BRO2 },
        ],
        direct: [],
    },
};

export function getTemplate(parejas: number): Template {
    const t = TEMPLATES[parejas];
    if (!t) throw new Error(`Formato no soportado: ${parejas} parejas (válidos de 3 a 10)`);
    return t;
}

/**
 * Reparto de cabezas de serie en grupos por "serpentina":
 * 1-A, 2-B, 3-B, 4-A... respetando el tamaño de cada grupo.
 */
export function assignSeeds(parejas: number, groups: GroupSpec[]): Record<string, Seed[]> {
    const result: Record<string, Seed[]> = Object.fromEntries(groups.map((g) => [g.id, []]));
    let seed = 1;
    let round = 0;

    while (seed <= parejas) {
        const order = round % 2 === 0 ? groups : [...groups].reverse();
        for (const g of order) {
            if (seed > parejas) break;
            if (result[g.id].length < g.size) result[g.id].push(seed++);
        }
        round++;
    }
    return result;
}

export type GroupFixture = { a: Seed; b: Seed; leg: number };

/** Partidos de un grupo: todos contra todos, con vuelta si rounds = 2. */
export function groupFixtures(seeds: Seed[], rounds: 1 | 2): GroupFixture[] {
    const fixtures: GroupFixture[] = [];
    for (let i = 0; i < seeds.length; i++) {
        for (let j = i + 1; j < seeds.length; j++) {
            fixtures.push({ a: seeds[i], b: seeds[j], leg: 1 });
            if (rounds === 2) fixtures.push({ a: seeds[j], b: seeds[i], leg: 2 });
        }
    }
    return fixtures;
}

/** Número total de partidos del formato (grupos + cuadro). */
export function expectedMatchCount(t: Template): number {
    const groupMatches = t.groups.reduce(
        (acc, g) => acc + groupFixtures(Array.from({ length: g.size }, (_, i) => i), g.rounds).length,
        0,
    );
    return groupMatches + t.bracket.length;
}