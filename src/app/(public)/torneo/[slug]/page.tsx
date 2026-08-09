// Ruta: src/app/(public)/torneo/[slug]/page.tsx — sustituye entero al archivo actual
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ESTADO_TORNEO, ESTADO_TORNEO_BADGE, formatearFecha } from "@/lib/estados";
import StatusBadge from "@/components/StatusBadge";
import {
  MapPin,
  Users,
  Trophy,
  Image as ImageIcon,
  Calendar,
  Grid3x3,
  ListChecks,
  Gift,
} from "lucide-react";

export default async function TorneoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("id, nombre, estado, fecha_inicio, fecha_fin, club_id, precio_texto, descripcion")
    .eq("slug", slug)
    .single();

  if (!torneo || torneo.estado === "borrador") notFound();

  const { data: club } = torneo.club_id
    ? await supabase.from("clubs").select("nombre, direccion").eq("id", torneo.club_id).single()
    : { data: null };

  const { data: categorias } = await supabase
    .from("tournament_categories")
    .select("categories(nombre)")
    .eq("tournament_id", torneo.id);

  const { count: inscritas } = await supabase
    .from("pairs")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", torneo.id)
    .eq("estado", "confirmada");

  const estadoTexto = ESTADO_TORNEO[torneo.estado] ?? torneo.estado;
  const estadoBadge = ESTADO_TORNEO_BADGE[torneo.estado] ?? "pending";

  // Navegación dinámica: no mostrar pestañas vacías según la fase del torneo
  const antesDelTorneo = ["publicado", "inscripciones_abiertas"].includes(torneo.estado);
  const enJuegoOFinalizado = ["en_juego", "finalizado", "archivado"].includes(torneo.estado);
  const finalizado = ["finalizado", "archivado"].includes(torneo.estado);

  const tabs = [
    { href: "", label: "Información", icon: Calendar, show: true },
    { href: "/participantes", label: "Participantes", icon: Users, show: true },
    { href: "/horarios", label: "Horarios", icon: Calendar, show: enJuegoOFinalizado },
    { href: "/grupos", label: "Grupos", icon: ListChecks, show: enJuegoOFinalizado },
    { href: "/cuadros", label: "Cuadros", icon: Grid3x3, show: enJuegoOFinalizado },
    { href: "/resultados", label: "Resultados", icon: Trophy, show: enJuegoOFinalizado },
    { href: "/premios", label: "Premios", icon: Gift, show: true },
    { href: "/fotos", label: "Fotos", icon: ImageIcon, show: finalizado },
  ].filter((t) => t.show);

  return (
    <main>
      <div className="hero-gradient text-offwhite px-5 py-12">
        <div className="max-w-3xl mx-auto">
          <StatusBadge texto={estadoTexto} tipo={estadoBadge} />
          <h1 className="font-display text-3xl sm:text-4xl mt-3 mb-2">{torneo.nombre}</h1>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-offwhite/80 text-sm mb-6">
            <span className="flex items-center gap-1.5">
              <Calendar size={16} aria-hidden="true" /> {formatearFecha(torneo.fecha_inicio)}
            </span>
            {club && (
              <span className="flex items-center gap-1.5">
                <MapPin size={16} aria-hidden="true" /> {club.nombre}
              </span>
            )}
            {typeof inscritas === "number" && (
              <span className="flex items-center gap-1.5">
                <Users size={16} aria-hidden="true" /> {inscritas} parejas inscritas
              </span>
            )}
          </div>

          {!!categorias?.length && (
            <div className="flex flex-wrap gap-2 mb-6">
              {categorias.map((c, i) => (
                <span key={i} className="badge-pending">
                  {(c.categories as unknown as { nombre: string })?.nombre}
                </span>
              ))}
            </div>
          )}

          {torneo.estado === "inscripciones_abiertas" && (
            <Link href={`/torneo/${slug}/inscribirse`} className="btn-primary">
              Inscribirme
            </Link>
          )}
        </div>
      </div>

      <nav className="border-b border-navy/10 bg-white/50 sticky top-[64px] z-30 overflow-x-auto">
        <div className="max-w-3xl mx-auto flex gap-1 px-5">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={`/torneo/${slug}${t.href}`}
              className="flex items-center gap-1.5 px-3 py-3 text-sm text-navy/70 hover:text-coral whitespace-nowrap border-b-2 border-transparent hover:border-coral transition-colors"
            >
              <t.icon size={15} aria-hidden="true" />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-10 space-y-6">
        {(torneo.precio_texto || torneo.descripcion) && (
          <div className="card">
            {torneo.precio_texto && (
              <p className="font-semibold mb-2">💶 {torneo.precio_texto}</p>
            )}
            {torneo.descripcion && (
              <p className="text-sm text-navy/70 whitespace-pre-line">{torneo.descripcion}</p>
            )}
          </div>
        )}

        {antesDelTorneo && (
          <p className="text-navy/70">
            Toda la información de horarios, grupos y cuadros se publicará cuando
            arranque el torneo. Mientras tanto, consulta los{" "}
            <Link href={`/torneo/${slug}/participantes`} className="btn-tertiary">
              participantes confirmados
            </Link>{" "}
            y los{" "}
            <Link href={`/torneo/${slug}/premios`} className="btn-tertiary">
              premios
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}