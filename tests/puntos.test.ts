import { describe, expect, it } from "vitest";
import { CATEGORIAS, CUADROS, RONDAS } from "@/lib/constantes";
import { ESCALA, filasEscala, puntosPara } from "@/lib/puntos/escala";

describe("escala de puntos", () => {
    it("tiene 84 filas: 7 rondas × 4 categorías × 3 cuadros", () => {
        expect(filasEscala()).toHaveLength(84);
    });

    it("devuelve los valores de la tabla oficial", () => {
        expect(puntosPara("segunda", "oro", "campeon")).toBe(125);
        expect(puntosPara("primera", "bronce", "participacion")).toBe(12);
        expect(puntosPara("cuarta", "plata", "semifinalista")).toBe(45);
    });

    it("nunca sube al bajar de ronda", () => {
        for (const c of CATEGORIAS) {
            for (const q of CUADROS) {
                for (let i = 1; i < RONDAS.length; i++) {
                    expect(ESCALA[RONDAS[i]][c][q]).toBeLessThanOrEqual(ESCALA[RONDAS[i - 1]][c][q]);
                }
            }
        }
    });

    it("oro ≥ plata ≥ bronce en cada ronda y categoría", () => {
        for (const r of RONDAS) {
            for (const c of CATEGORIAS) {
                const e = ESCALA[r][c];
                expect(e.oro).toBeGreaterThanOrEqual(e.plata);
                expect(e.plata).toBeGreaterThanOrEqual(e.bronce);
            }
        }
    });

    it("una categoría superior puntúa igual o más que la inferior", () => {
        for (const r of RONDAS) {
            for (const q of CUADROS) {
                for (let i = 1; i < CATEGORIAS.length; i++) {
                    expect(ESCALA[r][CATEGORIAS[i - 1]][q]).toBeGreaterThanOrEqual(ESCALA[r][CATEGORIAS[i]][q]);
                }
            }
        }
    });
});