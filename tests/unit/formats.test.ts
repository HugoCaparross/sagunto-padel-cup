import { test } from "node:test";
import assert from "node:assert/strict";
import { assignSeeds, expectedMatchCount, getTemplate, groupFixtures, type Ref } from "../../src/domains/tournaments/formats";
import { resolveFormat, type Resolution } from "../../src/domains/tournaments/resolve";
import { rankGroup, type GroupResult } from "../../src/domains/tournaments/standings";
import { validateScore, type Score, type Stage } from "../../src/domains/tournaments/scoring";

// Marcador de cada etapa; aWins indica si gana el lado "a"
function scoreFor(stage: Stage, aWins: boolean): Score {
    const w = { a: 6, b: 2 };
    const l = { a: 2, b: 6 };
    if (stage === "group") return { sets: [aWins ? w : l] };
    if (stage === "semi") return { sets: [aWins ? { a: 9, b: 4 } : { a: 4, b: 9 }] };
    return { sets: [aWins ? w : l, aWins ? w : l] };
}

// Juega todo el formato: gana siempre la cabeza de serie más alta (número más bajo)
function playAll(parejas: number): Resolution {
    const t = getTemplate(parejas);
    const seeds = assignSeeds(parejas, t.groups);

    const groupResults: Record<string, GroupResult[]> = {};
    for (const g of t.groups) {
        groupResults[g.id] = groupFixtures(seeds[g.id], g.rounds).map((f) => ({
            a: f.a,
            b: f.b,
            score: scoreFor("group", f.a < f.b),
        }));
    }

    const bracketScores: Record<string, Score> = {};
    let res = resolveFormat(t, groupResults, bracketScores);

    for (const m of t.bracket) {
        const side = res.sides[m.id];
        if (!side || side.a === null || side.b === null) break;
        bracketScores[m.id] = scoreFor(m.stage, side.a < side.b);
        res = resolveFormat(t, groupResults, bracketScores);
    }
    assert.deepEqual(res.errors, []);
    return res;
}

const refKey = (r: Ref) => (r.kind === "pos" ? `${r.group}${r.pos}` : `${r.kind}:${r.match}`);

test("cada posición de grupo se usa exactamente una vez en cada formato (3 a 10)", () => {
    for (let n = 3; n <= 10; n++) {
        const t = getTemplate(n);
        const used = [
            ...t.bracket.flatMap((m) => [m.a, m.b]),
            ...t.direct.map((d) => d.ref),
        ]
            .filter((r): r is Extract<Ref, { kind: "pos" }> => r.kind === "pos")
            .map(refKey)
            .sort();

        const all = t.groups.flatMap((g) =>
            Array.from({ length: g.size }, (_, i) => `${g.id}${i + 1}`),
        ).sort();

        assert.deepEqual(used, all, `formato ${n}`);
    }
});

test("número de partidos por formato", () => {
    const expected: Record<number, number> = { 3: 7, 4: 10, 5: 14, 6: 15, 7: 16, 8: 19, 9: 22, 10: 27 };
    for (const [n, total] of Object.entries(expected)) {
        assert.equal(expectedMatchCount(getTemplate(Number(n))), total, `formato ${n}`);
    }
});

test("8 parejas: cruces acordados (1A-2B, 1B-2A, 3A-3B, 4A-4B)", () => {
    const t = getTemplate(8);
    const byId = Object.fromEntries(t.bracket.map((m) => [m.id, m]));

    assert.equal(refKey(byId["SF_ORO_1"].a), "A1");
    assert.equal(refKey(byId["SF_ORO_1"].b), "B2");
    assert.equal(refKey(byId["SF_ORO_2"].a), "B1");
    assert.equal(refKey(byId["SF_ORO_2"].b), "A2");

    assert.equal(refKey(byId["SF_PLATA_1"].a), "A3");
    assert.equal(refKey(byId["SF_PLATA_1"].b), "B3");
    assert.equal(refKey(byId["SF_PLATA_2"].a), "loser:SF_ORO_1");
    assert.equal(refKey(byId["SF_PLATA_2"].b), "loser:SF_ORO_2");

    assert.equal(refKey(byId["F_BRONCE"].a), "A4");
    assert.equal(refKey(byId["F_BRONCE"].b), "B4");
});

test("4 parejas: orden final 1.º y 2.º en Oro, 3.º y 4.º en Plata", () => {
    const res = playAll(4);
    assert.equal(res.complete, true);
    assert.deepEqual(res.outcomes.get(1), { subgroup: "oro", placement: 1 });
    assert.deepEqual(res.outcomes.get(2), { subgroup: "oro", placement: 2 });
    assert.deepEqual(res.outcomes.get(3), { subgroup: "plata", placement: 1 });
    assert.deepEqual(res.outcomes.get(4), { subgroup: "plata", placement: 2 });
});

test("3 parejas: la tercera es campeona de Plata", () => {
    const res = playAll(3);
    assert.deepEqual(res.outcomes.get(3), { subgroup: "plata", placement: 1 });
    assert.deepEqual(res.outcomes.get(1), { subgroup: "oro", placement: 1 });
});

test("5 parejas: la quinta es campeona de Bronce directamente", () => {
    const res = playAll(5);
    assert.deepEqual(res.outcomes.get(5), { subgroup: "bronce", placement: 1 });
});

