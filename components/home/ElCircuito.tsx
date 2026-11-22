import Link from "next/link";
import GoogleIcon, { type GoogleIconName } from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

const VENTAJAS = [
    {
        titulo: "Pruebas periódicas",
        texto: "Competiciones durante toda la temporada.",
        icono: "calendar_month",
        href: "/calendario",
    },
    {
        titulo: "Ranking individual",
        texto: "Suma puntos en cada prueba y mejora tu posición.",
        icono: "leaderboard",
        href: "/ranking",
    },
    {
        titulo: "Race To Master",
        texto: "Accede a la Master Final según tu ranking.",
        icono: "trending_up",
        href: "/puntos",
    },
    {
        titulo: "Master Final",
        texto: "Cierra la temporada con los mejores jugadores.",
        icono: "emoji_events",
        href: "/premios",
    },
] satisfies { titulo: string; texto: string; icono: GoogleIconName; href: string }[];

export default function ElCircuito() {
    return (
        <section id="circuito" className={`${s.section} ${s.sectionLight}`}>
            <div className="container">
                <header className={`${s.sectionCabecera} ${s.sectionCabeceraCentro}`}>
                    <h2 className={s.sectionTitle}>El Circuito</h2>
                    <p className={s.sectionText}>
                        Un formato de pruebas regulares, con ranking individual y una gran Master Final.
                    </p>
                </header>

                <div className={s.featureGrid}>
                    {VENTAJAS.map((v) => (
                        <Link key={v.titulo} href={v.href} className={s.feature}>
                            <span className={s.featureIcon}>
                                <GoogleIcon name={v.icono} />
                            </span>
                            <h3 className={s.featureTitle}>{v.titulo}</h3>
                            <p className={s.featureText}>{v.texto}</p>
                            <span className={s.featureLink}>
                                Explorar
                                <GoogleIcon name="arrow_forward" />
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}