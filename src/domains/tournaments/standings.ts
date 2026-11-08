// Clasificación de grupo con los desempates acordados:
// 1) partidos ganados, 2) enfrentamiento directo (entre empatadas),
// 3) diferencia de sets, 4) diferencia de juegos.
// Si persiste el empate, se marca como "decisión de la organización" (orden de cabeza de serie).

import { matchSummary, winnerOf, type Score, type Seed } from "./scoring";

export type GroupResult = { a: Seed; b: Seed; score: Score };
export type Ranking = { order: Seed[]; organizerTie: boolean };

type Tally = { wins: number; setDiff: number; gameDiff: number };

function tally(seed: Seed, results: GroupResult[]): Tally {
    let wins = 0;
    let setDiff = 0;
    let gameDiff = 0;

    for (const r of results) {
        const isA = r.a === seed;
        if (!isA && r.b !== seed) continue;

        const s = matchSummary(r.score);
        const mySets = isA ? s.sa : s.sb;
        const rivalSets = isA ? s.sb : s.sa;
        const myGames = isA ? s.ga : s.gb;
        const rivalGames = isA ? s.gb : s.ga;

        if (winnerOf(r.score) === (isA ? "a" : "b")) wins++;
        setDiff += mySets - rivalSets;
        gameDiff += myGames - rivalGames;
    }
    return { wins, setDiff, gameDiff };
}

const cmpMini = (x: Tally, y: Tally) => y.wins - x.wins || y.setDiff - x.setDiff || y.gameDiff - x.gameDiff;
const cmpOverall = (x: Tally, y: Tally) => y.setDiff - x.setDiff || y.gameDiff - x.gameDiff;

export function rankGroup(seeds: Seed[], results: GroupResult[]): Ranking {
    const overall = new Map(seeds.map((s) => [s, tally(s, results)] as const));

    const byWins = [...seeds].sort((x, y) => overall.get(y)!.wins - overall.get(x)!.wins || x - y);
    const order: Seed[] = [];
    let organizerTie = false;

    let i = 0;
    while (i < byWins.length) {
        const wins = overall.get(byWins[i])!.wins;
        let j = i;
        while (j < byWins.length && overall.get(byWins[j])!.wins === wins) j++;

        const tier = byWins.slice(i, j);

        if (tier.length === 1) {
            order.push(tier[0]);
        } else {
            // Enfrentamientos solo entre las parejas empatadas
            const inTier = new Set(tier);
            const mini = results.filter((r) => inTier.has(r.a) && inTier.has(r.b));
            const miniT = new Map(tier.map((s) => [s, tally(s, mini)] as const));

            const sorted = [...tier].sort(
                (x, y) =>
                    cmpMini(miniT.get(x)!, miniT.get(y)!) ||
                    cmpOverall(overall.get(x)!, overall.get(y)!) ||
                    x - y,
            );

            for (let k = 0; k + 1 < sorted.length; k++) {
                const p = sorted[k];
                const q = sorted[k + 1];
                if (
                    cmpMini(miniT.get(p)!, miniT.get(q)!) === 0 &&
                    cmpOverall(overall.get(p)!, overall.get(q)!) === 0
                ) {
                    organizerTie = true;
                }
            }
            order.push(...sorted);
        }
        i = j;
    }

    return { order, organizerTie };
}