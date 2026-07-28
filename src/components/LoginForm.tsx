// Ruta: src/components/LoginForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { login } from "@/app/login/actions";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setEnviando(true);
    setError(null);
    const res = await login(values);
    if (res && !res.ok) setError(res.error);
    setEnviando(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-sm">
      <div>
        <label className="block font-semibold mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        />
        {errors.email && (
          <p className="text-coral text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        />
        {errors.password && (
          <p className="text-coral text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {error && <p className="text-coral font-semibold">{error}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-card bg-coral text-offwhite font-display text-lg py-4 disabled:opacity-50"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-sm text-center">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="underline text-coral">
          Regístrate
        </Link>
      </p>
    </form>
  );
}