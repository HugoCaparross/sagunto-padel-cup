import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Categoria, Ronda } from "@/lib/constantes";
import { ESCALA } from "@/lib/puntos/escala";

describe("espejo de la escala de puntos", () => {
    it("coincide con las 28 filas de points_scale en seed.sql", () => {
        const seed = readFileSync("supabase/seed.sql", "utf8");
        const inicio = seed.indexOf("insert into public.points_scale");
        expect(inicio).toBeGreaterThanOrEqual(0);
        const fin = seed.indexOf(";", inicio);
        expect(fin).toBeGreaterThan(inicio);
        const bloque = seed.slice(inicio, fin);
        const filas = [...bloque.matchAll(/\('(campeon|subcampeon|semifinalista|cuartos|octavos|dieciseisavos|participacion)'\s*,\s*'(primera|segunda|tercera|cuarta)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/g)];

        expect(filas).toHaveLength(28);
        for (const [, ronda, categoria, oro, plata, bronce] of filas) {
            expect(ESCALA[ronda as Ronda][categoria as Categoria]).toEqual({
                oro: Number(oro),
                plata: Number(plata),
                bronce: Number(bronce),
            });
        }
    });
});
