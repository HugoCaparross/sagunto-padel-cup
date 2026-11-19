"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { crearNoticia, editarNoticia, type NoticiaAdmin } from "@/actions/noticias";
import { slugificar } from "@/lib/formato";
import {
    CATEGORIAS_NOTICIA,
    ETIQUETAS_NOTICIA,
    type CategoriaNoticia,
} from "@/lib/validadores/noticias";

type Props = { inicial?: NoticiaAdmin };

const CAMPO = "rounded-md border border-[#D5D9DC] bg-white px-3 py-2 text-sm";

export default function FormularioNoticia({ inicial }: Props) {
    const router = useRouter();
    const [pendiente, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const [titulo, setTitulo] = useState(inicial?.titulo ?? "");
    const [slug, setSlug] = useState(inicial?.slug ?? "");
    // En creación el slug sigue al título hasta que el organizador lo toca
    const [slugTocado, setSlugTocado] = useState(Boolean(inicial));

    const slugCambiado = Boolean(inicial) && slug !== inicial?.slug;

    function alCambiarTitulo(valor: string) {
        setTitulo(valor);
        if (!slugTocado) setSlug(slugificar(valor));
    }

    function enviar(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);

        const comunes = {
            titulo: String(f.get("titulo") ?? ""),
            resumen: String(f.get("resumen") ?? ""),
            contenido: String(f.get("contenido") ?? ""),
            categoria: String(f.get("categoria") ?? "general") as CategoriaNoticia,
            imagenUrl: String(f.get("imagenUrl") ?? "").trim() || null,
        };
        const slugForm = String(f.get("slug") ?? "").trim();

        setError(null);
        startTransition(async () => {
            const res = inicial
                ? await editarNoticia({ id: inicial.id, slug: slugForm, ...comunes })
                : await crearNoticia({
                    ...comunes,
                    slug: slugForm || undefined,
                    publicar: f.get("publicar") === "on",
                });

            if (res.ok) {
                router.push("/admin/contenido");
            } else {
                setError(res.error);
            }
        });
    }

    return (
        <form onSubmit={enviar} className="space-y-5 rounded-xl bg-white p-6 ring-1 ring-[#D5D9DC]">
            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[#68737D]">Título</span>
                <input
                    name="titulo"
                    value={titulo}
                    onChange={(e) => alCambiarTitulo(e.target.value)}
                    required
                    minLength={5}
                    maxLength={140}
                    className={CAMPO}
                />
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[#68737D]">
                    Slug (parte final de la URL)
                    {!inicial && " · se genera del título si lo dejas vacío"}
                </span>
                <input
                    name="slug"
                    value={slug}
                    onChange={(e) => {
                        setSlugTocado(true);
                        setSlug(e.target.value);
                    }}
                    maxLength={120}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    className={CAMPO}
                />
                {slugCambiado && (
                    <span className="text-xs text-[#B77912]">
                        Si cambias el slug, la dirección anterior dejará de funcionar.
                    </span>
                )}
            </label>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[#68737D]">Resumen (aparece en el listado)</span>
                <textarea
                    name="resumen"
                    defaultValue={inicial?.resumen ?? ""}
                    required
                    minLength={10}
                    maxLength={300}
                    rows={2}
                    className={CAMPO}
                />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Categoría</span>
                    <select name="categoria" defaultValue={inicial?.categoria ?? "general"} className={CAMPO}>
                        {CATEGORIAS_NOTICIA.map((c) => (
                            <option key={c} value={c}>
                                {ETIQUETAS_NOTICIA[c]}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    <span className="text-[#68737D]">Imagen (URL, opcional)</span>
                    <input
                        name="imagenUrl"
                        type="url"
                        defaultValue={inicial?.imagenUrl ?? ""}
                        maxLength={500}
                        className={CAMPO}
                    />
                </label>
            </div>

            <label className="flex flex-col gap-1 text-sm">
                <span className="text-[#68737D]">
                    Contenido · usa ## para títulos, - para listas y una línea en blanco entre párrafos
                </span>
                <textarea
                    name="contenido"
                    defaultValue={inicial?.contenido ?? ""}
                    required
                    minLength={20}
                    maxLength={50000}
                    rows={16}
                    className={`${CAMPO} font-mono`}
                />
            </label>

            {!inicial && (
                <label className="flex items-center gap-2 text-sm">
                    <input name="publicar" type="checkbox" />
                    Publicar al guardar (si no, queda como borrador)
                </label>
            )}

            {inicial && (
                <p className="text-xs text-[#68737D]">
                    Para publicar o pasar a borrador, usa el listado de noticias.
                </p>
            )}

            {error && <p className="rounded-lg bg-[#FDECEC] p-3 text-sm text-[#C73535]">{error}</p>}

            <button
                type="submit"
                disabled={pendiente}
                className="rounded-lg bg-[#F0443A] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
                {pendiente ? "Guardando…" : inicial ? "Guardar cambios" : "Crear noticia"}
            </button>
        </form>
    );
}