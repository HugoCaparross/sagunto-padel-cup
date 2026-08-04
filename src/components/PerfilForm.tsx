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
  { key: "ciudad", label: "Ciudad" },
  { key: "mano_dominante", label: "Mano dominante" },
  { key: "pala", label: "Pala" },
  { key: "instagram", label: "Instagram" },
] as const;

export default function PerfilForm({ inicial }: { inicial: Datos }) {
  const [form, setForm] = useState(inicial);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");

  async function guardar() {
    setEstado("enviando");
    await actualizarPerfil(form);
    setEstado("ok");
  }

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <label className="block font-semibold mb-1">Ciudad</label>
        <input
          value={form.ciudad}
          onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Mano dominante</label>
        <select
          value={form.mano_dominante}
          onChange={(e) => setForm((f) => ({ ...f, mano_dominante: e.target.value }))}
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        >
          <option value="">Sin especificar</option>
          <option value="diestro">Diestro</option>
          <option value="zurdo">Zurdo</option>
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1">Pala</label>
        <input
          value={form.pala}
          onChange={(e) => setForm((f) => ({ ...f, pala: e.target.value }))}
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Instagram</label>
        <input
          value={form.instagram}
          onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        />
      </div>

      <div className="rounded-card bg-navy/5 p-4">
        <p className="font-semibold mb-2 text-sm">
          ¿Qué quieres que se vea en tu perfil público?
        </p>
        {CAMPOS_OPCIONALES.map((c) => (
          <label key={c.key} className="flex items-center gap-2 text-sm mb-1">
            <input
              type="checkbox"
              checked={!!form.visibilidad_json[c.key]}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  visibilidad_json: { ...f.visibilidad_json, [c.key]: e.target.checked },
                }))
              }
            />
            {c.label}
          </label>
        ))}
      </div>

      <button
        onClick={guardar}
        disabled={estado === "enviando"}
        className="rounded-card bg-coral text-offwhite font-display px-6 py-3 disabled:opacity-50"
      >
        {estado === "enviando" ? "Guardando..." : "Guardar cambios"}
      </button>
      {estado === "ok" && <p className="text-sm text-sage">Perfil actualizado.</p>}
    </div>
  );
}