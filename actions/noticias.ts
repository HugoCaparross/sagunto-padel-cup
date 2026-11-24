"use server";

import { revalidatePath } from "next/cache";
import { exigirOrganizador } from "@/lib/auth/organizador";
import { registrarAuditoria } from "@/lib/auditoria";
import { slugificar } from "@/lib/formato";
import {
    esquemaCrearNoticia,
    esquemaEditarNoticia,
    esquemaEliminarNoticia,
    esquemaPublicacion,
    esquemaSlug,
    type CategoriaNoticia,
} from "@/lib/validadores/noticias";
import { crearClienteAdmin, crearClienteServidor } from "@/lib/supabase/server";

export type AccionNoticia =
    | { ok: true; id?: string; slug?: string }
    | { ok: false; error: string };

export type NoticiaPublica = {
    id: string;
    slug: string;
    titulo: string;
    resumen: string;
    contenido: string;
    categoria: CategoriaNoticia;
    imagenUrl: string | null;
    publicadaAt: string | null;
};

export type NoticiaAdmin = NoticiaPublica & {
    publicada: boolean;
    actualizadaAt: string;
};

type Fila = {
    id: string;
    slug: string;
    titulo: string;
    resumen: string;
    contenido: string;
    categoria: CategoriaNoticia;
    imagen_url: string | null;
    publicada: boolean;
    publicada_at: string | null;
    updated_at: string;
};

const COLUMNAS =
    "id, slug, titulo, resumen, contenido, categoria, imagen_url, publicada, publicada_at, updated_at";

const DUPLICADO = "Ya existe una noticia con ese slug";

function aPublica(f: Fila): NoticiaPublica {
    return {
        id: f.id,
        slug: f.slug,
        titulo: f.titulo,
        resumen: f.resumen,
        contenido: f.contenido,
        categoria: f.categoria,
        imagenUrl: f.imagen_url,
        publicadaAt: f.publicada_at,
    };
}

function aAdmin(f: Fila): NoticiaAdmin {
    return { ...aPublica(f), publicada: f.publicada, actualizadaAt: f.updated_at };
}

function errorBD(e: { code?: string; message: string }): string {
    return e.code === "23505" ? DUPLICADO : e.message;
}

function refrescar(slugs: (string | undefined)[]) {
    revalidatePath("/noticias");
    revalidatePath("/");
    for (const s of slugs) {
        if (s) revalidatePath(`/noticias/${s}`);
    }
    revalidatePath("/admin/contenido");
}

// ---------------------------------------------------------
// LECTURA PÚBLICA
// ---------------------------------------------------------
export async function listarNoticias(
    opciones: { categoria?: CategoriaNoticia; limite?: number } = {}
): Promise<NoticiaPublica[]> {
    const supabase = await crearClienteServidor();
    const base = supabase
        .from("noticias")
        .select(COLUMNAS)
        .eq("publicada", true)
        .order("publicada_at", { ascending: false })
        .limit(opciones.limite ?? 20);

    const { data, error } = opciones.categoria
        ? await base.eq("categoria", opciones.categoria)
        : await base;

    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Fila[]).map(aPublica);
}

export async function obtenerNoticia(slug: string): Promise<NoticiaPublica | null> {
    const parseo = esquemaSlug.safeParse({ slug });
    if (!parseo.success) return null;

    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
        .from("noticias")
        .select(COLUMNAS)
        .eq("slug", parseo.data.slug)
        .eq("publicada", true)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? aPublica(data as unknown as Fila) : null;
}

// ---------------------------------------------------------
// LECTURA DEL ORGANIZADOR (incluye borradores)
// ---------------------------------------------------------
export async function listarNoticiasAdmin(): Promise<
    { ok: true; noticias: NoticiaAdmin[] } | { ok: false; error: string }
