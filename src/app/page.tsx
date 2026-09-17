import Image from "next/image";
import Link from "next/link";

import Header from "@/components/layout/Header";
import { getPublicCategories, getPublicNews, getPublicRanking, getPublicSponsors, getPublicTournaments } from "@/lib/public/site";

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
  const nextTournament = [...tournaments]
    .filter((tournament) => tournament.estado === "inscripciones_abiertas" || tournament.estado === "publicado")
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio))[0] ?? null;
  const rankingResult = await getPublicRanking(categoriesResult.data?.[0]?.id);
  const sponsorResult = await getPublicSponsors(tournaments.slice(0, 6).map((tournament) => tournament.id));

  const data: HomeData = {
    nextTournament: nextTournament ? {
      id: nextTournament.id,
      nombre: nextTournament.nombre,
      slug: nextTournament.slug,
      fechaInicio: nextTournament.fecha_inicio,
      fechaFin: nextTournament.fecha_fin,
      estado: nextTournament.estado,
      precioTexto: nextTournament.precio_texto,
      descripcion: nextTournament.descripcion,
      club: nextTournament.club ? { nombre: nextTournament.club.nombre, direccion: nextTournament.club.direccion } : null,
      categorias: [],
    } : null,
    upcomingTournaments: tournaments.slice(0, 6).map((tournament) => ({
      id: tournament.id,
      nombre: tournament.nombre,
      slug: tournament.slug,
      fechaInicio: tournament.fecha_inicio,
      fechaFin: tournament.fecha_fin,
      estado: tournament.estado,
      precioTexto: tournament.precio_texto,
      descripcion: tournament.descripcion,
      club: tournament.club ? { nombre: tournament.club.nombre, direccion: tournament.club.direccion } : null,
      categorias: [],
    })),
    rankingPreview: (rankingResult.data?.entries ?? []).slice(0, 5).map((entry) => ({
      position: entry.position,
      playerId: entry.player.id,
      nombre: entry.player.nombre,
      apellidos: entry.player.apellidos,
      puntos: entry.points,
      pruebas: entry.tournaments,
      fotoUrl: entry.player.foto_url,
    })),
    categories: (categoriesResult.data ?? []).map((category) => ({ id: category.id, nombre: category.nombre, nivelOrden: category.nivel_orden })),
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
    <div className={styles.page}>
      <Header />

      <main>
        <HeroSection tournament={data.nextTournament} />

        <CircuitSection />

        <CompetitionSection
          tournaments={data.upcomingTournaments}
          ranking={data.rankingPreview}
        />

        <CategoriesSection categories={data.categories} />

        <HowItWorksSection />

        <RaceToMasterSection />

        <NewsSection news={data.news} />

        <SponsorsSection sponsors={data.sponsors} />

        <FinalCtaSection />
      </main>

      <Footer />
    </div>
  );
}

function HeroSection({
  tournament,
}: {
  tournament: HomeTournament | null;
}) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroOverlay} />

      <div className={styles.heroBackground}>
        <div className={styles.heroImagePlaceholder} />
      </div>

      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>SAGUNTO PADEL CUP</p>

          <h1 className={styles.heroTitle}>
            TORNEOS DE
            <br />
            PÁDEL EN SAGUNTO
          </h1>

          <p className={styles.heroLead}>
            Sagunto Padel Cup es un circuito de pádel amateur
            en Sagunto.
          </p>

          <p className={styles.heroDescription}>
            Un circuito formado por diferentes torneos, con
            ranking individual, Race to Master y un Master Final
            donde se decide quién domina la temporada.
          </p>

          <div className={styles.heroActions}>
            <Link
              href="/torneos"
              className={styles.primaryButton}
            >
              <span>VER PRÓXIMOS TORNEOS</span>
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/ranking"
              className={styles.secondaryButton}
            >
              CONSULTAR RANKING
            </Link>
          </div>
        </div>

        <HeroTournamentCard tournament={tournament} />
      </div>
    </section>
  );
}

