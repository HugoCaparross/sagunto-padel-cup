// Ruta: src/components/PerfilForm.tsx

"use client";

import { useState } from "react";
import { actualizarPerfil } from "@/app/(private)/app/perfil/actions";

type Datos = {
  ciudad: string;
  mano_dominante: string;
  pala: string;
  instagram: string;
  visibilidad_json: Record<string, boolean>;
};

const CAMPOS_OPCIONALES = [
  {
    key: "ciudad",
    label: "Ciudad",
  },
  {
    key: "mano_dominante",
    label: "Mano dominante",
  },
  {
    key: "pala",
    label: "Pala",
  },
  {
    key: "instagram",
    label: "Instagram",
  },
] as const;

type Estado = "idle" | "enviando" | "ok";

export default function PerfilForm({ inicial }: { inicial: Datos }) {
  const [form, setForm] = useState<Datos>({
    ...inicial,
    visibilidad_json: {
      ...inicial.visibilidad_json,
    },
  });

  const [estado, setEstado] = useState<Estado>("idle");

  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    if (estado === "enviando") {
      return;
    }

    setEstado("enviando");
    setError(null);

    try {
      const resultado = await actualizarPerfil(form);

      if (!resultado.ok) {
        setEstado("idle");
        setError(resultado.error ?? "No se ha podido guardar el perfil.");
        return;
      }

      setEstado("ok");
    } catch (actionError) {
      console.error("[PerfilForm] Error actualizando perfil:", actionError);

      setEstado("idle");
      setError(
        "Ha ocurrido un error inesperado. Tus cambios siguen en el formulario.",
      );
    }
  }

  function actualizarCampo(
    campo: keyof Omit<Datos, "visibilidad_json">,
    valor: string,
  ) {
    setEstado("idle");
    setError(null);

    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function actualizarVisibilidad(campo: string, visible: boolean) {
    setEstado("idle");
    setError(null);

    setForm((actual) => ({
      ...actual,
      visibilidad_json: {
        ...actual.visibilidad_json,
        [campo]: visible,
      },
    }));
  }

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <label className="block font-semibold mb-1" htmlFor="perfil-ciudad">
          Ciudad
        </label>

        <input
          id="perfil-ciudad"
          value={form.ciudad}
          onChange={(e) => actualizarCampo("ciudad", e.target.value)}
          disabled={estado === "enviando"}
          maxLength={120}
          className="w-full rounded-card border border-navy/20 px-4 py-3 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="perfil-mano">
          Mano dominante
        </label>

        <select
          id="perfil-mano"
          value={form.mano_dominante}
          onChange={(e) => actualizarCampo("mano_dominante", e.target.value)}
          disabled={estado === "enviando"}
          className="w-full rounded-card border border-navy/20 px-4 py-3 disabled:opacity-50"
        >
          <option value="">Sin especificar</option>

          <option value="diestro">Diestro</option>

          <option value="zurdo">Zurdo</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="perfil-pala">
          Pala
        </label>

        <input
          id="perfil-pala"
          value={form.pala}
          onChange={(e) => actualizarCampo("pala", e.target.value)}
          disabled={estado === "enviando"}
          maxLength={160}
          className="w-full rounded-card border border-navy/20 px-4 py-3 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="perfil-instagram">
          Instagram
        </label>

        <input
          id="perfil-instagram"
          value={form.instagram}
          onChange={(e) => actualizarCampo("instagram", e.target.value)}
          disabled={estado === "enviando"}
          maxLength={160}
          className="w-full rounded-card border border-navy/20 px-4 py-3 disabled:opacity-50"
        />
      </div>

      <div className="rounded-card bg-navy/5 p-4">
        <p className="font-semibold mb-2 text-sm">
          ¿Qué quieres que se vea en tu perfil público?
        </p>

        {CAMPOS_OPCIONALES.map((campo) => (
          <label
            key={campo.key}
            className="flex items-center gap-2 text-sm mb-1"
          >
            <input
              type="checkbox"
              checked={!!form.visibilidad_json[campo.key]}
              onChange={(e) =>
                actualizarVisibilidad(campo.key, e.target.checked)
              }
              disabled={estado === "enviando"}
            />

            {campo.label}
          </label>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-coral">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void guardar()}
        disabled={estado === "enviando"}
        className="rounded-card bg-coral text-offwhite font-display px-6 py-3 disabled:opacity-50"
      >
        {estado === "enviando" ? "Guardando..." : "Guardar cambios"}
      </button>

      {estado === "ok" ? (
        <p role="status" className="text-sm text-sage">
          Perfil actualizado.
        </p>
      ) : null}
    </div>
  );
}
