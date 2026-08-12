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
        router.push(`/torneo/${torneoSlug}/completada`);

        return;
      }

      setError(res.error ?? "No se ha podido completar la inscripción.");
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5">
      <div>
        <label className="mb-1 block font-semibold" htmlFor="categoria_id">
          Categoría
        </label>

        <select
          id="categoria_id"
          {...register("categoria_id")}
          disabled={enviando}
          aria-invalid={errors.categoria_id ? true : undefined}
          aria-describedby={
            errors.categoria_id ? "categoria_id-error" : undefined
          }
          className="input disabled:opacity-50"
        >
          <option value="">Selecciona tu categoría</option>

          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>

        {errors.categoria_id ? (
          <p
            id="categoria_id-error"
            role="alert"
            className="mt-1 text-sm text-coral"
          >
            {errors.categoria_id.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block font-semibold" htmlFor="talla_camiseta">
          Talla de camiseta (Welcome Pack)
        </label>

        <select
          id="talla_camiseta"
          {...register("talla_camiseta")}
          disabled={enviando}
          aria-invalid={errors.talla_camiseta ? true : undefined}
          aria-describedby={
            errors.talla_camiseta ? "talla_camiseta-error" : undefined
          }
          className="input disabled:opacity-50"
        >
          <option value="">Selecciona tu talla</option>

          {["XS", "S", "M", "L", "XL", "XXL"].map((talla) => (
            <option key={talla} value={talla}>
              {talla}
            </option>
          ))}
        </select>

        {errors.talla_camiseta ? (
          <p
            id="talla_camiseta-error"
            role="alert"
            className="mt-1 text-sm text-coral"
          >
            {errors.talla_camiseta.message}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block font-semibold" htmlFor="compañero_email">
          Email de tu compañero/a (si ya lo tienes)
        </label>

        <input
          id="compañero_email"
          type="email"
          autoComplete="email"
          placeholder="compañero@email.com"
          {...register("compañero_email")}
          disabled={enviando}
          aria-invalid={errors.compañero_email ? true : undefined}
          aria-describedby={
            errors.compañero_email ? "compañero_email-error" : undefined
          }
          className="input disabled:opacity-50"
        />

        {errors.compañero_email ? (
          <p
            id="compañero_email-error"
            role="alert"
            className="mt-1 text-sm text-coral"
          >
            {errors.compañero_email.message}
          </p>
        ) : null}
      </div>

      {!tieneCompañero ? (
        <div>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              {...register("quiere_bolsa_pareja")}
              disabled={enviando}
              aria-invalid={errors.quiere_bolsa_pareja ? true : undefined}
              aria-describedby={
                errors.quiere_bolsa_pareja
                  ? "quiere_bolsa_pareja-error"
                  : undefined
              }
              className="mt-1"
            />

            <span>
              Aún no tengo pareja, apúntame a la bolsa de &quot;busco
              pareja&quot;
            </span>
          </label>

          {errors.quiere_bolsa_pareja ? (
            <p
              id="quiere_bolsa_pareja-error"
              role="alert"
              className="mt-1 text-sm text-coral"
            >
              {errors.quiere_bolsa_pareja.message}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" aria-live="polite" className="font-semibold text-coral">
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
        <p className="text-center text-xs text-navy/50">
          No cierres esta ventana mientras procesamos la inscripción.
        </p>
      ) : null}
    </form>
  );
}
