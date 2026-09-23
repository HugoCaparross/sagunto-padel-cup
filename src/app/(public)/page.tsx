import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck2,
  CalendarDays,
  CircleHelp,
  Handshake,
  MapPin,
  Medal,
  Newspaper,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import PublicShell from "@/components/public/PublicShell";
import {
  getPublicCategories,
  getPublicNews,
  getPublicRanking,
  getPublicSponsors,
  getPublicTournaments,
} from "@/lib/public/site";

import {
  formatNewsDate,
  formatRankingPoints,
  formatTournamentDate,
  getCategoryHref,
  getNewsHref,
  getPlayerHref,
  getTournamentHref,
  getTournamentStatusLabel,
  getTournamentStatusVariant,
  type HomeData,
  type HomeTournament,
} from "./page.logic";

import styles from "./page.module.css";
import RankingPreview from "./RankingPreview";

export default async function Home() {
  /*
   * La conexión con Supabase se incorporará cuando utilicemos
   * el cliente real del proyecto.
   *
   * No se inventa aquí ninguna ruta de cliente Supabase.
   */
  const [tournamentsResult, categoriesResult, newsResult] = await Promise.all([
    getPublicTournaments(),
    getPublicCategories(),
    getPublicNews(),
  ]);

  const tournaments = tournamentsResult.data ?? [];
  const nextTournament =
    [...tournaments]
      .filter(
        (tournament) =>
          tournament.estado === "inscripciones_abiertas" ||
          tournament.estado === "publicado",
      )
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))[0] ??
    null;

  const circuitCategories = getUniqueCircuitCategories(
    (categoriesResult.data ?? []).map((category) => ({
      ...category,
      nivelOrden: category.nivel_orden,
    })),
  );

  const categoryRankingResults = await Promise.all(
    circuitCategories.map(async (category) => {
      const result = await getPublicRanking(category.id);

      return {
        category: {
          id: category.id,
          nombre: category.nombre,
          nivelOrden: category.nivelOrden,
        },
        ranking: (result.data?.entries ?? []).slice(0, 5).map((entry) => ({
          position: entry.position,
          playerId: entry.player.id,
          nombre: entry.player.nombre,
          apellidos: entry.player.apellidos,
          puntos: entry.points,
          pruebas: entry.tournaments,
          fotoUrl: entry.player.foto_url,
        })),
      };
    }),
  );

  const rankingPreview = categoryRankingResults[0]?.ranking ?? [];

  const sponsorResult = await getPublicSponsors(
    tournaments.slice(0, 6).map((tournament) => tournament.id),
  );

  const data: HomeData = {
    nextTournament: nextTournament
      ? {
        id: nextTournament.id,
        nombre: nextTournament.nombre,
        slug: nextTournament.slug,
        fechaInicio: nextTournament.fecha_inicio,
        fechaFin: nextTournament.fecha_fin,
        estado: nextTournament.estado,
        precioTexto: nextTournament.precio_texto,
        descripcion: nextTournament.descripcion,
        club: nextTournament.club
          ? {
            nombre: nextTournament.club.nombre,
            direccion: nextTournament.club.direccion,
          }
          : null,
        categorias: [],
      }
      : null,
    upcomingTournaments: tournaments.slice(0, 6).map((tournament) => ({
      id: tournament.id,
      nombre: tournament.nombre,
      slug: tournament.slug,
      fechaInicio: tournament.fecha_inicio,
      fechaFin: tournament.fecha_fin,
      estado: tournament.estado,
      precioTexto: tournament.precio_texto,
      descripcion: tournament.descripcion,
      club: tournament.club
        ? {
          nombre: tournament.club.nombre,
          direccion: tournament.club.direccion,
        }
        : null,
      categorias: [],
    })),
    rankingPreview,
    categories: circuitCategories.map((category) => ({
      id: category.id,
      nombre: category.nombre,
      nivelOrden: category.nivelOrden,
    })),
    news: (newsResult.data ?? []).slice(0, 4).map((news) => ({
      id: news.id,
      titulo: news.titulo,
      slug: news.slug,
      contenido: news.contenido,
      imagenDestacada: news.imagen_destacada,
      categoria: news.categoria,
      fechaPublicacion: news.fecha_publicacion,
    })),
    sponsors: (sponsorResult.data ?? []).slice(0, 8).map((sponsor) => ({
      id: sponsor.id,
      nombre: sponsor.nombre,
      logoUrl: sponsor.logo_url,
      descripcion: sponsor.descripcion,
      enlace: sponsor.enlace,
      tipo: sponsor.tipo,
    })),
  };

  return (
    <PublicShell>
      <div className={styles.page}>
        <HeroSection tournament={data.nextTournament} />

        <CircuitSection />

        <TournamentsSection tournaments={data.upcomingTournaments} />

        <RankingSection rankingByCategory={categoryRankingResults} />

        <CategoriesSection categories={data.categories} />

        <HowItWorksSection />

        <RaceToMasterSection />

        <NewsSection news={data.news} />

        <SponsorsSection sponsors={data.sponsors} />

        <FinalCtaSection />
      </div>
    </PublicShell>
  );
}

