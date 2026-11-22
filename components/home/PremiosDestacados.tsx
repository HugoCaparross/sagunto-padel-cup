import Image from "next/image";
import Link from "next/link";
import {
    CATEGORIAS,
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_CUADRO,
    type Categoria,
} from "@/lib/constantes";
import type { PremioPublico } from "@/lib/patrocinio/publico";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type Props = {
    premios: PremioPublico[];
    categorias: Categoria[];
    nombrePrueba: string | null;
    pruebaSlug: string | null;
};
const IMAGENES_PREMIOS = [
    "/images/padel-court.jpg",
    "/images/padel-player.jpg",
    "/images/padel-woman.jpg",
    "/images/padel-hero.jpg",
];

export default function PremiosDestacados({
    premios,
    categorias,
    nombrePrueba,
    pruebaSlug,
}: Props) {
    const categoriasPrueba = categorias.length > 0 ? categorias : CATEGORIAS;
    const hrefPremios = pruebaSlug ? `/premios?prueba=${encodeURIComponent(pruebaSlug)}` : "/premios";

    return (
        <section className={`${s.section} ${s.sectionLight} ${s.premiosBackdrop}`}>
            <div className={`container ${s.premiosSection}`}>
                <header className={s.premiosIntro}>
                    <h2 className={s.sectionTitle}>Premios</h2>
                    <p className={s.sectionText}>
                        {nombrePrueba
                            ? `Premios propios de ${nombrePrueba}, diferentes en cada categoría.`
                            : "Reconocimiento para los campeones de cada categoría en cada prueba."}
                    </p>
                    <Link href={hrefPremios} className="btn btn-secundario">
                        Ver detalles de premios
                        <GoogleIcon name="arrow_outward" />
                    </Link>
                </header>

                <ul className={s.premiosGrid}>
                    {categoriasPrueba.map((c, index) => {
                        const premio =
                            premios.find((p) => p.categoria === c && p.cuadro === "oro") ??
                            premios.find((p) => p.categoria === c);
                        const textoPremio = !premio
                            ? "Premio por confirmar"
                            : premio.revelado
                              ? premio.descripcion || "Premio anunciado próximamente"
                              : "El premio se desvelará pronto";

                        return (
                            <li key={c}>
                                <Link href={hrefPremios} className={s.premioCard}>
                                    <Image
                                        src={IMAGENES_PREMIOS[index % IMAGENES_PREMIOS.length]}
                                        alt=""
                                        fill
                                        sizes="(max-width: 760px) 90vw, 25vw"
                                        className={s.premioImagen}
                                    />
                                    <GoogleIcon
                                        name={premio && !premio.revelado ? "lock" : "emoji_events"}
                                        className={s.premioIcono}
                                    />
                                    {premio && (
                                        <span className={s.premioCuadro}>
                                            Cuadro {ETIQUETAS_CUADRO[premio.cuadro]}
                                        </span>
                                    )}
                                    <h3 className={s.premioCat}>{ETIQUETAS_CATEGORIA[c]}</h3>
                                    <p className={s.premioTexto}>{textoPremio}</p>
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