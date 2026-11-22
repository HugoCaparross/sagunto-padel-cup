import Image from "next/image";
import Link from "next/link";
import GoogleIcon, { type GoogleIconName } from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

const VENTAJAS = [
    { titulo: "Pruebas durante todo el año", icono: "calendar_month", href: "/calendario" },
    { titulo: "Ranking individual", icono: "leaderboard", href: "/ranking" },
    { titulo: "Comunidad local", icono: "groups", href: "/buscar-pareja" },
    { titulo: "Máster Final", icono: "emoji_events", href: "/premios" },
] satisfies { titulo: string; icono: GoogleIconName; href: string }[];

export default function ElCircuito() {
    return (
        <section id="circuito" className={`${s.section} ${s.sectionLight}`}>
            <div className={`container ${s.circuitoEditorial}`}>
                <div className={s.circuitoCollage} aria-hidden="true">
                    <div className={`${s.circuitoFoto} ${s.circuitoFotoPrincipal}`}>
                        <Image
                            src="/images/padel-woman.jpg"
                            alt=""
                            fill
                            sizes="(max-width: 760px) 48vw, 35vw"
                        />
                    </div>
                    <div className={`${s.circuitoFoto} ${s.circuitoFotoSecundaria}`}>
                        <Image
                            src="/images/padel-court.jpg"
                            alt=""
                            fill
                            sizes="(max-width: 760px) 45vw, 20vw"
                        />
                    </div>
                    <div className={`${s.circuitoFoto} ${s.circuitoFotoPanoramica}`}>
                        <Image
                            src="/images/sagunto-castle.jpg"
                            alt=""
                            fill
                            sizes="(max-width: 760px) 45vw, 20vw"
                        />
                    </div>
                    <span className={s.circuitoSello}>
                        <GoogleIcon name="location_on" />
                        Sagunto, sede del circuito
                    </span>
                </div>

                <div className={s.circuitoCopy}>
                    <p className={s.circuitoEyebrow}>Pádel, comunidad y territorio</p>
                    <h2 className={s.sectionTitle}>El pádel de Sagunto, vivido desde dentro.</h2>
                    <p className={s.sectionText}>
                        Un circuito amateur para jugar más, crecer con cada partido y conectar a la
                        comunidad del Camp de Morvedre.
                    </p>

                    <ul className={s.circuitoValores} aria-label="Ventajas del circuito">
                        {VENTAJAS.map((ventaja) => (
                            <li key={ventaja.titulo}>
                                <Link href={ventaja.href} className={s.circuitoValor}>
                                    <span className={s.circuitoValorIcono}>
                                        <GoogleIcon name={ventaja.icono} />
                                    </span>
                                    <span>{ventaja.titulo}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <Link href="/circuito" className={`btn btn-secundario ${s.circuitoCta}`}>
                        Conocer el circuito
                        <GoogleIcon name="arrow_forward" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
