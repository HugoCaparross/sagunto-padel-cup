// Ruta: src/components/admin/PatrocinadoresManager.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearSponsor,
  borrarSponsor,
} from "@/app/(admin)/admin/torneos/[id]/patrocinadores/actions";

type Sponsor = {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
};

export default function PatrocinadoresManager({
  torneoId,
  sponsorsIniciales,
}: {
  torneoId: string;
  sponsorsIniciales: Sponsor[];
}) {
  const router = useRouter();
  const [sponsors, setSponsors] = useState(sponsorsIniciales);
  const [form, setForm] = useState({
    nombre: "",
    logo_url: "",
    descripcion: "",
    enlace: "",
    tipo: "comercial" as "comercial" | "institucion",
  });
  const [enviando, setEnviando] = useState(false);

  async function crear() {
    if (!form.nombre) return;
    setEnviando(true);
    await crearSponsor(torneoId, form);
    setForm({ nombre: "", logo_url: "", descripcion: "", enlace: "", tipo: "comercial" });
    setEnviando(false);
    router.refresh();
  }

  async function borrar(id: string) {
    setSponsors((prev) => prev.filter((s) => s.id !== id));
    await borrarSponsor(torneoId, id);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="rounded-card bg-navy-light p-4 space-y-3">
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
        <input
          placeholder="URL del logo"
          value={form.logo_url}
          onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Descripción"
          value={form.descripcion}
          onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
        <input
          placeholder="Enlace web"
          value={form.enlace}
          onChange={(e) => setForm((f) => ({ ...f, enlace: e.target.value }))}
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        />
        <select
          value={form.tipo}
          onChange={(e) =>
            setForm((f) => ({ ...f, tipo: e.target.value as "comercial" | "institucion" }))
          }
          className="w-full rounded-card border border-offwhite/20 bg-navy px-3 py-2 text-sm"
        >
          <option value="comercial">Patrocinador comercial</option>
          <option value="institucion">Institución</option>
        </select>
        <button
          onClick={crear}
          disabled={enviando}
          className="rounded-card bg-coral text-offwhite text-sm px-4 py-2 disabled:opacity-50"
        >
          {enviando ? "Añadiendo..." : "Añadir"}
        </button>
      </div>

      <ul className="space-y-2">
        {sponsors.map((s) => (
          <li key={s.id} className="rounded-card bg-navy-light px-4 py-3 flex justify-between items-center">
            <span className="text-sm">
              {s.nombre} <span className="text-offwhite/50 text-xs">({s.tipo})</span>
            </span>
            <button onClick={() => borrar(s.id)} className="text-coral text-xs">
              Borrar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}