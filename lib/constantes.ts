// Valores exactos que acepta la base de datos (ver migraciones).
// Si cambias uno aquí, cámbialo también en el check correspondiente.

export const NOMBRE_CIRCUITO = "Sagunto Padel Cup";
export const TEMPORADA_ACTIVA = "2026-2027";

// ---------------------------------------------------------
// CATEGORÍAS
// ---------------------------------------------------------
export const CATEGORIAS = ["primera", "segunda", "tercera", "cuarta"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const ETIQUETAS_CATEGORIA: Record<Categoria, string> = {
    primera: "1.ª categoría",
    segunda: "2.ª categoría",
    tercera: "3.ª categoría",
    cuarta: "4.ª categoría",
};

// ---------------------------------------------------------
// CUADROS
// ---------------------------------------------------------
export const CUADROS = ["oro", "plata", "bronce"] as const;
export type Cuadro = (typeof CUADROS)[number];

export const ETIQUETAS_CUADRO: Record<Cuadro, string> = {
    oro: "Oro",
    plata: "Plata",
    bronce: "Bronce",
};

// ---------------------------------------------------------
// RONDAS (de mejor a peor resultado)
// ---------------------------------------------------------
export const RONDAS = [
    "campeon",
    "subcampeon",
    "semifinalista",
    "cuartos",
    "octavos",
    "dieciseisavos",
    "participacion",
] as const;
export type Ronda = (typeof RONDAS)[number];

export const ETIQUETAS_RONDA: Record<Ronda, string> = {
    campeon: "Campeón",
    subcampeon: "Subcampeón",
    semifinalista: "Semifinalista",
    cuartos: "Cuartofinalista",
    octavos: "Octavofinalista",
    dieciseisavos: "Dieciseisavos",
    participacion: "Participación inicial",
};

// ---------------------------------------------------------
// ESTADOS
// ---------------------------------------------------------
export const ESTADOS_INSCRIPCION = [
    "pendiente",
    "confirmada",
    "pagada_en_prueba",
    "lista_espera",
    "retirada",
] as const;
export type EstadoInscripcion = (typeof ESTADOS_INSCRIPCION)[number];

// Estados que ocupan plaza en el cupo de una categoría
export const ESTADOS_QUE_OCUPAN_PLAZA = [
    "pendiente",
    "confirmada",
    "pagada_en_prueba",
] as const satisfies readonly EstadoInscripcion[];

export const ETIQUETAS_ESTADO_INSCRIPCION: Record<EstadoInscripcion, string> = {
    pendiente: "Pendiente",
    confirmada: "Confirmada",
    pagada_en_prueba: "Pagada en prueba",
    lista_espera: "Lista de espera",
    retirada: "Retirada",
};

export const ESTADOS_PRUEBA = [
    "proxima",
    "abierta",
    "cerrada",
    "en_curso",
    "finalizada",
] as const;
export type EstadoPrueba = (typeof ESTADOS_PRUEBA)[number];

export const ETIQUETAS_ESTADO_PRUEBA: Record<EstadoPrueba, string> = {
    proxima: "Próximamente",
    abierta: "Inscripciones abiertas",
    cerrada: "Inscripciones cerradas",
    en_curso: "En curso",
    finalizada: "Finalizada",
};

// ---------------------------------------------------------
// REGLAS DEL CIRCUITO
// ---------------------------------------------------------
export const CUPO_POR_DEFECTO = 12;   // parejas por categoría y prueba
export const CUPO_MINIMO = 6;         // mínimo de parejas para celebrar la categoría
export const PRUEBAS_MINIMAS_MASTER = 2; // pruebas del circuito para optar al Máster
export const TOP_MASTER = 6;          // clasificados directos al Máster por categoría
export const VENTANA_RANKING_MESES = 12;

// ---------------------------------------------------------
// MARCA
// ---------------------------------------------------------
export const COLORES = {
    coral: "#F0443A",
    navy: "#0D1B2A",
    sage: "#A7C4A0",
    grisClaro: "#E6E6E6",
    exito: "#16845B",
    advertencia: "#B77912",
    error: "#C73535",
    informacion: "#2767B1",
} as const;

// ---------------------------------------------------------
// TYPE GUARDS (para validar datos que llegan de formularios o de la base de datos)
// ---------------------------------------------------------
export function esCategoria(valor: string): valor is Categoria {
    return (CATEGORIAS as readonly string[]).includes(valor);
}

export function esCuadro(valor: string): valor is Cuadro {
    return (CUADROS as readonly string[]).includes(valor);
}

export function esRonda(valor: string): valor is Ronda {
    return (RONDAS as readonly string[]).includes(valor);
}