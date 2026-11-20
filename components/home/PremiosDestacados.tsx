import Link from "next/link";
import { CATEGORIAS, ETIQUETAS_CATEGORIA } from "@/lib/constantes";
import type { PremioPublico } from "@/lib/patrocinio/publico";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type Props = { premios: PremioPublico[] };

export default function PremiosDestacados({ premios }: Props) {
    return (
        <section className={`${s.section} ${s.sectionLight}`}>
            <div className="container grid gap-10 lg:grid-cols-[1fr_2.2fr] lg:items-center">
                <header className="space-y-5">
                    <h2 className={s.sectionTitle}>Premios</h2>
                    <p className={s.sectionText}>
                        Reconocimiento para los campeones de cada categoría en cada prueba.
                    </p>
                    <Link href="/premios" className="btn btn-secundario">
                        Ver detalles de premios
                        <GoogleIcon name="arrow_outward" />
                    </Link>
                </header>

                <ul className={s.premiosGrid}>
                    {CATEGORIAS.map((c) => {
                        const premio =
                            premios.find((p) => p.categoria === c && p.cuadro === "oro") ??
                            premios.find((p) => p.categoria === c);

                        return (
                            <li key={c}>
                                <Link href="/premios" className={s.premioCard}>
                                    <GoogleIcon name="emoji_events" className={s.premioIcono} />
                                    <h3 className={s.premioCat}>{ETIQUETAS_CATEGORIA[c]}</h3>
                                    <p className={s.premioTexto}>
                                        {!premio
                                            ? "Próximamente"
                                            : premio.revelado
                                                ? (premio.descripcion ?? "")
                                                : "Sorpresa"}
                                    </p>
                                    <span className={s.premioEnlace}>
                                        Conocer premio
                                        <GoogleIcon name="arrow_forward" />
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}