function HeroTournamentCard({
  tournament,
}: {
  tournament: HomeTournament | null;
}) {
  if (!tournament) {
    return (
      <aside className={styles.heroTournamentCard}>
        <div className={styles.cardTopLine} />

        <p className={styles.heroCardEyebrow}>
          PRÓXIMO TORNEO
        </p>

        <h2 className={styles.heroCardTitle}>
          Próximamente
        </h2>

        <p className={styles.heroCardEmpty}>
          Estamos preparando la próxima prueba del circuito.
        </p>

        <Link
          href="/torneos"
          className={styles.heroCardLink}
        >
          VER TORNEOS
          <span aria-hidden="true">→</span>
        </Link>
      </aside>
    );
  }

  const statusVariant = getTournamentStatusVariant(
    tournament.estado,
  );

  return (
    <aside className={styles.heroTournamentCard}>
      <div className={styles.cardTopLine} />

      <p className={styles.heroCardEyebrow}>
        PRÓXIMO TORNEO
      </p>

      <div className={styles.heroTournamentNumber}>
        01
      </div>

      <h2 className={styles.heroCardTitle}>
        {tournament.nombre}
      </h2>

      <div className={styles.heroCardMeta}>
        <div>
          <span className={styles.metaIcon}>▣</span>
          <span>
            {formatTournamentDate(
              tournament.fechaInicio,
              tournament.fechaFin,
            )}
          </span>
        </div>

        {tournament.club && (
          <div>
            <span className={styles.metaIcon}>⌖</span>
            <span>{tournament.club.nombre}</span>
          </div>
        )}

        <div>
          <span
            className={`${styles.statusDot} ${statusVariant === "open"
              ? styles.statusDotOpen
              : ""
              }`}
          />
          <span>
            {getTournamentStatusLabel(tournament.estado)}
          </span>
        </div>
      </div>

      <Link
        href={getTournamentHref(tournament.slug)}
        className={styles.heroCardLink}
      >
        VER TORNEO
        <span aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}

function CircuitSection() {
  return (
    <section className={styles.circuitSection}>
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeadingDark}>
          <p className={styles.eyebrow}>CIRCUITO</p>

          <h2>Todo lo que necesitas en un solo circuito</h2>
        </div>

        <div className={styles.circuitGrid}>
          <CircuitFeature
            number="01"
            title="TORNEOS"
            description="Vive diferentes pruebas a lo largo de la temporada en las mejores instalaciones de Sagunto."
            href="/torneos"
            symbol="T"
          />

          <CircuitFeature
            number="02"
            title="RANKING"
            description="Ranking individual por puntos que refleja tu evolución durante toda la temporada."
            href="/ranking"
            symbol="R"
          />

          <CircuitFeature
            number="03"
            title="RACE TO MASTER"
            description="Cada punto cuenta. Avanza en el Race to Master y logra tu plaza para el Master Final."
            href="/master"
            symbol="★"
          />
        </div>
      </div>
    </section>
  );
}