> {
    try {
        if (!(await exigirOrganizador())) return { ok: false, error: "No autorizado" };

        const supabase = await crearClienteServidor();
        const { data, error } = await supabase
            .from("noticias")
            .select(COLUMNAS)
            .order("updated_at", { ascending: false });
        if (error) return { ok: false, error: error.message };

        return {
            ok: true,
            noticias: ((data ?? []) as unknown as Fila[]).map(aAdmin),
        };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 1. Crear noticia (borrador o publicada)
// ---------------------------------------------------------
export async function crearNoticia(entrada: unknown): Promise<AccionNoticia> {
    try {
        const parseo = esquemaCrearNoticia.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };

        const slug = d.slug ?? slugificar(d.titulo);
        if (!slug) return { ok: false, error: "No se pudo generar un slug con ese título" };

        const admin = crearClienteAdmin();
        const ahora = new Date().toISOString();

        const { data, error } = await admin
            .from("noticias")
            .insert({
                slug,
                titulo: d.titulo,
                resumen: d.resumen,
                contenido: d.contenido,
                categoria: d.categoria,
                imagen_url: d.imagenUrl ?? null,
                publicada: d.publicar,
                publicada_at: d.publicar ? ahora : null,
                autor_id: usuarioId,
            })
            .select("id")
            .single();
        if (error) return { ok: false, error: errorBD(error) };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "crear_noticia",
            tabla: "noticias",
            registroId: data.id,
            despues: { slug, titulo: d.titulo, publicada: d.publicar },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        refrescar([slug]);
        return { ok: true, id: data.id, slug };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 2. Editar noticia
// Cambiar el slug cambia la URL; el panel lo avisa antes de guardar.
// ---------------------------------------------------------
export async function editarNoticia(entrada: unknown): Promise<AccionNoticia> {
    try {
        const parseo = esquemaEditarNoticia.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const d = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: previa, error: errorPrevia } = await admin
            .from("noticias")
            .select("slug, titulo, categoria, publicada")
            .eq("id", d.id)
            .single();
        if (errorPrevia || !previa) return { ok: false, error: "Noticia no encontrada" };

        const { error } = await admin
            .from("noticias")
            .update({
                slug: d.slug,
                titulo: d.titulo,
                resumen: d.resumen,
                contenido: d.contenido,
                categoria: d.categoria,
                imagen_url: d.imagenUrl ?? null,
            })
            .eq("id", d.id);
        if (error) return { ok: false, error: errorBD(error) };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "editar_noticia",
            tabla: "noticias",
            registroId: d.id,
            antes: previa,
            despues: { slug: d.slug, titulo: d.titulo, categoria: d.categoria },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        refrescar([previa.slug, d.slug]);
        return { ok: true, id: d.id, slug: d.slug };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 3. Publicar o pasar a borrador
// La fecha de publicación es la primera vez que se publicó; despublicar no la borra.
// ---------------------------------------------------------
export async function cambiarPublicacion(entrada: unknown): Promise<AccionNoticia> {
    try {
        const parseo = esquemaPublicacion.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { id, publicada } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: previa, error: errorPrevia } = await admin
            .from("noticias")
            .select("slug, publicada, publicada_at")
            .eq("id", id)
            .single();
        if (errorPrevia || !previa) return { ok: false, error: "Noticia no encontrada" };

        const { error } = await admin
            .from("noticias")
            .update({
                publicada,
                publicada_at: publicada
                    ? (previa.publicada_at ?? new Date().toISOString())
                    : previa.publicada_at,
            })
            .eq("id", id);
        if (error) return { ok: false, error: error.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: publicada ? "publicar_noticia" : "despublicar_noticia",
            tabla: "noticias",
            registroId: id,
            antes: { publicada: previa.publicada },
            despues: { publicada },
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        refrescar([previa.slug]);
        return { ok: true, id, slug: previa.slug };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}

// ---------------------------------------------------------
// 4. Eliminar noticia (exige motivo, queda en auditoría)
// ---------------------------------------------------------
export async function eliminarNoticia(entrada: unknown): Promise<AccionNoticia> {
    try {
        const parseo = esquemaEliminarNoticia.safeParse(entrada);
        if (!parseo.success) return { ok: false, error: parseo.error.issues[0].message };
        const { id, motivo } = parseo.data;

        const usuarioId = await exigirOrganizador();
        if (!usuarioId) return { ok: false, error: "No autorizado" };
        const admin = crearClienteAdmin();

        const { data: previa, error: errorPrevia } = await admin
            .from("noticias")
            .select("slug, titulo")
            .eq("id", id)
            .single();
        if (errorPrevia || !previa) return { ok: false, error: "Noticia no encontrada" };

        const { error } = await admin.from("noticias").delete().eq("id", id);
        if (error) return { ok: false, error: error.message };

        const errorAuditoria = await registrarAuditoria({
            usuarioId,
            accion: "eliminar_noticia",
            tabla: "noticias",
            registroId: id,
            antes: previa,
            motivo,
        });
        if (errorAuditoria) return { ok: false, error: errorAuditoria };

        refrescar([previa.slug]);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "Error inesperado" };
    }
}
