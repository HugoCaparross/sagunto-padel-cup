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
  } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
  });

  async function onSubmit(values: TournamentFormValues) {
    if (enviando) {
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const res = await createTournament(values);

      if (res.ok) {
        reset();
        return;
      }

      setError(res.error ?? "No se ha podido crear el torneo.");
    } catch (actionError) {
      console.error("[TournamentForm] Error creando torneo:", actionError);

      setError("Ha ocurrido un error inesperado al crear el torneo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="nombre-torneo" className="sr-only">
          Nombre del torneo
        </label>

        <input
          id="nombre-torneo"
          placeholder="Nombre del torneo"
          {...register("nombre")}
          disabled={enviando}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3 disabled:opacity-50"
        />

        {errors.nombre && (
          <p role="alert" className="text-coral text-sm mt-1">
            {errors.nombre.message}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <div className="w-full">
          <label htmlFor="fecha-inicio" className="sr-only">
            Fecha de inicio
          </label>

          <input
            id="fecha-inicio"
            type="date"
            {...register("fecha_inicio")}
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3 disabled:opacity-50"
          />
        </div>

        <div className="w-full">
          <label htmlFor="fecha-fin" className="sr-only">
            Fecha de fin
          </label>

          <input
            id="fecha-fin"
            type="date"
            {...register("fecha_fin")}
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3 disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-coral font-semibold">
          {error}
        </p>
      )}

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
