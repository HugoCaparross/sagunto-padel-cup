import { describe, expect, it } from "vitest";
import { crearSlugJugador } from "@/lib/jugadores/slug";

describe("crearSlugJugador", () => {
    it("normaliza tildes y espacios", () => {
        expect(crearSlugJugador("Álvaro Núñez", "ABCDEF12-3456")).toBe("alvaro-nunez-abcdef");
    });

    it("usa jugador cuando el nombre está vacío", () => {
        expect(crearSlugJugador("   ", "12345678-90ab")).toBe("jugador-123456");
    });

    it("usa jugador cuando el nombre solo tiene caracteres no alfanuméricos", () => {
        expect(crearSlugJugador("---", "abcdef12-3456")).toBe("jugador-abcdef");
    });
});
