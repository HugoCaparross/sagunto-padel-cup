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
  CircleHelp,
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

  const estadoAntes =
    torneo.estado === "publicado" || torneo.estado === "inscripciones_abiertas";

  const estadoActivo =
    torneo.estado === "en_preparacion" ||
    torneo.estado === "en_juego" ||
    torneo.estado === "finalizado" ||
    torneo.estado === "archivado";

  const finalizado =
    torneo.estado === "finalizado" || torneo.estado === "archivado";

  const cancelado = torneo.estado === "cancelado";

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
      show: estadoActivo,
    },
    {
      href: "/grupos",
      label: "Grupos",
      icon: ListChecks,
      show: estadoActivo,
    },
    {
      href: "/cuadros",
      label: "Cuadros",
      icon: Grid3x3,
      show: estadoActivo,
    },
    {
      href: "/resultados",
      label: "Resultados",
      icon: Trophy,
      show: estadoActivo,
    },
    {
      href: "/quiniela",
      label: "Quiniela",
      icon: CircleHelp,
      show: torneo.estado === "en_juego" || torneo.estado === "finalizado",
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

      <div className="hero-gradient px-5 py-12 text-offwhite">
        <div className="mx-auto max-w-3xl">
          <StatusBadge texto={estadoTexto} tipo={estadoBadge} />

          <h1 className="mt-3 mb-2 font-display text-3xl sm:text-4xl">
            {torneo.nombre}
          </h1>

          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-offwhite/80">
            <span className="flex items-center gap-1.5">
              <Calendar size={16} aria-hidden="true" />
              {formatearFecha(torneo.fecha_inicio)}
            </span>

            {club ? (
              <span className="flex items-center gap-1.5">
                <MapPin size={16} aria-hidden="true" />
                {club.nombre}
              </span>
            ) : null}

            {typeof inscritas === "number" ? (
              <span className="flex items-center gap-1.5">
                <Users size={16} aria-hidden="true" />
                {inscritas} parejas inscritas
              </span>
            ) : null}
          </div>

          {!!categorias?.length ? (
            <div className="mb-6 flex flex-wrap gap-2" aria-label="Categorías">
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
          ) : null}

          {torneo.estado === "inscripciones_abiertas" ? (
            <Link
              href={`/torneo/${slug}/inscribirse`}
              className="btn-primary inline-flex"
            >
              Inscribirme
            </Link>
          ) : null}
        </div>
      </div>

      <nav
        aria-label="Navegación del torneo"
        className="sticky top-[64px] z-30 overflow-x-auto border-b border-navy/10 bg-white"
      >
        <div className="mx-auto flex min-w-max max-w-3xl gap-1 px-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <Link
                key={tab.label}
                href={`/torneo/${slug}${tab.href}`}
                className="flex items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-sm text-navy/70 transition-colors hover:border-coral hover:text-coral"
              >
                <Icon size={15} aria-hidden="true" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 px-5 py-10">
        {cancelado ? (
          <section
            role="status"
            className="rounded-card border border-coral/20 bg-coral/5 p-5"
          >
            <h2 className="font-semibold">Torneo cancelado</h2>
            <p className="mt-1 text-sm text-navy/70">
              Esta prueba ha sido cancelada. Consulta la información publicada
              por la organización si necesitas asistencia.
            </p>
          </section>
        ) : null}

        {torneo.precio_texto || torneo.descripcion ? (
          <section aria-labelledby="informacion-torneo" className="card">
            <h2 id="informacion-torneo" className="sr-only">
              Información del torneo
            </h2>

            {torneo.precio_texto ? (
              <p className="mb-2 font-semibold">{torneo.precio_texto}</p>
            ) : null}

            {torneo.descripcion ? (
              <p className="whitespace-pre-line text-sm text-navy/70">
                {torneo.descripcion}
              </p>
            ) : null}
          </section>
        ) : null}

        {estadoAntes ? (
          <p className="text-navy/70">
            La prueba todavía está en fase previa. Puedes consultar los{" "}
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
            . Los horarios, grupos, cuadros y resultados se mostrarán cuando
            estén disponibles.
          </p>
        ) : null}

        {!categorias?.length ? (
          <section
            role="status"
            className="rounded-card bg-navy/5 p-5 text-sm text-navy/70"
          >
            Las categorías del torneo todavía están pendientes de configuración.
          </section>
        ) : null}
      </div>
    </main>
  );
}
