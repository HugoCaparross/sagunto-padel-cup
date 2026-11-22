import Image from "next/image";
import Link from "next/link";
import type { EstadoPrueba } from "@/lib/constantes";
import type { PruebaHome } from "@/lib/home/datos";
import GoogleIcon, { type GoogleIconName } from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type Props = {
    pruebas: PruebaHome[];
    proximaId: string | null;
    temporada: string | null;
};

const ESTADO_TEXTO: Record<EstadoPrueba, string> = {
    proxima: "Próximamente",
    abierta: "Abierta",
    cerrada: "Cerrada",
    en_curso: "En curso",
    finalizada: "Finalizada",
};

const ESTADO_ICONO: Record<EstadoPrueba, GoogleIconName> = {
    proxima: "schedule",
    abierta: "event_available",
    cerrada: "schedule",
    en_curso: "sports_tennis",
    finalizada: "check_circle",
};

function rangoCorto(p: PruebaHome): string {
    const ini = new Date(`${p.fechaInicio}T12:00:00Z`);
    const fin = new Date(`${p.fechaFin}T12:00:00Z`);
    const mes = ini.toLocaleDateString("es-ES", { month: "short", timeZone: "UTC" }).replace(".", "");
    const mesCap = mes.charAt(0).toUpperCase() + mes.slice(1);
    const dias =
        p.fechaFin !== p.fechaInicio
            ? `${ini.getUTCDate()} – ${fin.getUTCDate()}`
            : `${ini.getUTCDate()}`;
    return `${dias} ${mesCap}`;
}

const FOTOS_PRUEBA = [
    "/images/padel-player.jpg",
    "/images/padel-woman.jpg",
    "/images/padel-court.jpg",
];

function fotoDePrueba(prueba: PruebaHome, indice: number): string {
    return prueba.esMaster ? "/images/sagunto-castle.jpg" : FOTOS_PRUEBA[indice % FOTOS_PRUEBA.length];
}

export default function LineaCalendario({ pruebas, proximaId, temporada }: Props) {
    const destacada =
        pruebas.find((prueba) => prueba.id === proximaId) ??
        pruebas.find((prueba) => prueba.estado === "abierta" || prueba.estado === "proxima") ??
        pruebas[0];
    const secundarias = pruebas.filter((prueba) => prueba.id !== destacada?.id).slice(0, 2);

    return (
        <section className={`${s.section} ${s.sectionDark}`}>
            <div
                className={`container ${s.calFeatured} ${
                    secundarias.length === 0 ? s.calFeaturedSimple : ""
                }`}
            >
                <header className={s.calIntro}>
                    <p className={s.calIntroEyebrow}>
                        Próximas pruebas{temporada ? ` · Temporada ${temporada}` : ""}
                    </p>
                    <h2 className={s.sectionTitle}>
                        Encuentra tu próxima pista.
                    </h2>
                    <p className={s.sectionText}>
                        Elige una fecha, prepara tu pareja y suma puntos durante toda la temporada.
                    </p>
                    <Link href="/calendario" className="btn btn-claro">
                        Ver todas las pruebas
                        <GoogleIcon name="arrow_forward" />
                    </Link>
                </header>

                {destacada ? (
                    <Link
                        href={destacada.href ?? `/pruebas/${destacada.slug}`}
                        className={s.calFeatureCard}
                        aria-label={`${destacada.nombre}, ${rangoCorto(destacada)}, ${ESTADO_TEXTO[destacada.estado]}`}
                    >
                        <span className={s.calFeatureImagen}>
                            <Image
                                src={fotoDePrueba(destacada, 0)}
                                alt=""
                                fill
                                sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 38vw"
                            />
                            <span className={s.calFeatureEstado} data-estado={destacada.estado}>
                                <GoogleIcon name={ESTADO_ICONO[destacada.estado]} />
                                {ESTADO_TEXTO[destacada.estado]}
                            </span>
                        </span>
                        <span className={s.calFeatureContenido}>
                            <span className={s.calFeatureEyebrow}>
                                {destacada.esMaster ? "Gran final del circuito" : "Prueba destacada"}
                            </span>
                            <strong className={s.calFeatureTitulo}>{destacada.nombre}</strong>
                            <span className={s.calFeatureMeta}>
                                <span>
                                    <GoogleIcon name="calendar_month" />
                                    {rangoCorto(destacada)}
                                </span>
                                <span>
                                    <GoogleIcon name="location_on" />
                                    {destacada.sede}
                                </span>
                            </span>
                            <span className={s.calFeatureLink}>
                                Descubrir prueba
                                <GoogleIcon name="arrow_forward" />
                            </span>
                        </span>
                    </Link>
                ) : (
                    <div className={s.calSinPruebas}>
                        <GoogleIcon name="event" />
                        <p>Estamos preparando las próximas fechas del circuito.</p>
                    </div>
                )}

                {secundarias.length > 0 && (
                    <ul className={s.calSideList} aria-label="Otras próximas pruebas">
                        {secundarias.map((prueba, index) => (
                            <li key={prueba.id}>
                                <Link
                                    href={prueba.href ?? `/pruebas/${prueba.slug}`}
                                    className={s.calSideCard}
                                    aria-label={`${prueba.nombre}, ${rangoCorto(prueba)}, ${ESTADO_TEXTO[prueba.estado]}`}
                                >
                                    <span className={s.calSideImagen}>
                                        <Image
                                            src={fotoDePrueba(prueba, index + 1)}
                                            alt=""
                                            fill
                                            sizes="(max-width: 700px) 28vw, 16vw"
                                        />
                                    </span>
                                    <span className={s.calSideContenido}>
                                        <span className={s.calSideFecha}>
                                            <GoogleIcon name="calendar_month" />
                                            {rangoCorto(prueba)}
                                        </span>
                                        <strong className={s.calSideTitulo}>{prueba.nombre}</strong>
                                        <span className={s.calSideSede}>
                                            <GoogleIcon name="location_on" />
                                            {prueba.sede}
                                        </span>
                                        <span className={s.calSideEstado} data-estado={prueba.estado}>
                                            {ESTADO_TEXTO[prueba.estado]}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}