// Ruta: src/app/(private)/app/ajustes/page.tsx
"use client";

import { useState } from "react";
import { cambiarPassword, darseDeBaja } from "./actions";

export default function AjustesPage() {
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function guardarPassword() {
    setEstado("enviando");
    setError(null);
    const res = await cambiarPassword(password);
    if (res.ok) {
      setEstado("ok");
      setPassword("");
    } else {
      setEstado("error");
      setError(res.error ?? "Error");
    }
  }

  async function confirmarBaja() {
    if (confirm("¿Seguro que quieres darte de baja? Esta acción no se puede deshacer desde la web.")) {
      await darseDeBaja();
    }
  }

  return (
    <main className="max-w-md mx-auto px-5 py-12 space-y-10">
      <h1 className="font-display text-3xl">Ajustes</h1>

      <div>
        <h2 className="font-display text-lg mb-3">Cambiar contraseña</h2>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-card border border-navy/20 px-4 py-3 mb-3"
        />
        {error && <p className="text-coral text-sm mb-2">{error}</p>}
        {estado === "ok" && <p className="text-sm text-sage mb-2">Contraseña actualizada.</p>}
        <button
          onClick={guardarPassword}
          disabled={estado === "enviando"}
          className="rounded-card bg-coral text-offwhite font-display px-6 py-3 disabled:opacity-50"
        >
          {estado === "enviando" ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <div>
        <h2 className="font-display text-lg mb-3">Baja de cuenta</h2>
        <p className="text-sm text-navy/70 mb-3">
          Puedes darte de baja en cualquier momento. Tus datos se anonimizarán
          pasados 12 meses según nuestra política de privacidad.
        </p>
        <button onClick={confirmarBaja} className="text-coral underline text-sm">
          Darme de baja
        </button>
      </div>
    </main>
  );
}