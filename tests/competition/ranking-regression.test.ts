import assert from "node:assert/strict";
import test from "node:test";

import { RANKING_POINTS } from "../../src/lib/constants.ts";
import {
    aggregateRankingPoints,
    aggregateRankingPointsByCategory,
    calculateRankingPoints,
    createGroupPhaseRankingPointEvent,
    createRankingPointEvent,
    getCategoryRankingBand,
    getGroupEliminationPoints,
    getMasterQualification,
    getMaximumCategoryPoints,
    getMinimumCategoryPoints,
    getRankingPoints,
    validateOfficialRankingConfiguration,
} from "../../src/lib/competition/ranking.ts";

const expectedPoints = {
    "1ª": {
        oro: [120, 118, 116, 114],
        plata: [113, 112, 111, 110],
        bronce: [109, 108, 107, 106],
        grupos: 106,
    },
    "2ª": {
        oro: [105, 103, 101, 99],
        plata: [98, 97, 96, 95],
        bronce: [94, 93, 92, 91],
        grupos: 91,
    },
    "3ª": {
        oro: [90, 88, 86, 84],
        plata: [83, 82, 81, 80],
        bronce: [79, 78, 77, 76],
        grupos: 76,
    },
    "4ª": {
        oro: [75, 73, 71, 69],
        plata: [68, 67, 66, 65],
        bronce: [64, 63, 62, 61],
        grupos: 61,
    },
} as const;

const categories = ["1ª", "2ª", "3ª", "4ª"] as const;
const tiers = ["oro", "plata", "bronce"] as const;

test("mantiene la tabla oficial v1.1 para categorías, tramos y posiciones", () => {
    for (const category of categories) {
        for (const tier of tiers) {
            expectedPoints[category][tier].forEach((points, index) => {
                const position = index + 1;
                assert.equal(getRankingPoints(category, tier, position), points);
                assert.deepEqual(calculateRankingPoints({ category, tier, position }), {
                    points,
                    finish: [
                        `campeon_${tier}`,
                        `finalista_${tier}`,
                        `semifinalista_${tier}`,
                        `cuartos_${tier}`,
                    ][index],
                });
            });
        }
        assert.equal(getGroupEliminationPoints(category), expectedPoints[category].grupos);
        assert.equal(RANKING_POINTS[category].fase_grupos, expectedPoints[category].grupos);
    }

    assert.equal(validateOfficialRankingConfiguration(), true);
});

test("las bandas de categorías no se solapan y cada extremo corresponde a la tabla", () => {
    for (const category of categories) {
        const band = getCategoryRankingBand(category);
        assert.equal(band.minimum, getMinimumCategoryPoints(category));
        assert.equal(band.maximum, getMaximumCategoryPoints(category));
    }
    assert.deepEqual(categories.map((category) => getCategoryRankingBand(category)), [
        { minimum: 106, maximum: 120 },
        { minimum: 91, maximum: 105 },
        { minimum: 76, maximum: 90 },
        { minimum: 61, maximum: 75 },
    ]);
});

test("los eventos de resultados son individuales y llevan la categoría relacional requerida", () => {
    const finalEvent = createRankingPointEvent({
        playerId: "player-1",
        tournamentId: "tournament-1",
        categoryId: "category-1",
        seasonId: "season-1",
        category: "1ª",
        tier: "oro",
        position: 1,
        fecha: "2026-10-04",
    });
    assert.equal(finalEvent.player_id, "player-1");
    assert.equal(finalEvent.categoria_id, "category-1");
    assert.equal(finalEvent.puntos_obtenidos, 120);
    assert.equal(finalEvent.ronda_alcanzada, "campeon_oro");
    assert.equal("fecha_caducidad" in finalEvent, false);

    const groupEvent = createGroupPhaseRankingPointEvent({
        playerId: "player-2",
        tournamentId: "tournament-1",
        categoryId: "category-2",
        category: "2ª",
        fecha: "2026-10-04",
    });
    assert.equal(groupEvent.categoria_id, "category-2");
    assert.equal(groupEvent.puntos_obtenidos, 91);
    assert.equal(groupEvent.ronda_alcanzada, "fase_grupos");
    assert.equal("fecha_caducidad" in groupEvent, false);

    assert.throws(() => createRankingPointEvent({
        playerId: "player-1",
        tournamentId: "tournament-1",
        categoryId: " ",
        category: "1ª",
        tier: "oro",
        position: 1,
    }), /categoryId/);
});

test("agrega puntos individuales, ordena por total y no modifica los eventos recibidos", () => {
    const events = [
        { player_id: "player-b", puntos_obtenidos: 118 },
        { player_id: "player-a", puntos_obtenidos: 120 },
        { player_id: "player-b", puntos_obtenidos: 2 },
        { player_id: "player-c", puntos_obtenidos: 120 },
    ];
    const original = structuredClone(events);

    assert.deepEqual(aggregateRankingPoints(events), [
        { playerId: "player-a", points: 120, position: 1 },
        { playerId: "player-b", points: 120, position: 2 },
        { playerId: "player-c", points: 120, position: 3 },
    ]);
    assert.deepEqual(events, original);
});

