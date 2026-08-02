// Ruta: src/components/admin/ResultadoForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarResultado } from "@/app/(admin)/admin/torneos/[id]/resultados/actions";

type SetInput = {
  juegos_pair1: number;
  juegos_pair2: number;
  tiebreak: boolean;
  tiebreak_pair1: number;
  tiebreak_pair2: number;
};

const setVacio: SetInput = {
  juegos_pair1: 0,
  juegos_pair2: 0,
  tiebreak: false,
  tiebreak_pair1: 0,
  tiebreak_pair2: 0,
};

export default function ResultadoForm({
  torneoId,
  matchId,
  nombrePair1,
  nombrePair2,
}: {
  torneoId: string;
  matchId: string;
  nombrePair1: string;
  nombrePair2: string;
}) {
  const router = useRouter();
  const [sets, setSets] = useState<SetInput[]>([{ ...setVacio }]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar(i: number, campo: keyof SetInput, valor: number | boolean) {
    setSets((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [campo]: valor } : s))
    );
  }

  async function guardar() {
    setEnviando(true);
    setError(null);
    const res = await guardarResultado(torneoId, matchId, { sets });
    if (!res.ok) setError(res.error ?? "Error al guardar");
    setEnviando(false);
    router.refresh();
  }

  return (
    <div className="rounded-card bg-navy-light p-4 space-y-3">
      <p className="font-semibold text-sm">
        {nombrePair1} <span className="text-offwhite/50">vs</span> {nombrePair2}
      </p>

      {sets.map((s, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="w-14">Set {i + 1}</span>
          <input
            type="number"
            value={s.juegos_pair1}
            onChange={(e) => actualizar(i, "juegos_pair1", Number(e.target.value))}
            className="w-14 rounded border border-offwhite/20 bg-navy px-2 py-1"
          />
          <span>-</span>
          <input
            type="number"
            value={s.juegos_pair2}
            onChange={(e) => actualizar(i, "juegos_pair2", Number(e.target.value))}
            className="w-14 rounded border border-offwhite/20 bg-navy px-2 py-1"
          />
          <label className="flex items-center gap-1 ml-2">
            <input
              type="checkbox"
              checked={s.tiebreak}
              onChange={(e) => actualizar(i, "tiebreak", e.target.checked)}
            />
            Tiebreak
          </label>
          {s.tiebreak && (
            <>
              <input
                type="number"
                value={s.tiebreak_pair1}
                onChange={(e) =>
                  actualizar(i, "tiebreak_pair1", Number(e.target.value))
                }
                className="w-14 rounded border border-offwhite/20 bg-navy px-2 py-1"
              />
              <span>-</span>
              <input
                type="number"
                value={s.tiebreak_pair2}
                onChange={(e) =>
                  actualizar(i, "tiebreak_pair2", Number(e.target.value))
                }
                className="w-14 rounded border border-offwhite/20 bg-navy px-2 py-1"
              />
            </>
          )}
        </div>
      ))}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setSets((prev) => [...prev, { ...setVacio }])}
          className="text-sage text-sm underline"
        >
          + Añadir set
        </button>
        <button
          type="button"
          onClick={guardar}
          disabled={enviando}
          className="rounded-card bg-coral text-offwhite text-sm px-4 py-2 disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Guardar resultado"}
        </button>
      </div>

      {error && <p className="text-coral text-sm">{error}</p>}
    </div>
  );
}