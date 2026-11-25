import { describe, expect, it } from "vitest";
import { colorAvatarJugador, inicialesJugador } from "@/lib/jugadores/avatar";

describe("avatar de jugador", () => {
    it("usa iniciales del nombre y el apellido", () => {
        expect(inicialesJugador("Lucía Mar Pérez")).toBe("LP");
    });

    it("usa una inicial si solo hay un nombre", () => {
        expect(inicialesJugador("Hugo")).toBe("H");
    });

    it("usa un marcador si el nombre está vacío", () => {
        expect(inicialesJugador("   ")).toBe("?");
    });

    it("elige de forma estable un color de marca", () => {
        const color = colorAvatarJugador("Lucía Mar Pérez");
        expect(colorAvatarJugador("Lucía Mar Pérez")).toBe(color);
        expect(["#F0443A", "#0D1B2A", "#A7C4A0"]).toContain(color);
    });
});
