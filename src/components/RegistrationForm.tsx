// Ruta: src/components/RegistrationForm.tsx — sustituye entero al archivo actual
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

type Categoria = { id: string; nombre: string };

export default function RegistrationForm({
  torneoSlug,
  categorias,
}: {
  torneoSlug: string;
  categorias: Categoria[];
}) {
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
    defaultValues: { quiere_bolsa_pareja: false },
  });

  const tieneCompañero = watch("compañero_email");

  async function onSubmit(values: RegistrationFormValues) {
    setEnviando(true);
    setError(null);
    const res = await registerPair(torneoSlug, values);
    if (res.ok) {
      router.push(`/torneo/${torneoSlug}/inscribirse/completada`);
    } else {
      setError(res.error ?? "No se ha podido completar la inscripción");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-md">
      <div>
        <label className="block font-semibold mb-1" htmlFor="categoria_id">
          Categoría
        </label>
        <select id="categoria_id" {...register("categoria_id")} className="input">
          <option value="">Selecciona tu categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {errors.categoria_id && (
          <p className="text-coral text-sm mt-1">{errors.categoria_id.message}</p>
        )}
      </div>

      <div>
        <label className="block font-semibold mb-1" htmlFor="talla_camiseta">
          Talla de camiseta (Welcome Pack)
        </label>
        <select id="talla_camiseta" {...register("talla_camiseta")} className="input">
          <option value="">Selecciona tu talla</option>
          {["XS", "S", "M", "L", "XL", "XXL"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {errors.talla_camiseta && (
          <p className="text-coral text-sm mt-1">{errors.talla_camiseta.message}</p>
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
          className="input"
        />
        {errors.compañero_email && (
          <p className="text-coral text-sm mt-1">{errors.compañero_email.message}</p>
        )}
      </div>

      {!tieneCompañero && (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" {...register("quiere_bolsa_pareja")} />
          Aún no tengo pareja, apúntame a la bolsa de &quot;busco pareja&quot;
        </label>
      )}

      {error && <p className="text-coral font-semibold">{error}</p>}

      <button type="submit" disabled={enviando} className="btn-primary w-full">
        {enviando ? "Enviando..." : "Confirmar inscripción"}
      </button>
    </form>
  );
}