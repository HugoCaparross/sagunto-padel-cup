import {
    ESTADOS_QUE_OCUPAN_PLAZA,
    type EstadoInscripcion,
    type EstadoPrueba,
} from "@/lib/constantes";

// Estados de prueba en los que se puede fichar. Fechas en formato yyyy-mm-dd.
const ESTADOS_CON_CHECKIN: readonly EstadoPrueba[] = ["abierta", "cerrada", "en_curso"];

export type DatosCheckin = {
    estadoPrueba: EstadoPrueba;
    fechaInicio: string;
    fechaFin: string;
    hoy: string;
    estadoInscripcion: EstadoInscripcion;
};

// Devuelve el motivo por el que no se puede fichar, o null si se puede.
export function motivoNoCheckin(d: DatosCheckin): string | null {
    if (!ESTADOS_CON_CHECKIN.includes(d.estadoPrueba)) {
        return "La prueba no está en un estado que permita el check-in";
    }
    if (d.hoy < d.fechaInicio || d.hoy > d.fechaFin) {
        return "El check-in solo se puede hacer durante las fechas de la prueba";
    }
    if (d.estadoInscripcion === "retirada") {
        return "La inscripción está retirada";
    }
    if (d.estadoInscripcion === "lista_espera") {
        return "La pareja está en lista de espera y no tiene plaza";
    }
    if (!(ESTADOS_QUE_OCUPAN_PLAZA as readonly string[]).includes(d.estadoInscripcion)) {
        return "La inscripción no está activa";
    }
    return null;
}