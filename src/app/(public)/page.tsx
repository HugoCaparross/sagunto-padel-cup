// Ruta: src/app/(public)/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: proximo } = await supabase
    .from("tournaments")
    .select("nombre, slug, estado, fecha_inicio")
    .neq("estado", "borrador")
    .neq("estado", "finalizado")
    .neq("estado", "archivado")
    .order("fecha_inicio")
    .limit(1)
    .maybeSingle();

  return (
    <main>
      <section className="bg-navy text-offwhite px-5 py-20 text-center">
        <h1 className="font-display text-4xl sm:text-5xl mb-4">
          Sagunto Padel Cup
        </h1>
        <p className="text-offwhite/80 mb-8 max-w-md mx-auto">
          El circuito amateur de pádel de Sagunto. Compite, sube en el
          ranking y lucha por el Master Final.
        </p>

        {proximo ? (
          <div className="inline-block bg-navy-light rounded-card px-8 py-6">
            <p className="text-sage text-sm uppercase mb-1">
              Próximo torneo
            </p>
            <p className="font-display text-2xl mb-4">{proximo.nombre}</p>
            <p className="mb-4">
              {new Date(proximo.fecha_inicio).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <Link
              href={
                proximo.estado === "inscripciones_abiertas"
                  ? `/torneo/${proximo.slug}/inscribirse`
                  : `/torneo/${proximo.slug}`
              }
              className="inline-block rounded-card bg-coral text-offwhite font-display px-6 py-3"
            >
              {proximo.estado === "inscripciones_abiertas"
                ? "Inscríbete"
                : "Ver torneo"}
            </Link>
          </div>
        ) : (
          <p className="text-offwhite/60">
            Próxima fecha por confirmar — vuelve pronto.
          </p>
        )}
      </section>

      <section className="px-5 py-12 max-w-3xl mx-auto flex flex-wrap gap-4 justify-center text-center">
        <Link href="/calendario" className="underline">
          Calendario
        </Link>
        <Link href="/ranking" className="underline">
          Ranking
        </Link>
        <Link href="/jugadores" className="underline">
          Jugadores
        </Link>
        <Link href="/circuito" className="underline">
          El Circuito
        </Link>
        <Link href="/noticias" className="underline">
          Noticias
        </Link>
      </section>
    </main>
  );
}