// Ruta: src/app/(public)/jugador/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function JugadorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: jugador } = await supabase
    .from("players")
    .select("nombre, apellidos, ciudad, mano_dominante, pala, instagram, categories(nombre), visibilidad_json")
    .eq("id", id)
    .eq("estado", "activo")
    .single();

  if (!jugador) notFound();

  const hoy = new Date().toISOString().slice(0, 10);
  const { data: puntos } = await supabase
    .from("ranking_points")
    .select("puntos_obtenidos")
    .eq("player_id", id)
    .gte("fecha_caducidad", hoy);

  const totalPuntos = puntos?.reduce((sum, p) => sum + p.puntos_obtenidos, 0) ?? 0;

  const { data: historial } = await supabase
    .from("ranking_points")
    .select("ronda_alcanzada, puntos_obtenidos, fecha, tournaments(nombre)")
    .eq("player_id", id)
    .order("fecha", { ascending: false });

  const vis = (jugador.visibilidad_json ?? {}) as Record<string, boolean>;

  return (
    <main className="max-w-2xl mx-auto px-5 py-12">
      <h1 className="font-display text-3xl mb-1">
        {jugador.nombre} {jugador.apellidos}
      </h1>
      <p className="text-navy/70 mb-6">
        {(jugador.categories as unknown as { nombre: string })?.nombre}
      </p>

      <div className="rounded-card bg-navy text-offwhite p-5 mb-8 inline-block">
        <p className="text-sage text-sm uppercase mb-1">Puntos de ranking</p>
        <p className="font-display text-3xl">{totalPuntos}</p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-navy/70 mb-8">
        {vis.ciudad && jugador.ciudad && <span>📍 {jugador.ciudad}</span>}
        {vis.mano_dominante && jugador.mano_dominante && (
          <span>🎾 {jugador.mano_dominante}</span>
        )}
        {vis.pala && jugador.pala && <span>🏓 {jugador.pala}</span>}
        {vis.instagram && jugador.instagram && <span>📷 @{jugador.instagram}</span>}
      </div>

      <h2 className="font-display text-xl mb-3">Historial</h2>
      <ul className="space-y-2">
        {historial?.map((h, i) => (
          <li key={i} className="rounded-card bg-navy/5 px-4 py-3 flex justify-between text-sm">
            <span>
              {(h.tournaments as unknown as { nombre: string })?.nombre} —{" "}
              {h.ronda_alcanzada.replace(/_/g, " ")}
            </span>
            <span className="font-semibold">{h.puntos_obtenidos} pts</span>
          </li>
        ))}
      </ul>
      {!historial?.length && (
        <p className="text-navy/70 text-sm">Aún no tiene torneos disputados.</p>
      )}
    </main>
  );
}