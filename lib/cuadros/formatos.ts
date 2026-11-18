import type { Cuadro } from "@/lib/constantes";

// ---------------------------------------------------------
// LÍMITES
// ---------------------------------------------------------
export const MIN_PAREJAS_CATEGORIA = 3;
export const MAX_PAREJAS_POR_CATEGORIA = 12;
export const MIN_PARTIDOS_POR_PAREJA = 3;

// ---------------------------------------------------------
// TIPOS
// ---------------------------------------------------------
export type FasePartido = "grupo" | "fase_final" | "final";

export const RONDAS = ["round_robin", "cuartos", "semifinal", "final"] as const;
export type Ronda = (typeof RONDAS)[number];

// Una plaza solo puede depender de un partido de una ronda anterior.
export const ORDEN_RONDA: Record<Ronda, number> = {
    round_robin: 0,
    cuartos: 1,
    semifinal: 2,
    final: 3,
};

export type Conteo = {
    grupo: number;
    fase_final: number;
    final: number;
    total: number;
};

// Compatibilidad con sorteo.ts.
export type Origen = string;

// Una plaza se rellena con una pareja directa o con el ganador/perdedor de otro partido.
export type LadoEntrada =
    | { tipo: "pareja"; inscripcionId: string }
    | { tipo: "ganador" | "perdedor"; partidoId: string };

export type PartidoEntrada = {
    id: string;
    cuadro: Cuadro;
    ronda: Ronda;
    formato: "fase_final" | "final";
    orden: number;
    a: LadoEntrada | null;
    b: LadoEntrada | null;
};

// Campeón de un cuadro sin partido (solo un clasificado).
export type AutomaticoEntrada = {
    cuadro: Cuadro;
    inscripcionId: string | null;
};

// Datos planos, serializables, para validar en servidor y en el editor.
export type ContextoLlaves = {
    activas: string[];
    grupoDe: Record<string, string>;
    posicionDe: Record<string, number>;
    duelosGrupo: [string, string][];
    topDos: string[];
};

export type Incidencia = {
    nivel: "error" | "aviso";
    mensaje: string;
};

// ---------------------------------------------------------
// GRUPOS
// ---------------------------------------------------------
const TAMANOS: Record<number, number[]> = {
    3: [3],
    4: [4],
    5: [5],
    6: [3, 3],
    7: [4, 3],
    8: [4, 4],
    9: [5, 4],
    10: [5, 5],
    11: [6, 5],
    12: [6, 6],
};

// Hasta 5 parejas: 1 grupo. Desde 6: siempre 2 grupos.
export function tamanosGrupos(parejas: number): number[] | null {
    return TAMANOS[parejas] ?? null;
}

// Grupo de 3: doble vuelta (cada pareja juega 4 partidos). Resto: vuelta simple.
export function vueltasDeGrupo(tamano: number): 1 | 2 {
    return tamano === 3 ? 2 : 1;
}

// Todos contra todos. Con vueltas = 2, se repiten invirtiendo los lados.
export function enfrentamientos(
    ids: string[],
    vueltas: 1 | 2
): [string, string][] {
    const pares: [string, string][] = [];
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) pares.push([ids[i], ids[j]]);
    }
    if (vueltas === 1) return pares;
    return [...pares, ...pares.map(([a, b]): [string, string] => [b, a])];
}

// ---------------------------------------------------------
// PLANTILLA SUGERIDA DE LA FASE FINAL
// Es solo el punto de partida del editor. El organizador la modifica libremente.
// Final de oro: 2 sets. Resto de finales: 1 set de 9 juegos.
// ---------------------------------------------------------
type Bloque = { cuadro: Cuadro; ronda: Ronda; veces: number };

const PLANTILLAS: Record<
    number,
    { partidos: Bloque[]; automaticos: Cuadro[] }
