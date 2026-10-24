import {
    ArrowDownRight,
    ArrowRight,
    BarChart3,
    CalendarDays,
    Clock3,
    FileText,
    HeartHandshake,
    Layers3,
    MapPin,
    Star,
    Trophy,
    UsersRound,
} from "lucide-react";

import { HomeHeader } from "@/components/public/home-header";
import { SectionHeading } from "@/components/public/section-heading";
import { RankingPreview } from "@/components/public/ranking-preview";
import { CircuitCalendar } from "@/components/public/circuit-calendar";
import SiteFooter from "@/components/public/site-footer";

import { getHomeData } from "@/domains/content/home-data";

import styles from "./home.module.css";

export default async function HomePage() {
    const {
        upcomingEvent,
        calendarEvents,
        masterFinal,
        rankingPreview,
        resultsPreview,
        newsItems,
        sponsors,
    } = await getHomeData();

    return (
        <>
            <HomeHeader />

            <main>
                {/* HERO PRINCIPAL */}
                <section
                    className={styles.hero}
                    aria-labelledby="hero-title"
                >
                    <div
                        className={styles.heroImage}
                        aria-hidden="true"
                    />

                    <div
                        className={styles.heroOverlay}
                        aria-hidden="true"
                    />

                    <div className={`container ${styles.heroContent}`}>
                        <p className={styles.eyebrow}>
                            SAGUNTO PADEL CUP
                        </p>

                        <h1 id="hero-title">
                            COMPITE EN SAGUNTO.
                            <span>SUMA PUNTOS.</span>
                            VIVE EL PÁDEL.
                        </h1>

                        <p className={styles.heroLead}>
                            Seis pruebas. Un ranking individual.
                            <br />
                            Un destino: el Máster Final.
                        </p>

                        <div className={styles.heroActions}>
                            <a
                                className="button button-primary"
                                href="#proxima-prueba"
                            >
                                <CalendarDays size={17} />
                                Ver próxima prueba
                            </a>

                            <a
                                className="button button-outline-light"
                                href="#circuito"
                            >
                                <Trophy size={17} />
                                Descubrir el circuito
                            </a>
                        </div>
                    </div>

                    <div
                        className={styles.heroSlogan}
                        aria-hidden="true"
                    >
                        MÁS
                        <br />
                        PÁDEL
                        <br />
                        MÁS
                        <br />
                        SAGUNTO
                    </div>
                </section>

                {/* PRÓXIMA PRUEBA */}
                <section
                    className={`section section-light ${styles.eventsSection}`}
                    id="proxima-prueba"
                    aria-labelledby="next-event-title"
                >
                    <div className="container">
                        <SectionHeading
                            eyebrow="EL CIRCUITO"
                            title="PRÓXIMA PRUEBA"
                            action={
                                <a
                                    className="text-link"
                                    href="/calendario"
                                >
                                    Ver calendario completo
                                    <CalendarDays size={16} />
                                </a>
                            }
                        />

                        <div className={styles.eventGrid}>
                            <article className={styles.eventPoster}>
                                <div
                                    className={styles.posterImage}
                                    aria-hidden="true"
                                />

                                <div
                                    className={styles.posterShade}
                                    aria-hidden="true"
                                />

                                <span className={styles.statusPill}>
                                    {upcomingEvent.id
                                        ? "DATOS DE LA PRUEBA"
                                        : "INFORMACIÓN POR CONFIRMAR"}
                                </span>

                                <div className={styles.posterContent}>
                                    <p className={styles.posterNumber}>
                                        PRUEBA {upcomingEvent.number}
                                    </p>

                                    <h3 id="next-event-title">
                                        {upcomingEvent.club}
                                    </h3>

                                    <div className={styles.posterMeta}>
                                        <span>
                                            <CalendarDays size={15} />
                                            {upcomingEvent.dateLabel}
                                        </span>

                                        <span>
                                            <MapPin size={15} />
                                            {upcomingEvent.location}
                                        </span>
                                    </div>

                                    <div className={styles.organizerMarks}>
                                        <span>CLUB ORGANIZADOR</span>
                                        <span>SEDE OFICIAL</span>
                                    </div>
                                </div>
                            </article>

                            <article className={styles.eventDetails}>
                                <div className={styles.detailRow}>
                                    <CalendarDays
                                        className={styles.detailIcon}
                                        size={25}
                                    />

                                    <div>
                                        <span className={styles.detailLabel}>
                                            FECHA
                                        </span>

                                        <strong>
                                            {upcomingEvent.dateLabel}
                                        </strong>

                                        <small>
                                            {upcomingEvent.yearLabel}
                                        </small>
                                    </div>
                                </div>

                                <div className={styles.detailRow}>
                                    <MapPin
                                        className={styles.detailIcon}
                                        size={25}
                                    />

                                    <div>
                                        <span className={styles.detailLabel}>
                                            SEDE
                                        </span>

                                        <strong>
                                            {upcomingEvent.club}
                                        </strong>

                                        <small>
                                            {upcomingEvent.location}
                                        </small>
                                    </div>
                                </div>

                                <div className={styles.detailRow}>
                                    <Layers3
                                        className={styles.detailIconMuted}
                                        size={24}
                                    />

                                    <div>
                                        <span className={styles.detailLabel}>
                                            CATEGORÍAS
                                        </span>

                                        <div className={styles.categoryTags}>
                                            {upcomingEvent.categories.length > 0 ? (
                                                upcomingEvent.categories.map((category) => (
                                                    <span
                                                        key={category}
                                                        className={
                                                            category
                                                                .toLowerCase()
                                                                .includes("iniciación")
                                                                ? styles.tagSage
                                                                : undefined
                                                        }
                                                    >
                                                        {category}
                                                    </span>
                                                ))
                                            ) : (
                                                <span>
                                                    Categorías por confirmar
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <a
                                    className={`button button-primary ${styles.eventCta}`}
                                    href="/calendario"
                                >
                                    <FileText size={16} />
                                    Consultar detalles
                                </a>

                                <p className={styles.demoNotice}>
                                    Los precios y las condiciones de inscripción
                                    se publicarán cuando estén confirmados por
                                    la organización.
                                </p>
                            </article>

                            <aside className={styles.eventAside}>
                                <div className={styles.asideFact}>
                                    <UsersRound size={23} />

                                    <div>
                                        <strong>
                                            {upcomingEvent.capacity
                                                ? `${upcomingEvent.capacity} plazas disponibles como máximo`
                                                : "Aforo por confirmar"}
                                        </strong>
                                        <span>
                                            Capacidad publicada para esta prueba
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.asideFact}>
                                    <Layers3 size={23} />

                                    <div>
                                        <strong>Inicio de inscripción</strong>
                                        <span>
                                            {upcomingEvent.registrationOpensLabel}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.asideFact}>
                                    <Clock3 size={23} />

                                    <div>
                                        <strong>Cierre de inscripción</strong>
                                        <span>
                                            {upcomingEvent.registrationClosesLabel}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.asideFact}>
                                    <Star size={23} />

                                    <div>
                                        <strong>Organización</strong>
                                        <span>
                                            Información oficial pendiente
                                        </span>
                                    </div>
                                </div>

                                <div
                                    className={styles.asidePhoto}
                                    aria-hidden="true"
                                />
                            </aside>
                        </div>
                    </div>
                </section>

                {/* CALENDARIO */}
                <section
                    className={`section section-light section-calendar ${styles.calendarSection}`}
                    id="calendario"
                    aria-labelledby="calendar-title"
                >
                    <div className="container">
                        <SectionHeading
                            eyebrow="TEMPORADA 2026/27"
                            title="CALENDARIO"
                            description="Seis pruebas. Un ranking. Un Máster Final."
                            action={
                                <a
                                    className="text-link"
                                    href="/calendario"
                                >
                                    Ver todas las fechas
                                    <ArrowRight size={16} />
                                </a>
                            }
                        />

                        <CircuitCalendar
                            events={calendarEvents}
                            masterFinal={masterFinal}
                        />
                    </div>
                </section>

                {/* RANKING */}
                <section
                    className={`section section-dark ${styles.rankingSection}`}
                    id="ranking"
                    aria-labelledby="ranking-title"
                >
                    <div
                        className={styles.rankingBackdrop}
                        aria-hidden="true"
                    />

                    <div className="container">
                        <SectionHeading
                            eyebrow="RACE TO MASTER"
                            title="RANKING INDIVIDUAL"
                            dark
                            action={
                                <a
                                    className="button button-outline-light button-small"
                                    href="/ranking"
                                >
                                    Ver ranking completo
                                    <BarChart3 size={15} />
                                </a>
                            }
                        />

                        <RankingPreview players={rankingPreview} />

                        {rankingPreview.length === 0 && (
                            <p className={styles.demoNoticeDark}>
                                El ranking oficial aparecerá cuando exista una
                                clasificación publicada para la temporada activa.
                            </p>
                        )}
                    </div>
                </section>

                {/* RESULTADOS */}
                <section
                    className={`section section-light ${styles.resultsSection}`}
                    id="resultados"
                    aria-labelledby="results-title"
                >
                    <div className="container">
                        <SectionHeading
                            eyebrow="COMPETICIÓN"
                            title="ÚLTIMOS RESULTADOS"
                            action={
                                <a
                                    className="text-link"
                                    href="/resultados"
                                >
                                    Ver todos los resultados
                                    <BarChart3 size={16} />
                                </a>
                            }
                        />

                        <div className={styles.resultsGrid}>
                            {resultsPreview.map((result) => (
                                <a
                                    href={result.href}
                                    className={styles.resultCard}
                                    key={result.id}
                                >
                                    <div
                                        className={`${styles.resultImage} ${styles[result.imageClass]}`}
                                        aria-hidden="true"
                                    />

                                    <div className={styles.resultCopy}>
                                        <span className={styles.resultCategory}>
                                            {result.category}
                                        </span>

                                        <strong>RESULTADOS OFICIALES</strong>

                                        <span>{result.description}</span>

                                        <small>
                                            <CalendarDays size={13} />
                                            {result.date}
                                        </small>
                                    </div>
                                </a>
                            ))}

                            {resultsPreview.length === 0 && (
                                <p role="status">
                                    Todavía no hay resultados validados publicados.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* SAGUNTO */}
                <section
                    className={styles.saguntoBanner}
                    id="circuito"
                    aria-labelledby="sagunto-title"
                >
                    <div
                        className={styles.saguntoPhoto}
                        aria-hidden="true"
                    />

                    <div
                        className={styles.saguntoShade}
                        aria-hidden="true"
                    />

                    <div className={`container ${styles.saguntoContent}`}>
                        <p className={styles.eyebrow}>
                            DEPORTE, COMUNIDAD Y TERRITORIO
                        </p>

                        <h2 id="sagunto-title">
                            UN CIRCUITO
                            <br />
                            EN UNA CIUDAD
                            <br />
                            <span>CON HISTORIA.</span>
                        </h2>

                        <p>
                            El pádel también se vive fuera de la pista.
                            <br />
                            Descubre Sagunto y forma parte del circuito.
                        </p>

                        <a
                            className="button button-outline-light"
                            href="/circuito"
                        >
                            Descubre el circuito
                            <ArrowDownRight size={17} />
                        </a>
                    </div>
                </section>

                {/* ACTUALIDAD */}
                <section
                    className={`section section-light ${styles.newsSection}`}
                    id="actualidad"
                    aria-labelledby="news-title"
                >
                    <div className="container">
                        <SectionHeading
                            eyebrow="NOTICIAS Y AVISOS"
                            title="ACTUALIDAD"
                            action={
                                <a
                                    className="text-link"
                                    href="/noticias"
                                >
                                    Ver todas las noticias
                                    <ArrowRight size={16} />
                                </a>
                            }
                        />

                        <div className={styles.newsGrid}>
                            {newsItems.map((item) => (
                                <article
                                    className={styles.newsCard}
                                    key={item.id}
                                >
                                    <div
                                        className={`${styles.newsImage} ${styles[item.imageClass]}`}
                                        aria-hidden="true"
                                    >
                                        <span>{item.tag}</span>
                                    </div>

                                    <div className={styles.newsCopy}>
                                        <h3>{item.title}</h3>
                                        <p>{item.summary}</p>

                                        <small>
                                            <CalendarDays size={13} />
                                            {item.date}
                                        </small>
                                    </div>
                                </article>
                            ))}

                            {newsItems.length === 0 && (
                                <p role="status">
                                    Todavía no hay noticias publicadas.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* PATROCINADORES */}
                <section
                    className={styles.sponsorsSection}
                    aria-labelledby="sponsors-title"
                >
                    <div className="container">
                        <h2 id="sponsors-title">
                            <HeartHandshake size={18} />
                            PATROCINADORES Y COLABORADORES
                        </h2>

                        <div className={styles.sponsorsList}>
                            {sponsors.map((sponsor) => (
                                <span key={sponsor.id}>
                                    {sponsor.logo_url ? (
                                        <img
                                            src={sponsor.logo_url}
                                            alt={sponsor.name}
                                            loading="lazy"
                                        />
                                    ) : sponsor.website_url ? (
                                        <a
                                            href={sponsor.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {sponsor.name}
                                        </a>
                                    ) : (
                                        sponsor.name
                                    )}
                                </span>
                            ))}

                            {sponsors.length === 0 && (
                                <p role="status">
                                    Los patrocinadores se mostrarán cuando estén
                                    publicados por la organización.
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </>
    );
}