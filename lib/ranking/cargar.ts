
import { esCategoria, esRonda, type Categoria } from "@/lib/constantes";
import { crearClienteAdmin } from "@/lib/supabase/server";
import { fotoPublicable } from "@/lib/jugadores/fotos-publicas";
import {
    calcularRanking,
    type FilaRanking,
    type RegistroPartido,
    type RegistroPuntos,
} from "@/lib/ranking/calcular";

// Ranking público: cada fila es un jugador.
// Si el jugador no tiene visibilidad pública, el nombre queda oculto.
export type FilaRankingPublico = FilaRanking & {
    nombre: string;
    visible: boolean;
};

type FilaPrueba = {
    id: string;
    fecha_fin: string;
    es_master: boolean;
};

type FilaInscripcion = {
    id: string;
    jugador_1: string;
    jugador_2: string | null;
};

type FilaPerfil = {
    id: string;
    nombre: string;
    visibilidad_publica: boolean;
};

type FilaFotoPerfil = {
    id: string;
    foto_perfil_path: string | null;
    visibilidad_publica: boolean;
    consentimiento_imagen: boolean;
};

type FilaPuntos = {
    jugador_id: string;
    prueba_id: string;
    categoria: string;
    ronda: string;
    puntos: number;
    fecha: string;
};

type FilaPartido = {
    prueba_id: string;
    categoria: string;
    inscripcion_a: string | null;
    inscripcion_b: string | null;
    ganador_id: string | null;
};

export type DatosRanking = {
    puntos: RegistroPuntos[];
    partidos: RegistroPartido[];
    perfiles: Map<
        string,
        {
            nombre: string;
            visible: boolean;
            fotoPath: string | null;
        }
    >;
};

function leer<T>(
    nombre: string,
    resultado: {
        data: unknown[] | null;
        error: { message: string } | null;
    }
): T[] {
    if (resultado.error) {
        throw new Error(
            `Error leyendo ${nombre}: ${resultado.error.message}`
        );
    }

    return (resultado.data ?? []) as T[];
}

// Lee las tablas del circuito y devuelve los registros por jugador.
// El Máster Final no computa para el ranking de temporada salvo que se pida.
export async function cargarDatosRanking(
    opciones: { incluirMaster?: boolean } = {}
): Promise<DatosRanking> {
    const { incluirMaster = false } = opciones;
    const supabase = crearClienteAdmin();

    const pruebas = new Map<string, FilaPrueba>();

    for (const p of leer<FilaPrueba>(
        "pruebas",
        await supabase
            .from("pruebas")
            .select("id, fecha_fin, es_master")
    )) {
        if (incluirMaster || !p.es_master) {
            pruebas.set(p.id, p);
        }
    }

    // Inscripción -> jugadores que la forman.
    const jugadoresDeInscripcion = new Map<string, string[]>();

    for (const i of leer<FilaInscripcion>(
        "inscripciones",
        await supabase
            .from("inscripciones")
            .select("id, jugador_1, jugador_2")
    )) {
        const jugadores = i.jugador_2
            ? [i.jugador_1, i.jugador_2]
            : [i.jugador_1];

        jugadoresDeInscripcion.set(i.id, jugadores);
    }

    // Perfiles de jugadores.
    // No se consulta slug porque no existe en la tabla perfiles.
    const filasPerfiles = leer<FilaPerfil>(
        "perfiles",
        await supabase
            .from("perfiles")
            .select("id, nombre, visibilidad_publica")
    );

    // Fotografías de perfil.
    const { data: fotosData, error: errorFotos } = await supabase
        .from("perfiles")
        .select(
            "id, foto_perfil_path, visibilidad_publica, consentimiento_imagen"
        );

    if (errorFotos?.code === "42703") {
        console.warn(
            "[ranking] Falta la columna perfiles.foto_perfil_path; aplica la migración de fotos de perfil."
        );
    } else if (errorFotos) {
        throw new Error(
            `Error leyendo fotos de perfil: ${errorFotos.message}`
        );
    }

    const rutasFotos = new Map(
        ((fotosData ?? []) as FilaFotoPerfil[]).map((fila) => [
            fila.id,
            fila,
        ])
    );

    const perfiles = new Map<
        string,
        {
            nombre: string;
            visible: boolean;
            fotoPath: string | null;
        }
    >();

    for (const p of filasPerfiles) {
        perfiles.set(p.id, {
            nombre: p.nombre,
            visible: p.visibilidad_publica,
            fotoPath: fotoPublicable({
                ...(rutasFotos.get(p.id) ?? {
                    foto_perfil_path: null,
                    visibilidad_publica: false,
                    consentimiento_imagen: false,
                }),
            }),
        });
    }

    // Puntos: ya vienen por jugador desde puntos_prueba.
    const puntos: RegistroPuntos[] = [];

    for (const f of leer<FilaPuntos>(
        "puntos_prueba",
        await supabase
            .from("puntos_prueba")
            .select(
                "jugador_id, prueba_id, categoria, ronda, puntos, fecha"
            )
    )) {
        if (!pruebas.has(f.prueba_id)) continue;
        if (!esCategoria(f.categoria) || !esRonda(f.ronda)) continue;

        puntos.push({
            clave: f.jugador_id,
            pruebaId: f.prueba_id,
            fecha: f.fecha,
            categoria: f.categoria,
            ronda: f.ronda,
            puntos: f.puntos,
        });
    }

    // Partidos jugados: cada jugador de la pareja ganadora suma una victoria,
    // cada jugador de la perdedora suma una derrota.
    const partidos: RegistroPartido[] = [];

    for (const p of leer<FilaPartido>(
        "partidos",
        await supabase
            .from("partidos")
            .select(
                "prueba_id, categoria, inscripcion_a, inscripcion_b, ganador_id"
            )
            .not("ganador_id", "is", null)
    )) {
        const prueba = pruebas.get(p.prueba_id);

        if (!prueba || !esCategoria(p.categoria)) continue;

        const categoria: Categoria = p.categoria;

        for (const inscripcion of [
            p.inscripcion_a,
            p.inscripcion_b,
        ]) {
            if (!inscripcion) continue;

            const ganado = p.ganador_id === inscripcion;

            for (const jugador of
                jugadoresDeInscripcion.get(inscripcion) ?? []) {
                partidos.push({
                    clave: jugador,
                    fecha: prueba.fecha_fin,
                    categoria,
                    ganado,
                });
            }
        }
    }

    return {
        puntos,
        partidos,
        perfiles,
    };
}

// Fecha de hoy en Europe/Madrid, formato yyyy-mm-dd.
export function hoyEnMadrid(): string {
    return new Date().toLocaleDateString("sv-SE", {
        timeZone: "Europe/Madrid",
    });
}

// Ranking público de una categoría.
// Cada fila representa a un jugador individual.
export async function obtenerRanking(
    categoria: Categoria,
    referencia: string = hoyEnMadrid()
): Promise<FilaRankingPublico[]> {
    const { puntos, partidos, perfiles } = await cargarDatosRanking();

    const filas = calcularRanking({
        categoria,
        referencia,
        puntos,
        partidos,
    });

    return filas.map((fila) => {
        const perfil = perfiles.get(fila.clave);
        const visible = perfil?.visible ?? false;

        return {
            ...fila,
            nombre:
                visible && perfil
                    ? perfil.nombre
                    : "Jugador privado",
            visible,
        };
    });
}
