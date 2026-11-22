import Link from "next/link";
import { ETIQUETAS_CATEGORIA, ETIQUETAS_CUADRO } from "@/lib/constantes";
import { fechaCorta } from "@/lib/formato";
import type { PartidoPublico } from "@/lib/pruebas/publico";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type ResultadoHome = {
    pruebaNombre: string;
    pruebaSlug: string;
    partido: PartidoPublico & { resultado: string };
    href?: string;
};

type Props = { resultados: ResultadoHome[] };

const ETIQUETAS_RONDA_PARTIDO: Record<string, string> = {
    round_robin: "Fase de grupos",
    dieciseisavos: "Dieciseisavos de final",
    octavos: "Octavos de final",
    cuartos: "Cuartos de final",
    semifinal: "Semifinal",
    final: "Final",
};

function etiquetaRonda(partido: PartidoPublico): string {
    if (partido.fase === "grupo") {
        return partido.grupo ? `Grupo ${partido.grupo}` : "Fase de grupos";
    }

    if (!partido.ronda || partido.ronda === "automatico") return "Eliminatoria";

    return (
        ETIQUETAS_RONDA_PARTIDO[partido.ronda] ??
        partido.ronda.replace(/_/g, " ").replace(/^./, (letra) => letra.toUpperCase())
    );
}

function NombresPareja({ nombre, className }: { nombre: string; className: string }) {
    return (
        <span className={className}>
            {nombre.split(" / ").map((jugador, index) => (
                <span key={`${jugador}-${index}`}>{jugador}</span>
            ))}
        </span>
    );
}

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
                        {resultados.map(({ pruebaNombre, pruebaSlug, partido, href }) => (
                            <li key={partido.id}>
                                <Link href={href ?? `/pruebas/${pruebaSlug}`} className={s.resultadoCard}>
                                    <span className={s.resultadoCabeceraCard}>
                                        <span className={s.resultadoPrueba}>
                                            <GoogleIcon name="event" />
                                            <span>{pruebaNombre}</span>
                                        </span>
                                        <span className={s.resultadoCategoria}>
                                            {ETIQUETAS_CATEGORIA[partido.categoria]}
                                        </span>
                                    </span>
                                    <span className={s.resultadoContexto}>
                                        <span className={s.resultadoRonda}>
                                            <GoogleIcon name={partido.fase === "grupo" ? "groups" : "emoji_events"} />
                                            {etiquetaRonda(partido)}
                                        </span>
                                        {partido.cuadro && (
                                            <span className={s.resultadoCuadro}>
                                                Cuadro {ETIQUETAS_CUADRO[partido.cuadro]}
                                            </span>
                                        )}
                                    </span>
                                    <span className={s.resultadoParejas}>
                                        <NombresPareja nombre={partido.ladoA} className={s.resultadoLadoA} />
                                        <strong className={s.resultadoMarcador}>
                                            {partido.resultado}
                                        </strong>
                                        <NombresPareja nombre={partido.ladoB} className={s.resultadoLadoB} />
                                    </span>
                                    <span className={s.resultadoPie}>
                                        <span>
                                            {partido.fecha
                                                ? `${fechaCorta(partido.fecha)}${partido.hora ? ` · ${partido.hora}` : ""}`
                                                : "Marcador final"}
                                        </span>
                                        <span className={s.resultadoVer}>
                                            Ver prueba
                                            <GoogleIcon name="arrow_outward" />
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
