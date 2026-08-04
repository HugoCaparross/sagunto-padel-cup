// Ruta: src/components/admin/NoticiasManager.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearNoticia,
  togglePublicarNoticia,
  borrarNoticia,
} from "@/app/(admin)/admin/noticias/actions";

type Noticia = { id: string; titulo: string; estado: string };

export default function NoticiasManager({
  noticiasIniciales,
}: {
  noticiasIniciales: Noticia[];
}) {
  const router = useRouter();
  const [noticias, setNoticias] = useState(noticiasIniciales);
  const [form, setForm] = useState({
    titulo: "",
    contenido: "",
    imagen_destacada: "",
    categoria: "",
  });
  const [enviando, setEnviando] = useState(false);

  async function crear(publicar: boolean) {
    if (!form.titulo || !form.contenido) return;
    setEnviando(true);
    await crearNoticia({ ...form, publicar });
    setForm({ titulo: "", contenido: "", imagen_destacada: "", categoria: "" });
    setEnviando(false);
    router.refresh();
  }

  async function togglePublicar(id: string, publicar: boolean) {
    setNoticias((prev) =>
      prev.map((n) => (n.id === id ? { ...n, estado: publicar ? "publicado" : "borrador" } : n))
    );
    await togglePublicarNoticia(id, publicar);
  }

  async function borrar(id: string) {
    setNoticias((prev) => prev.filter((n) => n.id !== id));
    await borrarNoticia(id);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-card bg-navy-light p-4 space-y-3">
        <input
          placeholder="Título"
          value={form.titulo}
          onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Contenido"
          rows={5}
          value={form.contenido}
          onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
        <input
          placeholder="URL imagen destacada"
          value={form.imagen_destacada}
          onChange={(e) => setForm((f) => ({ ...f, imagen_destacada: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
        <select
          value={form.categoria}
          onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        >
          <option value="">Categoría</option>
          <option value="cronica">Crónica</option>
          <option value="entrevista">Entrevista</option>
          <option value="anuncio">Anuncio</option>
        </select>
        <div className="flex gap-3">
          <button
            onClick={() => crear(false)}
            disabled={enviando}
            className="rounded-card border border-offwhite/30 text-sm px-4 py-2 disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => crear(true)}
            disabled={enviando}
            className="rounded-card bg-coral text-offwhite text-sm px-4 py-2 disabled:opacity-50"
          >
            Publicar
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {noticias.map((n) => (
          <li key={n.id} className="rounded-card bg-navy-light px-4 py-3 flex justify-between items-center">
            <span className="text-sm">{n.titulo}</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={n.estado === "publicado"}
                  onChange={(e) => togglePublicar(n.id, e.target.checked)}
                />
                Publicado
              </label>
              <button onClick={() => borrar(n.id)} className="text-coral text-xs">
                Borrar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}