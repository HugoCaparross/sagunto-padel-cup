// Ruta: src/components/QuinielaCard.tsx

"use client";

import { useState } from "react";
import { votar } from "@/app/(public)/torneo/[slug]/quiniela/actions";

type Pareja = {
  id: string;
  nombre: string;
};

interface QuinielaCardProps {
  slug: string;
  matchId: string;
  pareja1: Pareja;
  pareja2: Pareja;
  votoInicial: string | null;
}

export default function QuinielaCard({
  slug,
  matchId,
  pareja1,
  pareja2,
  votoInicial,
}: QuinielaCardProps) {
  const [voto, setVoto] = useState(votoInicial);

  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function elegir(parejaId: string) {
    if (enviando) {
      return;
    }

    const votoAnterior = voto;

    setEnviando(true);
    setError(null);
    setVoto(parejaId);

    try {
      const resultado = await votar(slug, matchId, parejaId);

      if (!resultado.ok) {
        setVoto(votoAnterior);

        setError(resultado.error ?? "No se ha podido guardar tu voto.");
      }
    } catch (actionError) {
      console.error("[QuinielaCard] Error guardando voto:", actionError);

      setVoto(votoAnterior);

      setError("Ha ocurrido un error inesperado al guardar tu voto.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-card bg-navy/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => elegir(pareja1.id)}
          disabled={enviando}
          aria-pressed={voto === pareja1.id}
          className={`flex-1 rounded-card px-3 py-2 text-sm text-left ${
            voto === pareja1.id ? "bg-coral text-offwhite" : "bg-navy/10"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {pareja1.nombre}
        </button>

        <span className="text-navy/40 text-xs" aria-hidden="true">
          vs
        </span>

        <button
          type="button"
          onClick={() => elegir(pareja2.id)}
          disabled={enviando}
          aria-pressed={voto === pareja2.id}
          className={`flex-1 rounded-card px-3 py-2 text-sm text-right ${
            voto === pareja2.id ? "bg-coral text-offwhite" : "bg-navy/10"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {pareja2.nombre}
        </button>
      </div>

      {enviando ? (
        <p className="text-xs text-navy/50 mt-2 text-center">
          Guardando voto...
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-coral mt-2 text-center">
          {error}
        </p>
      ) : null}
    </div>
  );
}
