// Ruta: src/app/(public)/contacto/page.tsx
"use client";

import { useState } from "react";
import { enviarContacto } from "./actions";

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: "", email: "", mensaje: "", empresa: "" });
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");

  async function enviar() {
    setEstado("enviando");
    const res = await enviarContacto(form);
    setEstado(res.ok ? "ok" : "error");
    if (res.ok) setForm({ nombre: "", email: "", mensaje: "", empresa: "" });
  }

  return (
    <main className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl mb-8">Contacto</h1>

      {estado === "ok" ? (
        <p className="rounded-card bg-sage/20 border border-sage p-5">
          Mensaje enviado. Te responderemos lo antes posible.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void enviar(); }}>
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            className="w-full rounded-card border border-navy/20 px-4 py-3"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-card border border-navy/20 px-4 py-3"
          />
          <textarea
            placeholder="Tu mensaje"
            value={form.mensaje}
            onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
            rows={5}
            className="w-full rounded-card border border-navy/20 px-4 py-3"
          />
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            value={form.empresa}
            onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
          />
          {estado === "error" && (
            <p className="text-coral font-semibold">
              Algo ha fallado, inténtalo de nuevo.
            </p>
          )}
          <button
            type="submit"
            disabled={estado === "enviando"}
            className="w-full rounded-card bg-coral text-offwhite font-display text-lg py-4 disabled:opacity-50"
          >
            {estado === "enviando" ? "Enviando..." : "Enviar"}
          </button>
        </form>
      )}
    </main>
  );
}
