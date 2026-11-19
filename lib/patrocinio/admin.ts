import { CATEGORIAS, CUADROS, type Categoria, type Cuadro } from "@/lib/constantes";
import { crearClienteAdmin } from "@/lib/supabase/server";

export type PatrocinadorAdmin = {
    id: string;
    nombre: string;
    logoUrl: string;
    webUrl: string | null;
    tipo: "institucional" | "comercial";
    activo: boolean;
};

export type PremioAdmin = {
    id: string;
    categoria: Categoria;
    cuadro: Cuadro;
    descripcion: string;
    revelarEl: string | null; // yyyy-mm-dd, en horario de Madrid
};

// Todo lo que necesita el panel para una prueba concreta.
export async function cargarPatrociniosAdmin(pruebaId: string): Promise<{
    patrocinadores: PatrocinadorAdmin[];
    asignadas: string[];
    premios: PremioAdmin[];
}> {
    const admin = crearClienteAdmin();

    const [patros, enlaces, premios] = await Promise.all([
        admin
            .from("patrocinadores")
            .select("id, nombre, logo_url, web_url, tipo, activo")
            .order("nombre", { ascending: true }),
        admin.from("prueba_patrocinadores").select("patrocinador_id").eq("prueba_id", pruebaId),
        admin
            .from("premios")
            .select("id, categoria, cuadro, descripcion, revelar_at")
            .eq("prueba_id", pruebaId),
    ]);

    if (patros.error) throw new Error(patros.error.message);
    if (enlaces.error) throw new Error(enlaces.error.message);
    if (premios.error) throw new Error(premios.error.message);

    const patrocinadores = ((patros.data ?? []) as {
        id: string;
        nombre: string;
        logo_url: string;
        web_url: string | null;
        tipo: "institucional" | "comercial";
        activo: boolean;
    }[]).map((p) => ({
        id: p.id,
        nombre: p.nombre,
        logoUrl: p.logo_url,
        webUrl: p.web_url,
        tipo: p.tipo,
        activo: p.activo,
    }));

    const listaPremios = ((premios.data ?? []) as {
        id: string;
        categoria: Categoria;
        cuadro: Cuadro;
        descripcion: string;
        revelar_at: string | null;
    }[])
        .map((p) => ({
            id: p.id,
            categoria: p.categoria,
            cuadro: p.cuadro,
            descripcion: p.descripcion,
            revelarEl: p.revelar_at
                ? new Date(p.revelar_at).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" })
                : null,
        }))
        .sort(
            (a, b) =>
                CATEGORIAS.indexOf(a.categoria) - CATEGORIAS.indexOf(b.categoria) ||
                CUADROS.indexOf(a.cuadro) - CUADROS.indexOf(b.cuadro)
        );

    return {
        patrocinadores,
        asignadas: ((enlaces.data ?? []) as { patrocinador_id: string }[]).map((e) => e.patrocinador_id),
        premios: listaPremios,
    };
}