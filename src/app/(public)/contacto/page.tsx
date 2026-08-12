// Ruta: src/app/(public)/contacto/page.tsx

"use client";

import { useState } from "react";
import { enviarContacto } from "./actions";

const INITIAL_FORM = {
  nombre: "",
  email: "",
  mensaje: "",
  empresa: "",
};

type Estado = "idle" | "enviando" | "ok" | "error";

export default function ContactoPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    if (estado === "enviando") {
      return;
    }

    setEstado("enviando");
    setError(null);

    const resultado = await enviarContacto(form);

    if (resultado.ok) {
      setEstado("ok");
      setForm(INITIAL_FORM);
      return;
    }

    setEstado("error");
    setError(resultado.error ?? "No se ha podido enviar el mensaje.");
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl">Contacto</h1>
        <p className="mt-2 text-sm leading-6 text-navy/65">
          Si no encuentras respuesta en el reglamento o las preguntas
          frecuentes, puedes escribir a la organización.
        </p>
      </header>

      {estado === "ok" ? (
        <div
          role="status"
          aria-live="polite"
          className="border border-sage bg-sage/10 p-5"
        >
          <p className="font-semibold">Mensaje enviado.</p>
          <p className="mt-1 text-sm text-navy/70">
            Hemos recibido tu consulta y te responderemos lo antes posible.
          </p>
          <button
            type="button"
            onClick={() => setEstado("idle")}
            className="mt-4 text-sm font-semibold underline underline-offset-4"
          >
            Enviar otra consulta
          </button>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void enviar();
          }}
          noValidate
        >
          <div>
            <label
              htmlFor="contacto-nombre"
              className="mb-1.5 block text-sm font-semibold"
            >
              Nombre
            </label>
            <input
              id="contacto-nombre"
              name="nombre"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              value={form.nombre}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nombre: event.target.value,
                }))
              }
              disabled={estado === "enviando"}
              className="w-full rounded-card border border-navy/20 bg-offwhite px-4 py-3 outline-none focus:border-coral disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="contacto-email"
              className="mb-1.5 block text-sm font-semibold"
            >
              Email
            </label>
            <input
              id="contacto-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              disabled={estado === "enviando"}
              className="w-full rounded-card border border-navy/20 bg-offwhite px-4 py-3 outline-none focus:border-coral disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="contacto-mensaje"
              className="mb-1.5 block text-sm font-semibold"
            >
              Mensaje
            </label>
            <textarea
              id="contacto-mensaje"
              name="mensaje"
              required
              minLength={5}
              maxLength={2_000}
              rows={7}
              value={form.mensaje}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  mensaje: event.target.value,
                }))
              }
              disabled={estado === "enviando"}
              className="w-full rounded-card border border-navy/20 bg-offwhite px-4 py-3 outline-none focus:border-coral disabled:opacity-50"
            />
            <p className="mt-1 text-right text-xs text-navy/45">
              {form.mensaje.length}/2000
            </p>
          </div>

          <input
            name="empresa"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            value={form.empresa}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                empresa: event.target.value,
              }))
            }
          />

          {error ? (
            <p
              role="alert"
              aria-live="polite"
              className="text-sm font-semibold text-coral"
            >
              {error}
            </p>
          ) : null}

          <p className="text-xs leading-5 text-navy/55">
            Utilizaremos los datos que facilites únicamente para responder a tu
            consulta. Consulta la política de privacidad para más información.
          </p>

          <button
            type="submit"
            disabled={estado === "enviando"}
            className="w-full rounded-card bg-coral px-5 py-3 font-display text-lg text-offwhite disabled:cursor-not-allowed disabled:opacity-50"
          >
            {estado === "enviando" ? "Enviando..." : "Enviar mensaje"}
          </button>
        </form>
      )}
    </main>
  );
}
