import Image from "next/image";
import Link from "next/link";
import type { PruebaHome } from "@/lib/home/datos";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type Props = {
    temporada: string | null;
    proxima: PruebaHome | null;
    pruebas: number;
};

export default function Hero({ temporada, proxima, pruebas }: Props) {
    const inscripcionesAbiertas = proxima?.estado === "abierta";
    const href = proxima
        ? inscripcionesAbiertas
            ? `/inscribirse/${proxima.slug}`
            : `/pruebas/${proxima.slug}`
        : "/calendario";

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
                <p className={s.heroSello} aria-hidden="true">
                    Más
                    <br />
                    pádel
                    <br />
                    más
                    <br />
                    Sagunto
                </p>
            </div>
        </section>
    );
}
