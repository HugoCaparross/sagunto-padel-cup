// Ruta: src/app/(private)/app/ajustes/page.tsx

"use client";

import { useState } from "react";
import { cambiarPassword, darseDeBaja } from "./actions";

type Estado = "idle" | "enviando" | "ok" | "error";

export default function AjustesPage() {
  const [password, setPassword] = useState("");

  const [estadoPassword, setEstadoPassword] = useState<Estado>("idle");

  const [errorPassword, setErrorPassword] = useState<string | null>(null);

  const [bajaAbierta, setBajaAbierta] = useState(false);

  const [bajaEnviando, setBajaEnviando] = useState(false);

  const [errorBaja, setErrorBaja] = useState<string | null>(null);

  async function guardarPassword() {
    setEstadoPassword("enviando");
    setErrorPassword(null);

    const resultado = await cambiarPassword(password);

    if (resultado.ok) {
      setEstadoPassword("ok");
      setPassword("");
      return;
    }

    setEstadoPassword("error");
    setErrorPassword(
      resultado.error ?? "No se ha podido cambiar la contraseña",
    );
  }

  async function confirmarBaja() {
    setBajaEnviando(true);
    setErrorBaja(null);

    try {
      await darseDeBaja();
    } catch (error) {
      console.error("[app/ajustes] Error tramitando baja:", error);

      setBajaEnviando(false);
      setErrorBaja("No se ha podido tramitar la baja. Inténtalo de nuevo.");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 md:px-8 md:py-10">
      <header className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-sage">
          Mi cuenta
        </p>

        <h1 className="font-display text-3xl tracking-tight md:text-4xl">
          Ajustes
        </h1>

        <p className="mt-2 text-sm leading-6 text-navy/65">
          Gestiona la seguridad y el estado de tu cuenta.
        </p>
      </header>

      <div className="space-y-10">
        <section aria-labelledby="password-title">
          <div className="mb-4">
            <h2 id="password-title" className="font-display text-xl">
              Cambiar contraseña
            </h2>

            <p className="mt-1 text-sm leading-6 text-navy/60">
              Utiliza una contraseña de al menos 8 caracteres.
            </p>
          </div>

          <div className="max-w-md">
            <label
              htmlFor="nueva-password"
              className="mb-2 block text-sm font-semibold"
            >
              Nueva contraseña
            </label>

            <input
              id="nueva-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={estadoPassword === "enviando"}
              className="mb-3 w-full rounded-card border border-navy/20 bg-offwhite px-4 py-3 outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20 disabled:opacity-50"
            />

            {errorPassword ? (
              <p role="alert" className="mb-3 text-sm text-coral">
                {errorPassword}
              </p>
            ) : null}

            {estadoPassword === "ok" ? (
              <p role="status" className="mb-3 text-sm text-sage">
                Contraseña actualizada correctamente.
              </p>
            ) : null}

            <button
              type="button"
              onClick={guardarPassword}
              disabled={estadoPassword === "enviando" || password.length === 0}
              className="rounded-card bg-coral px-6 py-3 font-display text-sm text-offwhite transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {estadoPassword === "enviando"
                ? "Guardando..."
                : "Guardar contraseña"}
            </button>
          </div>
        </section>

        <section
          aria-labelledby="baja-title"
          className="border-t border-navy/10 pt-10"
        >
          <div className="max-w-xl">
            <h2 id="baja-title" className="font-display text-xl">
              Baja de cuenta
            </h2>

            <p className="mt-2 text-sm leading-6 text-navy/65">
              Puedes solicitar la baja de tu cuenta en cualquier momento. La
              cuenta dejará de estar activa y se aplicará el tratamiento de
              datos previsto en la política de privacidad.
            </p>

            {errorBaja ? (
              <p role="alert" className="mt-3 text-sm text-coral">
                {errorBaja}
              </p>
            ) : null}

            {!bajaAbierta ? (
              <button
                type="button"
                onClick={() => {
                  setErrorBaja(null);
                  setBajaAbierta(true);
                }}
                className="mt-5 text-sm font-semibold text-coral underline underline-offset-4"
              >
                Solicitar baja de cuenta
              </button>
            ) : (
              <div className="mt-5 border border-coral/30 bg-coral/5 p-5">
                <h3 className="text-sm font-semibold">¿Quieres continuar?</h3>

                <p className="mt-2 text-sm leading-6 text-navy/65">
                  Esta acción cerrará tu sesión y marcará tu cuenta como dada de
                  baja. Comprueba que realmente quieres continuar antes de
                  confirmarlo.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={confirmarBaja}
                    disabled={bajaEnviando}
                    className="rounded-card bg-coral px-5 py-2.5 text-sm font-semibold text-offwhite disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {bajaEnviando ? "Tramitando..." : "Confirmar baja"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBajaAbierta(false);
                      setErrorBaja(null);
                    }}
                    disabled={bajaEnviando}
                    className="rounded-card border border-navy/15 px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
