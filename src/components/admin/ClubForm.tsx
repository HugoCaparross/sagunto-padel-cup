// Ruta: src/components/admin/ClubForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClub } from "@/app/(admin)/admin/ajustes/actions";

interface ClubFormState {
  nombre: string;
  direccion: string;
  num_pistas: number;
  telefono: string;
}

const INITIAL_FORM: ClubFormState = {
  nombre: "",
  direccion: "",
  num_pistas: 4,
  telefono: "",
};

export default function ClubForm() {
  const router = useRouter();

  const [form, setForm] = useState<ClubFormState>(INITIAL_FORM);

  const [enviando, setEnviando] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [exito, setExito] = useState(false);

  async function crear() {
    const nombre = form.nombre.trim();

    if (!nombre) {
      setError("El nombre del club es obligatorio.");
      setExito(false);
      return;
    }

    if (
      !Number.isInteger(form.num_pistas) ||
      form.num_pistas < 1 ||
      form.num_pistas > 100
    ) {
      setError("El número de pistas debe estar entre 1 y 100.");
      setExito(false);
      return;
    }

    setEnviando(true);
    setError(null);
    setExito(false);

    try {
      const resultado = await crearClub({
        nombre,
        direccion: form.direccion.trim(),
        num_pistas: form.num_pistas,
        telefono: form.telefono.trim(),
      });

      if (!resultado.ok) {
        setError(resultado.error ?? "No se ha podido crear el club.");
        return;
      }

      setForm(INITIAL_FORM);
      setExito(true);

      router.refresh();
    } catch (actionError) {
      console.error("[ClubForm] Error creando club:", actionError);

      setError("Ha ocurrido un error inesperado al crear el club.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-md space-y-3 rounded-card bg-navy-light p-4">
      <div>
        <h2 className="text-sm font-semibold">Nuevo club</h2>

        <p className="mt-1 text-xs text-offwhite/50">
          Añade un club y configura sus pistas.
        </p>
      </div>

      <div>
        <label
          htmlFor="club-nombre"
          className="mb-1.5 block text-xs font-semibold text-offwhite/70"
        >
          Nombre
        </label>

        <input
          id="club-nombre"
          type="text"
          placeholder="Nombre del club"
          value={form.nombre}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              nombre: event.target.value,
            }))
          }
          disabled={enviando}
          maxLength={120}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none transition focus:border-coral disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="club-direccion"
          className="mb-1.5 block text-xs font-semibold text-offwhite/70"
        >
          Dirección
        </label>

        <input
          id="club-direccion"
          type="text"
          placeholder="Dirección"
          value={form.direccion}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              direccion: event.target.value,
            }))
          }
          disabled={enviando}
          maxLength={250}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none transition focus:border-coral disabled:opacity-50"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="club-pistas"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Nº de pistas
          </label>

          <input
            id="club-pistas"
            type="number"
            min={1}
            max={100}
            step={1}
            value={form.num_pistas}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                num_pistas: Number(event.target.value) || 0,
              }))
            }
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none transition focus:border-coral disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="club-telefono"
            className="mb-1.5 block text-xs font-semibold text-offwhite/70"
          >
            Teléfono
          </label>

          <input
            id="club-telefono"
            type="tel"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                telefono: event.target.value,
              }))
            }
            disabled={enviando}
            maxLength={30}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none transition focus:border-coral disabled:opacity-50"
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}

      {exito ? (
        <p role="status" className="text-sm text-sage">
          Club creado correctamente.
        </p>
      ) : null}

      <button
        type="button"
        onClick={crear}
        disabled={enviando}
        className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? "Creando..." : "Crear club"}
      </button>
    </div>
  );
}
