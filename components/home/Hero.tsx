import Image from "next/image";
import Link from "next/link";
import GoogleIcon from "@/components/ui/GoogleIcon";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_ESTADO_PRUEBA } from "@/lib/constantes";
import { euros, fechaLarga } from "@/lib/formato";
import type { PruebaHome } from "@/lib/home/datos";
import s from "./home.module.css";

type Props = {
    temporada: string | null;
    proxima: PruebaHome | null;
    pruebas: number;
    proximaHref?: string;
};

function fechasDePrueba(prueba: PruebaHome): string {
    const inicio = fechaLarga(prueba.fechaInicio);
    return prueba.fechaFin !== prueba.fechaInicio
        ? `${inicio} – ${fechaLarga(prueba.fechaFin)}`
        : inicio;
}

export default function Hero({ temporada, proxima, pruebas, proximaHref }: Props) {
    const inscripcionesAbiertas = proxima?.estado === "abierta";
    const href = proximaHref ?? proxima?.href ?? (proxima
        ? inscripcionesAbiertas
            ? `/inscribirse/${proxima.slug}`
            : `/pruebas/${proxima.slug}`
        : "/calendario");

    return (
        <section className={s.hero}>
            <div className={s.heroArt} aria-hidden="true">
                <Image src="/images/padel-hero.jpg" alt="" fill priority sizes="100vw" />
            </div>
            <div className={`container ${s.heroGrid}`}>
                <div className={s.heroCopy}>
                    <p className={s.kicker}>
                        Sagunto Padel Cup{temporada ? ` · Temporada ${temporada}` : ""}
                    </p>
                    <h1 className={s.heroTitle}>
                        <span>Compite</span>
                        <span>en Sagunto.</span>
                        <span className={s.heroTitleAccent}>Suma puntos.</span>
                        <span>Vive el pádel.</span>
                    </h1>
                    <p className={s.heroLead}>
                        {pruebas} pruebas. Un ranking individual.
                        <br />
                        Un destino: el Máster Final.
                    </p>
                    <div className={s.heroActions}>
                        <Link href={href} className="btn btn-cta">
                            <GoogleIcon name="calendar_month" />
                            Ver próxima prueba
                            <GoogleIcon name="arrow_forward" />
                        </Link>
                        <Link href="/circuito" className="btn btn-claro">
                            <GoogleIcon name="sports_tennis" />
                            Descubrir el circuito
                        </Link>
                    </div>
                </div>
                <article className={s.heroProxima} aria-labelledby="hero-proxima-titulo">
                    <div className={s.heroProximaImagen}>
                        <Image
                            src="/images/padel-court.jpg"
                            alt=""
                            fill
                            loading="eager"
                            sizes="(max-width: 760px) 100vw, 34vw"
                        />
                        <span className={s.heroProximaEstado}>
                            {proxima ? ETIQUETAS_ESTADO_PRUEBA[proxima.estado] : "Próximamente"}
                        </span>
                    </div>
                    <div className={s.heroProximaContenido}>
                        <div>
                            <p className={s.heroProximaEyebrow}>Próxima prueba</p>
                            <h2 id="hero-proxima-titulo" className={s.heroProximaTitulo}>
                                {proxima?.nombre ?? "Nuevas fechas en camino"}
                            </h2>
                        </div>
                        {proxima ? (
                            <>
                                <div className={s.heroProximaDatos}>
                                    <div>
                                        <GoogleIcon name="calendar_month" />
                                        <span>
                                            <small>Fecha</small>
                                            <strong>{fechasDePrueba(proxima)}</strong>
                                        </span>
                                    </div>
                                    <div>
                                        <GoogleIcon name="location_on" />
                                        <span>
                                            <small>Sede</small>
                                            <strong>{proxima.sede}</strong>
                                        </span>
                                    </div>
                                </div>
                                <div className={s.heroProximaResumen}>
                                    <div>
                                        <span>Plazas disponibles</span>
                                        <strong>{proxima.plazasLibres} / {proxima.plazasMaximas}</strong>
                                    </div>
                                    <div>
                                        <span>Precio por pareja</span>
                                        <strong>{euros(proxima.precioCentimos)}</strong>
                                    </div>
                                </div>
                                <ul className={s.heroProximaCategorias} aria-label="Categorías">
                                    {proxima.categorias.map((categoria) => (
                                        <li key={categoria}>{ETIQUETAS_CATEGORIA[categoria]}</li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <p className={s.heroProximaSinPrueba}>
                                Estamos preparando el calendario. Consulta las fechas en cuanto se publiquen.
                            </p>
                        )}
                        <Link href={href} className={s.heroProximaBoton}>
                            {!proxima || href === "/calendario"
                                ? "Ver calendario"
                                : inscripcionesAbiertas
                                  ? "Inscribirme"
                                  : "Ver detalles"}
                            <GoogleIcon name="arrow_forward" />
                        </Link>
                    </div>
                </article>
            </div>
        </section>
    );
}
