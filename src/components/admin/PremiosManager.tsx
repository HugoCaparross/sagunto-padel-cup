// Ruta: src/components/admin/PremiosManager.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearPremio,
  toggleVisiblePremio,
  borrarPremio,
} from "@/app/(admin)/admin/torneos/[id]/premios/actions";

type Categoria = { id: string; nombre: string };
type Sponsor = { id: string; nombre: string };
type Premio = {
  id: string;
  categoria_id: string | null;
  tramo: string | null;
  posicion: string | null;
  descripcion: string;
  patrocinador_id: string | null;
  visible: boolean;
};

export default function PremiosManager({
  torneoId,
  categorias,
  sponsors,
  premiosIniciales,
}: {
  torneoId: string;
  categorias: Categoria[];
  sponsors: Sponsor[];
  premiosIniciales: Premio[];
}) {
  const router = useRouter();
  const [premios, setPremios] = useState(premiosIniciales);
  const [form, setForm] = useState({
    categoria_id: "",
    tramo: "",
    posicion: "",
    descripcion: "",
    patrocinador_id: "",
  });
  const [enviando, setEnviando] = useState(false);

  async function crear() {
    if (!form.descripcion) return;
    setEnviando(true);
    await crearPremio(torneoId, form);
    setForm({ categoria_id: "", tramo: "", posicion: "", descripcion: "", patrocinador_id: "" });
    setEnviando(false);
    router.refresh();
  }

  async function toggle(id: string, visible: boolean) {
    setPremios((prev) => prev.map((p) => (p.id === id ? { ...p, visible } : p)));
    await toggleVisiblePremio(torneoId, id, visible);
  }

  async function borrar(id: string) {
    setPremios((prev) => prev.filter((p) => p.id !== id));
    await borrarPremio(torneoId, id);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-card bg-navy-light p-4 space-y-3">
        <select
          value={form.categoria_id}
          onChange={(e) => setForm((f) => ({ ...f, categoria_id: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        >
          <option value="">Categoría (opcional)</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            value={form.tramo}
            onChange={(e) => setForm((f) => ({ ...f, tramo: e.target.value }))}
            className="w-1/2 rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
          >
            <option value="">Tramo</option>
            <option value="oro">Oro</option>
            <option value="plata">Plata</option>
            <option value="bronce">Bronce</option>
            <option value="sorteo">Sorteo</option>
          </select>
          <select
            value={form.posicion}
            onChange={(e) => setForm((f) => ({ ...f, posicion: e.target.value }))}
            className="w-1/2 rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
          >
            <option value="">Posición</option>
            <option value="campeon">Campeón</option>
            <option value="subcampeon">Subcampeón</option>
            <option value="semifinalista">Semifinalista</option>
            <option value="cuartofinalista">Cuartofinalista</option>
          </select>
        </div>

        <textarea
          placeholder="Descripción del premio"
          value={form.descripcion}
          onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />

        <select
          value={form.patrocinador_id}
          onChange={(e) => setForm((f) => ({ ...f, patrocinador_id: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        >
          <option value="">Patrocinador (opcional)</option>
          {sponsors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>

        <button
          onClick={crear}
          disabled={enviando}
          className="rounded-card bg-coral text-offwhite text-sm px-4 py-2 disabled:opacity-50"
        >
          {enviando ? "Añadiendo..." : "Añadir premio"}
        </button>
      </div>

      <ul className="space-y-2">
        {premios.map((p) => (
          <li key={p.id} className="rounded-card bg-navy-light px-4 py-3 flex justify-between items-center gap-3">
            <span className="text-sm">
              {p.descripcion}
              {p.tramo && ` — ${p.tramo} ${p.posicion ?? ""}`}
            </span>
            <div className="flex items-center gap-3 shrink-0">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={p.visible}
                  onChange={(e) => toggle(p.id, e.target.checked)}
                />
                Visible
              </label>
              <button onClick={() => borrar(p.id)} className="text-coral text-xs">
                Borrar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}