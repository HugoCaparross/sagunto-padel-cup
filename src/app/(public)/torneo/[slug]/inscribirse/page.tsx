// Ruta: src/app/(public)/torneo/[slug]/inscribirse/page.tsx

import { createClient } from "@/lib/supabase/server";
import RegistrationForm from "@/components/RegistrationForm";
import { notFound } from "next/navigation";

export default async function InscribirsePage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, nombre, estado")
    .eq("slug", slug)
    .maybeSingle();

  if (tournamentError || !tournament) {
    notFound();
  }

  const { data: categorias } = await supabase
    .from("categories")
    .select("id, nombre")
    .order("nivel_orden");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bolsa } = user
    ? await supabase
        .from("partner_pool")
        .select("id, categorias:categories(nombre), players(nombre, apellidos)")
        .eq("tournament_id", tournament.id)
        .eq("disponible", true)
    : { data: null };

  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy/45">
        Torneo
      </p>
      <h1 className="mt-1 font-display text-4xl font-semibold mb-2">
        Inscripción
      </h1>

      <p className="text-navy/65 mb-8">{tournament.nombre}</p>

      {tournament.estado !== "inscripciones_abiertas" ? (
        <p className="border border-navy/10 bg-white p-6">
          Las inscripciones para este torneo no están abiertas ahora mismo.
        </p>
      ) : (
        <>
          {user && !!bolsa?.length && (
            <div className="mb-10 border border-sage/30 bg-sage/10 p-5">
              <p className="font-semibold mb-2">Jugadores buscando pareja</p>

              <ul className="text-sm space-y-1">
                {bolsa.map((b) => {
                  const jugador = b.players as unknown as {
                    nombre: string;
                    apellidos: string;
                  } | null;

                  const categoria = b.categorias as unknown as {
                    nombre: string;
                  } | null;

                  if (!jugador) {
                    return null;
                  }

                  return (
                    <li key={b.id}>
                      {jugador.nombre} {jugador.apellidos} —{" "}
                      {categoria?.nombre ?? "Categoría pendiente"}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <RegistrationForm torneoSlug={slug} categorias={categorias ?? []} />
        </>
      )}
    </main>
  );
}
