"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import type { FilaTop } from "@/lib/home/datos";
import GoogleIcon from "@/components/ui/GoogleIcon";
import s from "./home.module.css";

type CategoriaRanking = Categoria | "general";
type Props = {
    ranking: Record<Categoria, FilaTop[]>;
    rankingGeneral: FilaTop[];
};

const CATEGORIAS_RANKING: CategoriaRanking[] = ["general", ...CATEGORIAS];
const FOTOS_FALLBACK = ["/images/padel-player.jpg", "/images/padel-woman.jpg"];

function etiquetaCategoria(categoria: CategoriaRanking): string {
    return categoria === "general" ? "General" : ETIQUETAS_CATEGORIA[categoria];
}

function fotoJugador(fila: FilaTop): string {
    if (fila.fotoUrl) return fila.fotoUrl;
    const indice = [...fila.nombre].reduce((total, letra) => total + letra.charCodeAt(0), 0);
    return FOTOS_FALLBACK[indice % FOTOS_FALLBACK.length];
}

export default function RankingTop5({ ranking, rankingGeneral }: Props) {
    const [activa, setActiva] = useState<CategoriaRanking>("general");
    const [seleccionado, setSeleccionado] = useState<FilaTop | null>(null);
    const botones = useRef<Array<HTMLButtonElement | null>>([]);
    const dialogo = useRef<HTMLDialogElement>(null);
    const filas = activa === "general" ? rankingGeneral : ranking[activa] ?? [];

    useEffect(() => {
        const elemento = dialogo.current;
        if (!elemento) return;
        if (seleccionado && !elemento.open) elemento.showModal();
        if (!seleccionado && elemento.open) elemento.close();
    }, [seleccionado]);

    // Pestañas con teclado: flechas, inicio y fin
    function teclado(e: KeyboardEvent<HTMLDivElement>) {
        const i = CATEGORIAS_RANKING.indexOf(activa);
        let siguiente = -1;
        if (e.key === "ArrowRight") siguiente = (i + 1) % CATEGORIAS_RANKING.length;
        if (e.key === "ArrowLeft") siguiente = (i - 1 + CATEGORIAS_RANKING.length) % CATEGORIAS_RANKING.length;
        if (e.key === "Home") siguiente = 0;
        if (e.key === "End") siguiente = CATEGORIAS_RANKING.length - 1;
        if (siguiente < 0) return;

        e.preventDefault();
        setActiva(CATEGORIAS_RANKING[siguiente]);
        botones.current[siguiente]?.focus();
    }

    return (
        <section className={`${s.section} ${s.sectionDark}`}>
            <div className={`container ${s.rankGrid}`}>
                <header className={s.rankIntro}>
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

                <div className={s.rankView}>
                    <div
                        role="tablist"
                        aria-label="Tipo de ranking"
                        className={s.rankTabs}
                        onKeyDown={teclado}
                    >
                        {CATEGORIAS_RANKING.map((c, i) => (
                            <button
                                key={c}
                                ref={(el) => {
                                    botones.current[i] = el;
                                }}
                                type="button"
                                role="tab"
                                id={`tab-ranking-${c}`}
                                aria-selected={c === activa}
                                aria-controls="panel-ranking"
                                tabIndex={c === activa ? 0 : -1}
                                onClick={() => setActiva(c)}
                                className={`${s.rankTab} ${c === activa ? s.rankTabActiva : ""}`}
                            >
                                {etiquetaCategoria(c)}
                            </button>
                        ))}
                    </div>

                    <div className={s.rankPanel}>
                        <div className={s.rankTablaCabecera} aria-hidden="true">
                            <span>Pos.</span>
                            <span />
                            <span>Jugador</span>
                            <span>Puntos</span>
                        </div>
                        <div
                            role="tabpanel"
                            id="panel-ranking"
                            aria-labelledby={`tab-ranking-${activa}`}
                            className={s.rankTabPanel}
                        >
                            {filas.length === 0 ? (
                                <div className={s.rankVacio}>
                                    <GoogleIcon name="leaderboard" />
                                    <p>Aún no hay datos para este ranking.</p>
                                    <Link href="/calendario">
                                        Descubre las próximas pruebas
                                        <GoogleIcon name="arrow_forward" />
                                    </Link>
                                </div>
                            ) : (
                                <ol className={s.rankLista} aria-label={`Ranking ${etiquetaCategoria(activa)}`}>
                                    {filas.map((fila) => (
                                        <li key={`${fila.jugadorId ?? fila.nombre}-${fila.posicion}`} className={s.rankFila}>
                                            <span className={s.rankPos}>{fila.posicion}</span>
                                            <span className={s.rankAvatar}>
                                                <Image
                                                    src={fotoJugador(fila)}
                                                    alt=""
                                                    fill
                                                    sizes="56px"
                                                    unoptimized={Boolean(fila.fotoUrl?.startsWith("http"))}
                                                />
                                            </span>
                                            {fila.jugadorId ? (
                                                <button
                                                    type="button"
                                                    className={s.rankNombre}
                                                    onClick={() => setSeleccionado(fila)}
                                                >
                                                    <span>{fila.nombre}</span>
                                                    <GoogleIcon name="open_in_new" />
                                                </button>
                                            ) : (
                                                <span className={`${s.rankNombre} ${s.rankNombrePrivado}`}>
                                                    {fila.nombre}
                                                </span>
                                            )}
                                            <span className={s.rankPts}>
                                                {fila.puntos.toLocaleString("es-ES")}
                                                <small>pts</small>
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <dialog
                ref={dialogo}
                className={s.playerDialog}
                aria-labelledby="ficha-jugador-titulo"
                onClose={() => setSeleccionado(null)}
                onClick={(event) => {
                    if (event.target === event.currentTarget) event.currentTarget.close();
                }}
            >
                {seleccionado && (
                    <article className={s.playerCard}>
                        <div className={s.playerFoto}>
                            <Image
                                src={fotoJugador(seleccionado)}
                                alt=""
                                fill
                                sizes="(max-width: 700px) 100vw, 45vw"
                                unoptimized={Boolean(seleccionado.fotoUrl?.startsWith("http"))}
                            />
                        </div>
                        <div className={s.playerContenido}>
                            <p className={s.playerEyebrow}>
                                Sagunto Padel Cup · Ranking {etiquetaCategoria(activa)}
                            </p>
                            <h3 id="ficha-jugador-titulo">{seleccionado.nombre}</h3>
                            <p className={s.playerPuesto}>
                                <span>#{seleccionado.posicion}</span>
                                Posición actual
                            </p>
                            <div className={s.playerEstadisticas}>
                                <div>
                                    <strong>{seleccionado.puntos.toLocaleString("es-ES")}</strong>
                                    <span>Puntos</span>
                                </div>
                                <div>
                                    <strong>{seleccionado.pruebasJugadas}</strong>
                                    <span>Pruebas</span>
                                </div>
                                <div>
                                    <strong>{seleccionado.partidos}</strong>
                                    <span>Partidos</span>
                                </div>
                                <div>
                                    <strong>{seleccionado.porcentajeVictorias}%</strong>
                                    <span>Victorias</span>
                                </div>
                            </div>
                            {seleccionado.jugadorId && !seleccionado.jugadorId.startsWith("demo-") && (
                                <Link
                                    href={`/jugadores/${seleccionado.jugadorId}`}
                                    className={s.playerEnlace}
                                >
                                    Ver perfil completo
                                    <GoogleIcon name="arrow_forward" />
                                </Link>
                            )}
                        </div>
                        <button
                            type="button"
                            className={s.playerCerrar}
                            aria-label="Cerrar ficha del jugador"
                            onClick={() => dialogo.current?.close()}
                        >
                            <GoogleIcon name="close" />
                        </button>
                    </article>
                )}
            </dialog>
        </section>
    );
}