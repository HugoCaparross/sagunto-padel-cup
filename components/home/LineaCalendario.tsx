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

const ESTADO_CLASE: Record<EstadoPrueba, string> = {
    proxima: s.calEstadoProxima,
    abierta: s.calEstadoAbierta,
    cerrada: s.calEstadoCerrada,
    en_curso: s.calEstadoEnCurso,
    finalizada: s.calEstadoFinalizada,
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

export default function LineaCalendario({ pruebas, proximaId, temporada }: Props) {
    let numero = 0;

    return (
        <section className={`${s.section} ${s.sectionLight}`}>
            <div className="container grid gap-10 lg:grid-cols-[1fr_2.4fr] lg:items-center">
                <header className="space-y-5">
                    <h2 className={s.sectionTitle}>
                        Calendario
                        {temporada && (
                            <>
                                <br />
                                Temporada {temporada}
                            </>
                        )}
                    </h2>
                    <p className={s.sectionText}>
                        Cada fecha es una nueva oportunidad para competir y sumar puntos.
                    </p>
                    <Link href="/calendario" className="btn btn-secundario">
                        Ver todas las pruebas
                        <GoogleIcon name="arrow_forward" />
                    </Link>
                </header>

                <ol className={s.calGrid}>
                    {pruebas.map((p, index) => {
                        if (!p.esMaster) numero++;

                        const clases = [
                            s.calCard,
                            p.esMaster ? s.calCardMaster : "",
                            p.id === proximaId || p.estado === "abierta" ? s.calCardActiva : "",
                        ].join(" ");

                        return (
                            <li key={p.id}>
                                <Link
                                    href={`/pruebas/${p.slug}`}
                                    className={clases}
                                    aria-label={`${p.esMaster ? "Master Final" : `${numero}.ª Prueba`}, ${rangoCorto(p)}, ${ESTADO_TEXTO[p.estado]}`}
                                >
                                    <span className={s.calImagen}>
                                        <Image
                                            src={p.esMaster ? "/images/padel-court.jpg" : FOTOS_PRUEBA[index % FOTOS_PRUEBA.length]}
                                            alt=""
                                            fill
                                            sizes="(max-width: 680px) 82vw, (max-width: 1100px) 40vw, 28vw"
                                        />
                                        <span className={`${s.calEstado} ${ESTADO_CLASE[p.estado]}`}>
                                            <GoogleIcon name={ESTADO_ICONO[p.estado]} />
                                            {ESTADO_TEXTO[p.estado]}
                                        </span>
                                    </span>
                                    <span className={s.calContenido}>
                                        <span className={s.calDate}>
                                            <GoogleIcon name="calendar_month" />
                                            {rangoCorto(p)}
                                        </span>
                                        <span className={s.calName}>{p.nombre}</span>
                                        <span className={s.calSede}>
                                            <GoogleIcon name="location_on" />
                                            {p.sede}
                                        </span>
                                        <span className={s.calFlecha}>
                                            Ver prueba
                                            <GoogleIcon name="arrow_forward" />
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}