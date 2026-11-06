export type StageRules = {
    games_to: number;
    tiebreak_at: number;
    best_of: 1 | 3;
    points_win: number;
    points_loss: number;
};

// Valores provisionales. La tabla oficial de puntos se configura en el paso 9.
export const DEFAULT_STAGE_RULES: StageRules = {
    games_to: 5,
    tiebreak_at: 5,
    best_of: 1,
    points_win: 10,
    points_loss: 4,
};

export type SetInput = { a: number; b: number; tbA: number | null; tbB: number | null };

export const MATCH_STATUS_LABEL: Record<string, string> = {
    scheduled: "Programado",
    in_progress: "En juego",
    finished_pending_validation: "Pendiente de validar",
    validated: "Validado",
    suspended: "Suspendido",
    not_played: "No disputado",
    walkover: "Walkover",
    cancelled: "Cancelado",
};

type Result =
    | { ok: true; winner: "a" | "b" }
    | { ok: false; error: string };

/** Comprueba que los sets son válidos y que hay un ganador claro según las reglas de la fase. */
export function validateSets(sets: SetInput[], rules: StageRules): Result {
    const fail = (error: string): Result => ({ ok: false, error });

    if (sets.length === 0) return fail("Introduce al menos un set.");

    const toWin = rules.best_of === 1 ? 1 : 2;
    let winsA = 0;
    let winsB = 0;

    for (let i = 0; i < sets.length; i++) {
        const s = sets[i];
        const n = i + 1;

        if (![s.a, s.b].every((v) => Number.isInteger(v) && v >= 0)) {
            return fail(`Set ${n}: marcador no válido.`);
        }

        let setWinner: "a" | "b";

        if (s.a === s.b) {
            if (s.a !== rules.tiebreak_at) {
                return fail(`Set ${n}: un empate solo es posible a ${rules.tiebreak_at} juegos.`);
            }
            if (s.tbA === null || s.tbB === null || s.tbA === s.tbB) {
                return fail(`Set ${n}: introduce el tie-break (distinto en cada lado).`);
            }
            setWinner = s.tbA > s.tbB ? "a" : "b";
        } else {
            const high = Math.max(s.a, s.b);
            const low = Math.min(s.a, s.b);
            if (high !== rules.games_to || low >= rules.games_to) {
                return fail(`Set ${n}: el set debe ganarse a ${rules.games_to} juegos.`);
            }
            setWinner = s.a > s.b ? "a" : "b";
        }

        if (setWinner === "a") winsA++;
        else winsB++;

        if (winsA === toWin || winsB === toWin) {
            if (i !== sets.length - 1) return fail("Hay sets de más después de decidir el partido.");
            return { ok: true, winner: winsA === toWin ? "a" : "b" };
        }
    }

    return fail("El partido no está decidido: faltan sets.");
}