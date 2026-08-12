// Ruta: src/components/RegistrationForm.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  registrationSchema,
  type RegistrationFormValues,
} from "@/lib/validations/registration";
import { registerPair } from "@/app/(public)/torneo/[slug]/inscribirse/actions";

type Categoria = {
  id: string;
  nombre: string;
};

interface RegistrationFormProps {
  torneoSlug: string;
  categorias: Categoria[];
}

export default function RegistrationForm({
  torneoSlug,
  categorias,
}: RegistrationFormProps) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      quiere_bolsa_pareja: false,
    },
  });

  const tieneCompañero = watch("compañero_email");

  async function onSubmit(values: RegistrationFormValues) {
    if (enviando) {
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const res = await registerPair(torneoSlug, values);

      if (res.ok) {
        router.push(`/torneo/${torneoSlug}/inscribirse/completada`);

        return;
      }

      setError(res.error ?? "No se ha podido completar la inscripción");
    } catch (actionError) {
      console.error(
        "[RegistrationForm] Error enviando inscripción:",
        actionError,
      );

      setError(
        "Ha ocurrido un error inesperado. Comprueba tu conexión e inténtalo de nuevo.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      <div>
        <label className="block font-semibold mb-1" htmlFor="categoria_id">
          Categoría
        </label>

        <select
          id="categoria_id"
          {...register("categoria_id")}
          disabled={enviando}
          className="input disabled:opacity-50"
        >
          <option value="">Selecciona tu categoría</option>

          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        {errors.categoria_id && (
          <p role="alert" className="text-coral text-sm mt-1">
            {errors.categoria_id.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="talla_camiseta">
          Talla de camiseta (Welcome Pack)
        </label>

        <select
          id="talla_camiseta"
          {...register("talla_camiseta")}
          disabled={enviando}
          className="input disabled:opacity-50"
        >
          <option value="">Selecciona tu talla</option>

          {["XS", "S", "M", "L", "XL", "XXL"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {errors.talla_camiseta && (
          <p role="alert" className="text-coral text-sm mt-1">
            {errors.talla_camiseta.message}
          </p>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="compañero_email">
          Email de tu compañero/a (si ya lo tienes)
        </label>

        <input
          id="compañero_email"
          type="email"
          autoComplete="email"
          placeholder="compañero@email.com"
          {...register("compañero_email")}
          disabled={enviando}
          className="input disabled:opacity-50"
        />

        {errors.compañero_email && (
          <p role="alert" className="text-coral text-sm mt-1">
            {errors.compañero_email.message}
          </p>
        )}
      </div>

      {!tieneCompañero && (
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            {...register("quiere_bolsa_pareja")}
            disabled={enviando}
          />
          Aún no tengo pareja, apúntame a la bolsa de &quot;busco pareja&quot;
        </label>
      )}

      {error ? (
        <p role="alert" aria-live="polite" className="text-coral font-semibold">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={enviando}
        className="btn-primary w-full disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Confirmar inscripción"}
      </button>

      {enviando ? (
        <p className="text-xs text-navy/50 text-center">
          No cierres esta ventana mientras procesamos la inscripción.
        </p>
      ) : null}
    </form>
  );
}
