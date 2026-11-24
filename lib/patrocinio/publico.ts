import {
    CATEGORIAS,
    type Categoria,
    type Cuadro,
    type EstadoPrueba,
} from "@/lib/constantes";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

export type PatrocinadorPublico = {
    id: string;
    nombre: string;
    logoUrl: string;
    webUrl: string | null;
    tipo: "institucional" | "comercial";
};

export type PremioPublico = {
    id: string;
    categoria: Categoria;
    cuadro: Cuadro;
    revelado: boolean;
    revelaEl: string | null;
    descripcion: string | null; // null mientras el premio está bloqueado
};

export type PruebaSelector = {
    id: string;
    slug: string;
    nombre: string;
    estado: EstadoPrueba;
    fechaInicio: string;
};

export type HistoricoPatrocinador = {
    prueba: PruebaSelector;
    patrocinadores: PatrocinadorPublico[];
};

type PatrocinadorFila = {
    id: string;
    nombre: string;
    logo_url: string;
    web_url: string | null;
    tipo: "institucional" | "comercial";
};

export async function listarPruebasSelector(): Promise<PruebaSelector[]> {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from("pruebas")
        .select("id, slug, nombre, estado, fecha_inicio")
        .order("fecha_inicio", { ascending: true });
    if (error) throw new Error(error.message);

    return ((data ?? []) as { id: string; slug: string; nombre: string; estado: EstadoPrueba; fecha_inicio: string }[]).map(
        (p) => ({
            id: p.id,
            slug: p.slug,
            nombre: p.nombre,
            estado: p.estado,
            fechaInicio: p.fecha_inicio,
        })
    );
}

// La prueba pedida; si no hay ninguna, la primera que no ha terminado; si todas han terminado, la última.
export function elegirPrueba(pruebas: PruebaSelector[], slug?: string): PruebaSelector | null {
    if (pruebas.length === 0) return null;
    const pedida = slug ? pruebas.find((p) => p.slug === slug) : undefined;
    if (pedida) return pedida;
    return pruebas.find((p) => p.estado !== "finalizada") ?? pruebas[pruebas.length - 1];
}

function aPatrocinador(p: PatrocinadorFila): PatrocinadorPublico {
    return {
        id: p.id,
        nombre: p.nombre,
        logoUrl: p.logo_url,
        webUrl: p.web_url,
        tipo: p.tipo,
    };
}

export async function patrocinadoresDePrueba(pruebaId: string): Promise<PatrocinadorPublico[]> {
    const supabase = await crearClienteServidor();

    const { data: enlaces, error: errorEnlaces } = await supabase
        .from("prueba_patrocinadores")
        .select("patrocinador_id")
        .eq("prueba_id", pruebaId);
    if (errorEnlaces) throw new Error(errorEnlaces.message);

    const ids = (enlaces ?? []).map((e: { patrocinador_id: string }) => e.patrocinador_id);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
        .from("patrocinadores")
        .select("id, nombre, logo_url, web_url, tipo")
        .in("id", ids)
        .eq("activo", true)
        .order("nombre", { ascending: true });
    if (error) throw new Error(error.message);

    return ((data ?? []) as PatrocinadorFila[]).map(aPatrocinador);
}

// Histórico: cada prueba con sus patrocinadores, de la más reciente a la más antigua.
export async function historicoPatrocinadores(): Promise<HistoricoPatrocinador[]> {
    const supabase = await crearClienteServidor();
    const admin = crearClienteAdmin();
    const pruebas = await listarPruebasSelector();

    const [{ data: enlaces, error: errorEnlaces }, { data: patros, error: errorPatros }] =
        await Promise.all([
            supabase.from("prueba_patrocinadores").select("prueba_id, patrocinador_id"),
            admin
                .from("patrocinadores")
                .select("id, nombre, logo_url, web_url, tipo")
                .eq("activo", true),
        ]);
    if (errorEnlaces) throw new Error(errorEnlaces.message);
    if (errorPatros) throw new Error(errorPatros.message);

    const porId = new Map(((patros ?? []) as PatrocinadorFila[]).map((p) => [p.id, aPatrocinador(p)]));

    const porPrueba = new Map<string, PatrocinadorPublico[]>();
    for (const e of (enlaces ?? []) as { prueba_id: string; patrocinador_id: string }[]) {
        const p = porId.get(e.patrocinador_id);
        if (!p) continue;
        const lista = porPrueba.get(e.prueba_id) ?? [];
        lista.push(p);
        porPrueba.set(e.prueba_id, lista);
    }

    return pruebas
        .filter((p) => (porPrueba.get(p.id) ?? []).length > 0)
        .reverse()
        .map((p) => ({ prueba: p, patrocinadores: porPrueba.get(p.id) ?? [] }));
}

// Premios públicos: solo el cuadro Oro entrega premios a campeones y subcampeones.
export async function premiosDePruebas(
    pruebaIds: string[]
): Promise<Record<string, PremioPublico[]>> {
    if (pruebaIds.length === 0) return {};

    const admin = crearClienteAdmin();

    const { data, error } = await admin
        .from("premios")
        .select("id, prueba_id, categoria, cuadro, descripcion, revelar_at")
        .in("prueba_id", pruebaIds)
        .eq("cuadro", "oro");
    if (error) throw new Error(error.message);

    const ahora = Date.now();
    const porPrueba: Record<string, PremioPublico[]> = {};
    for (const id of pruebaIds) porPrueba[id] = [];

    for (const p of (data ?? []) as {
        id: string;
        prueba_id: string;
        categoria: Categoria;
        cuadro: Cuadro;
        descripcion: string;
        revelar_at: string | null;
    }[]) {
        const revelado = !p.revelar_at || Date.parse(p.revelar_at) <= ahora;
        const premios = porPrueba[p.prueba_id];
        if (!premios) throw new Error(`Premio asociado a una prueba no solicitada: ${p.prueba_id}`);
        premios.push({
            id: p.id,
            categoria: p.categoria,
            cuadro: p.cuadro,
            revelado,
            revelaEl: p.revelar_at,
            descripcion: revelado ? p.descripcion : null,
        });
    }

    for (const premios of Object.values(porPrueba)) {
        premios.sort((a, b) => CATEGORIAS.indexOf(a.categoria) - CATEGORIAS.indexOf(b.categoria));
    }

    return porPrueba;
}

export async function premiosDePrueba(pruebaId: string): Promise<PremioPublico[]> {
    const premiosPorPrueba = await premiosDePruebas([pruebaId]);
    return premiosPorPrueba[pruebaId] ?? [];
}
