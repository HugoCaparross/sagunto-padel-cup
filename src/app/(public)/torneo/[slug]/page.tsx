// Ruta: src/app/(public)/torneo/[slug]/page.tsx

import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  ESTADO_TORNEO,
  ESTADO_TORNEO_BADGE,
  formatearFecha,
} from "@/lib/estados";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type TournamentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: TournamentPageProps): Promise<Metadata> {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("nombre, estado, fecha_inicio, fecha_fin, descripcion")
    .eq("slug", slug)
    .maybeSingle();

  if (!torneo || torneo.estado === "borrador") {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    torneo.descripcion ||
    `${torneo.nombre}: torneo de pádel amateur en Sagunto. Consulta fechas, categorías e inscripción.`;

  const url = `/torneo/${slug}`;

  return {
    title: torneo.nombre,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: torneo.nombre,
      description,
      url,
      type: "website",
    },
  };
}

export default async function TorneoPage({ params }: TournamentPageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select(
      "id, nombre, estado, fecha_inicio, fecha_fin, club_id, precio_texto, descripcion",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!torneo || torneo.estado === "borrador") {
    notFound();
  }

  const { data: club } = torneo.club_id
    ? await supabase
        .from("clubs")
        .select("nombre, direccion")
        .eq("id", torneo.club_id)
        .maybeSingle()
    : { data: null };

  const { data: categorias } = await supabase
    .from("tournament_categories")
    .select("categories(nombre)")
    .eq("tournament_id", torneo.id);

  const { count: inscritas } = await supabase
    .from("pairs")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("tournament_id", torneo.id)
    .eq("estado", "confirmada");

  const estadoTexto = ESTADO_TORNEO[torneo.estado] ?? torneo.estado;

  const estadoBadge = ESTADO_TORNEO_BADGE[torneo.estado] ?? "pending";

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: torneo.nombre,
    description:
      torneo.descripcion ||
      `${torneo.nombre}, torneo de pádel amateur en Sagunto.`,
    startDate: torneo.fecha_inicio,
    endDate: torneo.fecha_fin ?? torneo.fecha_inicio,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${siteUrl}/torneo/${slug}`,
    organizer: {
      "@type": "Organization",
      name: "Sagunto Padel Cup",
      url: siteUrl,
    },
    ...(club
      ? {
          location: {
            "@type": "Place",
            name: club.nombre,
            address: {
              "@type": "PostalAddress",
              streetAddress: club.direccion || undefined,
              addressLocality: "Sagunto",
              addressRegion: "Valencia",
              addressCountry: "ES",
            },
          },
        }
      : {}),
  };

  const antesDelTorneo = ["publicado", "inscripciones_abiertas"].includes(
    torneo.estado,
  );

  const enJuegoOFinalizado = ["en_juego", "finalizado", "archivado"].includes(
    torneo.estado,
  );

  const finalizado = ["finalizado", "archivado"].includes(torneo.estado);

  const tabs = [
    {
      href: "",
      label: "Información",
      icon: Calendar,
      show: true,
    },
    {
      href: "/participantes",
      label: "Participantes",
      icon: Users,
      show: true,
    },
    {
      href: "/horarios",
      label: "Horarios",
      icon: Calendar,
      show: enJuegoOFinalizado,
    },
    {
      href: "/grupos",
      label: "Grupos",
      icon: ListChecks,
      show: enJuegoOFinalizado,
    },
    {
      href: "/cuadros",
      label: "Cuadros",
      icon: Grid3x3,
      show: enJuegoOFinalizado,
    },
    {
      href: "/resultados",
      label: "Resultados",
      icon: Trophy,
      show: enJuegoOFinalizado,
    },
    {
      href: "/premios",
      label: "Premios",
      icon: Gift,
      show: true,
    },
    {
      href: "/fotos",
      label: "Fotos",
      icon: ImageIcon,
      show: finalizado,
    },
  ].filter((tab) => tab.show);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventSchema).replace(/</g, "\\u003c"),
        }}
      />

      <div className="hero-gradient text-offwhite px-5 py-12">
        <div className="max-w-3xl mx-auto">
          <StatusBadge texto={estadoTexto} tipo={estadoBadge} />

          <h1 className="font-display text-3xl sm:text-4xl mt-3 mb-2">
            {torneo.nombre}
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-offwhite/80 text-sm mb-6">
            <span className="flex items-center gap-1.5">
              <Calendar size={16} aria-hidden="true" />

              {formatearFecha(torneo.fecha_inicio)}
            </span>

            {club && (
              <span className="flex items-center gap-1.5">
                <MapPin size={16} aria-hidden="true" />

                {club.nombre}
              </span>
            )}

            {typeof inscritas === "number" && (
              <span className="flex items-center gap-1.5">
                <Users size={16} aria-hidden="true" />
                {inscritas} parejas inscritas
              </span>
            )}
          </div>

          {!!categorias?.length && (
            <div className="flex flex-wrap gap-2 mb-6">
              {categorias.map((categoria, index) => {
                const categoriaData = categoria.categories as unknown as {
                  nombre: string;
                } | null;

                if (!categoriaData) {
                  return null;
                }

                return (
                  <span
                    key={`${categoriaData.nombre}-${index}`}
                    className="badge-pending"
                  >
                    {categoriaData.nombre}
                  </span>
                );
              })}
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
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <Link
                key={tab.label}
                href={`/torneo/${slug}${tab.href}`}
                className="flex items-center gap-1.5 px-3 py-3 text-sm text-navy/70 hover:text-coral whitespace-nowrap border-b-2 border-transparent hover:border-coral transition-colors"
              >
                <Icon size={15} aria-hidden="true" />

                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-10 space-y-6">
        {(torneo.precio_texto || torneo.descripcion) && (
          <div className="card">
            {torneo.precio_texto && (
              <p className="font-semibold mb-2">{torneo.precio_texto}</p>
            )}

            {torneo.descripcion && (
              <p className="text-sm text-navy/70 whitespace-pre-line">
                {torneo.descripcion}
              </p>
            )}
          </div>
        )}

        {antesDelTorneo && (
          <p className="text-navy/70">
            Toda la información de horarios, grupos y cuadros se publicará
            cuando arranque el torneo. Mientras tanto, consulta los{" "}
            <Link
              href={`/torneo/${slug}/participantes`}
              className="btn-tertiary"
            >
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
