import { describe, expect, it } from "vitest";
import { fotoPublicable } from "@/lib/jugadores/fotos-publicas";

describe("fotoPublicable", () => {
    it("devuelve la ruta con visibilidad y consentimiento", () => {
        expect(fotoPublicable({ foto_perfil_path: "jugador/foto.webp", visibilidad_publica: true, consentimiento_imagen: true }))
            .toBe("jugador/foto.webp");
    });

    it("oculta la foto si el perfil no es público", () => {
        expect(fotoPublicable({ foto_perfil_path: "jugador/foto.webp", visibilidad_publica: false, consentimiento_imagen: true }))
            .toBeNull();
    });

    it("oculta la foto si no hay consentimiento", () => {
        expect(fotoPublicable({ foto_perfil_path: "jugador/foto.webp", visibilidad_publica: true, consentimiento_imagen: false }))
            .toBeNull();
    });

    it("devuelve null cuando no hay foto aunque exista consentimiento", () => {
        expect(fotoPublicable({ foto_perfil_path: null, visibilidad_publica: true, consentimiento_imagen: true }))
            .toBeNull();
    });
});
