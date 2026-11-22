import Image from "next/image";
import Link from "next/link";
import { ETIQUETAS_CATEGORIA } from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import type { PartidoPublico } from "@/lib/pruebas/publico";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type ResultadoHome = {
    pruebaNombre: string;
    pruebaSlug: string;
    partido: PartidoPublico;
    href?: string;
};

type Props = { resultados: ResultadoHome[] };

const FOTOS_RESULTADOS = [
    "/images/padel-woman.jpg",
    "/images/padel-player.jpg",
    "/images/padel-court.jpg",
];

export default function ResultadosRecientes({ resultados }: Props) {
    return (
        <section className={`${s.section} ${s.sectionDark}`}>
            <div className="container">
                <header className={s.resultadosCabecera}>
                    <div>
                        <p className={s.resultadosEyebrow}>La competición, al día</p>
                        <h2 className={s.sectionTitle}>Últimos resultados</h2>
                    </div>
                    <Link href="/calendario" className="btn btn-claro">
                        <GoogleIcon name="sports_score" />
                        Ver pruebas
                        <GoogleIcon name="arrow_outward" />
                    </Link>
                </header>

                {resultados.length === 0 ? (
                    <div className={s.resultadosVacios}>
                        <span className={s.resultadosIcono}>
                            <GoogleIcon name="sports_score" />
                        </span>
                        <div>
                            <h3>Aún no hay marcadores publicados</h3>
                            <p>
                                Cuando se cierren las primeras pruebas, aquí podrás consultar sus resultados.
                            </p>
                        </div>
                        <Link href="/calendario">
                            Explorar el calendario
                            <GoogleIcon name="arrow_forward" />
                        </Link>
                    </div>
                ) : (
                    <ul className={s.resultadosGrid}>
                        {resultados.map(({ pruebaNombre, pruebaSlug, partido, href }, index) => (
                            <li key={partido.id}>
                                <Link href={href ?? `/pruebas/${pruebaSlug}`} className={s.resultadoCard}>
                                    <span className={s.resultadoImagen}>
                                        <Image
                                            src={FOTOS_RESULTADOS[index % FOTOS_RESULTADOS.length]}
                                            alt=""
                                            fill
                                            sizes="(max-width: 760px) 100vw, 25vw"
                                        />
                                    </span>
                                    <span className={s.resultadoMeta}>
                                        <span>{pruebaNombre}</span>
                                        <span>{ETIQUETAS_CATEGORIA[partido.categoria]}</span>
                                    </span>
                                    <span className={s.resultadoParejas}>
                                        <span>{partido.ladoA}</span>
                                        <span className={s.resultadoVs}>vs</span>
                                        <span>{partido.ladoB}</span>
                                    </span>
                                    <span className={s.resultadoPie}>
                                        <span>
                                            {partido.fecha ? fechaCorta(partido.fecha) : "Marcador final"}
                                        </span>
                                        <strong>{partido.resultado}</strong>
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
