import type { NoticiaPublica } from "@/actions/noticias";
import { CATEGORIAS, type Categoria, type EstadoPrueba } from "@/lib/constantes";
import type { FilaTop, PruebaHome } from "@/lib/home/datos";
import type { PremioPublico } from "@/lib/patrocinio/publico";
import type { PartidoPublico } from "@/lib/pruebas/publico";

export const PRUEBA_DEMO: PruebaHome = {
    id: "demo-prueba-invierno",
    slug: "demo-prueba-invierno",
    nombre: "Torneo de Invierno Sagunto",
    estado: "abierta",
    fechaInicio: "2027-01-23",
    fechaFin: "2027-01-24",
    sede: "Club Padel Sagunto",
    precioCentimos: 4000,
    esMaster: false,
    categorias: [...CATEGORIAS],
    plazasLibres: 12,
    plazasMaximas: 24,
    href: "/calendario",
};

function pruebaDemo(
    id: string,
    nombre: string,
    estado: EstadoPrueba,
    fechaInicio: string,
    fechaFin: string,
    esMaster = false
): PruebaHome {
    return {
        ...PRUEBA_DEMO,
        id,
        slug: id,
        nombre,
        estado,
        fechaInicio,
        fechaFin,
        esMaster,
        href: "/calendario",
    };
}

export const PRUEBAS_DEMO: PruebaHome[] = [
    PRUEBA_DEMO,
    pruebaDemo("demo-torneo-primavera", "Torneo de Primavera", "proxima", "2027-03-20", "2027-03-21"),
    pruebaDemo("demo-master-final", "Master Final", "proxima", "2027-06-19", "2027-06-20", true),
];

function filasDemo(nombres: string[], puntosBase: number): FilaTop[] {
    return nombres.map((nombre, index) => ({
        jugadorId: `demo-${puntosBase}-${index}`,
        posicion: index + 1,
        nombre,
        puntos: puntosBase - index * 120,
        pruebasJugadas: Math.max(2, 5 - Math.floor(index / 2)),
        partidos: 12 - index,
        victorias: 9 - index,
        porcentajeVictorias: Math.round(((9 - index) / (12 - index)) * 1000) / 10,
        fotoUrl: index % 2 === 0 ? "/images/padel-woman.jpg" : "/images/padel-player.jpg",
    }));
}

export const RANKING_DEMO: Record<Categoria, FilaTop[]> = {
    primera: filasDemo(["Marina Beltrán", "Pablo Ferrer", "Nora Vidal", "Leo Pons", "Clara Esteve"], 1840),
    segunda: filasDemo(["Lucía Mar", "Hugo Costa", "Marta Ríos", "Álex Navarro", "Irene Soler"], 1560),
    tercera: filasDemo(["Carla Gil", "Dani Serra", "Noa Martí", "Pol Torres", "Eva Blasco"], 1280),
    cuarta: filasDemo(["Aina López", "Marc Sanz", "Lola Pérez", "Eric Vidal", "Cris Molina"], 960),
};

export const RANKING_GENERAL_DEMO: FilaTop[] = Object.values(RANKING_DEMO)
    .flat()
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 5)
    .map((fila, index) => ({ ...fila, posicion: index + 1 }));

export const PREMIOS_DEMO: PremioPublico[] = CATEGORIAS.map((categoria, index) => ({
    id: `demo-premio-${categoria}`,
    categoria,
    cuadro: "oro",
    revelado: true,
    revelaEl: null,
    descripcion: [
        "Pala de competición para la pareja campeona",
        "Paletero oficial y accesorios",
        "Pack de material deportivo",
        "Vale para equipamiento de pádel",
    ][index],
}));

export const NOTICIAS_DEMO: (NoticiaPublica & { href: string })[] = [
    {
        id: "demo-noticia-temporada",
        slug: "demo-temporada",
        titulo: "La temporada entra en juego con nuevas pruebas",
        resumen: "Conoce las próximas fechas del circuito.",
        contenido: "Contenido de demostración para visualizar las noticias del circuito.",
        categoria: "circuito",
        imagenUrl: "/images/padel-player.jpg",
        publicadaAt: "2026-11-18",
        href: "/noticias",
    },
    {
        id: "demo-noticia-inscripciones",
        slug: "demo-inscripciones",
        titulo: "Abiertas las inscripciones del Torneo de Invierno",
        resumen: "Elige categoría y prepara tu pareja.",
        contenido: "Contenido de demostración para visualizar las noticias del circuito.",
        categoria: "inscripciones",
        imagenUrl: "/images/padel-woman.jpg",
        publicadaAt: "2026-11-12",
        href: "/noticias",
    },
    {
        id: "demo-noticia-ranking",
        slug: "demo-ranking",
        titulo: "Cada partido suma en la carrera al Master Final",
        resumen: "Repasa cómo funciona el ranking individual.",
        contenido: "Contenido de demostración para visualizar las noticias del circuito.",
        categoria: "resultados",
        imagenUrl: "/images/padel-court.jpg",
        publicadaAt: "2026-11-05",
        href: "/noticias",
    },
];

const partidosDemo: (PartidoPublico & { resultado: string })[] = [
    {
        id: "demo-partido-uno",
        categoria: "primera",
        fase: "eliminatoria",
        cuadro: "oro",
        grupo: null,
        ronda: "final",
        ladoA: "Marina Beltrán / Pablo Ferrer",
        ladoB: "Nora Vidal / Leo Pons",
        resultado: "6-4 × 6-3",
        pista: 1,
        fecha: "2026-10-12",
        hora: "18:30",
    },
    {
        id: "demo-partido-dos",
        categoria: "segunda",
        fase: "eliminatoria",
        cuadro: "oro",
        grupo: null,
        ronda: "semifinal",
        ladoA: "Lucía Mar / Hugo Costa",
        ladoB: "Marta Ríos / Álex Navarro",
        resultado: "6-2 × 4-6 × 6-4",
        pista: 2,
        fecha: "2026-10-11",
        hora: "17:00",
    },
    {
        id: "demo-partido-tres",
        categoria: "tercera",
        fase: "eliminatoria",
        cuadro: "oro",
        grupo: null,
        ronda: "final",
        ladoA: "Carla Gil / Dani Serra",
        ladoB: "Noa Martí / Pol Torres",
        resultado: "7-5 × 6-4",
        pista: 3,
        fecha: "2026-09-21",
        hora: "12:00",
    },
    {
        id: "demo-partido-cuatro",
        categoria: "cuarta",
        fase: "eliminatoria",
        cuadro: "oro",
        grupo: null,
        ronda: "final",
        ladoA: "Aina López / Marc Sanz",
        ladoB: "Lola Pérez / Eric Vidal",
        resultado: "6-3 × 6-1",
        pista: 1,
        fecha: "2026-09-20",
        hora: "11:00",
    },
];

export const RESULTADOS_DEMO = partidosDemo.map((partido) => ({
    pruebaNombre: "Prueba de Otoño",
    pruebaSlug: "demo-resultados",
    href: "/calendario",
    partido,
}));
