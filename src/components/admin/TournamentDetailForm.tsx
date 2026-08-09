// Ruta: src/components/admin/TournamentDetailForm.tsx — sustituye entero al archivo actual
"use client";

import { useState } from "react";
import {
  updateTournamentEstado,
  updateTournamentClub,
  updateTournamentInfo,
  setTournamentCategory,
} from "@/app/(admin)/admin/torneos/[id]/actions";

type Categoria = { id: string; nombre: string };
type Club = { id: string; nombre: string };
type CategoriaActiva = { categoria_id: string; cupo_minimo: number; cupo_maximo: number };

const ESTADOS = ["borrador", "publicado", "inscripciones_abiertas", "en_juego", "finalizado", "archivado"];

export default function TournamentDetailForm({
  torneoId,
  estadoActual,
  clubActualId,
  clubs,
  categorias,
  categoriasActivas,
  precioInicial,
  descripcionInicial,
}: {
  torneoId: string;
  estadoActual: string;
  clubActualId: string | null;
  clubs: Club[];
  categorias: Categoria[];
  categoriasActivas: CategoriaActiva[];
  precioInicial: string;
  descripcionInicial: string;
}) {
  const [estado, setEstado] = useState(estadoActual);
  const [clubId, setClubId] = useState(clubActualId ?? "");
  const [precio, setPrecio] = useState(precioInicial);
  const [descripcion, setDescripcion] = useState(descripcionInicial);
  const [guardandoInfo, setGuardandoInfo] = useState(false);
  const [activas, setActivas] = useState<Record<string, CategoriaActiva | null>>(
    Object.fromEntries(
      categorias.map((c) => [c.id, categoriasActivas.find((a) => a.categoria_id === c.id) ?? null])
    )
  );

  async function cambiarEstado(nuevo: string) {
    setEstado(nuevo);
    await updateTournamentEstado(torneoId, nuevo);
  }

  async function cambiarClub(nuevo: string) {
    setClubId(nuevo);
    await updateTournamentClub(torneoId, nuevo);
  }

  async function guardarInfo() {
    setGuardandoInfo(true);
    await updateTournamentInfo(torneoId, { precio_texto: precio, descripcion });
    setGuardandoInfo(false);
  }

  async function toggleCategoria(categoriaId: string, activa: boolean) {
    const cupo = activas[categoriaId] ?? { categoria_id: categoriaId, cupo_minimo: 6, cupo_maximo: 12 };
    setActivas((prev) => ({ ...prev, [categoriaId]: activa ? cupo : null }));
    await setTournamentCategory(torneoId, categoriaId, activa, cupo.cupo_minimo, cupo.cupo_maximo);
  }

  async function cambiarCupo(categoriaId: string, campo: "cupo_minimo" | "cupo_maximo", valor: number) {
    const actual = activas[categoriaId];
    if (!actual) return;
    const nuevo = { ...actual, [campo]: valor };
    setActivas((prev) => ({ ...prev, [categoriaId]: nuevo }));
    await setTournamentCategory(torneoId, categoriaId, true, nuevo.cupo_minimo, nuevo.cupo_maximo);
  }

  return (
    <div className="space-y-8 max-w-md">
      <div>
        <label className="block font-semibold mb-1">Estado del torneo</label>
        <select
          value={estado}
          onChange={(e) => cambiarEstado(e.target.value)}
          className="input bg-navy border-offwhite/20 text-offwhite"
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1">Club / sede</label>
        <select
          value={clubId}
          onChange={(e) => cambiarClub(e.target.value)}
          className="input bg-navy border-offwhite/20 text-offwhite"
        >
          <option value="">Sin asignar</option>
          {clubs.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1">Precio (texto libre, ej. &quot;15€ por jugador&quot;)</label>
        <input
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="input bg-navy border-offwhite/20 text-offwhite mb-3"
        />
        <label className="block font-semibold mb-1">Información adicional</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={4}
          placeholder="Sistema de competición, partidos garantizados, notas para los jugadores..."
          className="input bg-navy border-offwhite/20 text-offwhite"
        />
        <button
          onClick={guardarInfo}
          disabled={guardandoInfo}
          className="btn-primary mt-2 !py-2 !px-4 text-sm"
        >
          {guardandoInfo ? "Guardando..." : "Guardar información"}
        </button>
      </div>

      <div>
        <label className="block font-semibold mb-3">Categorías disputadas</label>
        <div className="space-y-4">
          {categorias.map((c) => {
            const activa = activas[c.id];
            return (
              <div key={c.id} className="rounded-card bg-navy-light px-4 py-3">
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={!!activa} onChange={(e) => toggleCategoria(c.id, e.target.checked)} />
                  <span>{c.nombre}</span>
                </label>
                {activa && (
                  <div className="flex gap-3 mt-2 pl-7">
                    <label className="text-sm">
                      Mín.
                      <input
                        type="number"
                        value={activa.cupo_minimo}
                        onChange={(e) => cambiarCupo(c.id, "cupo_minimo", Number(e.target.value))}
                        className="w-16 ml-2 rounded border border-offwhite/20 bg-navy px-2 py-1"
                      />
                    </label>
                    <label className="text-sm">
                      Máx.
                      <input
                        type="number"
                        value={activa.cupo_maximo}
                        onChange={(e) => cambiarCupo(c.id, "cupo_maximo", Number(e.target.value))}
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