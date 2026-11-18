import type { EstadoPrueba } from "@/lib/constantes";

// Transiciones permitidas entre estados de una prueba.
// Las condiciones de cada transición están en actions/pruebas.ts.
export const TRANSICIONES: Record<EstadoPrueba, EstadoPrueba[]> = {
    proxima: ["abierta"],
    abierta: ["proxima", "cerrada"],
    cerrada: ["abierta", "en_curso"],
    en_curso: ["finalizada"],
    finalizada: [],
};

export function transicionPermitida(desde: EstadoPrueba, hasta: EstadoPrueba): boolean {
    return TRANSICIONES[desde].includes(hasta);
}

// Reabrir inscripciones después de cerrarlas exige motivo.
export function requiereMotivo(desde: EstadoPrueba, hasta: EstadoPrueba): boolean {
    return desde === "cerrada" && hasta === "abierta";
}

// Estados en los que los inscritos pueden verse públicamente.
export const ESTADOS_CON_INSCRITOS_PUBLICOS: readonly EstadoPrueba[] = [
    "cerrada",
    "en_curso",
    "finalizada",
];