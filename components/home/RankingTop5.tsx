"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import type { FilaTop } from "@/lib/home/datos";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type Props = { ranking: Record<Categoria, FilaTop[]> };

export default function RankingTop5({ ranking }: Props) {
    const [activa, setActiva] = useState<Categoria>("segunda");
    const botones = useRef<Array<HTMLButtonElement | null>>([]);
    const filas = ranking[activa] ?? [];

    // Pestañas con teclado: flechas, inicio y fin
    function teclado(e: KeyboardEvent<HTMLDivElement>) {
        const i = CATEGORIAS.indexOf(activa);
        let siguiente = -1;
        if (e.key === "ArrowRight") siguiente = (i + 1) % CATEGORIAS.length;
        if (e.key === "ArrowLeft") siguiente = (i - 1 + CATEGORIAS.length) % CATEGORIAS.length;
        if (e.key === "Home") siguiente = 0;
        if (e.key === "End") siguiente = CATEGORIAS.length - 1;
        if (siguiente < 0) return;

        e.preventDefault();
        setActiva(CATEGORIAS[siguiente]);
        botones.current[siguiente]?.focus();
    }

    return (
        <section className={`${s.section} ${s.sectionDark}`}>
            <div className={`container ${s.rankGrid}`}>
                <header className="space-y-5">
                    <h2 className={s.sectionTitle}>Ranking</h2>
                    <p className={s.sectionText}>
                        Sigue la clasificación individual de todas las categorías y lucha por tu plaza en el
                        Master Final.
                    </p>
                    <Link href="/ranking" className="btn btn-claro">
                        <GoogleIcon name="leaderboard" />
                        Ver ranking completo
                        <GoogleIcon name="arrow_outward" />
                    </Link>
                </header>

                <div className={s.rankPanel}>
                    <div
                        role="tablist"
                        aria-label="Categorías"
                        className={s.rankTabs}
                        onKeyDown={teclado}
                    >
                        {CATEGORIAS.map((c, i) => (
                            <button
                                key={c}
                                ref={(el) => {
                                    botones.current[i] = el;
                                }}
                                type="button"
                                role="tab"
                                id={`tab-${c}`}
                                aria-selected={c === activa}
                                aria-controls="panel-ranking"
                                tabIndex={c === activa ? 0 : -1}
                                onClick={() => setActiva(c)}
                                className={`${s.rankTab} ${c === activa ? s.rankTabActiva : ""}`}
                            >
                                {ETIQUETAS_CATEGORIA[c]}
                            </button>
                        ))}
                    </div>

                    <div role="tabpanel" id="panel-ranking" aria-labelledby={`tab-${activa}`}>
                        {filas.length === 0 ? (
                            <div className={s.rankVacio}>
                                <p className={s.rankVacioTitulo}>
                                    <GoogleIcon name="emoji_events" />
                                    Tu nombre puede estar aquí
                                </p>
                                <p>Aún no hay resultados en esta categoría.</p>
                                <Link href="/calendario">
                                    Descubre las próximas pruebas
                                    <GoogleIcon name="arrow_forward" />
                                </Link>
                            </div>
                        ) : (
                            <ol>
                                {filas.map((f) => (
                                    <li key={`${f.posicion}-${f.nombre}`} className={s.rankFila}>
                                        <span className={`${s.rankPos} ${f.posicion === 1 ? s.rankPos1 : ""}`}>
                                            {f.posicion}
                                        </span>
                                        <span className="truncate">{f.nombre}</span>
                                        <span className={s.rankPts}>{f.puntos.toLocaleString("es-ES")}</span>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>

                <aside className={s.rankLateral}>
                    <Image
                        src="/images/padel-player.jpg"
                        alt=""
                        fill
                        sizes="(max-width: 1000px) 100vw, 22vw"
                    />
                    <div className={s.rankLateralContenido}>
                        <GoogleIcon name="leaderboard" className={s.rankLateralIcono} />
                        <p className={s.rankLateralTitulo}>
                            El esfuerzo
                            <br />
                            también puntúa
                        </p>
                        <p className="text-sm">Cada partido cuenta en tu camino al Máster Final.</p>
                    </div>
                </aside>
            </div>
        </section>
    );
}