function HeroSection({
  tournament,
}: {
  tournament: HomeTournament | null;
}) {
  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className={styles.heroBackground} aria-hidden="true">
        <div className={styles.heroImagePlaceholder} />
        <div className={styles.heroImageTreatment} />
        <div className={styles.heroCourtLines} />
      </div>

      <div className={styles.heroOverlay} aria-hidden="true" />

      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>

          <h1
            id="home-hero-title"
            className={styles.heroTitle}
          >
            CIRCUITO DE
            <br />
            PÁDEL EN
            <br />
            <span>SAGUNTO</span>
          </h1>

          <p className={styles.heroStatement}>
            <strong>6 PRUEBAS</strong>
            <span>·</span>
            <strong>1 MASTER FINAL</strong>
          </p>

          <p className={styles.heroLead}>
            El circuito de pádel amateur de Sagunto donde cada
            prueba cuenta para construir tu temporada.
          </p>

          <p className={styles.heroDescription}>
            Compite en las diferentes pruebas, suma puntos en el
            ranking individual y avanza durante la temporada
            hasta el Master Final.
          </p>

          <div className={styles.heroActions}>
            <Link
              href="/torneos"
              className={styles.primaryButton}
            >
              <span>VER CALENDARIO</span>
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/circuito"
              className={styles.secondaryButton}
            >
              CONOCER EL CIRCUITO
            </Link>
          </div>
        </div>

        <div className={styles.heroSide}>
          <HeroTournamentCard tournament={tournament} />

          <div className={styles.heroSeason}>
            <div className={styles.heroSeasonHeader}>
              <span>TEMPORADA</span>
              <strong>2026 / 2027</strong>
            </div>

            <div className={styles.heroSeasonTrack}>
              <div className={styles.heroSeasonProgress} />

              {[
                "01",
                "02",
                "03",
                "04",
                "05",
                "06",
              ].map((number, index) => (
                <div
                  key={number}
                  className={`${styles.heroSeasonStep} ${index === 0
                    ? styles.heroSeasonStepActive
                    : ""
                    }`}
                >
                  <span className={styles.heroSeasonDot} />
                  <span>{number}</span>
                </div>
              ))}

              <div className={styles.heroSeasonStepMaster}>
                <span className={styles.heroSeasonMasterDot}>
                  🏆
                </span>
                <span>MASTER</span>
              </div>
            </div>

            <div className={styles.heroSeasonFooter}>
              <span>6 PRUEBAS</span>
              <span>CAMINO AL MASTER FINAL</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroTournamentCard({
  tournament,
}: {
  tournament: HomeTournament | null;
}) {
  const statusVariant = tournament
    ? getTournamentStatusVariant(tournament.estado)
    : "upcoming";

  const statusLabel = tournament
    ? getTournamentStatusLabel(tournament.estado)
    : "PRÓXIMAMENTE";

  const href = tournament
    ? getTournamentHref(tournament.slug)
    : "/torneos";

  const dateLabel = tournament
    ? formatTournamentDate(tournament.fechaInicio, tournament.fechaFin)
    : "FECHA POR CONFIRMAR";

  const venueName = tournament?.club?.nombre ?? "POR CONFIRMAR";

  const venueLocation =
    tournament?.club &&
      "direccion" in tournament.club &&
      typeof tournament.club.direccion === "string" &&
      tournament.club.direccion.trim().length > 0
      ? tournament.club.direccion
      : null;

  return (
    <aside className={styles.heroTournamentCard}>
      <div className={styles.cardTopLine} />

      <div className={styles.heroCardHeader}>
        <p className={styles.heroCardEyebrow}>SIGUIENTE PRUEBA</p>

        <span
          className={`${styles.heroStatus} ${statusVariant === "open"
              ? styles.heroStatusOpen
              : statusVariant === "live"
                ? styles.heroStatusLive
                : styles.heroStatusUpcoming
            }`}
        >
          <span className={styles.heroStatusDot} aria-hidden="true" />
          {statusLabel}
        </span>
      </div>

      <div className={styles.heroCardInformation}>
        <div className={styles.heroCardCompetition}>
          <span className={styles.heroCardSectionLabel}>CATEGORÍAS</span>

          <div className={styles.heroCardCategoryGrid}>
            <span>1ª CATEGORÍA</span>
            <span>2ª CATEGORÍA</span>
            <span>3ª CATEGORÍA</span>
            <span>4ª CATEGORÍA</span>
          </div>
        </div>

        <div className={styles.heroCardEventMeta}>
          <div className={styles.heroCardEventItem}>
            <CalendarDays
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <div>
              <span className={styles.heroCardSectionLabel}>FECHA</span>
              <strong className={styles.heroCardInformationValue}>
                {dateLabel}
              </strong>
            </div>
          </div>

          <div className={styles.heroCardEventItem}>
            <MapPin
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <div>
              <span className={styles.heroCardSectionLabel}>SEDE</span>
              <strong className={styles.heroCardInformationValue}>
                {venueName}
              </strong>

              {venueLocation && (
                <span className={styles.heroCardVenueLocation}>
                  {venueLocation}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Link href={href} className={styles.heroCardButton}>
        {tournament ? "VER PRUEBA" : "VER CALENDARIO"}
      </Link>
    </aside>
  );
}
function CircuitSection() {
  return (
    <section className={styles.circuitSection} aria-labelledby="circuito-home-title">
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeadingDark}>
          <p className={styles.eyebrow}>EL CIRCUITO</p>
          <h2 id="circuito-home-title">Un circuito. Toda una temporada.</h2>
          <p className={styles.sectionIntro}>
            Sagunto Padel Cup reúne torneos, ranking y un camino común hacia el Master Final.
            Descubre cómo competir y seguir toda la temporada desde un mismo lugar.
          </p>
        </div>

        <div className={styles.circuitGrid}>
          <CircuitFeature
            icon={<CalendarDays aria-hidden="true" />}
            title="TORNEOS"
            description="Consulta las próximas pruebas, fechas, sedes, categorías e información para participar."
            href="/torneos"
            action="VER PRÓXIMOS TORNEOS"
          />
          <CircuitFeature
            icon={<Medal aria-hidden="true" />}
            title="RANKING"
            description="Sigue la clasificación individual y descubre cómo evolucionan los jugadores durante la temporada."
            href="/ranking"
            action="VER RANKING"
          />
          <CircuitFeature
            icon={<Trophy aria-hidden="true" />}
            title="MASTER FINAL"
            description="Cada prueba forma parte de una temporada que termina en el Master Final del circuito."
            href="/master-final"
            action="CONOCER EL MASTER"
          />
        </div>
      </div>
    </section>
  );
}

function CircuitFeature({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <article className={styles.circuitFeature}>
      <div className={styles.featureIcon}>{icon}</div>
      <div className={styles.featureContent}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <Link href={href} className={styles.featureButton}>
        {action}
      </Link>
    </article>
  );
}

function TournamentsSection({
  tournaments,
}: {
  tournaments: HomeTournament[];
}) {
  return (
    <section className={styles.tournamentsSection} aria-labelledby="home-tournaments-title">
      <div className={styles.sectionContainer}>
        <SectionHeader
          eyebrow="PRÓXIMOS TORNEOS"
          title="Encuentra tu próxima prueba"
          href="/torneos"
          linkLabel="VER CALENDARIO"
          dark
        />

        <p id="home-tournaments-title" className={styles.sectionLeadDark}>
          Consulta el calendario de Sagunto Padel Cup y descubre el próximo torneo de pádel en Sagunto en el que puedes participar.
        </p>

        {tournaments.length > 0 ? (
          <div className={styles.tournamentGrid}>
            {tournaments.slice(0, 3).map((tournament, index) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                number={String(index + 1).padStart(2, "0")}
              />
            ))}
          </div>
        ) : (
          <EmptyCompetitionState
            title="El calendario se está preparando"
            description="Aquí aparecerán las próximas pruebas, sus fechas y toda la información para participar."
            href="/torneos"
            dark
            action="VER CALENDARIO"
          />
        )}
      </div>
    </section>
  );
}

function RankingSection({
  rankingByCategory,
}: {
  rankingByCategory: Array<{
    category: HomeData["categories"][number];
    ranking: HomeData["rankingPreview"];
  }>;
}) {
  const availableCategories = getUniqueRankingCategories(
    rankingByCategory,
  );

  return (
    <section
      className={styles.rankingSection}
      aria-labelledby="home-ranking-title"
    >
      <div className={styles.sectionContainer}>
        <SectionHeader
          eyebrow="RANKING DE PÁDEL"
          title="¿Quién lidera la temporada?"
          href="/ranking"
          linkLabel="VER RANKING COMPLETO"
        />

        <p id="home-ranking-title" className={styles.sectionLead}>
          El ranking individual de Sagunto Padel Cup suma los puntos obtenidos en las diferentes pruebas del circuito.
        </p>

        {availableCategories.length > 0 ? (
          <RankingPreview categories={availableCategories} />
        ) : (
          <EmptyCompetitionState
            title="El ranking comienza aquí"
            description="Los primeros resultados de la temporada darán forma a la clasificación individual."
            href="/ranking"
            action="VER RANKING COMPLETO"
          />
        )}

        {availableCategories.length > 0 && (
          <div className={styles.rankingBottomActions}>
            <Link href="/circuito#ranking" className={styles.outlineButton}>
              CÓMO FUNCIONA EL RANKING
            </Link>
            <Link href="/ranking" className={styles.primaryButtonLight}>
              VER RANKING COMPLETO
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function TournamentCard({
  tournament,
  number,
}: {
  tournament: HomeTournament;
  number: string;
}) {
  const variant = getTournamentStatusVariant(
    tournament.estado,
  );
  const isOpen = variant === "open";

  return (
    <article className={styles.tournamentCard}>
      <div className={styles.tournamentImage}>
        <div className={styles.tournamentImagePlaceholder} />
        <span className={styles.tournamentNumber}>{number}</span>
      </div>

      <div className={styles.tournamentBody}>
        <div className={styles.tournamentEyebrow}>PRUEBA {number}</div>
        <h3>{tournament.nombre}</h3>

        <div className={styles.tournamentMeta}>
          <span>
            <CalendarDays aria-hidden="true" />
            {formatTournamentDate(
              tournament.fechaInicio,
              tournament.fechaFin,
            )}
          </span>

          {tournament.club && (
            <span>
              <MapPin aria-hidden="true" />
              {tournament.club.nombre}
            </span>
          )}

          <span>
            <Users aria-hidden="true" />
            1ª · 2ª · 3ª · 4ª CATEGORÍA
          </span>
        </div>

        <div className={styles.tournamentFooter}>
          <span
            className={`${styles.tournamentStatus} ${getHomeTournamentStatusClass(
              tournament.estado,
            )}`}
          >
            <span className={styles.tournamentStatusDot} aria-hidden="true" />
            {getTournamentStatusLabel(tournament.estado)}
          </span>

          <div className={styles.tournamentActions}>
            <Link
              href={getTournamentHref(tournament.slug)}
              className={styles.cardButton}
            >
              VER TORNEO
            </Link>

            {isOpen && (
              <Link
                href={`${getTournamentHref(tournament.slug)}#inscripciones`}
                className={styles.cardButtonPrimary}
              >
                INSCRÍBETE
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyCompetitionState({
  title,
  description,
  href,
  dark = false,
  action = "VER MÁS",
}: {
  title: string;
  description: string;
  href: string;
  dark?: boolean;
  action?: string;
}) {
  return (
    <div
      className={`${styles.emptyCompetition} ${dark ? styles.emptyCompetitionDark : ""
        }`}
    >
      <span className={styles.emptyCompetitionLine} />

      <h3>{title}</h3>

      <p>{description}</p>

      <Link
        href={href}
        className={
          dark ? styles.outlineButtonDark : styles.primaryButtonLight
        }
      >
        {action}
      </Link>
    </div>
  );
}

function CategoriesSection({
  categories,
}: {
  categories: HomeData["categories"];
}) {
  const circuitCategories = getUniqueCircuitCategories(categories);

  return (
    <section
      className={styles.categoriesSection}
      aria-labelledby="home-categories-title"
    >
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeadingLight}>
          <p className={styles.eyebrow}>CATEGORÍAS</p>

          <h2 id="home-categories-title">
            Encuentra tu categoría
          </h2>

          <p className={styles.sectionIntroLight}>
            Cuatro categorías para que encuentres tu nivel y puedas competir durante toda la temporada.
          </p>
        </div>

        <div className={styles.categoriesGrid}>
          {circuitCategories.map((category) => (
            <Link
              key={category.id}
              href={getCategoryHref(category.id)}
              className={styles.categoryCard}
            >
              <div className={styles.categoryTop}>
                <span className={styles.categoryBadge}>
                  {getCategoryShortLabel(category.nombre)}
                </span>
              </div>

              <div className={styles.categoryContent}>
                <h3>{getCategoryShortLabel(category.nombre)} CATEGORÍA</h3>

                <p>
                  {getCategoryDescription(category.nombre)}
                </p>

                <span className={styles.categoryButton}>
                  VER CATEGORÍA
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.categoryHelp}>
          <div>
            <CircleHelp aria-hidden="true" />
            <span>¿NO SABES QUÉ CATEGORÍA ELEGIR?</span>
          </div>

          <Link
            href="/circuito#categorias"
            className={styles.outlineButtonDark}
          >
            DESCUBRE TU CATEGORÍA
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      className={styles.howSection}
      aria-labelledby="home-how-title"
    >
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeadingDark}>
          <p className={styles.eyebrow}>CÓMO FUNCIONA</p>

          <h2 id="home-how-title">
            Participa en el circuito
          </h2>

          <p className={styles.sectionIntro}>
            Empezar es sencillo: elige tu categoría, encuentra una prueba y compite para sumar puntos.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          <HowItWorksStep
            icon={<Target aria-hidden="true" />}
            number="01"
            title="ELIGE TU CATEGORÍA"
            description="Encuentra la categoría que mejor encaja con tu nivel y descubre cómo funciona."
          />

          <HowItWorksStep
            icon={<CalendarCheck2 aria-hidden="true" />}
            number="02"
            title="INSCRÍBETE A UNA PRUEBA"
            description="Elige el torneo que quieras disputar y consulta toda la información de inscripción."
          />

          <HowItWorksStep
            icon={<Trophy aria-hidden="true" />}
            number="03"
            title="COMPITE Y SUMA"
            description="Juega, consigue resultados y suma puntos para tu ranking individual de temporada."
          />
        </div>

        <div className={styles.howAction}>
          <Link
            href="/circuito/faq"
            className={styles.primaryButtonLight}
          >
            VER CÓMO INSCRIBIRTE
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorksStep({
  icon,
  number,
  title,
  description,
}: {
  icon: ReactNode;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className={styles.step}>
      <div className={styles.stepTop}>
        <span className={styles.stepNumber}>{number}</span>

        <div className={styles.stepIcon}>{icon}</div>
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </article>
  );
}

function RaceToMasterSection() {
  const stages = ["01", "02", "03", "04", "05", "06"];

  return (
    <section
      className={styles.masterSection}
      aria-labelledby="home-master-title"
    >
      <div className={styles.masterBackground}>
        <div className={styles.masterImagePlaceholder} />
      </div>

      <div className={styles.masterOverlay} />

      <div className={styles.sectionContainer}>
        <div className={styles.masterGrid}>
          <div className={styles.masterBrand}>
            <span>RACE TO</span>
            <strong>MASTER</strong>
          </div>

          <div className={styles.masterContent}>
            <p className={styles.masterKicker}>
              LA TEMPORADA SE JUEGA PRUEBA A PRUEBA
            </p>

            <h2 id="home-master-title">
              Cada prueba cuenta.
            </h2>

            <p>
              Cada torneo suma puntos para la clasificación de la temporada.
              Sigue la evolución del circuito y descubre quién consigue una
              plaza para el Master Final.
            </p>

            <div className={styles.masterStats}>
              <div>
                <strong>6</strong>
                <span>PRUEBAS</span>
              </div>

              <div>
                <strong>1</strong>
                <span>MASTER FINAL</span>
              </div>
            </div>

            <div
              className={styles.masterTimeline}
              aria-label="Temporada de seis pruebas hasta el Master Final"
            >
              {stages.map((stage) => (
                <span
                  key={stage}
                  className={styles.masterTimelineStep}
                >
                  {stage}
                </span>
              ))}

              <span className={styles.masterTimelineFinal}>
                MASTER FINAL
              </span>
            </div>

            <Link
              href="/master-final"
              className={styles.primaryButton}
            >
              <span>VER RACE TO MASTER</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsSection({
  news,
}: {
  news: HomeData["news"];
}) {
  if (news.length === 0) {
    return null;
  }

  const [featured, ...secondary] = news.slice(0, 3);

  return (
    <section
      className={styles.newsSection}
      aria-labelledby="home-news-title"
    >
      <div className={styles.sectionContainer}>
        <SectionHeader
          eyebrow="ACTUALIDAD"
          title="Todo lo que pasa en Sagunto Padel Cup"
          href="/noticias"
          linkLabel="VER TODAS LAS NOTICIAS"
        />

        <p id="home-news-title" className={styles.sectionLead}>
          Resultados, fotografías, actualidad del circuito y todo lo que ocurre durante la temporada.
        </p>

        <div className={styles.newsEditorialGrid}>
          <NewsCard item={featured} featured />

          <div className={styles.newsSecondary}>
            {secondary.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsCard({
  item,
  featured = false,
}: {
  item: HomeData["news"][number];
  featured?: boolean;
}) {
  return (
    <Link
      href={getNewsHref(item.slug)}
      className={`${styles.newsCard} ${featured ? styles.newsCardFeatured : ""
        }`}
    >
      <div className={styles.newsImage}>
        {item.imagenDestacada ? (
          <Image
            src={item.imagenDestacada}
            alt=""
            fill
            sizes={
              featured
                ? "(max-width: 768px) 100vw, 60vw"
                : "(max-width: 768px) 100vw, 35vw"
            }
          />
        ) : (
          <div className={styles.newsImagePlaceholder} />
        )}
      </div>

      <div className={styles.newsBody}>
        <div className={styles.newsMeta}>
          <Newspaper aria-hidden="true" />
          {item.fechaPublicacion &&
            formatNewsDate(item.fechaPublicacion)}
        </div>

        <h3>{item.titulo}</h3>

        <span className={styles.newsButton}>
          LEER NOTICIA
        </span>
      </div>
    </Link>
  );
}

function SponsorsSection({
  sponsors,
}: {
  sponsors: HomeData["sponsors"];
}) {
  return (
    <section
      className={styles.sponsorsSection}
      aria-labelledby="home-sponsors-title"
    >
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeadingLight}>
          <p className={styles.eyebrow}>SPONSORS</p>

          <h2 id="home-sponsors-title">
            El circuito crece contigo
          </h2>

          <p className={styles.sectionIntroLight}>
            Empresas, clubes y marcas hacen posible cada prueba de Sagunto Padel Cup.
          </p>
        </div>

        {sponsors.length > 0 ? (
          <div className={styles.sponsorsGrid}>
            {sponsors.slice(0, 8).map((sponsor) => {
              const content = sponsor.logoUrl ? (
                <Image
                  src={sponsor.logoUrl}
                  alt={sponsor.nombre}
                  width={220}
                  height={90}
                  className={styles.sponsorLogo}
                />
              ) : (
                <span className={styles.sponsorName}>
                  {sponsor.nombre}
                </span>
              );

              if (sponsor.enlace) {
                return (
                  <a
                    href={sponsor.enlace}
                    key={sponsor.id}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sponsor}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div
                  key={sponsor.id}
                  className={styles.sponsor}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.sponsorEmpty}>
            <Handshake aria-hidden="true" />
            <p>
              El espacio de colaboradores de la temporada aparecerá aquí.
            </p>
          </div>
        )}

        <div className={styles.sponsorAction}>
          <Link
            href="/contacto"
            className={styles.outlineButtonDark}
          >
            QUIERO SER SPONSOR
          </Link>
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className={styles.finalCta}>
      <div className={styles.finalCtaBackground} />

      <div className={styles.finalCtaContent}>
        <p className={styles.eyebrow}>SAGUNTO PADEL CUP</p>

        <h2>¿PREPARADO PARA COMPETIR?</h2>

        <p>
          Consulta los próximos torneos
          <br />
          y encuentra tu próxima prueba.
        </p>

        <Link
          href="/torneos"
          className={styles.primaryButton}
        >
          <span>VER TORNEOS</span>
        </Link>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  href,
  linkLabel,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`${styles.sectionHeader} ${dark ? styles.sectionHeaderDark : ""
        }`}
    >
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2>{title}</h2>
      </div>

      <Link
        href={href}
        className={
          dark
            ? styles.sectionHeaderButtonDark
            : styles.sectionHeaderButton
        }
      >
        {linkLabel}
      </Link>
    </div>
  );
}

function getUniqueCircuitCategories<
  T extends HomeData["categories"][number],
>(categories: T[]): T[] {
  const byLevel = new Map<number, T>();

  for (const category of categories) {
    const level = getCategoryLevel(category.nombre);

    if (level !== null && !byLevel.has(level)) {
      byLevel.set(level, category);
    }
  }

  return [1, 2, 3, 4]
    .map((level) => byLevel.get(level))
    .filter((category): category is T => Boolean(category));
}

function getUniqueRankingCategories(
  categories: Array<{
    category: HomeData["categories"][number];
    ranking: HomeData["rankingPreview"];
  }>,
) {
  const byLevel = new Map<
    number,
    {
      category: HomeData["categories"][number];
      ranking: HomeData["rankingPreview"];
    }
  >();

  for (const item of categories) {
    const level = getCategoryLevel(item.category.nombre);

    if (level !== null && !byLevel.has(level)) {
      byLevel.set(level, item);
    }
  }

  return [1, 2, 3, 4]
    .map((level) => byLevel.get(level))
    .filter(
      (
        item,
      ): item is {
        category: HomeData["categories"][number];
        ranking: HomeData["rankingPreview"];
      } => Boolean(item),
    );
}

function getHomeTournamentStatusClass(status: string): string {
  switch (status) {
    case "inscripciones_abiertas":
      return styles.tournamentStatusOpen;
    case "en_juego":
      return styles.tournamentStatusLive;
    case "publicado":
      return styles.tournamentStatusUpcoming;
    case "finalizado":
      return styles.tournamentStatusFinished;
    case "archivado":
    case "borrador":
    default:
      return styles.tournamentStatusNeutral;
  }
}

function getCategoryLevel(categoryName: string): number | null {
  const normalized = categoryName
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

  for (const level of [1, 2, 3, 4]) {
    if (
      normalized.startsWith(`${level}ª`) ||
      normalized.startsWith(`${level}º`) ||
      normalized.startsWith(`${level}A `) ||
      normalized === `${level}A` ||
      normalized.startsWith(`${level} `)
    ) {
      return level;
    }
  }

  return null;
}

function getCategoryShortLabel(categoryName: string): string {
  const level = getCategoryLevel(categoryName);
  return level ? `${level}ª` : categoryName.slice(0, 4);
}

function getCategoryDescription(categoryName: string): string {
  const level = getCategoryLevel(categoryName);

  if (level === 1) {
    return "La categoría de mayor nivel competitivo del circuito.";
  }

  if (level === 2) {
    return "Para jugadores con un nivel competitivo consolidado que buscan nuevos retos.";
  }

  if (level === 3) {
    return "Nivel intermedio para competir, progresar y seguir mejorando.";
  }

  if (level === 4) {
    return "Una categoría para empezar a competir y ganar experiencia en el circuito.";
  }

  return "Descubre toda la información de esta categoría.";
}
