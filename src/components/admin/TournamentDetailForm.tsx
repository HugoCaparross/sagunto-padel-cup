// Ruta: src/components/admin/TournamentDetailForm.tsx
"use client";

import { useState } from "react";
import {
  updateTournamentEstado,
  setTournamentCategory,
} from "@/app/(admin)/admin/torneos/[id]/actions";

type Categoria = { id: string; nombre: string };
type CategoriaActiva = {
  categoria_id: string;
  cupo_minimo: number;
  cupo_maximo: number;
};

const ESTADOS = [
  "borrador",
  "publicado",
  "inscripciones_abiertas",
  "en_juego",
  "finalizado",
  "archivado",
];

export default function TournamentDetailForm({
  torneoId,
  estadoActual,
  categorias,
  categoriasActivas,
}: {
  torneoId: string;
  estadoActual: string;
  categorias: Categoria[];
  categoriasActivas: CategoriaActiva[];
}) {
  const [estado, setEstado] = useState(estadoActual);
  const [activas, setActivas] = useState<Record<string, CategoriaActiva | null>>(
    Object.fromEntries(
      categorias.map((c) => [
        c.id,
        categoriasActivas.find((a) => a.categoria_id === c.id) ?? null,
      ])
    )
  );

  async function cambiarEstado(nuevo: string) {
    setEstado(nuevo);
    await updateTournamentEstado(torneoId, nuevo);
  }

  async function toggleCategoria(categoriaId: string, activa: boolean) {
    const cupo = activas[categoriaId] ?? { categoria_id: categoriaId, cupo_minimo: 6, cupo_maximo: 12 };
    setActivas((prev) => ({ ...prev, [categoriaId]: activa ? cupo : null }));
    await setTournamentCategory(
      torneoId,
      categoriaId,
      activa,
      cupo.cupo_minimo,
      cupo.cupo_maximo
    );
  }

  async function cambiarCupo(
    categoriaId: string,
    campo: "cupo_minimo" | "cupo_maximo",
    valor: number
  ) {
    const actual = activas[categoriaId];
    if (!actual) return;
    const nuevo = { ...actual, [campo]: valor };
    setActivas((prev) => ({ ...prev, [categoriaId]: nuevo }));
    await setTournamentCategory(
      torneoId,
      categoriaId,
      true,
      nuevo.cupo_minimo,
      nuevo.cupo_maximo
    );
  }

  return (
    <div className="space-y-8 max-w-md">
      <div>
        <label className="block font-semibold mb-1">Estado del torneo</label>
        <select
          value={estado}
          onChange={(e) => cambiarEstado(e.target.value)}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3"
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-3">
          Categorías disputadas
        </label>
        <div className="space-y-4">
          {categorias.map((c) => {
            const activa = activas[c.id];
            return (
              <div
                key={c.id}
                className="rounded-card bg-navy-light px-4 py-3"
              >
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!activa}
                    onChange={(e) => toggleCategoria(c.id, e.target.checked)}
                  />
                  <span>{c.nombre}</span>
                </label>
                {activa && (
                  <div className="flex gap-3 mt-2 pl-7">
                    <label className="text-sm">
                      Mín.
                      <input
                        type="number"
                        value={activa.cupo_minimo}
                        onChange={(e) =>
                          cambiarCupo(c.id, "cupo_minimo", Number(e.target.value))
                        }
                        className="w-16 ml-2 rounded border border-offwhite/20 bg-navy px-2 py-1"
                      />
                    </label>
                    <label className="text-sm">
                      Máx.
                      <input
                        type="number"
                        value={activa.cupo_maximo}
                        onChange={(e) =>
                          cambiarCupo(c.id, "cupo_maximo", Number(e.target.value))
                        }
                        className="w-16 ml-2 rounded border border-offwhite/20 bg-navy px-2 py-1"
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}