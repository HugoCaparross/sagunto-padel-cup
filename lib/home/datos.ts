import { CATEGORIAS, type Categoria, type EstadoPrueba } from "@/lib/constantes";
import { calcularRanking } from "@/lib/ranking/calcular";
import { cargarDatosRanking, hoyEnMadrid } from "@/lib/ranking/cargar";
import { crearClienteServidor } from "@/lib/supabase/server";

export type PruebaHome = {
    id: string;
    slug: string;
    nombre: string;
    estado: EstadoPrueba;
    fechaInicio: string;
    fechaFin: string;
    sede: string;
    precioCentimos: number;
    esMaster: boolean;
    categorias: Categoria[];
    plazasLibres: number;
    plazasMaximas: number;
    href?: string;
};

export type FilaTop = {
    posicion: number;
    nombre: string;
    puntos: number;
    pruebasJugadas: number;
};

export type Cifras = {
    jugadores: number;
    parejas: number;
    pruebas: number;
    categorias: number;
};

export type DatosHome = {
    temporada: string | null;
    proxima: PruebaHome | null;
    calendario: PruebaHome[];
    ranking: Record<Categoria, FilaTop[]>;
    cifras: Cifras;
};

type PruebaFila = {
    id: string;
    slug: string;
    nombre: string;
    estado: EstadoPrueba;
    fecha_inicio: string;
    fecha_fin: string;
    sede: string;
    precio_pareja_centimos: number;
    plazas_maximas: number;
    es_master: boolean;
};

export async function cargarDatosHome(): Promise<DatosHome> {
    const supabase = await crearClienteServidor();
    const hoy = hoyEnMadrid();

    const [{ data: temp }, { data: pruebasData }, { data: catsData }, { data: ocupData }] =
        await Promise.all([
            supabase.from("temporadas").select("anio").eq("activa", true).maybeSingle(),
            supabase
                .from("pruebas")
                .select(
                    "id, slug, nombre, estado, fecha_inicio, fecha_fin, sede, precio_pareja_centimos, plazas_maximas, es_master"
                )
                .order("fecha_inicio", { ascending: true }),
            supabase.from("prueba_categorias").select("prueba_id, categoria"),
            supabase.from("v_ocupacion").select("prueba_id, ocupadas"),
        ]);

    const categoriasDe = new Map<string, Categoria[]>();
    for (const c of (catsData ?? []) as { prueba_id: string; categoria: Categoria }[]) {
        const lista = categoriasDe.get(c.prueba_id) ?? [];
        lista.push(c.categoria);
        categoriasDe.set(c.prueba_id, lista);
    }

    const ocupadasDe = new Map<string, number>();
    for (const o of (ocupData ?? []) as { prueba_id: string; ocupadas: number }[]) {
        ocupadasDe.set(o.prueba_id, (ocupadasDe.get(o.prueba_id) ?? 0) + o.ocupadas);
    }

    const calendario: PruebaHome[] = ((pruebasData ?? []) as PruebaFila[]).map((p) => {
        const ocupadas = ocupadasDe.get(p.id) ?? 0;
        return {
            id: p.id,
            slug: p.slug,
            nombre: p.nombre,
            estado: p.estado,
            fechaInicio: p.fecha_inicio,
            fechaFin: p.fecha_fin,
            sede: p.sede,
            precioCentimos: p.precio_pareja_centimos,
            esMaster: p.es_master,
            categorias: CATEGORIAS.filter((c) => (categoriasDe.get(p.id) ?? []).includes(c)),
            plazasLibres: Math.max(0, p.plazas_maximas - ocupadas),
            plazasMaximas: p.plazas_maximas,
        };
    });

    const proxima =
        calendario.find((p) => p.estado !== "finalizada" && p.fechaFin >= hoy) ?? null;

    const datos = await cargarDatosRanking();
    const ranking = {} as Record<Categoria, FilaTop[]>;

    for (const categoria of CATEGORIAS) {
        ranking[categoria] = calcularRanking({
            categoria,
            referencia: hoy,
            puntos: datos.puntos,
            partidos: datos.partidos,
        })
            .slice(0, 5)
            .map((f) => {
                const perfil = datos.perfiles.get(f.clave);
                return {
                    posicion: f.posicion,
                    nombre: perfil?.visible ? perfil.nombre || "Jugador" : "Jugador privado",
                    puntos: f.puntos,
                    pruebasJugadas: f.pruebasJugadas,
                };
            });
    }

    const jugadoresActivos = new Set([
        ...datos.puntos.map((p) => p.clave),
        ...datos.partidos.map((p) => p.clave),
    ]).size;

    return {
        temporada: (temp as { anio: string } | null)?.anio ?? null,
        proxima,
        calendario,
        ranking,
        cifras: {
            jugadores: jugadoresActivos,
            parejas: [...ocupadasDe.values()].reduce((total, ocupadas) => total + ocupadas, 0),
            pruebas: calendario.length,
            categorias: CATEGORIAS.length,
        },
    };
}