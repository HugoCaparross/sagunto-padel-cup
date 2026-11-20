import { describe, expect, it } from "vitest";
import {
    contarPartidos,
    enfrentamientos,
    tamanosGrupos,
    validarLlaves,
    type ContextoLlaves,
    type PartidoEntrada,
} from "@/lib/cuadros/formatos";
import { clasificarGrupo, type PartidoGrupo } from "@/lib/cuadros/clasificacion";
import { sortearGrupos, sortearLlave, type ParticipanteLlave } from "@/lib/cuadros/sorteo";

describe("formatos", () => {
    it("cada número de parejas entre 3 y 12 reparte todas las plazas", () => {
        for (let n = 3; n <= 12; n++) {
            const tamanos = tamanosGrupos(n);
            expect(tamanos?.reduce((a, b) => a + b, 0)).toBe(n);
        }
    });

    it("un grupo de 3 juega a doble vuelta; el resto a vuelta simple", () => {
        expect(enfrentamientos(["a", "b", "c"], 2)).toHaveLength(6);
        expect(enfrentamientos(["a", "b", "c", "d"], 1)).toHaveLength(6);
    });

    it("cuenta los partidos de 3 y 4 parejas", () => {
        expect(contarPartidos(3)).toMatchObject({ grupo: 6, fase_final: 0, final: 1, total: 7 });
        expect(contarPartidos(4)).toMatchObject({ grupo: 6, fase_final: 3, final: 1, total: 10 });
    });

    it("con 6 parejas, dos grupos de 3 a doble vuelta", () => {
        expect(contarPartidos(6)).toMatchObject({ grupo: 12, fase_final: 2, final: 1, total: 15 });
    });
});

describe("validación de llaves", () => {
    const ctx: ContextoLlaves = {
        activas: ["a", "b", "c", "d"],
        grupoDe: {},
        posicionDe: {},
        duelosGrupo: [],
        topDos: [],
    };

    const semi = (id: string, a: string, b: string, orden: number): PartidoEntrada => ({
        id,
        cuadro: "oro",
        ronda: "semifinal",
        formato: "fase_final",
        orden,
        a: { tipo: "pareja", inscripcionId: a },
        b: { tipo: "pareja", inscripcionId: b },
    });

    it("bloquea una pareja que juega dos veces en la misma ronda", () => {
        const errores = validarLlaves([semi("p1", "a", "b", 0), semi("p2", "a", "c", 1)], [], ctx)
            .filter((i) => i.nivel === "error")
            .map((i) => i.mensaje);
        expect(errores).toContain("Una pareja aparece dos veces en la misma ronda");
    });

    it("un ganador solo puede venir de una ronda anterior", () => {
        const final: PartidoEntrada = {
            id: "p3",
            cuadro: "oro",
            ronda: "semifinal",
            formato: "fase_final",
            orden: 1,
            a: { tipo: "ganador", partidoId: "p1" },
            b: { tipo: "pareja", inscripcionId: "d" },
        };
        const errores = validarLlaves([semi("p1", "a", "b", 0), final], [], ctx)
            .filter((i) => i.nivel === "error")
            .map((i) => i.mensaje);
        expect(errores).toContain("Un ganador o perdedor solo puede venir de una ronda anterior");
    });
});

describe("sorteo de grupos", () => {
    it("las dos mejores parejas caen en grupos distintos", () => {
        const parejas = ["a", "b", "c", "d", "e", "f"].map((id, i) => ({ id, puntos: 100 - i * 10 }));
        for (let k = 0; k < 200; k++) {
            const grupos = sortearGrupos(parejas, [3, 3]);
            const grupoDe = (id: string) => grupos.findIndex((g) => g.includes(id));
            expect(grupoDe("a")).not.toBe(grupoDe("b"));
            expect(grupos.map((g) => g.length)).toEqual([3, 3]);
        }
    });
});

describe("sorteo de cuartos", () => {
    const participantes: ParticipanteLlave[] = [
        ...[1, 2, 3, 4].map((p) => ({ id: `a${p}`, grupo: "A", posicion: p, puntos: 100 - p * 5 })),
        ...[1, 2, 3, 4].map((p) => ({ id: `b${p}`, grupo: "B", posicion: p, puntos: 99 - p * 5 })),
    ];

    it("ningún cruce repite grupo y el 1.º no se cruza con el 2.º del otro", () => {
        const cruces = sortearLlave(participantes, { primeroVsSegundo: true });
        expect(cruces).not.toBeNull();

        const porId = new Map(participantes.map((p) => [p.id, p]));
        for (const [x, y] of cruces ?? []) {
            const px = porId.get(x)!;
            const py = porId.get(y)!;
            expect(px.grupo).not.toBe(py.grupo);
            const primeroConSegundo =
                (px.posicion === 1 && py.posicion === 2) || (px.posicion === 2 && py.posicion === 1);
            expect(primeroConSegundo).toBe(false);
        }
    });

    it("las dos mejores no quedan en la misma mitad del cuadro", () => {
        // a1 y b1 son las dos mejores por puntos
        const cruces = sortearLlave(participantes, { primeroVsSegundo: true }) ?? [];
        const mitad1 = cruces.slice(0, 2).flat();
        const mitad2 = cruces.slice(2, 4).flat();
        expect(mitad1.includes("a1") && mitad1.includes("b1")).toBe(false);
        expect(mitad2.includes("a1") && mitad2.includes("b1")).toBe(false);
    });
});

describe("clasificación de grupo", () => {
    it("en un triple empate, ordena por juegos ganados", () => {
        const partidos: PartidoGrupo[] = [
            { grupo: "A", inscripcionA: "a", inscripcionB: "b", sets: [[6, 0]], ganadorId: "a" },
            { grupo: "A", inscripcionA: "b", inscripcionB: "c", sets: [[6, 4]], ganadorId: "b" },
            { grupo: "A", inscripcionA: "c", inscripcionB: "a", sets: [[6, 5]], ganadorId: "c" },
        ];
        const { filas, completo } = clasificarGrupo("A", ["a", "b", "c"], partidos, () => 0.5);
        expect(completo).toBe(true);
        expect(filas.map((f) => f.id)).toEqual(["a", "c", "b"]);
        expect(filas[0].criterio).toBe("juegos_ganados");
    });
});