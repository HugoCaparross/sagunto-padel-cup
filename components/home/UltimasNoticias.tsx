import Image from "next/image";
import Link from "next/link";
import type { NoticiaPublica } from "@/actions/noticias";
import { fechaCorta } from "@/lib/formato";
import { ETIQUETAS_NOTICIA } from "@/lib/validadores/noticias";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type NoticiaHome = NoticiaPublica & { href?: string };

type Props = { noticias: NoticiaHome[] };

export default function UltimasNoticias({ noticias }: Props) {
    return (
        <section className={`${s.section} ${s.sectionDark}`}>
            <div className="container grid gap-10 lg:grid-cols-[1fr_2.2fr] lg:items-start">
                <header className="space-y-5">
                    <h2 className={s.sectionTitle}>
                        Últimas
                        <br />
                        novedades
                    </h2>
                    <p className={s.sectionText}>
                        Toda la actualidad del circuito: inscripciones, resultados, rankings y más.
                    </p>
                    <Link href="/noticias" className="btn btn-claro">
                        <GoogleIcon name="newspaper" />
                        Todas las noticias
                        <GoogleIcon name="arrow_outward" />
                    </Link>
                </header>

                {noticias.length === 0 ? (
                    <div className={s.newsEmpty}>
                        <div className={s.newsEmptyVisual}>
                            <Image
                                src="/noticias-padel-home.svg"
                                alt=""
                                fill
                                sizes="(max-width: 740px) 100vw, 35vw"
                            />
                            <span className={s.newsEmptySello}>
                                <GoogleIcon name="campaign" />
                                Vida de circuito
                            </span>
                        </div>
                        <div className={s.newsEmptyContenido}>
                            <p className={s.newsEmptyTitulo}>Las historias del circuito, aquí.</p>
                            <p>
                                Estamos preparando las próximas novedades. Mientras tanto, descubre fechas,
                                sedes y categorías para planificar tu temporada.
                            </p>
                            <Link href="/calendario">
                                Explorar el calendario
                                <GoogleIcon name="arrow_forward" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <ul className={s.newsGrid}>
                        {noticias.map((n) => (
                            <li key={n.id}>
                                <Link href={n.href ?? `/noticias/${n.slug}`} className={s.newsCard}>
                                    <div className={s.newsMedia}>
                                        {n.imagenUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={n.imagenUrl} alt="" loading="lazy" />
                                        )}
                                        {!n.imagenUrl && (
                                            <Image
                                                src="/noticias-padel-home.svg"
                                                alt=""
                                                fill
                                                sizes="(max-width: 740px) 100vw, 30vw"
                                            />
                                        )}
                                        <span className={s.newsBadge}>{ETIQUETAS_NOTICIA[n.categoria]}</span>
                                    </div>
                                    <div className={s.newsBody}>
                                        <h3 className={s.newsTitulo}>{n.titulo}</h3>
                                        <div className={s.newsMeta}>
                                            <span>{n.publicadaAt ? fechaCorta(n.publicadaAt) : ""}</span>
                                            <span className={s.newsFlecha} aria-hidden="true">
                                                <GoogleIcon name="arrow_forward" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}