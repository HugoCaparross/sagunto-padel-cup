// Resuelve un formato con los resultados reales: posiciones de grupo, cruces del cuadro
// y puesto final de cada pareja (subgrupo + posición). Cada pareja puntúa una sola vez.

import { validateScore, winnerOf, type Score, type Seed } from "./scoring";
import { assignSeeds, groupFixtures, type Outcome, type Ref, type Template } from "./formats";
import { rankGroup, type GroupResult } from "./standings";

export type Resolution = {
    positions: Record<string, Seed[] | null>;
    sides: Record<string, { a: Seed | null; b: Seed | null }>;
    winners: Record<string, Seed>;
    outcomes: Map<Seed, Outcome>;
    errors: string[];
    complete: boolean;
};

export function resolveFormat(
    t: Template,
    groupResults: Record<string, GroupResult[]>,
    bracketScores: Record<string, Score>,
): Resolution {
    const seeds = assignSeeds(t.parejas, t.groups);
    const errors: string[] = [];
    const positions: Record<string, Seed[] | null> = {};

    for (const g of t.groups) {
        const expected = groupFixtures(seeds[g.id], g.rounds);
        const results = groupResults[g.id] ?? [];

        if (results.length < expected.length) {
            positions[g.id] = null;
            continue;
        }

        let valid = true;
        for (const r of results) {
            const err = validateScore("group", r.score);
            if (err) {
                errors.push(`Grupo ${g.id}: ${err}`);
                valid = false;
            }
        }
        positions[g.id] = valid ? rankGroup(seeds[g.id], results).order : null;
    }

    const winners: Record<string, Seed> = {};
    const losers: Record<string, Seed> = {};
    const sides: Record<string, { a: Seed | null; b: Seed | null }> = {};

    const resolveRef = (ref: Ref): Seed | null => {
        if (ref.kind === "pos") {
            const p = positions[ref.group];
            return p ? (p[ref.pos - 1] ?? null) : null;
        }
        if (ref.kind === "winner") return winners[ref.match] ?? null;
        return losers[ref.match] ?? null;
    };

    for (const m of t.bracket) {
        const a = resolveRef(m.a);
        const b = resolveRef(m.b);
        sides[m.id] = { a, b };

        const sc = bracketScores[m.id];
        if (!sc || a === null || b === null) continue;

        const err = validateScore(m.stage, sc);
        if (err) {
            errors.push(`${m.id}: ${err}`);
            continue;
        }
        const w = winnerOf(sc);
        if (w === null) {
            errors.push(`${m.id}: el partido no tiene ganador`);
            continue;
        }
        winners[m.id] = w === "a" ? a : b;
        losers[m.id] = w === "a" ? b : a;
    }

    const outcomes = new Map<Seed, Outcome>();

    for (const d of t.direct) {
        const s = resolveRef(d.ref);
        if (s !== null) outcomes.set(s, d.outcome);
    }

    // Para cada pareja, se mira su último partido del cuadro (en orden inverso).
    // Solo se fija el puesto si ese partido está jugado y no es "continue".
    for (let s = 1; s <= t.parejas; s++) {
        if (outcomes.has(s)) continue;

        for (let i = t.bracket.length - 1; i >= 0; i--) {
            const m = t.bracket[i];
            const side = sides[m.id];
            if (!side || (side.a !== s && side.b !== s)) continue;

            if (winners[m.id] === undefined) break; // partido aún no jugado: puesto pendiente

            const o = winners[m.id] === s ? m.onWinner : m.onLoser;
            if (o !== "continue") outcomes.set(s, o);
            break;
        }
    }

    const groupsDone = t.groups.every((g) => positions[g.id] !== null);
    const bracketDone = t.bracket.every((m) => winners[m.id] !== undefined);
    const complete = errors.length === 0 && groupsDone && bracketDone && outcomes.size === t.parejas;

    return { positions, sides, winners, outcomes, errors, complete };
}