> = {
    3: {
        partidos: [{ cuadro: "oro", ronda: "final", veces: 1 }],
        automaticos: ["plata"],
    },
    4: {
        partidos: [
            { cuadro: "oro", ronda: "semifinal", veces: 2 },
            { cuadro: "oro", ronda: "final", veces: 1 },
            { cuadro: "plata", ronda: "final", veces: 1 },
        ],
        automaticos: [],
    },
    5: {
        partidos: [
            { cuadro: "oro", ronda: "semifinal", veces: 2 },
            { cuadro: "oro", ronda: "final", veces: 1 },
            { cuadro: "plata", ronda: "final", veces: 1 },
        ],
        automaticos: ["bronce"],
    },
    6: {
        partidos: [
            { cuadro: "oro", ronda: "final", veces: 1 },
            { cuadro: "plata", ronda: "final", veces: 1 },
            { cuadro: "bronce", ronda: "final", veces: 1 },
        ],
        automaticos: [],
    },
    7: {
        partidos: [
            { cuadro: "oro", ronda: "semifinal", veces: 2 },
            { cuadro: "oro", ronda: "final", veces: 1 },
            { cuadro: "plata", ronda: "final", veces: 1 },
        ],
        automaticos: ["bronce"],
    },
    8: {
        partidos: [
            { cuadro: "oro", ronda: "semifinal", veces: 2 },
            { cuadro: "oro", ronda: "final", veces: 1 },
            { cuadro: "plata", ronda: "final", veces: 1 },
            { cuadro: "bronce", ronda: "final", veces: 1 },
        ],
        automaticos: [],
    },
    9: {
        partidos: [
            { cuadro: "oro", ronda: "semifinal", veces: 2 },
            { cuadro: "oro", ronda: "final", veces: 1 },
            { cuadro: "plata", ronda: "final", veces: 1 },
            { cuadro: "bronce", ronda: "round_robin", veces: 3 },
        ],
        automaticos: [],
    },
    10: {
        partidos: [
            { cuadro: "oro", ronda: "cuartos", veces: 4 },
            { cuadro: "oro", ronda: "semifinal", veces: 2 },
            { cuadro: "oro", ronda: "final", veces: 1 },
            { cuadro: "plata", ronda: "final", veces: 1 },
            { cuadro: "bronce", ronda: "final", veces: 1 },
        ],
        automaticos: [],
    },
    11: {
        partidos: [
            { cuadro: "oro", ronda: "semifinal", veces: 2 },
            { cuadro: "oro", ronda: "final", veces: 1 },
            { cuadro: "plata", ronda: "round_robin", veces: 3 },
            { cuadro: "bronce", ronda: "semifinal", veces: 2 },
            { cuadro: "bronce", ronda: "final", veces: 1 },
        ],
        automaticos: [],
    },
    12: {
        partidos: [
            { cuadro: "oro", ronda: "semifinal", veces: 2 },
            { cuadro: "oro", ronda: "final", veces: 1 },
            { cuadro: "plata", ronda: "semifinal", veces: 2 },
            { cuadro: "plata", ronda: "final", veces: 1 },
            { cuadro: "bronce", ronda: "semifinal", veces: 2 },
            { cuadro: "bronce", ronda: "final", veces: 1 },
        ],
        automaticos: [],
    },
};

function formatoDe(cuadro: Cuadro, ronda: Ronda): "fase_final" | "final" {
    return cuadro === "oro" && ronda === "final" ? "final" : "fase_final";
}

export function plantillaPorDefecto(parejas: number): {
    partidos: PartidoEntrada[];
    automaticos: AutomaticoEntrada[];
} | null {
    const p = PLANTILLAS[parejas];
    if (!p) return null;

    const partidos: PartidoEntrada[] = [];
    for (const bloque of p.partidos) {
        for (let i = 0; i < bloque.veces; i++) {
            partidos.push({
                id: `p-${bloque.cuadro}-${bloque.ronda}-${partidos.length}`,
                cuadro: bloque.cuadro,
                ronda: bloque.ronda,
                formato: formatoDe(bloque.cuadro, bloque.ronda),
                orden: partidos.length,
                a: null,
                b: null,
            });
        }
    }

    return {
        partidos,
        automaticos: p.automaticos.map((cuadro) => ({
            cuadro,
            inscripcionId: null,
        })),
    };
}

