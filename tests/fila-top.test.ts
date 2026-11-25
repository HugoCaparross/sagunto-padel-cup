import { describe, expect, it } from "vitest";
import type { FilaTop } from "@/lib/home/datos";

describe("FilaTop", () => {
    it("expone el slug público independientemente del id interno", () => {
        const fila: FilaTop = {
            jugadorId: "uuid-interno",
            jugadorSlug: "ana-perez-abcdef",
            posicion: 1,
            nombre: "Ana Pérez",
            puntos: 100,
            pruebasJugadas: 2,
            partidos: 3,
            victorias: 2,
            porcentajeVictorias: 66.7,
            fotoUrl: null,
        };

        expect(fila.jugadorSlug).toBe("ana-perez-abcdef");
    });
});