test("rechaza datos incompletos o puntuaciones que no pueden formar un ranking fiable", () => {
    assert.throws(() => aggregateRankingPoints([
        { player_id: "", puntos_obtenidos: 10 },
    ]), /player_id/);
    assert.throws(() => aggregateRankingPoints([
        { player_id: "player-a", puntos_obtenidos: Number.NaN },
    ]), /puntuación/);
    assert.throws(() => aggregateRankingPoints([
        { player_id: "player-a", puntos_obtenidos: -1 },
    ]), /puntuación/);
    assert.throws(() => aggregateRankingPoints([
        { player_id: "player-a", puntos_obtenidos: 1.5 },
    ]), /puntuación/);
    assert.throws(() => aggregateRankingPoints([
        { player_id: "player-a", puntos_obtenidos: Number.MAX_SAFE_INTEGER },
        { player_id: "player-a", puntos_obtenidos: 1 },
    ]), /puntuación/);
    assert.throws(
        () => getRankingPoints("__proto__" as (typeof categories)[number], "oro", 1),
        /Categoría de ranking no válida/,
    );
});

test("separa categorías pero acumula juntos los tramos dentro de cada una", () => {
    const rankings = aggregateRankingPointsByCategory([
        { categoria_id: "cat-a", player_id: "player-1", puntos_obtenidos: 120 },
        { categoria_id: "cat-a", player_id: "player-1", puntos_obtenidos: 113 },
        { categoria_id: "cat-a", player_id: "player-2", puntos_obtenidos: 110 },
        { categoria_id: "cat-b", player_id: "player-1", puntos_obtenidos: 105 },
    ]);

    assert.deepEqual(rankings.get("cat-a"), [
        { playerId: "player-1", points: 233, position: 1 },
        { playerId: "player-2", points: 110, position: 2 },
    ]);
    assert.deepEqual(rankings.get("cat-b"), [
        { playerId: "player-1", points: 105, position: 1 },
    ]);
    assert.equal(rankings.size, 2);
    assert.throws(() => aggregateRankingPointsByCategory([
        { categoria_id: "", player_id: "player-1", puntos_obtenidos: 100 },
    ]), /categoria_id/);
});

test("el corte top 4 conserva provisionalmente todos los empates por puntos", () => {
    const qualification = getMasterQualification([
        { playerId: "p1", points: 120, position: 1 },
        { playerId: "p2", points: 110, position: 2 },
        { playerId: "p3", points: 100, position: 3 },
        // p4 could have a private/inactive profile; it still occupies rank 4.
        { playerId: "p4-hidden", points: 90, position: 4 },
        { playerId: "p5-visible", points: 90, position: 5 },
        { playerId: "p6-visible", points: 90, position: 6 },
        { playerId: "p7", points: 80, position: 7 },
    ]);

    assert.equal(qualification.cutoffPoints, 90);
    assert.equal(qualification.hasCutoffTie, true);
    assert.deepEqual(qualification.qualifiedPlayerIds, [
        "p1", "p2", "p3", "p4-hidden", "p5-visible", "p6-visible",
    ]);
});

test("el corte provisional distingue empate y conserva ligas cortas sin inventar desempate", () => {
    const noTie = getMasterQualification([
        { playerId: "p1", points: 100, position: 1 },
        { playerId: "p2", points: 90, position: 2 },
        { playerId: "p3", points: 80, position: 3 },
        { playerId: "p4", points: 70, position: 4 },
        { playerId: "p5", points: 60, position: 5 },
    ]);
    assert.equal(noTie.hasCutoffTie, false);
    assert.deepEqual(noTie.qualifiedPlayerIds, ["p1", "p2", "p3", "p4"]);

    const shortRanking = getMasterQualification([
        { playerId: "p1", points: 40, position: 1 },
        { playerId: "p2", points: 30, position: 2 },
    ]);
    assert.equal(shortRanking.cutoffPoints, null);
    assert.deepEqual(shortRanking.qualifiedPlayerIds, ["p1", "p2"]);
});

test("rechaza parámetros y clasificaciones incompletas en el corte Master", () => {
    assert.throws(() => getMasterQualification([], 0), /entero positivo/);
    assert.throws(() => getMasterQualification([
        { playerId: "p1", points: 100, position: 1 },
        { playerId: "p2", points: 90, position: 3 },
    ]), /incompleto/);
    assert.throws(() => getMasterQualification([
        { playerId: "p1", points: 100, position: 1 },
        { playerId: "p1", points: 90, position: 2 },
    ]), /duplicados/);
});
