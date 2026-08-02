// Ruta: src/components/admin/TournamentForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  tournamentSchema,
  type TournamentFormValues,
} from "@/lib/validations/tournament";
import { createTournament } from "@/app/(admin)/admin/torneos/actions";

export default function TournamentForm() {
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TournamentFormValues>({ resolver: zodResolver(tournamentSchema) });

  async function onSubmit(values: TournamentFormValues) {
    setEnviando(true);
    setError(null);
    const res = await createTournament(values);
    if (res.ok) reset();
    else setError(res.error ?? "Error al crear el torneo");
    setEnviando(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <input
          placeholder="Nombre del torneo"
          {...register("nombre")}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3"
        />
        {errors.nombre && (
          <p className="text-coral text-sm mt-1">{errors.nombre.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <input
          type="date"
          {...register("fecha_inicio")}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3"
        />
        <input
          type="date"
          {...register("fecha_fin")}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3"
        />
      </div>

      {error && <p className="text-coral font-semibold">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-card bg-coral text-offwhite font-display px-6 py-3 disabled:opacity-50"
      >
        {enviando ? "Creando..." : "Crear torneo"}
      </button>
    </form>
  );
}