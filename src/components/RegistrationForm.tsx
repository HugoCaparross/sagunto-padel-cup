// Ruta: src/components/RegistrationForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registrationSchema,
  type RegistrationFormValues,
} from "@/lib/validations/registration";
import { registerPair } from "@/app/(public)/torneo/[slug]/inscribirse/actions";

type Categoria = { id: string; nombre: string };

export default function RegistrationForm({
  torneoSlug,
  categorias,
}: {
  torneoSlug: string;
  categorias: Categoria[];
}) {
  const [resultado, setResultado] = useState<
    { ok: true; estado: string } | { ok: false; error: string } | null
  >(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { quiere_bolsa_pareja: false },
  });

  const tieneCompañero = watch("compañero_email");

  async function onSubmit(values: RegistrationFormValues) {
    setEnviando(true);
    const res = await registerPair(torneoSlug, values);
    setResultado(res as typeof resultado);
    setEnviando(false);
  }

  if (resultado?.ok) {
    return (
      <div className="rounded-card bg-sage/20 border border-sage p-6 text-navy">
        <h2 className="font-display text-2xl mb-2">
          {resultado.estado === "lista_espera"
            ? "¡Estás en lista de espera!"
            : "¡Inscripción confirmada!"}
        </h2>
        <p>Te hemos enviado un email con los detalles.</p>
      </div>
    );
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
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        >
          <option value="">Selecciona tu categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {errors.categoria_id && (
          <p className="text-coral text-sm mt-1">
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
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        >
          <option value="">Selecciona tu talla</option>
          {["XS", "S", "M", "L", "XL", "XXL"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.talla_camiseta && (
          <p className="text-coral text-sm mt-1">
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
          placeholder="compañero@email.com"
          {...register("compañero_email")}
          className="w-full rounded-card border border-navy/20 px-4 py-3"
        />
        {errors.compañero_email && (
          <p className="text-coral text-sm mt-1">
            {errors.compañero_email.message}
          </p>
        )}
      </div>

      {!tieneCompañero && (
        <label className="flex items-center gap-3">
          <input type="checkbox" {...register("quiere_bolsa_pareja")} />
          <span>
            Aún no tengo pareja, apúntame a la bolsa de "busco pareja"
          </span>
        </label>
      )}

      {resultado && !resultado.ok && (
        <p className="text-coral font-semibold">{resultado.error}</p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-card bg-coral text-offwhite font-display text-lg py-4 disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Confirmar inscripción"}
      </button>
    </form>
  );
}
