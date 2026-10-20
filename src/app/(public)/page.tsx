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
import { SiteFooter } from "@/components/public/site-footer";

import {
    upcomingEvent,
    newsItems,
    rankingPreview,
    resultsPreview,
    sponsors,
} from "@/domains/content/home-content";

import styles from "./home.module.css";

export default function HomePage() {
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
                    className="section section-light"
                    id="proxima-prueba"
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
                                    INFORMACIÓN POR CONFIRMAR
                                </span>

                                <div className={styles.posterContent}>
                                    <p className={styles.posterNumber}>
                                        PRUEBA {upcomingEvent.number}
                                    </p>

                                    <h3>{upcomingEvent.club}</h3>

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

                                        <strong>{upcomingEvent.dateLabel}</strong>

                                        <small>{upcomingEvent.yearLabel}</small>
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

                                        <strong>{upcomingEvent.club}</strong>

                                        <small>{upcomingEvent.location}</small>
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
                                            <span>1.ª Cat.</span>
                                            <span>2.ª Cat.</span>
                                            <span>3.ª Cat.</span>
                                            <span className={styles.tagSage}>
                                                Iniciación
                                            </span>
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
                                    Fecha, sede, precios y plazo de inscripción
                                    pendientes de confirmación oficial.
                                </p>
                            </article>

                            <aside className={styles.eventAside}>
                                <div className={styles.asideFact}>
                                    <UsersRound size={23} />

                                    <div>
                                        <strong>Plazas limitadas</strong>
                                        <span>
                                            Cupos pendientes de confirmación
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.asideFact}>
                                    <Layers3 size={23} />

                                    <div>
                                        <strong>Inscripción</strong>
                                        <span>Precio por confirmar</span>
                                    </div>
                                </div>

                                <div className={styles.asideFact}>
                                    <Clock3 size={23} />

                                    <div>
                                        <strong>Cierre de inscripción</strong>
                                        <span>Fecha por confirmar</span>
                                    </div>
                                </div>

                                <div className={styles.asideFact}>
                                    <Star size={23} />

                                    <div>
                                        <strong>Organización</strong>
                                        <span>Información oficial pendiente</span>
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
                    className="section section-light section-calendar"
                    id="calendario"
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

                        <CircuitCalendar />
                    </div>
                </section>

                {/* RANKING */}
                <section
                    className={`section section-dark ${styles.rankingSection}`}
                    id="ranking"
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

                        <p className={styles.demoNoticeDark}>
                            La clasificación se conectará a los puntos oficiales
                            validados por la organización.
                        </p>
                    </div>
                </section>

                {/* RESULTADOS */}
                <section
                    className="section section-light"
                    id="resultados"
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
                        </div>
                    </div>
                </section>

                {/* SAGUNTO */}
                <section
                    className={styles.saguntoBanner}
                    id="circuito"
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

                        <h2>
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
                    className="section section-light"
                    id="actualidad"
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
                                <span key={sponsor}>{sponsor}</span>
                            ))}
                        </div>

                        <p className={styles.demoNotice}>
                            Los patrocinadores definitivos se mostrarán cuando
                            su colaboración y el uso de sus marcas estén confirmados.
                        </p>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </>
    );
}