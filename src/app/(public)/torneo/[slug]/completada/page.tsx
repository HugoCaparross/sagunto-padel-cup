// Ruta: src/app/(public)/torneo/[slug]/inscribirse/completada/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ESTADO_INSCRIPCION, formatearFecha } from "@/lib/estados";
import { CheckCircle2 } from "lucide-react";

export default async function InscripcionCompletadaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre")
    .eq("slug", slug)
    .single();
  if (!torneo) notFound();

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const { data: pareja } = await supabase
    .from("pairs")
    .select(
      "estado, fecha_inscripcion, categories(nombre), player1:players!pairs_player_1_id_fkey(nombre), player2:players!pairs_player_2_id_fkey(nombre)",
    )
    .eq("tournament_id", torneo.id)
    .or(`player_1_id.eq.${player?.id ?? ""},player_2_id.eq.${player?.id ?? ""}`)
    .order("fecha_inscripcion", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!pareja) notFound();

  const p1 = (pareja.player1 as unknown as { nombre: string } | null)?.nombre;
  const p2 = (pareja.player2 as unknown as { nombre: string } | null)?.nombre;

  return (
    <main className="mx-auto max-w-xl px-5 py-16 text-center sm:py-20">
      <CheckCircle2
        size={56}
        className="mx-auto mb-4 text-sage"
        aria-hidden="true"
      />
      <h1 className="mb-8 font-display text-3xl font-semibold">
        Inscripción realizada correctamente
      </h1>

      <div className="card text-left space-y-3">
        <div>
          <p className="text-xs text-navy/50 uppercase">Torneo</p>
          <p className="font-semibold">{torneo.nombre}</p>
        </div>
        <div>
          <p className="text-xs text-navy/50 uppercase">Categoría</p>
          <p className="font-semibold">
            {(pareja.categories as unknown as { nombre: string })?.nombre}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy/50 uppercase">Pareja</p>
          <p className="font-semibold">
            {p1}
            {p2 ? ` / ${p2}` : " / Pendiente de compañero"}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy/50 uppercase">Estado</p>
          <p className="font-semibold">
            {ESTADO_INSCRIPCION[pareja.estado] ?? pareja.estado}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy/50 uppercase">Fecha de inscripción</p>
          <p className="font-semibold">
            {formatearFecha(pareja.fecha_inscripcion)}
          </p>
        </div>
      </div>

      <p className="text-sm text-navy/60 mt-6 mb-6">
        Te hemos enviado un email con los detalles. El pago de la inscripción se
        realiza el día del torneo, en el propio club.
      </p>

      <Link href="/app/torneos" className="btn-primary w-full">
        Ver mi inscripción
      </Link>
    </main>
  );
}
