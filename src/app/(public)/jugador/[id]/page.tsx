// Ruta: src/app/(public)/jugador/[id]/page.tsx — sustituye entero al archivo actual
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { obtenerNivelJugador } from "@/lib/gamification";
import NivelBadge from "@/components/NivelBadge";

const INSIGNIAS: Record<string, { label: string; icono: string }> = {
  primer_torneo: { label: "Primer torneo", icono: "🎾" },
  "10_victorias": { label: "10 victorias", icono: "🏆" },
  "50_partidos": { label: "50 partidos", icono: "💪" },
  campeon: { label: "Campeón", icono: "🥇" },
  ascenso_categoria: { label: "Ascenso de categoría", icono: "📈" },
  jugador_fundador: { label: "Jugador fundador", icono: "🌱" },
};

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
  const nivel = await obtenerNivelJugador(supabase, id);

  const { data: insignias } = await supabase
    .from("badges")
    .select("tipo, fecha_obtenida")
    .eq("player_id", id);

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

      <div className="flex flex-wrap gap-4 mb-8">
        <div className="rounded-card bg-navy text-offwhite p-5 inline-block">
          <p className="text-sage text-sm uppercase mb-1">Puntos de ranking</p>
          <p className="font-display text-3xl">{totalPuntos}</p>
        </div>
        <NivelBadge etiqueta={nivel.etiqueta} xp={nivel.xp} siguienteUmbral={nivel.siguienteUmbral} />
      </div>

      {!!insignias?.length && (
        <div className="mb-8">
          <h2 className="font-display text-lg mb-3">Insignias</h2>
          <div className="flex flex-wrap gap-3">
            {insignias.map((ins, i) => {
              const info = INSIGNIAS[ins.tipo] ?? { label: ins.tipo, icono: "🎖️" };
              return (
                <div
                  key={i}
                  title={new Date(ins.fecha_obtenida).toLocaleDateString("es-ES")}
                  className="rounded-card bg-sage/20 border border-sage px-4 py-2 text-sm flex items-center gap-2"
                >
                  <span>{info.icono}</span>
                  {info.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

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