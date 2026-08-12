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
  const [confirmando, setConfirmando] = useState(false);

  function actualizar(
    i: number,
    campo: keyof SetInput,
    valor: number | boolean,
  ) {
    setConfirmando(false);
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
    setConfirmando(false);
    setSets((prev) => [...prev, { ...setVacio }]);
  }

  function validarAntesDeGuardar() {
    const tieneSetConMarcador = sets.some(
      (set) => set.juegos_pair1 > 0 || set.juegos_pair2 > 0,
    );

    if (!tieneSetConMarcador) {
      setError("Introduce al menos un marcador antes de guardar.");
      return false;
    }

    const tieneSetVacioEntreSets = sets
      .slice(0, -1)
      .some((set) => set.juegos_pair1 === 0 && set.juegos_pair2 === 0);

    if (tieneSetVacioEntreSets) {
      setError("Completa los sets anteriores antes de continuar.");
      return false;
    }

    return true;
  }

  function solicitarConfirmacion() {
    if (enviando) {
      return;
    }

    setError(null);

    if (!validarAntesDeGuardar()) {
      return;
    }

    setConfirmando(true);
  }

  async function guardar() {
    if (enviando || !confirmando) {
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const res = await guardarResultado(torneoId, matchId, { sets });

      if (!res.ok) {
        setError(res.error ?? "No se ha podido guardar el resultado.");
        setConfirmando(false);
        return;
      }

      router.refresh();
    } catch (actionError) {
      console.error("[ResultadoForm] Error guardando resultado:", actionError);
      setError("Ha ocurrido un error inesperado al guardar el resultado.");
      setConfirmando(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section
      aria-labelledby={`resultado-${matchId}`}
      className="border border-offwhite/15 bg-navy p-4 text-offwhite sm:p-5"
    >
      <div className="mb-4 border-b border-offwhite/10 pb-4">
        <p id={`resultado-${matchId}`} className="text-sm font-semibold">
          {nombrePair1} <span className="text-offwhite/40">vs</span>{" "}
          {nombrePair2}
        </p>
        <p className="mt-1 text-xs text-offwhite/50">
          Introduce el marcador oficial del partido.
        </p>
      </div>

      <div className="space-y-3">
        {sets.map((s, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2 text-sm sm:flex sm:flex-wrap"
          >
            <span className="w-14 text-offwhite/60">Set {i + 1}</span>

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
              className="w-full rounded-card border border-offwhite/20 bg-transparent px-2 py-1.5 text-center disabled:opacity-50 sm:w-16"
            />

            <span className="text-offwhite/45">–</span>

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
              className="w-full rounded-card border border-offwhite/20 bg-transparent px-2 py-1.5 text-center disabled:opacity-50 sm:w-16"
            />

            <label className="mt-2 flex items-center gap-2 text-xs text-offwhite/65 sm:mt-0">
              <input
                type="checkbox"
                checked={s.tiebreak}
                onChange={(e) => actualizar(i, "tiebreak", e.target.checked)}
                disabled={enviando}
              />
              Tiebreak
            </label>

            {s.tiebreak ? (
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
                  className="w-16 rounded-card border border-offwhite/20 bg-transparent px-2 py-1.5 text-center disabled:opacity-50"
                />
                <span className="text-offwhite/45">–</span>
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
                  className="w-16 rounded-card border border-offwhite/20 bg-transparent px-2 py-1.5 text-center disabled:opacity-50"
                />
              </>
            ) : null}
          </div>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 border-l-2 border-coral pl-3 text-sm text-coral"
        >
          {error}
        </p>
      ) : null}

      {confirmando ? (
        <div className="mt-5 border border-coral/30 bg-coral/5 p-4">
          <p className="text-sm font-semibold">Confirmar resultado</p>
          <p className="mt-1 text-xs leading-5 text-offwhite/60">
            Esta acción finalizará el partido y puede actualizar clasificación,
            cuadro y ranking.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={enviando}
              className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:opacity-50"
            >
              {enviando ? "Guardando..." : "Confirmar resultado"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={enviando}
              className="rounded-card border border-offwhite/20 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Revisar
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={añadirSet}
            disabled={enviando || sets.length >= MAX_SETS}
            className="text-sm font-semibold text-sage underline-offset-4 hover:underline disabled:opacity-50"
          >
            + Añadir set
          </button>

          <button
            type="button"
            onClick={solicitarConfirmacion}
            disabled={enviando}
            className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:opacity-50"
          >
            Revisar resultado
          </button>
        </div>
      )}
    </section>
  );
}
