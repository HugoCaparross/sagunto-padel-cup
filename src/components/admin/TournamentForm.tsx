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
  const [guardado, setGuardado] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
  });

  async function onSubmit(values: TournamentFormValues) {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    setGuardado(false);
    try {
      const res = await createTournament(values);
      if (!res.ok) {
        setError(res.error ?? "No se ha podido crear el torneo.");
        return;
      }
      reset();
      setGuardado(true);
    } catch (actionError) {
      console.error("[TournamentForm] Error creando torneo:", actionError);
      setError("Ha ocurrido un error inesperado al crear el torneo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      <div>
        <label
          htmlFor="nombre-torneo"
          className="mb-1.5 block text-xs font-semibold text-offwhite/70"
        >
          Nombre del torneo
        </label>
        <input
          id="nombre-torneo"
          type="text"
          {...register("nombre")}
          disabled={enviando}
          maxLength={150}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3 outline-none focus:border-coral disabled:opacity-50"
        />
        {errors.nombre ? (
          <p role="alert" className="mt-1 text-sm text-coral">
            {errors.nombre.message}
          </p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="fecha-inicio"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Fecha de inicio
          </label>
          <input
            id="fecha-inicio"
            type="date"
            {...register("fecha_inicio")}
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3 outline-none focus:border-coral disabled:opacity-50"
          />
          {errors.fecha_inicio ? (
            <p role="alert" className="mt-1 text-sm text-coral">
              {errors.fecha_inicio.message}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="fecha-fin"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Fecha de fin
          </label>
          <input
            id="fecha-fin"
            type="date"
            {...register("fecha_fin")}
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-4 py-3 outline-none focus:border-coral disabled:opacity-50"
          />
          {errors.fecha_fin ? (
            <p role="alert" className="mt-1 text-sm text-coral">
              {errors.fecha_fin.message}
            </p>
          ) : null}
        </div>
      </div>
      <div className="border-l-2 border-sage pl-4 text-sm leading-6 text-offwhite/60">
        <p className="font-semibold text-offwhite">Estado inicial: borrador</p>
        <p>
          Después de guardar puedes completar club, categorías, plazas y
          configuración competitiva antes de publicar.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-coral">
          {error}
        </p>
      ) : null}
      {guardado ? (
        <p role="status" className="text-sm text-sage">
          Torneo creado como borrador.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-card bg-coral px-6 py-3 font-display text-offwhite disabled:opacity-50"
      >
        {enviando ? "Creando..." : "Guardar borrador"}
      </button>
    </form>
  );
}
