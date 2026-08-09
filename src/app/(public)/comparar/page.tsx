// Ruta: src/app/(public)/comparar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Jugador = { id: string; nombre: string; apellidos: string };

export default function CompararPage() {
  const router = useRouter();
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [id1, setId1] = useState("");
  const [id2, setId2] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("players")
      .select("id, nombre, apellidos")
      .eq("estado", "activo")
      .order("nombre")
      .then(({ data }) => setJugadores(data ?? []));
  }, []);

  function comparar() {
    if (id1 && id2 && id1 !== id2) {
      router.push(`/comparar/${id1}/${id2}`);
    }
  }

  return (
    <main className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl mb-8">Comparar jugadores</h1>

      <div className="space-y-4">
        <select
          value={id1}
          onChange={(e) => setId1(e.target.value)}
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        >
          <option value="">Jugador 1</option>
          {jugadores.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nombre} {j.apellidos}
            </option>
          ))}
        </select>

        <p className="text-center text-navy/40 font-display">VS</p>

        <select
          value={id2}
          onChange={(e) => setId2(e.target.value)}
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        >
          <option value="">Jugador 2</option>
          {jugadores.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nombre} {j.apellidos}
            </option>
          ))}
        </select>

        <button
          onClick={comparar}
          disabled={!id1 || !id2 || id1 === id2}
          className="w-full rounded-card bg-coral text-offwhite font-display text-lg py-4 disabled:opacity-50"
        >
          Comparar
        </button>
      </div>
    </main>
  );
}