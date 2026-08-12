// Ruta: src/components/admin/NoticiasManager.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarNoticia,
  borrarNoticia,
  crearNoticia,
  togglePublicarNoticia,
} from "@/app/(admin)/admin/noticias/actions";

type Noticia = { id: string; titulo: string; estado: string };
interface NoticiasManagerProps {
  noticiasIniciales: Noticia[];
}

const EMPTY_FORM = {
  titulo: "",
  contenido: "",
  imagen_destacada: "",
  categoria: "",
};

export default function NoticiasManager({
  noticiasIniciales,
}: NoticiasManagerProps) {
  const router = useRouter();
  const [noticias, setNoticias] = useState(noticiasIniciales);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<{
    id: string;
    accion: "publicar" | "despublicar" | "borrar";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function iniciarEdicion(noticia: Noticia) {
    setEditandoId(noticia.id);
    setForm({
      titulo: noticia.titulo,
      contenido: "",
      imagen_destacada: "",
      categoria: "",
    });
    setError(
      "Para editar completamente una noticia se debe cargar su contenido actual desde el editor de detalle.",
    );
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function guardar(publicar: boolean) {
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
      const resultado = editandoId
        ? await actualizarNoticia(editandoId, {
            ...form,
            titulo,
            contenido,
            imagen_destacada: form.imagen_destacada.trim(),
          })
        : await crearNoticia({
            ...form,
            titulo,
            contenido,
            imagen_destacada: form.imagen_destacada.trim(),
            publicar,
          });
      if (!resultado?.ok) {
        setError(resultado?.error ?? "No se ha podido guardar la noticia.");
        return;
      }
      setForm(EMPTY_FORM);
      setEditandoId(null);
      router.refresh();
    } catch (actionError) {
      console.error("[NoticiasManager] Error guardando noticia:", actionError);
      setError("Ha ocurrido un error inesperado al guardar la noticia.");
    } finally {
      setEnviando(false);
    }
  }

  async function ejecutarConfirmacion() {
    if (!confirmacion || actualizandoId) return;
    const { id, accion } = confirmacion;
    setActualizandoId(id);
    setError(null);
    try {
      if (accion === "borrar") {
        const resultado = await borrarNoticia(id);
        if (!resultado?.ok) {
          setError(resultado?.error ?? "No se ha podido eliminar la noticia.");
          return;
        }
        setNoticias((prev) => prev.filter((item) => item.id !== id));
      } else {
        const resultado = await togglePublicarNoticia(
          id,
          accion === "publicar",
        );
        if (!resultado?.ok) {
          setError(
            resultado?.error ?? "No se ha podido cambiar la publicación.",
          );
          return;
        }
        setNoticias((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  estado: accion === "publicar" ? "publicado" : "borrador",
                }
              : item,
          ),
        );
      }
      setConfirmacion(null);
    } catch (actionError) {
      console.error("[NoticiasManager] Error ejecutando acción:", actionError);
      setError("Ha ocurrido un error inesperado.");
    } finally {
      setActualizandoId(null);
    }
  }

  return (
    <section
      aria-labelledby="noticias-manager-title"
      className="max-w-2xl space-y-6"
    >
      <div className="space-y-4 rounded-card bg-navy-light p-4">
        <div>
          <h2 id="noticias-manager-title" className="text-sm font-semibold">
            {editandoId ? "Editar noticia" : "Nueva noticia"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-offwhite/50">
            Los estados borrador y publicado deben ser explícitos antes de hacer
            cambios editoriales.
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
            value={form.titulo}
            onChange={(event) =>
              setForm((current) => ({ ...current, titulo: event.target.value }))
            }
            disabled={enviando}
            maxLength={180}
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
            value={form.contenido}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                contenido: event.target.value,
              }))
            }
            disabled={enviando}
            rows={8}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
          />
        </div>
        <div>
          <label
            htmlFor="noticia-imagen"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            URL de imagen destacada (opcional)
          </label>
          <input
            id="noticia-imagen"
            type="url"
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
            <option value="">Sin categoría</option>
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => guardar(false)}
            disabled={enviando}
            className="rounded-card border border-offwhite/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            {enviando
              ? "Guardando..."
              : editandoId
                ? "Guardar cambios"
                : "Guardar borrador"}
          </button>
          {!editandoId ? (
            <button
              type="button"
              onClick={() => guardar(true)}
              disabled={enviando}
              className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:opacity-50"
            >
              Publicar
            </button>
          ) : null}
          {editandoId ? (
            <button
              type="button"
              onClick={cancelarEdicion}
              disabled={enviando}
              className="rounded-card border border-offwhite/20 px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl">Noticias existentes</h2>
        <div className="divide-y divide-offwhite/10 border-y border-offwhite/10">
          {noticias.map((noticia) => (
            <div
              key={noticia.id}
              className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <p className="text-sm font-medium">{noticia.titulo}</p>
                <p className="mt-1 text-xs text-offwhite/45">
                  Estado: {noticia.estado}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => iniciarEdicion(noticia)}
                  disabled={actualizandoId !== null}
                  className="text-xs underline underline-offset-4 disabled:opacity-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmacion({
                      id: noticia.id,
                      accion:
                        noticia.estado === "publicado"
                          ? "despublicar"
                          : "publicar",
                    })
                  }
                  disabled={actualizandoId !== null}
                  className="text-xs underline underline-offset-4 disabled:opacity-50"
                >
                  {noticia.estado === "publicado" ? "Despublicar" : "Publicar"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmacion({ id: noticia.id, accion: "borrar" })
                  }
                  disabled={
                    actualizandoId !== null || noticia.estado === "publicado"
                  }
                  className="text-xs text-coral underline underline-offset-4 disabled:opacity-40"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
        {!noticias.length ? (
          <p className="mt-4 text-sm text-offwhite/50">
            No hay noticias creadas todavía.
          </p>
        ) : null}
      </div>

      {confirmacion ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-navy/75 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-noticia-title"
        >
          <div className="w-full max-w-md rounded-card bg-navy-light p-5">
            <h2 id="confirmar-noticia-title" className="font-display text-xl">
              Confirmar acción
            </h2>
            <p className="mt-2 text-sm leading-6 text-offwhite/65">
              {confirmacion.accion === "borrar"
                ? "La noticia se eliminará y dejará de estar disponible en el backoffice."
                : confirmacion.accion === "publicar"
                  ? "La noticia pasará a estado publicado y podrá mostrarse públicamente."
                  : "La noticia dejará de estar publicada."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmacion(null)}
                disabled={Boolean(actualizandoId)}
                className="rounded-card border border-offwhite/20 px-4 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarConfirmacion}
                disabled={Boolean(actualizandoId)}
                className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:opacity-50"
              >
                {actualizandoId ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
