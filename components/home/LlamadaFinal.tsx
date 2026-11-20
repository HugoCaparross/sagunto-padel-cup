import Image from "next/image";
import Link from "next/link";
import GoogleIcon from "@/components/ui/GoogleIcon";
import type { PruebaHome } from "@/lib/home/datos";
import s from "./home.module.css";

type Props = { prueba: PruebaHome | null };

export default function LlamadaFinal({ prueba }: Props) {
    const inscripcionesAbiertas = prueba?.estado === "abierta";

    return (
        <section className={`${s.section} ${s.sectionLight}`}>
            <div className={`container ${s.ctaFinal}`}>
                <div className={s.ctaFinalContenido}>
                    <div className={s.ctaFinalTexto}>
                        <span className={s.ctaFinalIcono}>
                            <GoogleIcon name="sports_tennis" filled />
                        </span>
                        <div>
                            <p className={s.ctaFinalEyebrow}>Deporte, comunidad y un entorno único</p>
                            <h2 className="heading-font">
                                Un circuito en una ciudad con historia
                            </h2>
                            <p>
                                {prueba
                                    ? inscripcionesAbiertas
                                        ? `Compite en ${prueba.nombre} y descubre todo lo que Sagunto tiene para ofrecer.`
                                        : `Prepárate para ${prueba.nombre} y vive el pádel también fuera de la pista.`
                                    : "Descubre el calendario y encuentra tu próxima prueba en Sagunto."}
                            </p>
                        </div>
                    </div>
                    <Link href="/circuito" className={s.ctaFinalBoton}>
                        <GoogleIcon name="location_on" />
                        Descubre el circuito
                        <GoogleIcon name="arrow_forward" />
                    </Link>
                </div>
                <figure className={s.ctaFinalMedia}>
                    <Image
                        src="/images/sagunto-castle.jpg"
                        alt="Museo arqueológico dentro del Castillo de Sagunto, rodeado por antiguas murallas."
                        fill
                        sizes="(max-width: 760px) 100vw, 55vw"
                    />
                    <figcaption className={s.ctaFinalCredito}>
                        Foto:{" "}
                        <a
                            href="https://commons.wikimedia.org/wiki/File:Castillo_de_Sagunto,_Espa%C3%B1a,_2015-01-03,_DD_12-14_HDR.JPG"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Diego Delso / Wikimedia Commons (recortada)
                        </a>
                        {" · "}
                        <a
                            href="https://creativecommons.org/licenses/by-sa/4.0/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            CC BY-SA 4.0
                        </a>
                    </figcaption>
                </figure>
            </div>
        </section>
    );
}
