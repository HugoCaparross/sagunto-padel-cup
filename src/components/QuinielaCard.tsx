// Ruta: src/components/QuinielaCard.tsx
"use client";

import { useState } from "react";
import { votar } from "@/app/(public)/torneo/[slug]/quiniela/actions";

type Pareja = { id: string; nombre: string };

export default function QuinielaCard({
  slug,
  matchId,
  pareja1,
  pareja2,
  votoInicial,
}: {
  slug: string;
  matchId: string;
  pareja1: Pareja;
  pareja2: Pareja;
  votoInicial: string | null;
}) {
  const [voto, setVoto] = useState(votoInicial);
  const [enviando, setEnviando] = useState(false);

  async function elegir(parejaId: string) {
    setEnviando(true);
    setVoto(parejaId);
    await votar(slug, matchId, parejaId);
    setEnviando(false);
  }

  return (
    <div className="rounded-card bg-navy/5 p-4 flex items-center justify-between gap-3">
      <button
        onClick={() => elegir(pareja1.id)}
        disabled={enviando}
        className={`flex-1 rounded-card px-3 py-2 text-sm text-left ${
          voto === pareja1.id ? "bg-coral text-offwhite" : "bg-navy/10"
        }`}
      >
        {pareja1.nombre}
      </button>
      <span className="text-navy/40 text-xs">vs</span>
      <button
        onClick={() => elegir(pareja2.id)}
        disabled={enviando}
        className={`flex-1 rounded-card px-3 py-2 text-sm text-right ${
          voto === pareja2.id ? "bg-coral text-offwhite" : "bg-navy/10"
        }`}
      >
        {pareja2.nombre}
      </button>
    </div>
  );
}