// Partidos de una categoría: grupos más fase final según la plantilla.
// Con menos de 3 parejas o más de 12 no hay conteo.
export function contarPartidos(parejas: number): Conteo | null {
    const tamanos = tamanosGrupos(parejas);
    const plantilla = plantillaPorDefecto(parejas);
    if (!tamanos || !plantilla) return null;

    const grupo = tamanos.reduce(
        (acc, t) => acc + (vueltasDeGrupo(t) * t * (t - 1)) / 2,
        0
    );
    const fase_final = plantilla.partidos.filter(
        (p) => p.formato === "fase_final"
    ).length;
    const final = plantilla.partidos.filter((p) => p.formato === "final").length;

    return { grupo, fase_final, final, total: grupo + fase_final + final };
}

// ---------------------------------------------------------
// VALIDACIÓN DE LLAVES
// Se ejecuta en el editor (en vivo) y en el servidor (al guardar).
// Errores: bloquean el guardado. Avisos: se muestran y el organizador decide.
// ---------------------------------------------------------
export function validarLlaves(
    partidos: PartidoEntrada[],
    automaticos: AutomaticoEntrada[],
    ctx: ContextoLlaves
): Incidencia[] {
    const out: Incidencia[] = [];
    const error = (mensaje: string) => out.push({ nivel: "error", mensaje });
    const aviso = (mensaje: string) => out.push({ nivel: "aviso", mensaje });

    const activas = new Set(ctx.activas);
    const porId = new Map(partidos.map((p) => [p.id, p]));

    // 1. Forma de cada partido
    for (const p of partidos) {
        for (const lado of [p.a, p.b]) {
            if (lado?.tipo === "pareja" && !activas.has(lado.inscripcionId)) {
                error("Hay una pareja que no está inscrita en esta categoría");
            }
            if (lado && lado.tipo !== "pareja") {
                const origen = porId.get(lado.partidoId);
                if (!origen) {
                    error(`Un ${lado.tipo} apunta a un partido que no existe`);
                } else if (origen.id === p.id) {
                    error("Un partido no puede depender de sí mismo");
                } else if (ORDEN_RONDA[origen.ronda] >= ORDEN_RONDA[p.ronda]) {
                    error("Un ganador o perdedor solo puede venir de una ronda anterior");
                }
            }
        }
        if (
            p.a?.tipo === "pareja" &&
            p.b?.tipo === "pareja" &&
            p.a.inscripcionId === p.b.inscripcionId
        ) {
            error("Una pareja no puede jugar contra sí misma");
        }
    }

    // 2. Una pareja no puede repetirse en la misma ronda ni estar en dos cuadros
    // (el todos contra todos sí permite repetir rival)
    const directas = new Set<string>();
    const cuadrosDePareja = new Map<string, Set<Cuadro>>();
    const vecesEnRonda = new Map<string, number>();

    for (const p of partidos) {
        for (const lado of [p.a, p.b]) {
            if (lado?.tipo !== "pareja") continue;
            const id = lado.inscripcionId;
            directas.add(id);

            const cuadros = cuadrosDePareja.get(id) ?? new Set<Cuadro>();
            cuadros.add(p.cuadro);
            cuadrosDePareja.set(id, cuadros);

            if (p.ronda !== "round_robin") {
                const clave = `${p.cuadro}|${p.ronda}|${id}`;
                const n = (vecesEnRonda.get(clave) ?? 0) + 1;
                vecesEnRonda.set(clave, n);
                if (n > 1) error("Una pareja aparece dos veces en la misma ronda");
            }
        }
    }

    for (const a of automaticos) {
        if (!a.inscripcionId) continue;
        if (directas.has(a.inscripcionId)) {
            error("Una pareja con campeón automático no puede tener partidos");
        }
        const cuadros = cuadrosDePareja.get(a.inscripcionId) ?? new Set<Cuadro>();
        cuadros.add(a.cuadro);
        cuadrosDePareja.set(a.inscripcionId, cuadros);
    }

    for (const cuadros of cuadrosDePareja.values()) {
        if (cuadros.size > 1) error("Una pareja está colocada en más de un cuadro");
    }

    // 3. Completitud
    const sinCompletar = partidos.filter((p) => !p.a || !p.b).length;
    const colocadas = new Set<string>([
        ...directas,
        ...automaticos.flatMap((a) => (a.inscripcionId ? [a.inscripcionId] : [])),
    ]);
    const sinColocar = ctx.activas.filter((id) => !colocadas.has(id));

    if (sinCompletar > 0) aviso(`${sinCompletar} partido(s) sin completar`);
    if (sinColocar.length > 0) {
        aviso(`${sinColocar.length} pareja(s) sin colocar en ningún cuadro`);
    }
    const completo = sinCompletar === 0 && sinColocar.length === 0;

    // 4. Mínimo de partidos por pareja (solo con el cuadro completo)
    if (completo) {
        let insuficientes = 0;
        for (const id of ctx.activas) {
            const degrupo = ctx.duelosGrupo.filter(
                ([x, y]) => x === id || y === id
            ).length;
            const enFinal = partidos.filter((p) =>
                [p.a, p.b].some((l) => l?.tipo === "pareja" && l.inscripcionId === id)
            ).length;
            if (degrupo + enFinal < MIN_PARTIDOS_POR_PAREJA) insuficientes++;
        }
        if (insuficientes > 0) {
            aviso(
                `${insuficientes} pareja(s) con menos de ${MIN_PARTIDOS_POR_PAREJA} partidos`
            );
        }
    }

    // 5. Reglas del sorteo (avisos)
    const primeraRonda = new Map<Cuadro, number>();
    for (const p of partidos) {
        if (p.ronda === "round_robin") continue;
        const actual = primeraRonda.get(p.cuadro) ?? Number.POSITIVE_INFINITY;
        primeraRonda.set(p.cuadro, Math.min(actual, ORDEN_RONDA[p.ronda]));
    }

    let mismoGrupo = 0;
    let primeroConSegundo = 0;
    let topCruzados = 0;

    for (const p of partidos) {
        if (p.ronda === "round_robin") continue;
        if (p.a?.tipo !== "pareja" || p.b?.tipo !== "pareja") continue;

        const x = p.a.inscripcionId;
        const y = p.b.inscripcionId;

        const enPrimeraRonda = ORDEN_RONDA[p.ronda] === primeraRonda.get(p.cuadro);
        if (enPrimeraRonda && ctx.grupoDe[x] && ctx.grupoDe[x] === ctx.grupoDe[y]) {
            mismoGrupo++;
        }

        const px = ctx.posicionDe[x];
        const py = ctx.posicionDe[y];
        if (p.ronda === "cuartos" && ((px === 1 && py === 2) || (px === 2 && py === 1))) {
            primeroConSegundo++;
        }

        if (p.ronda !== "final" && ctx.topDos.includes(x) && ctx.topDos.includes(y)) {
            topCruzados++;
        }
    }

    if (mismoGrupo > 0) {
        aviso(`${mismoGrupo} cruce(s) de parejas del mismo grupo en la primera ronda`);
    }
    if (primeroConSegundo > 0) {
        aviso(`${primeroConSegundo} cruce(s) de 1.º con 2.º antes de semifinales`);
    }
    if (topCruzados > 0) {
        aviso("Las dos mejores parejas se cruzan antes de la final");
    }

    return out;
}