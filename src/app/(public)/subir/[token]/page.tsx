// Ruta: src/app/(public)/subir/[token]/page.tsx
"use client";

import { use, useState } from "react";
import { subirFotoColaborador } from "./actions";

export default function SubirFotosPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [estado, setEstado] = useState<"idle" | "subiendo" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function subir(formData: FormData) {
    setEstado("subiendo");
    setError(null);
    const res = await subirFotoColaborador(token, formData);
    if (res.ok) setEstado("ok");
    else {
      setEstado("error");
      setError(res.error ?? "Error al subir");
    }
  }

  return (
    <main className="max-w-md mx-auto px-5 py-16 text-center">
      <h1 className="font-display text-2xl mb-2">Subir fotos del torneo</h1>
      <p className="text-navy/70 text-sm mb-8">
        Sube tantas fotos como quieras, una a una.
      </p>

      <form action={subir} className="space-y-4">
        <input type="file" name="foto" accept="image/*" required className="w-full" />
        <button
          type="submit"
          disabled={estado === "subiendo"}
          className="w-full rounded-card bg-coral text-offwhite font-display text-lg py-4 disabled:opacity-50"
        >
          {estado === "subiendo" ? "Subiendo..." : "Subir foto"}
        </button>
      </form>

      {estado === "ok" && (
        <p className="text-sage font-semibold mt-4">
          ¡Foto subida! Puedes subir otra cuando quieras.
        </p>
      )}
      {error && <p className="text-coral mt-4">{error}</p>}
    </main>
  );
}