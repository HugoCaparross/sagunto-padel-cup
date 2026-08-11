// Ruta: src/components/admin/NoticiasManager.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearNoticia,
  togglePublicarNoticia,
  borrarNoticia,
} from "@/app/(admin)/admin/noticias/actions";

type Noticia = {
  id: string;
  titulo: string;
  estado: string;
};

interface NoticiasManagerProps {
  noticiasIniciales: Noticia[];
}

const INITIAL_FORM = {
  titulo: "",
  contenido: "",
  imagen_destacada: "",
  categoria: "",
};

export default function NoticiasManager({
  noticiasIniciales,
}: NoticiasManagerProps) {
  const router = useRouter();

  const [noticias, setNoticias] = useState<Noticia[]>(noticiasIniciales);

  const [form, setForm] = useState(INITIAL_FORM);

  const [enviando, setEnviando] = useState(false);

  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function crear(publicar: boolean) {
    const titulo = form.titulo.trim();
    const contenido = form.contenido.trim();

    if (!titulo) {
      setError("El título es obligatorio.");
      return;
    }

    if (!contenido) {
      setError("El contenido es obligatorio.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const resultado = await crearNoticia({
        ...form,
        titulo,
        contenido,
        imagen_destacada: form.imagen_destacada.trim(),
        publicar,
      });

      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido crear la noticia.");
        return;
      }

      setForm(INITIAL_FORM);
      router.refresh();
    } catch (actionError) {
      console.error("[NoticiasManager] Error creando noticia:", actionError);

      setError("Ha ocurrido un error inesperado al crear la noticia.");
    } finally {
      setEnviando(false);
    }
  }

  async function togglePublicar(id: string, publicar: boolean) {
    const noticia = noticias.find((item) => item.id === id);

    if (!noticia) {
      return;
    }

    setActualizandoId(id);
    setError(null);

    const estadoAnterior = noticia.estado;

    setNoticias((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              estado: publicar ? "publicado" : "borrador",
            }
          : item,
      ),
    );

    try {
      const resultado = await togglePublicarNoticia(id, publicar);

      if (!resultado?.ok) {
        setNoticias((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  estado: estadoAnterior,
                }
              : item,
          ),
        );

        setError(
          resultado?.error ??
            "No se ha podido cambiar el estado de la noticia.",
        );
      }
    } catch (actionError) {
      console.error("[NoticiasManager] Error publicando noticia:", actionError);

      setNoticias((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                estado: estadoAnterior,
              }
            : item,
        ),
      );

      setError("Ha ocurrido un error inesperado al publicar la noticia.");
    } finally {
      setActualizandoId(null);
    }
  }

  async function borrar(id: string) {
    const noticia = noticias.find((item) => item.id === id);

    if (!noticia) {
      return;
    }

    const confirmado = window.confirm(
      `¿Quieres eliminar la noticia "${noticia.titulo}"?`,
    );

    if (!confirmado) {
      return;
    }

    setActualizandoId(id);
    setError(null);

    try {
      const resultado = await borrarNoticia(id);

      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido eliminar la noticia.");
        return;
      }

      setNoticias((prev) => prev.filter((item) => item.id !== id));
    } catch (actionError) {
      console.error("[NoticiasManager] Error eliminando noticia:", actionError);

      setError("Ha ocurrido un error inesperado al eliminar la noticia.");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-3 rounded-card bg-navy-light p-4">
        <div>
          <h2 className="text-sm font-semibold">Nueva noticia</h2>

          <p className="mt-1 text-xs text-offwhite/50">
            Crea un borrador o publica directamente la noticia.
          </p>
        </div>

        <div>
          <label
            htmlFor="noticia-titulo"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Título
          </label>

          <input
            id="noticia-titulo"
            type="text"
            placeholder="Título"
            value={form.titulo}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                titulo: event.target.value,
              }))
            }
            disabled={enviando}
            maxLength={200}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="noticia-contenido"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Contenido
          </label>

          <textarea
            id="noticia-contenido"
            placeholder="Contenido"
            rows={6}
            value={form.contenido}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contenido: event.target.value,
              }))
            }
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="noticia-imagen"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Imagen destacada
          </label>

          <input
            id="noticia-imagen"
            type="url"
            placeholder="URL imagen destacada"
            value={form.imagen_destacada}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                imagen_destacada: event.target.value,
              }))
            }
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="noticia-categoria"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Categoría
          </label>

          <select
            id="noticia-categoria"
            value={form.categoria}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                categoria: event.target.value,
              }))
            }
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
          >
            <option value="">Categoría</option>
            <option value="cronica">Crónica</option>
            <option value="entrevista">Entrevista</option>
            <option value="anuncio">Anuncio</option>
          </select>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-coral">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => crear(false)}
            disabled={enviando}
            className="rounded-card border border-offwhite/30 px-4 py-2 text-sm transition hover:bg-offwhite/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Guardar borrador"}
          </button>

          <button
            type="button"
            onClick={() => crear(true)}
            disabled={enviando}
            className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? "Publicando..." : "Publicar"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Noticias existentes</h2>

        <ul className="space-y-2">
          {noticias.map((noticia) => {
            const actualizando = actualizandoId === noticia.id;

            return (
              <li
                key={noticia.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-navy-light px-4 py-3"
              >
                <span className="min-w-0 flex-1 text-sm">{noticia.titulo}</span>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={noticia.estado === "publicado"}
                      onChange={(event) =>
                        togglePublicar(noticia.id, event.target.checked)
                      }
                      disabled={actualizando}
                    />
                    Publicado
                  </label>

                  <button
                    type="button"
                    onClick={() => borrar(noticia.id)}
                    disabled={actualizando}
                    className="text-xs text-coral underline underline-offset-4 disabled:opacity-50"
                  >
                    Borrar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {!noticias.length ? (
          <p className="mt-4 text-sm text-offwhite/50">
            No hay noticias creadas todavía.
          </p>
        ) : null}
      </div>
    </div>
  );
}
