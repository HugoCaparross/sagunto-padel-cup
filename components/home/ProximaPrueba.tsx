import Image from "next/image";
import Link from "next/link";
import {
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_ESTADO_PRUEBA,
} from "@/lib/constantes";
import { euros, fechaLarga } from "@/lib/formato";
import type { PruebaHome } from "@/lib/home/datos";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type Props = { prueba: PruebaHome | null };

function fechasDePrueba(prueba: PruebaHome): string {
    const inicio = fechaLarga(prueba.fechaInicio);
    return prueba.fechaFin !== prueba.fechaInicio
        ? `${inicio} – ${fechaLarga(prueba.fechaFin)}`
        : inicio;
}

export default function ProximaPrueba({ prueba }: Props) {
    const inscripcionesAbiertas = prueba?.estado === "abierta";
    const href = prueba
        ? inscripcionesAbiertas
            ? `/inscribirse/${prueba.slug}`
            : `/pruebas/${prueba.slug}`
        : "/calendario";

    return (
        <section id="proxima" className={`${s.section} ${s.sectionLight}`}>
            <div className="container">
                <header className={s.proximaCabecera}>
                    <div>
                        <p className={s.proximaEyebrow}>Temporada en juego</p>
                        <h2 className={s.sectionTitle}>Próxima prueba</h2>
                    </div>
                    <Link href="/calendario" className="btn btn-secundario">
                        Ver calendario completo
                        <GoogleIcon name="calendar_month" />
                    </Link>
                </header>

                {prueba ? (
                    <article className={s.proximaPanel}>
                        <div className={s.proximaFoto}>
                            <Image
                                src="/images/padel-court.jpg"
                                alt=""
                                fill
                                sizes="(max-width: 760px) 100vw, 40vw"
                            />
                            <span
                                className={`${s.proximaBadge} ${inscripcionesAbiertas ? s.proximaBadgeAbierta : ""}`}
                            >
                                {ETIQUETAS_ESTADO_PRUEBA[prueba.estado]}
                            </span>
                            <div className={s.proximaFotoTexto}>
                                <span>{prueba.esMaster ? "Master Final" : prueba.nombre}</span>
                                <span>
                                    <GoogleIcon name="location_on" />
                                    {prueba.sede}
                                </span>
                            </div>
                        </div>

                        <div className={s.proximaInfo}>
                            <div className={s.proximaDetalle}>
                                <span className={s.proximaIcono}>
                                    <GoogleIcon name="calendar_month" />
                                </span>
                                <span>
                                    <span className={s.proximaLabel}>Fecha</span>
                                    <strong>{fechasDePrueba(prueba)}</strong>
                                </span>
                            </div>

                            <div className={s.proximaDetalle}>
                                <span className={s.proximaIcono}>
                                    <GoogleIcon name="location_on" />
                                </span>
                                <span>
                                    <span className={s.proximaLabel}>Sede</span>
                                    <strong>{prueba.sede}</strong>
                                </span>
                            </div>

                            <div className={s.proximaCategorias}>
                                <span className={s.proximaLabel}>Categorías</span>
                                <ul>
                                    {prueba.categorias.map((categoria) => (
                                        <li key={categoria}>{ETIQUETAS_CATEGORIA[categoria]}</li>
                                    ))}
                                </ul>
                            </div>

                            <Link href={href} className={s.proximaBoton}>
                                <GoogleIcon name={inscripcionesAbiertas ? "event_available" : "event"} />
                                {inscripcionesAbiertas ? "Ver detalles e inscribirme" : "Ver detalles de la prueba"}
                                <GoogleIcon name="arrow_forward" />
                            </Link>
                        </div>

                        <aside className={s.proximaResumen} aria-label="Información de la prueba">
                            <div>
                                <span className={s.proximaResumenIcono}>
                                    <GoogleIcon name="groups" />
                                </span>
                                <span>
                                    <span className={s.proximaLabel}>Parejas máximas</span>
                                    <strong>{prueba.plazasMaximas}</strong>
                                </span>
                            </div>
                            <div>
                                <span className={s.proximaResumenIcono}>
                                    <GoogleIcon name="event_available" />
                                </span>
                                <span>
                                    <span className={s.proximaLabel}>
                                        {inscripcionesAbiertas ? "Plazas disponibles" : "Estado"}
                                    </span>
                                    <strong>
                                        {inscripcionesAbiertas
                                            ? prueba.plazasLibres
                                            : ETIQUETAS_ESTADO_PRUEBA[prueba.estado]}
                                    </strong>
                                </span>
                            </div>
                            <div>
                                <span className={s.proximaResumenIcono}>
                                    <GoogleIcon name="payments" />
                                </span>
                                <span>
                                    <span className={s.proximaLabel}>Precio por pareja</span>
                                    <strong>{euros(prueba.precioCentimos)}</strong>
                                </span>
                            </div>
                        </aside>
                    </article>
                ) : (
                    <div className={s.proximaVacia}>
                        <GoogleIcon name="event" />
                        <div>
                            <h3>Próximamente anunciaremos nuevas fechas</h3>
                            <p>Consulta el calendario para ver las pruebas publicadas.</p>
                        </div>
                        <Link href="/calendario" className="btn btn-secundario">
                            Ir al calendario
                            <GoogleIcon name="arrow_forward" />
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