function CircuitFeature({
  number,
  title,
  description,
  href,
  symbol,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
  symbol: string;
}) {
  return (
    <article className={styles.circuitFeature}>
      <div className={styles.featureSymbol}>
        {symbol}
      </div>

      <div className={styles.featureNumber}>
        {number}
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      <Link
        href={href}
        className={styles.textLinkDark}
      >
        VER MÁS
        <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function CompetitionSection({
  tournaments,
  ranking,
}: {
  tournaments: HomeTournament[];
  ranking: HomeData["rankingPreview"];
}) {
  return (
    <section className={styles.competitionSection}>
      <div className={styles.sectionContainer}>
        <div className={styles.competitionGrid}>
          <div className={styles.tournamentsColumn}>
            <SectionHeader
              eyebrow="PRÓXIMOS TORNEOS"
              title="Próximos torneos de pádel"
              href="/torneos"
              linkLabel="VER TODOS"
            />

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
                title="Próximamente"
                description="Aquí aparecerán las próximas pruebas del circuito."
                href="/torneos"
              />
            )}
          </div>

          <div className={styles.rankingColumn}>
            <SectionHeader
              eyebrow="RANKING DE PÁDEL"
              title="Top 5 del ranking"
              href="/ranking"
              linkLabel="VER RANKING COMPLETO"
            />

            {ranking.length > 0 ? (
              <RankingTable ranking={ranking.slice(0, 5)} />
            ) : (
              <EmptyCompetitionState
                title="Ranking próximamente"
                description="Los resultados aparecerán aquí cuando haya puntos registrados."
                href="/ranking"
              />
            )}
          </div>
        </div>
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

  return (
    <article className={styles.tournamentCard}>
      <div className={styles.tournamentImage}>
        <div className={styles.tournamentImagePlaceholder} />

        <span className={styles.tournamentNumber}>
          {number}
        </span>
      </div>

      <div className={styles.tournamentBody}>
        <h3>{tournament.nombre}</h3>

        <div className={styles.tournamentMeta}>
          <span>
            ▣{" "}
            {formatTournamentDate(
              tournament.fechaInicio,
              tournament.fechaFin,
            )}
          </span>

          {tournament.club && (
            <span>⌖ {tournament.club.nombre}</span>
          )}

          {tournament.categorias.length > 0 && (
            <span>
              {tournament.categorias.join(" · ")}
            </span>
          )}
        </div>

        <div className={styles.tournamentFooter}>
          <span
            className={`${styles.tournamentStatus} ${variant === "open"
              ? styles.tournamentStatusOpen
              : variant === "live"
                ? styles.tournamentStatusLive
                : styles.tournamentStatusUpcoming
              }`}
          >
            {getTournamentStatusLabel(tournament.estado)}
          </span>

          <Link
            href={getTournamentHref(tournament.slug)}
            className={styles.cardArrow}
            aria-label={`Ver ${tournament.nombre}`}
          >
            →
          </Link>
        </div>
      </div>
    </article>
  );
}

function RankingTable({
  ranking,
}: {
  ranking: HomeData["rankingPreview"];
}) {
  return (
    <div className={styles.rankingTable}>
      <div className={styles.rankingHeader}>
        <span>POS.</span>
        <span>JUGADOR</span>
        <span>PUNTOS</span>
        <span>PRUEBAS</span>
      </div>

      {ranking.map((player) => (
        <Link
          key={player.playerId}
          href={getPlayerHref(player.playerId)}
          className={styles.rankingRow}
        >
          <span className={styles.rankingPosition}>
            {String(player.position).padStart(2, "0")}
          </span>

          <span className={styles.rankingPlayer}>
            {player.nombre} {player.apellidos ?? ""}
          </span>

          <span className={styles.rankingPoints}>
            {formatRankingPoints(player.puntos)}
          </span>

          <span className={styles.rankingEvents}>
            {player.pruebas}
          </span>
        </Link>
      ))}
    </div>
  );
}

function EmptyCompetitionState({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className={styles.emptyCompetition}>
      <span className={styles.emptyCompetitionLine} />

      <h3>{title}</h3>

      <p>{description}</p>

      <Link
        href={href}
        className={styles.textLinkLight}
      >
        VER MÁS
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function CategoriesSection({
  categories,
}: {
  categories: HomeData["categories"];
}) {
  return (
    <section className={styles.categoriesSection}>
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeadingLight}>
          <p className={styles.eyebrow}>CATEGORÍAS</p>

          <h2>Encuentra tu categoría</h2>
        </div>

        <div className={styles.categoriesGrid}>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={getCategoryHref(category.id)}
              className={styles.categoryCard}
            >
              <div className={styles.categoryBadge}>
                {getCategoryShortLabel(category.nombre)}
              </div>

              <div className={styles.categoryContent}>
                <h3>{category.nombre}</h3>

                <p>
                  {getCategoryDescription(category.nombre)}
                </p>

                <span className={styles.textLinkLight}>
                  VER MÁS
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className={styles.howSection}>
      <div className={styles.howOverlay} />

      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeadingDark}>
          <p className={styles.eyebrow}>CÓMO FUNCIONA</p>

          <h2>Así funciona Sagunto Padel Cup</h2>
        </div>

        <div className={styles.stepsGrid}>
          <HowItWorksStep
            number="01"
            title="COMPITE"
            description="Participa en las pruebas del circuito en las categorías que mejor se adapten a tu nivel."
            symbol="T"
          />

          <HowItWorksStep
            number="02"
            title="SUMA PUNTOS"
            description="Tus resultados en cada torneo influyen en tu clasificación del ranking individual."
            symbol="↗"
          />

          <HowItWorksStep
            number="03"
            title="LUCHA POR EL MASTER"
            description="Avanza en el Race to Master durante la temporada y consigue tu plaza para el Master Final."
            symbol="★"
          />
        </div>
      </div>
    </section>
  );
}

function HowItWorksStep({
  number,
  title,
  description,
  symbol,
}: {
  number: string;
  title: string;
  description: string;
  symbol: string;
}) {
  return (
    <article className={styles.step}>
      <div className={styles.stepTop}>
        <span className={styles.stepNumber}>{number}</span>

        <span className={styles.stepSymbol}>{symbol}</span>
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </article>
  );
}

function RaceToMasterSection() {
  return (
    <section className={styles.masterSection}>
      <div className={styles.masterBackground}>
        <div className={styles.masterImagePlaceholder} />
      </div>

      <div className={styles.masterOverlay} />

      <div className={styles.sectionContainer}>
        <div className={styles.masterGrid}>
          <div className={styles.masterBrand}>
            <span>RACE TO</span>
            <strong>MASTER</strong>
            <b>★</b>
          </div>

          <div className={styles.masterContent}>
            <h2>
              Tu temporada no termina en un torneo.
            </h2>

            <p>
              Cada prueba cuenta para alcanzar el Master Final.
            </p>

            <Link
              href="/master"
              className={styles.primaryButton}
            >
              <span>VER RACE TO MASTER</span>
              <span aria-hidden="true">→</span>
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

  return (
    <section className={styles.newsSection}>
      <div className={styles.sectionContainer}>
        <SectionHeader
          eyebrow="ACTUALIDAD"
          title="Últimas noticias"
          href="/noticias"
          linkLabel="VER TODAS"
        />

        <div className={styles.newsGrid}>
          {news.slice(0, 3).map((item) => (
            <Link
              href={getNewsHref(item.slug)}
              key={item.id}
              className={styles.newsCard}
            >
              <div className={styles.newsImage}>
                {item.imagenDestacada ? (
                  <Image
                    src={item.imagenDestacada}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className={styles.newsImagePlaceholder} />
                )}
              </div>

              <div className={styles.newsBody}>
                {item.fechaPublicacion && (
                  <span>
                    {formatNewsDate(item.fechaPublicacion)}
                  </span>
                )}

                <h3>{item.titulo}</h3>

                <span className={styles.textLinkLight}>
                  LEER NOTICIA
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SponsorsSection({
  sponsors,
}: {
  sponsors: HomeData["sponsors"];
}) {
  if (sponsors.length === 0) {
    return null;
  }

  return (
    <section className={styles.sponsorsSection}>
      <div className={styles.sectionContainer}>
        <div className={styles.sectionHeadingLight}>
          <p className={styles.eyebrow}>COLABORADORES</p>

          <h2>Con el apoyo de</h2>
        </div>

        <div className={styles.sponsorsGrid}>
          {sponsors.map((sponsor) => {
            const content = (
              <>
                {sponsor.logoUrl ? (
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
                )}
              </>
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
          <span aria-hidden="true">→</span>
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
}: {
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2>{title}</h2>
      </div>

      <Link
        href={href}
        className={styles.sectionHeaderLink}
      >
        {linkLabel}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerBrand}>
          <Link
            href="/"
            className={styles.footerLogo}
            aria-label="Sagunto Padel Cup"
          >
            <span className={styles.footerLogoMark}>S</span>

            <span>
              <strong>SAGUNTO</strong>
              <b>PADEL CUP</b>
            </span>
          </Link>

          <p>
            Circuito de pádel amateur en Sagunto
            con torneos, ranking individual,
            Race to Master y Master Final.
          </p>

          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.instagramLink}
            aria-label="Instagram"
          >
            Instagram
          </a>
        </div>

        <FooterColumn
          title="CIRCUITO"
          links={[
            ["Torneos", "/torneos"],
            ["Ranking", "/ranking"],
            ["Jugadores", "/jugadores"],
            ["Circuito", "/circuito"],
          ]}
        />

        <FooterColumn
          title="COMPETICIÓN"
          links={[
            ["Cómo funciona", "/circuito"],
            ["Categorías", "/ranking"],
            ["Race to Master", "/master"],
            ["Master Final", "/master"],
          ]}
        />

        <FooterColumn
          title="CONTACTO"
          links={[
            ["Contacto", "/contacto"],
            ["Instagram", "https://www.instagram.com/"],
          ]}
        />

        <FooterColumn
          title="LEGAL"
          links={[
            ["Aviso legal", "/legal"],
            ["Privacidad", "/privacidad"],
            ["Cookies", "/cookies"],
          ]}
        />
      </div>

      <div className={styles.footerBottom}>
        <span>
          © {new Date().getFullYear()} Sagunto Padel Cup.
        </span>

        <span>
          Todos los derechos reservados.
        </span>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div className={styles.footerColumn}>
      <h3>{title}</h3>

      {links.map(([label, href]) => {
        const isExternal = href.startsWith("http");

        if (isExternal) {
          return (
            <a
              href={href}
              key={label}
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
            </a>
          );
        }

        return (
          <Link href={href} key={label}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function getCategoryShortLabel(
  categoryName: string,
): string {
  const normalized = categoryName.toUpperCase();

  if (normalized.includes("INICIACIÓN")) {
    return "INC.";
  }

  if (normalized.includes("2ª")) {
    return "2ª";
  }

  if (normalized.includes("3ª")) {
    return "3ª";
  }

  if (normalized.includes("4ª")) {
    return "4ª";
  }

  return categoryName.slice(0, 4);
}

function getCategoryDescription(
  categoryName: string,
): string {
  const normalized = categoryName.toUpperCase();

  if (normalized.includes("2ª")) {
    return "Para jugadores con un nivel competitivo consolidado que buscan retos exigentes.";
  }

  if (normalized.includes("3ª")) {
    return "Nivel intermedio que busca competir y seguir mejorando en cada torneo.";
  }

  if (normalized.includes("4ª")) {
    return "Para jugadores que quieren disfrutar, competir y ganar experiencia.";
  }

  return "El punto de partida perfecto para empezar a competir en el circuito.";
}