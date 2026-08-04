// Ruta: src/app/(public)/torneo/[slug]/page.tsx — sustituye entero al archivo actual
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const ESTADO_LABEL: Record<string, string> = {
  borrador: "Próximamente",
  publicado: "Próximamente",
  inscripciones_abiertas: "Inscripciones abiertas",
  en_juego: "En juego",
  finalizado: "Finalizado",
  archivado: "Finalizado",
};

export default async function TorneoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre, estado, fecha_inicio, fecha_fin, club_id")
    .eq("slug", slug)
    .single();

  if (!torneo) notFound();

  const { data: club } = torneo.club_id
    ? await supabase
        .from("clubs")
        .select("nombre, direccion")
        .eq("id", torneo.club_id)
        .single()
    : { data: null };

  return (
    <main className="max-w-3xl mx-auto px-5 py-12">
      <span className="inline-block bg-sage text-navy text-sm font-semibold px-3 py-1 rounded-card mb-4">
        {ESTADO_LABEL[torneo.estado] ?? torneo.estado}
      </span>

      <h1 className="font-display text-4xl mb-2">{torneo.nombre}</h1>

      <p className="text-navy/70 mb-8">
        {new Date(torneo.fecha_inicio).toLocaleDateString("es-ES", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        {club && ` · ${club.nombre}`}
      </p>

      {torneo.estado === "inscripciones_abiertas" && (
        <Link
          href={`/torneo/${slug}/inscribirse`}
          className="inline-block rounded-card bg-coral text-offwhite font-display text-lg px-8 py-4"
        >
          Inscríbete
        </Link>
      )}

      <nav className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href={`/torneo/${slug}/participantes`} className="underline">
          Participantes
        </Link>
        <Link href={`/torneo/${slug}/grupos`} className="underline">
          Grupos
        </Link>
        <Link href={`/torneo/${slug}/horarios`} className="underline">
          Horarios
        </Link>
        <Link href={`/torneo/${slug}/cuadros`} className="underline">
          Cuadros
        </Link>
        <Link href={`/torneo/${slug}/resultados`} className="underline">
          Resultados
        </Link>
        <Link href={`/torneo/${slug}/premios`} className="underline">
          Premios
        </Link>
      </nav>
    </main>
  );
}