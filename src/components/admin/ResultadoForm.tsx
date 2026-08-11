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

const MAX_SETS = 5;

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

  function actualizar(
    i: number,
    campo: keyof SetInput,
    valor: number | boolean,
  ) {
    setSets((prev) =>
      prev.map((s, idx) =>
        idx === i
          ? {
              ...s,
              [campo]: valor,
            }
          : s,
      ),
    );
  }

  function añadirSet() {
    if (sets.length >= MAX_SETS) {
      setError(`No se pueden añadir más de ${MAX_SETS} sets.`);
      return;
    }

    setError(null);

    setSets((prev) => [...prev, { ...setVacio }]);
  }

  async function guardar() {
    if (enviando) {
      return;
    }

    const tieneSetConMarcador = sets.some(
      (set) => set.juegos_pair1 > 0 || set.juegos_pair2 > 0,
    );

    if (!tieneSetConMarcador) {
      setError("Introduce al menos un marcador antes de guardar.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const res = await guardarResultado(torneoId, matchId, { sets });

      if (!res.ok) {
        setError(res.error ?? "No se ha podido guardar el resultado.");
        return;
      }

      router.refresh();
    } catch (actionError) {
      console.error("[ResultadoForm] Error guardando resultado:", actionError);

      setError("Ha ocurrido un error inesperado al guardar el resultado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-card bg-navy-light p-4 space-y-3">
      <p className="font-semibold text-sm">
        {nombrePair1} <span className="text-offwhite/50">vs</span> {nombrePair2}
      </p>

      {sets.map((s, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="w-14">Set {i + 1}</span>

          <label htmlFor={`pair1-${matchId}-${i}`} className="sr-only">
            Juegos de {nombrePair1}, set {i + 1}
          </label>

          <input
            id={`pair1-${matchId}-${i}`}
            type="number"
            min={0}
            max={20}
            step={1}
            value={s.juegos_pair1}
            onChange={(e) =>
              actualizar(i, "juegos_pair1", Number(e.target.value))
            }
            disabled={enviando}
            className="w-14 rounded border border-offwhite/20 bg-navy px-2 py-1 disabled:opacity-50"
          />

          <span>-</span>

          <label htmlFor={`pair2-${matchId}-${i}`} className="sr-only">
            Juegos de {nombrePair2}, set {i + 1}
          </label>

          <input
            id={`pair2-${matchId}-${i}`}
            type="number"
            min={0}
            max={20}
            step={1}
            value={s.juegos_pair2}
            onChange={(e) =>
              actualizar(i, "juegos_pair2", Number(e.target.value))
            }
            disabled={enviando}
            className="w-14 rounded border border-offwhite/20 bg-navy px-2 py-1 disabled:opacity-50"
          />

          <label className="flex items-center gap-1 ml-2">
            <input
              type="checkbox"
              checked={s.tiebreak}
              onChange={(e) => actualizar(i, "tiebreak", e.target.checked)}
              disabled={enviando}
            />
            Tiebreak
          </label>

          {s.tiebreak && (
            <>
              <label htmlFor={`tb1-${matchId}-${i}`} className="sr-only">
                Tiebreak de {nombrePair1}, set {i + 1}
              </label>

              <input
                id={`tb1-${matchId}-${i}`}
                type="number"
                min={0}
                max={30}
                step={1}
                value={s.tiebreak_pair1}
                onChange={(e) =>
                  actualizar(i, "tiebreak_pair1", Number(e.target.value))
                }
                disabled={enviando}
                className="w-14 rounded border border-offwhite/20 bg-navy px-2 py-1 disabled:opacity-50"
              />

              <span>-</span>

              <label htmlFor={`tb2-${matchId}-${i}`} className="sr-only">
                Tiebreak de {nombrePair2}, set {i + 1}
              </label>

              <input
                id={`tb2-${matchId}-${i}`}
                type="number"
                min={0}
                max={30}
                step={1}
                value={s.tiebreak_pair2}
                onChange={(e) =>
                  actualizar(i, "tiebreak_pair2", Number(e.target.value))
                }
                disabled={enviando}
                className="w-14 rounded border border-offwhite/20 bg-navy px-2 py-1 disabled:opacity-50"
              />
            </>
          )}
        </div>
      ))}

      {error && (
        <p role="alert" className="text-coral text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={añadirSet}
          disabled={enviando || sets.length >= MAX_SETS}
          className="text-sage text-sm underline disabled:opacity-50"
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
    </div>
  );
}
