import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  MapPin,
  Newspaper,
  Trophy,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { ESTADO_TORNEO } from "@/lib/estados";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 60;

/* ============================================================
   METADATA
   ============================================================ */

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();

  const { data: torneo } = await supabase
    .from("tournaments")
    .select("nombre, slug, fecha_inicio")
    .in("estado", [
      "publicado",
      "inscripciones_abiertas",
      "inscripciones_cerradas",
      "en_preparacion",
      "en_juego",
    ])
    .order("fecha_inicio", { ascending: true })
    .limit(1)
    .maybeSingle();

  const nextEvent = torneo
    ? ` Próxima prueba: ${torneo.nombre}, ${formatDateShort(
        torneo.fecha_inicio,
      )}.`
    : "";

  return {
    title: "Sagunto Padel Cup | Circuito de pádel amateur en Sagunto",

    description: `Sagunto Padel Cup es el circuito de pádel amateur de Sagunto: torneos, ranking individual, calendario, jugadores, noticias y carrera hacia el Máster Final.${nextEvent}`,

    alternates: {
      canonical: "/",
    },

    openGraph: {
      title: "Sagunto Padel Cup | Circuito de pádel amateur en Sagunto",

      description:
        "Compite, suma puntos y avanza hacia el Máster Final en el circuito de pádel amateur de Sagunto.",

      url: siteUrl,
      type: "website",
      locale: "es_ES",
      siteName: "Sagunto Padel Cup",
    },

    twitter: {
      card: "summary_large_image",

      title: "Sagunto Padel Cup | Circuito de pádel amateur en Sagunto",

      description:
        "Compite, suma puntos y avanza hacia el Máster Final en Sagunto.",
    },
  };
}

/* ============================================================
   TYPES
   ============================================================ */

type UpcomingTournament = {
  id: string;
  nombre: string;
  slug: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  club_id: string | null;
  descripcion: string | null;

  clubs: {
    nombre: string;
    direccion: string | null;
  } | null;

  tournament_categories: Array<{
    cupo_maximo: number | null;

    categories: {
      id: string;
      nombre: string;
    } | null;
  }>;
};

type RankingPoint = {
  player_id: string;
  puntos_obtenidos: number;

  players: {
    nombre: string;
    apellidos: string;
    categoria_actual_id: string | null;
  } | null;
};

type NewsItem = {
  slug: string;
  titulo: string;
  contenido: string;
  imagen_destacada: string | null;
  categoria: string | null;
  fecha_publicacion: string;
};

type Sponsor = {
  id: string;
  nombre: string;
  logo_url: string | null;
  enlace: string | null;
  tipo: string;
};

/* ============================================================
   HELPERS
   ============================================================ */

