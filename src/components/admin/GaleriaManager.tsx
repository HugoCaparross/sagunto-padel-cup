// Ruta: src/components/admin/GaleriaManager.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { subirFoto, borrarFoto } from "@/app/(admin)/admin/torneos/[id]/galeria/actions";

type Foto = { id: string; url: string };

export default function GaleriaManager({
  torneoId,
  fotosIniciales,
}: {
  torneoId: string;
  fotosIniciales: Foto[];
}) {
  const router = useRouter();
  const [fotos, setFotos] = useState(fotosIniciales);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subir(formData: FormData) {
    setSubiendo(true);
    setError(null);
    const res = await subirFoto(torneoId, formData);
    if (!res.ok) setError(res.error ?? "Error al subir");
    setSubiendo(false);
    router.refresh();
  }

  async function borrar(id: string) {
    setFotos((prev) => prev.filter((f) => f.id !== id));
    await borrarFoto(torneoId, id);
  }

  return (
    <div className="space-y-6">
      <form action={subir} className="flex items-center gap-3">
        <input type="file" name="foto" accept="image/*" required className="text-sm" />
        <button
          type="submit"
          disabled={subiendo}
          className="rounded-card bg-coral text-offwhite text-sm px-4 py-2 disabled:opacity-50"
        >
          {subiendo ? "Subiendo..." : "Subir foto"}
        </button>
      </form>
      {error && <p className="text-coral text-sm">{error}</p>}

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {fotos.map((f) => (
          <div key={f.id} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt="" className="rounded-card aspect-square object-cover w-full" />
            <button
              onClick={() => borrar(f.id)}
              className="absolute top-1 right-1 bg-navy/80 text-offwhite text-xs rounded-full w-6 h-6"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {!fotos.length && <p className="text-offwhite/60 text-sm">Aún no hay fotos.</p>}
    </div>
  );
}