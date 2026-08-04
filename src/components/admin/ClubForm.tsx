// Ruta: src/components/admin/ClubForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearClub } from "@/app/(admin)/admin/ajustes/actions";

export default function ClubForm() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", direccion: "", num_pistas: 4, telefono: "" });
  const [enviando, setEnviando] = useState(false);

  async function crear() {
    if (!form.nombre) return;
    setEnviando(true);
    await crearClub(form);
    setForm({ nombre: "", direccion: "", num_pistas: 4, telefono: "" });
    setEnviando(false);
    router.refresh();
  }

  return (
    <div className="rounded-card bg-navy-light p-4 space-y-3 max-w-md">
      <input
        placeholder="Nombre del club"
        value={form.nombre}
        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
        className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
      />
      <input
        placeholder="Dirección"
        value={form.direccion}
        onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
        className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
      />
      <div className="flex gap-3">
        <input
          type="number"
          placeholder="Nº pistas"
          value={form.num_pistas}
          onChange={(e) => setForm((f) => ({ ...f, num_pistas: Number(e.target.value) }))}
          className="w-1/2 rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
        <input
          placeholder="Teléfono"
          value={form.telefono}
          onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
          className="w-1/2 rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
      </div>
      <button
        onClick={crear}
        disabled={enviando}
        className="rounded-card bg-coral text-offwhite text-sm px-4 py-2 disabled:opacity-50"
      >
        {enviando ? "Creando..." : "Crear club"}
      </button>
    </div>
  );
}