function formatDateShort(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "fecha por confirmar";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateRange(start: string, end: string | null) {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  if (Number.isNaN(startDate.getTime())) {
    return "Fecha por confirmar";
  }

  if (!endDate || Number.isNaN(endDate.getTime()) || start === end) {
    return formatDateShort(start);
  }

  const sameMonth =
    startDate.getUTCFullYear() === endDate.getUTCFullYear() &&
    startDate.getUTCMonth() === endDate.getUTCMonth();

  if (sameMonth) {
    return `${startDate.getUTCDate()}—${endDate.getUTCDate()} ${new Intl.DateTimeFormat(
      "es-ES",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      },
    ).format(endDate)}`;
  }

  return `${new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(startDate)} — ${new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(endDate)}`;
}

function getStatusPresentation(status: string) {
  switch (status) {
    case "inscripciones_abiertas":
      return {
        label: "INSCRIPCIONES ABIERTAS",
        className: "home-status home-status--success",
      };

    case "inscripciones_cerradas":
      return {
        label: "INSCRIPCIONES CERRADAS",
        className: "home-status home-status--muted",
      };

    case "en_juego":
      return {
        label: "EN JUEGO",
        className: "home-status home-status--live",
      };

    case "en_preparacion":
      return {
        label: "EN PREPARACIÓN",
        className: "home-status home-status--warning",
      };

    case "finalizado":
      return {
        label: "FINALIZADO",
        className: "home-status home-status--muted",
      };

    case "cancelado":
      return {
        label: "CANCELADO",
        className: "home-status home-status--danger",
      };

    default:
      return {
        label: ESTADO_TORNEO[status] ?? status,

        className: "home-status home-status--muted",
      };
  }
}

function getNewsExcerpt(content: string) {
  const plain = content
    .replace(/[#*_>`\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return plain.length > 110 ? `${plain.slice(0, 107)}…` : plain;
}

/* ============================================================
   HOME
   ============================================================ */

export default async function HomePage() {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: upcomingRaw },
    { data: tournaments },
    { data: categories },
    { data: rankingPoints },
    { data: news },
  ] = await Promise.all([
    supabase
      .from("tournaments")
      .select(
        "id, nombre, slug, estado, fecha_inicio, fecha_fin, club_id, descripcion, clubs(nombre, direccion), tournament_categories(cupo_maximo, categories(id, nombre))",
      )
      .in("estado", [
        "publicado",
        "inscripciones_abiertas",
        "inscripciones_cerradas",
        "en_preparacion",
        "en_juego",
      ])
      .gte("fecha_inicio", today)
      .order("fecha_inicio", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("tournaments")
      .select("id, nombre, slug, estado, fecha_inicio, fecha_fin")
      .neq("estado", "borrador")
      .neq("estado", "archivado")
      .order("fecha_inicio", {
        ascending: true,
      }),

    supabase.from("categories").select("id, nombre").order("nivel_orden"),

    supabase
      .from("ranking_points")
      .select(
        "player_id, puntos_obtenidos, players(nombre, apellidos, categoria_actual_id)",
      )
      .gte("fecha_caducidad", today),

    supabase
      .from("news")
      .select(
        "slug, titulo, contenido, imagen_destacada, categoria, fecha_publicacion",
      )
      .eq("estado", "publicado")
      .order("fecha_publicacion", {
        ascending: false,
      })
      .limit(3),
  ]);

  const torneo = upcomingRaw as unknown as UpcomingTournament | null;

  /* ==========================================================
     SECONDARY DATA
     ========================================================== */

  const [{ data: heroPhotos }, { data: sponsors }] = torneo
    ? await Promise.all([
        supabase
          .from("gallery_items")
          .select("id, url, created_at")
          .eq("tournament_id", torneo.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(6),

        supabase
          .from("sponsors")
          .select("id, nombre, logo_url, enlace, tipo")
          .eq("tournament_id", torneo.id)
          .order("orden", {
            ascending: true,
          }),
      ])
    : [{ data: [] }, { data: [] }];

  /* ==========================================================
     RANKING
     ========================================================== */

  const puntosMap = new Map<
    string,
    {
      nombre: string;
      puntos: number;
    }
  >();

  for (const row of (rankingPoints ?? []) as unknown as RankingPoint[]) {
    if (!row.players) continue;

    const current = puntosMap.get(row.player_id);

    const nombre = `${row.players.nombre} ${row.players.apellidos}`.trim();

    const puntos = Number(row.puntos_obtenidos) || 0;

    puntosMap.set(row.player_id, {
      nombre,
      puntos: (current?.puntos ?? 0) + puntos,
    });
  }

  const topRanking = Array.from(puntosMap.entries())
    .map(([playerId, value]) => ({
      playerId,
      ...value,
    }))
    .sort(
      (a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"),
    )
    .slice(0, 5);

  /* ==========================================================
     DERIVED DATA
     ========================================================== */

  const tournamentList = tournaments ?? [];

  const visibleCategories = (categories ?? []).slice(0, 4);

  const upcomingList = tournamentList
    .filter((item) => item.fecha_inicio >= today)
    .slice(0, 5);

  const latestPhotos = heroPhotos ?? [];

  const heroImage = latestPhotos[0]?.url ?? null;

  const circuitImage = latestPhotos[1]?.url ?? latestPhotos[0]?.url ?? null;

  const newsItems = (news ?? []) as NewsItem[];

  const sponsorItems = (sponsors ?? []) as Sponsor[];

  const status = torneo ? getStatusPresentation(torneo.estado) : null;

  const registrationHref = torneo
    ? torneo.estado === "inscripciones_abiertas"
      ? `/torneo/${torneo.slug}/inscribirse`
      : `/torneo/${torneo.slug}`
    : "/calendario";

  const categoryNames =
    torneo?.tournament_categories
      ?.map((item) => item.categories?.nombre)
      .filter(Boolean) ?? [];

  /* ==========================================================
     STRUCTURED DATA
     ========================================================== */

  const eventSchema = torneo
    ? {
        "@context": "https://schema.org",

        "@type": "SportsEvent",

        name: torneo.nombre,

        description:
          torneo.descripcion ||
          `${torneo.nombre}, prueba de Sagunto Padel Cup, circuito amateur de pádel en Sagunto.`,

        startDate: torneo.fecha_inicio,

        endDate: torneo.fecha_fin ?? torneo.fecha_inicio,

        eventStatus: "https://schema.org/EventScheduled",

        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",

        url: `${siteUrl}/torneo/${torneo.slug}`,

        organizer: {
          "@type": "Organization",

          name: "Sagunto Padel Cup",

          url: siteUrl,
        },

        ...(torneo.clubs
          ? {
              location: {
                "@type": "Place",

                name: torneo.clubs.nombre,

                address: {
                  "@type": "PostalAddress",

                  streetAddress: torneo.clubs.direccion ?? undefined,

                  addressLocality: "Sagunto",

                  addressRegion: "Valencia",

                  addressCountry: "ES",
                },
              },
            }
          : {}),
      }
    : null;

  const websiteSchema = {
    "@context": "https://schema.org",

    "@type": "WebSite",

    name: "Sagunto Padel Cup",

    url: siteUrl,

    description:
      "Circuito de pádel amateur en Sagunto con torneos, ranking individual, calendario, jugadores y Máster Final.",

    inLanguage: "es-ES",
  };

  const organizationSchema = {
    "@context": "https://schema.org",

    "@type": "SportsOrganization",

    name: "Sagunto Padel Cup",

    url: siteUrl,

    sport: "Padel",

    areaServed: {
      "@type": "City",

      name: "Sagunto",
    },
  };

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <main className="home-page">
      {/* ======================================================
          STRUCTURED DATA
          ====================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />

      {eventSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(eventSchema),
          }}
        />
      ) : null}

      {/* ======================================================
          01 — HERO
          ====================================================== */}

      <section className="home-hero" aria-labelledby="home-title">
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt="Competición de pádel de Sagunto Padel Cup"
            className="home-hero__image"
            fetchPriority="high"
          />
        ) : null}

        <div className="home-hero__overlay" aria-hidden="true" />

        <div className="home-shell home-hero__inner">
          {/* HERO COPY */}

          <div className="home-hero__copy">
            <p className="home-eyebrow home-eyebrow--light">
              CIRCUITO AMATEUR
              <span aria-hidden="true" />
              SAGUNTO
            </p>

            <h1 id="home-title">
              Compite.
              <br />
              Suma.
              <br />
              Llega al Máster.
            </h1>

            <p className="home-hero__lead">
              El circuito de pádel de referencia en Sagunto.
              <br />
              Varias pruebas. Un ranking. Un objetivo.
            </p>

            <div className="home-hero__actions">
              <Link
                href={registrationHref}
                className="home-button home-button--solid"
              >
                {torneo?.estado === "inscripciones_abiertas"
                  ? "PRÓXIMA PRUEBA"
                  : "VER PRÓXIMA PRUEBA"}

                <ArrowRight size={18} aria-hidden="true" />
              </Link>

              <Link
                href="/calendario"
                className="home-button home-button--outline"
              >
                VER CALENDARIO
                <CalendarDays size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* HERO EVENT CARD */}

          {torneo ? (
            <article
              className="home-event-card"
              aria-label="Próxima prueba del circuito"
            >
              {circuitImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={circuitImage}
                  alt="Pista de pádel de la próxima prueba"
                  className="home-event-card__image"
                />
              ) : null}

              <div className="home-event-card__body">
                <div className="home-event-card__topline">
                  <span>PRÓXIMA PRUEBA</span>

                  <span className="home-event-card__round">
                    {upcomingList.findIndex((item) => item.id === torneo.id) +
                      1 || 1}
                    ª PRUEBA
                  </span>
                </div>

                <h2>{torneo.nombre}</h2>

                <dl className="home-event-details">
                  <div>
                    <dt>
                      <CalendarDays size={19} aria-hidden="true" />
                      Fecha
                    </dt>

                    <dd>
                      {formatDateRange(torneo.fecha_inicio, torneo.fecha_fin)}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      <MapPin size={19} aria-hidden="true" />
                      Sede
                    </dt>

                    <dd>{torneo.clubs?.nombre ?? "Club por confirmar"}</dd>

                    {torneo.clubs?.direccion ? (
                      <small>{torneo.clubs.direccion}</small>
                    ) : null}
                  </div>

                  <div>
                    <dt>
                      <Users size={19} aria-hidden="true" />
                      Categorías
                    </dt>

                    <dd>
                      {categoryNames.length
                        ? categoryNames.join(" · ")
                        : "Categorías por confirmar"}
                    </dd>
                  </div>
                </dl>

                {status ? (
                  <div className={status.className}>
                    <span aria-hidden="true" />
                    {status.label}
                  </div>
                ) : null}

                <Link href={registrationHref} className="home-event-card__cta">
                  {torneo.estado === "inscripciones_abiertas"
                    ? "INSCRIBIRSE AHORA"
                    : "VER TODA LA INFORMACIÓN"}

                  <ArrowRight size={18} aria-hidden="true" />
                </Link>

                {torneo.estado === "inscripciones_abiertas" ? (
                  <p className="home-event-card__note">
                    Plazas sujetas a disponibilidad.
                  </p>
                ) : null}
              </div>
            </article>
          ) : (
            <article className="home-event-card home-event-card--empty">
              <p className="home-eyebrow">Próxima prueba</p>

              <h2>La siguiente fecha está por confirmar.</h2>

              <p>
                Consulta el calendario para ver el estado actualizado de la
                temporada.
              </p>

              <Link href="/calendario" className="home-event-card__cta">
                VER CALENDARIO
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
          )}
        </div>
      </section>

      {/* ======================================================
          02 — INTRO + IMAGE + STATS
          ====================================================== */}

      <section
        className="home-intro home-section"
        aria-labelledby="intro-title"
      >
        <div className="home-shell home-intro__grid">
          <div className="home-intro__copy">
            <p className="home-eyebrow">¿QUÉ ES SAGUNTO PADEL CUP?</p>

            <h2 id="intro-title">
              Un circuito.
              <br />
              Una comunidad.
            </h2>

            <p>
              Un circuito amateur formado por pruebas a lo largo de la
              temporada. Suma puntos, mejora tu posición en el ranking y avanza
              hacia el Máster Final.
            </p>

            <Link href="/circuito" className="home-text-link">
              Descubre el circuito
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="home-intro__visual">
            {circuitImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={circuitImage}
                alt="Pista de pádel de Sagunto Padel Cup"
                className="home-intro__image"
                loading="lazy"
              />
            ) : (
              <div
                className="home-intro__image home-intro__image--fallback"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="home-stat-grid" aria-label="Datos del circuito">
            <div className="home-stat">
              <CalendarDays size={23} aria-hidden="true" />

              <strong>{tournamentList.length}</strong>

              <span>
                Pruebas
                <br />+ Máster Final
              </span>
            </div>

            <div className="home-stat">
              <Users size={23} aria-hidden="true" />

              <strong>{categories?.length ?? 0}</strong>

              <span>
                Categorías
                <br />
                competitivas
              </span>
            </div>

            <div className="home-stat">
              <BarChart3 size={23} aria-hidden="true" />

              <strong>Individual</strong>

              <span>
                Ranking
                <br />
                por jugador
              </span>
            </div>

            <div className="home-stat">
              <Trophy size={23} aria-hidden="true" />

              <strong>Premios</strong>

              <span>
                En cada prueba
                <br />y en el Máster
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          03 — CAMINO HACIA EL MÁSTER
          ====================================================== */}

      <section className="home-circuit" aria-labelledby="circuit-title">
        <div className="home-shell home-circuit__inner">
          <div className="home-circuit__intro">
            <p className="home-eyebrow home-eyebrow--light">EL CIRCUITO</p>

            <h2 id="circuit-title">
              El camino
              <br />
              hacia el Máster.
            </h2>

            <p>
              Compite en tus pruebas, suma puntos en el ranking y avanza hacia
              el Máster Final.
            </p>

            <Link href="/circuito" className="home-button home-button--outline">
              MÁS INFORMACIÓN
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <ol className="home-circuit-steps">
            {[
              ["01", "PRUEBAS", "Varias pruebas a lo largo de la temporada"],
              ["02", "PUNTOS", "Suma puntos con cada resultado"],
              ["03", "RANKING", "Mejora tu posición"],
              ["04", "RACE TO MASTER", "Los mejores se clasifican"],
              ["05", "MÁSTER FINAL", "La gran cita del circuito"],
            ].map(([number, title, text], index) => (
              <li key={title}>
                <div className="home-circuit-step__number">{number}</div>

                <div className="home-circuit-step__media" aria-hidden="true">
                  {latestPhotos[index] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={latestPhotos[index].url} alt="" loading="lazy" />
                  ) : null}
                </div>

                <h3>{title}</h3>

                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ======================================================
          04 — RANKING / CALENDARIO / NOTICIAS
          ====================================================== */}

      <section
        className="home-competition home-section"
        aria-label="Competición y actualidad"
      >
        <div className="home-shell home-competition__grid">
          {/* RANKING */}

          <section className="home-panel" aria-labelledby="ranking-home-title">
            <div className="home-panel__header">
              <div>
                <p className="home-eyebrow">TOP 5 RANKING</p>

                <h2 id="ranking-home-title">Ranking individual</h2>
              </div>

              <Link href="/ranking" className="home-panel__link">
                Ver ranking completo
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {visibleCategories.length ? (
              <nav
                className="home-category-tabs"
                aria-label="Categorías del ranking"
              >
                {visibleCategories.map((category, index) => (
                  <Link
                    key={category.id}
                    href={`/ranking?categoria=${category.id}`}
                    className={index === 0 ? "is-active" : ""}
                  >
                    {category.nombre}
                  </Link>
                ))}
              </nav>
            ) : null}

            {topRanking.length ? (
              <ol className="home-ranking-list">
                {topRanking.map((player, index) => (
                  <li key={player.playerId}>
                    <span className="home-ranking-list__position">
                      {index + 1}
                    </span>

                    <Link href={`/jugador/${player.playerId}`}>
                      {player.nombre}
                    </Link>

                    <strong>
                      {player.puntos.toLocaleString("es-ES")}

                      <small> PTS</small>
                    </strong>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="home-empty-state">
                <p>
                  El ranking se activará con los primeros resultados de la
                  temporada.
                </p>

                <Link href="/circuito#ranking">
                  Cómo funciona el ranking
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>

          {/* CALENDARIO */}

          <section className="home-panel" aria-labelledby="calendar-home-title">
            <div className="home-panel__header">
              <div>
                <p className="home-eyebrow">PRÓXIMAS FECHAS</p>

                <h2 id="calendar-home-title">Calendario</h2>
              </div>

              <Link href="/calendario" className="home-panel__link">
                Ver calendario
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            <ol className="home-calendar-list">
              {upcomingList.length ? (
                upcomingList.map((item, index) => {
                  const itemStatus = getStatusPresentation(item.estado);

                  return (
                    <li
                      key={item.id}
                      className={index === 0 ? "is-featured" : ""}
                    >
                      <span className="home-calendar-list__number">
                        {index + 1}
                        <small>ª</small>
                      </span>

                      <div>
                        <Link href={`/torneo/${item.slug}`}>
                          {formatDateRange(item.fecha_inicio, item.fecha_fin)}
                        </Link>

                        <span>{item.nombre}</span>
                      </div>

                      <span
                        className={
                          item.estado === "inscripciones_abiertas"
                            ? "home-mini-status home-mini-status--success"
                            : "home-mini-status"
                        }
                      >
                        {itemStatus.label}
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="home-empty-row">
                  No hay próximas pruebas publicadas.
                </li>
              )}
            </ol>
          </section>

          {/* NOTICIAS */}

          <section
            className="home-panel home-panel--news"
            aria-labelledby="news-home-title"
          >
            <div className="home-panel__header">
              <div>
                <p className="home-eyebrow">ACTUALIDAD</p>

                <h2 id="news-home-title">Últimas noticias</h2>
              </div>

              <Link href="/noticias" className="home-panel__link">
                Ver todas
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {newsItems.length ? (
              <div className="home-news-list">
                {newsItems.map((item, index) => (
                  <article
                    key={item.slug}
                    className={index === 0 ? "is-featured" : ""}
                  >
                    {item.imagen_destacada ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imagen_destacada} alt="" loading="lazy" />
                    ) : (
                      <div
                        className="home-news-list__placeholder"
                        aria-hidden="true"
                      >
                        <Newspaper size={22} />
                      </div>
                    )}

                    <div>
                      <time dateTime={item.fecha_publicacion}>
                        {formatDateShort(item.fecha_publicacion)}
                      </time>

                      <h3>
                        <Link href={`/noticias/${item.slug}`}>
                          {item.titulo}
                        </Link>
                      </h3>

                      <p>{getNewsExcerpt(item.contenido)}</p>
                    </div>

                    <Link
                      href={`/noticias/${item.slug}`}
                      className="home-news-list__arrow"
                      aria-label={`Leer ${item.titulo}`}
                    >
                      <ChevronRight size={19} aria-hidden="true" />
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="home-empty-state">
                <p>Aún no hay noticias publicadas.</p>

                <Link href="/noticias">
                  Ver actualidad
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            )}
          </section>
        </div>
      </section>

      {/* ======================================================
          05 — PATROCINADORES
          ====================================================== */}

      <section className="home-sponsors" aria-labelledby="sponsors-title">
        <div className="home-shell">
          <div className="home-section-heading home-section-heading--center">
            <p className="home-eyebrow home-eyebrow--light">
              EL APOYO QUE HACE POSIBLE EL CIRCUITO
            </p>

            <h2 id="sponsors-title">Patrocinadores oficiales</h2>
          </div>

          {sponsorItems.length ? (
            <div
              className="home-sponsors__grid"
              aria-label="Patrocinadores oficiales"
            >
              {sponsorItems.map((sponsor) => {
                const content = sponsor.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sponsor.logo_url}
                    alt={sponsor.nombre}
                    loading="lazy"
                  />
                ) : (
                  <span>{sponsor.nombre}</span>
                );

                return sponsor.enlace ? (
                  <a
                    key={sponsor.id}
                    href={sponsor.enlace}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Visitar ${sponsor.nombre}`}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={sponsor.id}>{content}</div>
                );
              })}
            </div>
          ) : (
            <p className="home-sponsors__empty">
              Próximamente anunciaremos los patrocinadores oficiales.
            </p>
          )}

          <div className="home-sponsors__cta">
            <Link
              href="/patrocinadores"
              className="home-text-link home-text-link--light"
            >
              Conoce a nuestros patrocinadores
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================
          06 — FINAL CTA
          ====================================================== */}

      <section className="home-final-cta" aria-labelledby="final-cta-title">
        <div className="home-shell home-final-cta__inner">
          <div>
            <p className="home-eyebrow home-eyebrow--light">
              SAGUNTO PADEL CUP
            </p>

            <h2 id="final-cta-title">No te pierdas la próxima prueba.</h2>

            <p>
              Consulta el calendario, descubre la competición y decide cuándo
              vuelves a pista.
            </p>
          </div>

          <div className="home-final-cta__actions">
            <Link href="/calendario" className="home-button home-button--solid">
              VER CALENDARIO
              <ArrowRight size={17} aria-hidden="true" />
            </Link>

            {torneo?.estado === "inscripciones_abiertas" ? (
              <Link
                href={registrationHref}
                className="home-button home-button--outline"
              >
                INSCRIBIRME
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
