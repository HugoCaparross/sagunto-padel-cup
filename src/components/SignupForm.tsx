// Ruta: src/components/SignupForm.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";
import { signup } from "@/app/(public)/registro/actions";

export default function SignupForm() {
  const [error, setError] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values: SignupFormValues) {
    if (enviando) {
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const res = await signup(values);

      if (res && !res.ok) {
        setError(res.error ?? "No se ha podido crear la cuenta.");
      }
    } catch (actionError) {
      /*
       * signup() puede ejecutar redirect()
       * cuando el registro termina correctamente.
       * Ese flujo no debe convertirse en un mensaje
       * de error de usuario.
       */
      if (
        actionError &&
        typeof actionError === "object" &&
        "digest" in actionError &&
        typeof actionError.digest === "string" &&
        actionError.digest.startsWith("NEXT_REDIRECT")
      ) {
        throw actionError;
      }

      console.error("[SignupForm] Error creando cuenta:", actionError);

      setError("Ha ocurrido un error inesperado al crear la cuenta.");
    } finally {
      setEnviando(false);
    }
  }

  const campos: {
    id: keyof SignupFormValues;
    label: string;
    type: string;
    autoComplete?: string;
  }[] = [
    {
      id: "nombre",
      label: "Nombre",
      type: "text",
      autoComplete: "given-name",
    },
    {
      id: "apellidos",
      label: "Apellidos",
      type: "text",
      autoComplete: "family-name",
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      autoComplete: "email",
    },
    {
      id: "telefono",
      label: "Teléfono",
      type: "tel",
      autoComplete: "tel",
    },
    {
      id: "password",
      label: "Contraseña",
      type: "password",
      autoComplete: "new-password",
    },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-5">
      {campos.map((campo) => {
        const errorCampo = errors[campo.id];
        const errorId = `${campo.id}-error`;

        return (
          <div key={campo.id}>
            <label className="mb-1 block font-semibold" htmlFor={campo.id}>
              {campo.label}
            </label>

            <input
              id={campo.id}
              type={campo.type}
              autoComplete={campo.autoComplete}
              {...register(campo.id)}
              disabled={enviando}
              aria-invalid={errorCampo ? true : undefined}
              aria-describedby={errorCampo ? errorId : undefined}
              className="w-full rounded-card border border-navy/20 px-4 py-3 disabled:opacity-50"
            />

            {errorCampo ? (
              <p id={errorId} role="alert" className="mt-1 text-sm text-coral">
                {errorCampo.message}
              </p>
            ) : null}
          </div>
        );
      })}

      {error ? (
        <p role="alert" aria-live="polite" className="font-semibold text-coral">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-card bg-coral py-4 font-display text-lg text-offwhite disabled:opacity-50"
      >
        {enviando ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-coral underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
