// =========================================================
// NIVELES Y XP DEL JUGADOR
// XP = puntos históricos + regularidad + bonus de victorias.
// Independiente de la categoría: el nivel mide progreso, no nivel competitivo.
// =========================================================

export const XP = {
    porPuntoHistorico: 1,     // cada punto del ranking vale 1 XP
    porPruebaJugada: 25,      // regularidad: cada prueba disputada
    partidosMinimosBonus: 5,  // partidos mínimos para que cuente el % de victorias
    factorVictorias: 1,       // bonus = % de victorias × factor (máx. 100 XP)
} as const;

export const NIVEL_MAXIMO = 50;

export type EstadisticasJugador = {
    puntosHistoricos: number;   // suma de todos los puntos obtenidos
    pruebasJugadas: number;
    partidos: number;
    porcentajeVictorias: number; // 0-100
};

export type Tier = {
    desde: number;
    nombre: string;
};

// Tiers: cada uno agrupa un tramo de niveles
export const TIERS: readonly Tier[] = [
    { desde: 1, nombre: "Iniciado" },
    { desde: 10, nombre: "Regular" },
    { desde: 20, nombre: "Avanzado" },
    { desde: 30, nombre: "Veterano" },
    { desde: 40, nombre: "Élite" },
    { desde: 50, nombre: "Leyenda" },
];

// XP total necesaria para alcanzar un nivel: 25 × n × (n − 1)
// Nivel 2 → 50 XP, nivel 5 → 500 XP, nivel 10 → 2.250 XP, nivel 50 → 61.250 XP
export function xpParaNivel(nivel: number): number {
    return 25 * nivel * (nivel - 1);
}

export function calcularXp(e: EstadisticasJugador): number {
    const bonusVictorias =
        e.partidos >= XP.partidosMinimosBonus
            ? Math.round(e.porcentajeVictorias * XP.factorVictorias)
            : 0;

    return (
        Math.max(0, e.puntosHistoricos) * XP.porPuntoHistorico +
        Math.max(0, e.pruebasJugadas) * XP.porPruebaJugada +
        bonusVictorias
    );
}

export function tierDeNivel(nivel: number): Tier {
    let tier = TIERS[0];
    for (const t of TIERS) {
        if (nivel >= t.desde) tier = t;
    }
    return tier;
}

export type ProgresoNivel = {
    xpTotal: number;
    nivel: number;
    tier: string;
    xpEnNivel: number;        // XP ganada dentro del nivel actual
    xpParaSiguiente: number;  // XP necesaria para pasar de nivel (0 si es el máximo)
    xpFaltante: number;       // XP que falta para el siguiente nivel
    progreso: number;         // 0-1, para la barra
    esMaximo: boolean;
};

export function progresoDesdeXp(xpBruta: number): ProgresoNivel {
    const xpTotal = Math.max(0, Math.floor(xpBruta));

    let nivel = 1;
    while (nivel < NIVEL_MAXIMO && xpTotal >= xpParaNivel(nivel + 1)) {
        nivel++;
    }

    const base = xpParaNivel(nivel);
    const esMaximo = nivel === NIVEL_MAXIMO;

    if (esMaximo) {
        return {
            xpTotal,
            nivel,
            tier: tierDeNivel(nivel).nombre,
            xpEnNivel: xpTotal - base,
            xpParaSiguiente: 0,
            xpFaltante: 0,
            progreso: 1,
            esMaximo,
        };
    }

    const siguiente = xpParaNivel(nivel + 1);
    const tramo = siguiente - base;
    const xpEnNivel = xpTotal - base;

    return {
        xpTotal,
        nivel,
        tier: tierDeNivel(nivel).nombre,
        xpEnNivel,
        xpParaSiguiente: tramo,
        xpFaltante: siguiente - xpTotal,
        progreso: xpEnNivel / tramo,
        esMaximo,
    };
}

// Atajo: de estadísticas del jugador directamente al progreso
export function progresoDeJugador(e: EstadisticasJugador): ProgresoNivel {
    return progresoDesdeXp(calcularXp(e));
}