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
  } = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupFormValues) {
    setEnviando(true);
    setError(null);
    const res = await signup(values);
    if (res && !res.ok) setError(res.error);
    setEnviando(false);
  }

  const campos: {
    id: keyof SignupFormValues;
    label: string;
    type: string;
  }[] = [
    { id: "nombre", label: "Nombre", type: "text" },
    { id: "apellidos", label: "Apellidos", type: "text" },
    { id: "email", label: "Email", type: "email" },
    { id: "telefono", label: "Teléfono", type: "tel" },
    { id: "password", label: "Contraseña", type: "password" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-sm">
      {campos.map((campo) => (
        <div key={campo.id}>
          <label className="block font-semibold mb-1" htmlFor={campo.id}>
            {campo.label}
          </label>
          <input
            id={campo.id}
            type={campo.type}
            {...register(campo.id)}
            className="w-full rounded-card border border-navy/20 px-4 py-3"
          />
          {errors[campo.id] && (
            <p className="text-coral text-sm mt-1">
              {errors[campo.id]?.message}
            </p>
          )}
        </div>
      ))}

      {error && <p className="text-coral font-semibold">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-card bg-coral text-offwhite font-display text-lg py-4 disabled:opacity-50"
      >
        {enviando ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-sm text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="underline text-coral">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}