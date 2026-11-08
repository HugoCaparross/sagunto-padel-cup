// Reglas de marcador según el Sistema de Juego 2026.
// Fase de grupos: 1 set a 6 (tie-break a 7 en 6-6).
// Semifinales: 1 set a 9 (tie-break a 9-8 en 8-8).
// Finales: 2 sets a 6 (tie-break a 7 en 6-6); si 1-1, super tie-break a 10 con diferencia mínima de 2.

export type Seed = number;
export type Stage = "group" | "semi" | "final";
export type SetScore = { a: number; b: number };
export type Score = { sets: SetScore[]; superTiebreak?: SetScore };

const isSixSet = (s: SetScore) =>
    (s.a === 6 && s.b <= 4) ||
    (s.b === 6 && s.a <= 4) ||
    (s.a === 7 && s.b === 6) ||
    (s.a === 6 && s.b === 7);

const isNineSet = (s: SetScore) =>
    (s.a === 9 && s.b <= 7) ||
    (s.b === 9 && s.a <= 7) ||
    (s.a === 9 && s.b === 8) ||
    (s.a === 8 && s.b === 9);

const isSuperTiebreak = (s: SetScore) => {
    const max = Math.max(s.a, s.b);
    const min = Math.min(s.a, s.b);
    return max >= 10 && max - min >= 2 && min >= 0 && s.a !== s.b;
};

export function validateScore(stage: Stage, s: Score): string | null {
    if (stage === "group") {
        if (s.sets.length !== 1 || s.superTiebreak) return "La fase de grupos se juega a un set";
        return isSixSet(s.sets[0]) ? null : "Set no válido: 6 juegos, o 7-6 con tie-break";
    }

    if (stage === "semi") {
        if (s.sets.length !== 1 || s.superTiebreak) return "Las semifinales se juegan a un set de 9 juegos";
        return isNineSet(s.sets[0]) ? null : "Set no válido: 9 juegos, o 9-8 con tie-break";
    }

    if (s.sets.length !== 2) return "La final se juega a dos sets";
    if (!s.sets.every(isSixSet)) return "Set no válido en la final: 6 juegos, o 7-6 con tie-break";

    const wa = s.sets.filter((x) => x.a > x.b).length;
    const wb = s.sets.length - wa;

    if (wa === 2 || wb === 2) {
        return s.superTiebreak ? "No hay super tie-break si una pareja gana los dos sets" : null;
    }

    if (!s.superTiebreak) return "Con un set cada pareja falta el super tie-break a 10";
    return isSuperTiebreak(s.superTiebreak)
        ? null
        : "Super tie-break no válido: 10 puntos con diferencia mínima de 2";
}

/** Ganador del partido. Un super tie-break cuenta como tercer set. */
export function winnerOf(s: Score): "a" | "b" | null {
    let wa = 0;
    let wb = 0;
    for (const set of s.sets) {
        if (set.a > set.b) wa++;
        else if (set.b > set.a) wb++;
        else return null;
    }
    if (s.superTiebreak) {
        if (s.superTiebreak.a > s.superTiebreak.b) wa++;
        else wb++;
    }
    if (wa === wb) return null;
    return wa > wb ? "a" : "b";
}

/** Sets y juegos de cada lado. El super tie-break no suma juegos. */
export function matchSummary(s: Score) {
    let sa = 0;
    let sb = 0;
    let ga = 0;
    let gb = 0;
    for (const set of s.sets) {
        ga += set.a;
        gb += set.b;
        if (set.a > set.b) sa++;
        else sb++;
    }
    if (s.superTiebreak) {
        if (s.superTiebreak.a > s.superTiebreak.b) sa++;
        else sb++;
    }
    return { sa, sb, ga, gb };
}