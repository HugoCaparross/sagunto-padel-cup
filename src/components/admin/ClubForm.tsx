// Ruta: src/components/admin/ClubForm.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarClub, crearClub } from "@/app/(admin)/admin/ajustes/actions";

interface ClubFormState {
  nombre: string;
  direccion: string;
  num_pistas: number;
  telefono: string;
}

export interface ClubFormInitialData extends ClubFormState {
  id: string;
}

const EMPTY_FORM: ClubFormState = {
  nombre: "",
  direccion: "",
  num_pistas: 4,
  telefono: "",
};

export default function ClubForm({
  clubInicial = null,
}: {
  clubInicial?: ClubFormInitialData | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ClubFormState>(
    clubInicial
      ? {
          nombre: clubInicial.nombre,
          direccion: clubInicial.direccion,
          num_pistas: clubInicial.num_pistas,
          telefono: clubInicial.telefono,
        }
      : EMPTY_FORM,
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const esEdicion = Boolean(clubInicial);

  async function guardar() {
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
      const payload = {
        nombre,
        direccion: form.direccion.trim(),
        num_pistas: form.num_pistas,
        telefono: form.telefono.trim(),
      };

      const resultado =
        esEdicion && clubInicial
          ? await actualizarClub({ clubId: clubInicial.id, ...payload })
          : await crearClub(payload);

      if (!resultado.ok) {
        setError(resultado.error ?? "No se ha podido guardar el club.");
        return;
      }

      if (!esEdicion) {
        setForm(EMPTY_FORM);
      }

      setExito(true);
      router.refresh();
    } catch (actionError) {
      console.error("[ClubForm] Error guardando club:", actionError);
      setError("Ha ocurrido un error inesperado al guardar el club.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section
      aria-labelledby="club-form-title"
      className="max-w-md space-y-3 rounded-card bg-navy-light p-4"
    >
      <div>
        <h2 id="club-form-title" className="text-sm font-semibold">
          {esEdicion ? "Editar club" : "Nuevo club"}
        </h2>
        <p className="mt-1 text-xs leading-5 text-offwhite/50">
          {esEdicion
            ? "Actualiza los datos operativos de la sede."
            : "Añade una sede y configura sus pistas."}
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
          value={form.nombre}
          onChange={(event) =>
            setForm((current) => ({ ...current, nombre: event.target.value }))
          }
          disabled={enviando}
          maxLength={120}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
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
          value={form.direccion}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              direccion: event.target.value,
            }))
          }
          disabled={enviando}
          maxLength={250}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
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
                num_pistas: Number(event.target.value),
              }))
            }
            disabled={enviando}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
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
            value={form.telefono}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                telefono: event.target.value,
              }))
            }
            disabled={enviando}
            maxLength={30}
            className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm outline-none focus:border-coral disabled:opacity-50"
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
          {esEdicion
            ? "Club actualizado correctamente."
            : "Club creado correctamente."}
        </p>
      ) : null}

      <button
        type="button"
        onClick={guardar}
        disabled={enviando}
        className="rounded-card bg-coral px-4 py-2 text-sm font-semibold text-offwhite disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando
          ? "Guardando..."
          : esEdicion
            ? "Guardar cambios"
            : "Crear club"}
      </button>
    </section>
  );
}
