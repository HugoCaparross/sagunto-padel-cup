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
        .select(
          "id, categorias:categories(nombre), players(nombre, apellidos, email)",
        )
        .eq("tournament_id", tournament.id)
        .eq("disponible", true)
    : { data: null };

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-2">Inscripción</h1>

      <p className="text-navy/70 mb-8">{tournament.nombre}</p>

      {tournament.estado !== "inscripciones_abiertas" ? (
        <p className="rounded-card bg-navy/5 p-6">
          Las inscripciones para este torneo no están abiertas ahora mismo.
        </p>
      ) : (
        <>
          {user && !!bolsa?.length && (
            <div className="mb-10 rounded-card bg-sage/20 border border-sage p-5">
              <p className="font-semibold mb-2">Jugadores buscando pareja</p>

              <ul className="text-sm space-y-1">
                {bolsa.map((b) => {
                  const jugador = b.players as unknown as {
                    nombre: string;
                    apellidos: string;
                    email: string;
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
                      {categoria?.nombre ?? "Categoría pendiente"} —{" "}
                      <a
                        href={`mailto:${jugador.email}`}
                        className="underline text-coral"
                      >
                        {jugador.email}
                      </a>
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