test("7 parejas: el cuarto del grupo de 4 queda con participación inicial", () => {
    const res = playAll(7);
    assert.equal(res.complete, true);
    assert.deepEqual(res.outcomes.get(7), { subgroup: "bronce", placement: 33 });
    assert.deepEqual(res.outcomes.get(3), { subgroup: "oro", placement: 3 });
});

test("8 parejas: cuadro completo con puesto único por pareja", () => {
    const res = playAll(8);
    assert.equal(res.complete, true);
    // Grupo A: 1,4,5,8. Grupo B: 2,3,6,7. Ganan siempre las cabezas de serie más altas.
    assert.deepEqual(res.outcomes.get(1), { subgroup: "oro", placement: 1 });
    assert.deepEqual(res.outcomes.get(2), { subgroup: "oro", placement: 2 });
    assert.deepEqual(res.outcomes.get(3), { subgroup: "plata", placement: 1 });
    assert.deepEqual(res.outcomes.get(5), { subgroup: "plata", placement: 2 });
    assert.deepEqual(res.outcomes.get(4), { subgroup: "plata", placement: 3 });
    assert.deepEqual(res.outcomes.get(6), { subgroup: "plata", placement: 3 });
    assert.deepEqual(res.outcomes.get(7), { subgroup: "bronce", placement: 1 });
    assert.deepEqual(res.outcomes.get(8), { subgroup: "bronce", placement: 2 });
});

test("6 parejas: finales 1.º A-1.º B (Oro), 2.º A-2.º B (Plata), 3.º A-3.º B (Bronce)", () => {
    const res = playAll(6);
    assert.equal(res.complete, true);
    assert.deepEqual(res.outcomes.get(1), { subgroup: "oro", placement: 1 });
    assert.deepEqual(res.outcomes.get(2), { subgroup: "oro", placement: 2 });
    assert.deepEqual(res.outcomes.get(3), { subgroup: "plata", placement: 1 });
    assert.deepEqual(res.outcomes.get(4), { subgroup: "plata", placement: 2 });
    assert.deepEqual(res.outcomes.get(5), { subgroup: "bronce", placement: 1 });
    assert.deepEqual(res.outcomes.get(6), { subgroup: "bronce", placement: 2 });
});

test("9 parejas: el quinto del grupo de 5 queda con participación inicial", () => {
    const res = playAll(9);
    assert.equal(res.complete, true);
    assert.deepEqual(res.outcomes.get(9), { subgroup: "bronce", placement: 33 });
});

test("10 parejas: final de Bronce entre quintos de cada grupo", () => {
    const res = playAll(10);
    assert.equal(res.complete, true);
    assert.deepEqual(res.outcomes.get(9), { subgroup: "bronce", placement: 1 });
    assert.deepEqual(res.outcomes.get(10), { subgroup: "bronce", placement: 2 });
});

test("desempate de tres parejas por enfrentamiento directo (mini liguilla)", () => {
    // 1 gana a 2 (6-4), 2 gana a 3 (6-0), 3 gana a 1 (6-5). Todas con 1 victoria.
    const results: GroupResult[] = [
        { a: 1, b: 2, score: { sets: [{ a: 6, b: 4 }] } },
        { a: 2, b: 3, score: { sets: [{ a: 6, b: 0 }] } },
        { a: 3, b: 1, score: { sets: [{ a: 6, b: 5 }] } },
    ];
    const r = rankGroup([1, 2, 3], results);
    // Juegos en la mini liguilla: 2 = +4, 1 = +1, 3 = -5
    assert.deepEqual(r.order, [2, 1, 3]);
    assert.equal(r.organizerTie, false);
});

test("validación de marcadores de grupo, semifinal y final", () => {
    assert.equal(validateScore("group", { sets: [{ a: 6, b: 4 }] }), null);
    assert.equal(validateScore("group", { sets: [{ a: 7, b: 6 }] }), null);
    assert.notEqual(validateScore("group", { sets: [{ a: 5, b: 4 }] }), null);

    assert.equal(validateScore("semi", { sets: [{ a: 9, b: 7 }] }), null);
    assert.equal(validateScore("semi", { sets: [{ a: 9, b: 8 }] }), null);
    assert.notEqual(validateScore("semi", { sets: [{ a: 8, b: 7 }] }), null);

    assert.equal(validateScore("final", { sets: [{ a: 6, b: 2 }, { a: 6, b: 3 }] }), null);
    assert.notEqual(validateScore("final", { sets: [{ a: 6, b: 2 }, { a: 2, b: 6 }] }), null);
    assert.equal(
        validateScore("final", {
            sets: [{ a: 6, b: 2 }, { a: 2, b: 6 }],
            superTiebreak: { a: 10, b: 8 },
        }),
        null,
    );
    assert.notEqual(
        validateScore("final", {
            sets: [{ a: 6, b: 2 }, { a: 2, b: 6 }],
            superTiebreak: { a: 10, b: 9 },
        }),
        null,
    );
});

test("walkover administrativo de final: 6-0 en cada set", () => {
    assert.equal(validateScore("final", { sets: [{ a: 6, b: 0 }, { a: 6, b: 0 }] }), null);
});