"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIAS, ETIQUETAS_CATEGORIA, type Categoria } from "@/lib/constantes";
import type { FilaTop } from "@/lib/home/datos";

type Props = { ranking: Record<Categoria, FilaTop[]> };

export default function RankingTop5({ ranking }: Props) {
    const [activa, setActiva] = useState<Categoria>("segunda");
    const filas = ranking[activa];

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="heading-font text-4xl">Ranking</h2>
                <Link href="/ranking" className="text-sm underline">
                    Ranking completo
                </Link>
            </div>

            <div role="tablist" className="flex flex-wrap gap-2">
                {CATEGORIAS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        role="tab"
                        aria-selected={c === activa}
                        onClick={() => setActiva(c)}
                        className={`rounded-md px-3 py-1.5 text-sm ${c === activa ? "bg-[#0D1B2A] text-white" : "bg-white ring-1 ring-[#D5D9DC]"
                            }`}
                    >
                        {ETIQUETAS_CATEGORIA[c]}
                    </button>
                ))}
            </div>

            {filas.length === 0 ? (
                <p className="rounded-xl bg-white p-6 text-sm text-[#68737D] ring-1 ring-[#D5D9DC]">
                    Todavía no hay resultados en esta categoría.
                </p>
            ) : (
                <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
                    <table className="w-full text-sm">
                        <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
                            <tr>
                                <th className="px-4 py-2">Pos.</th>
                                <th className="px-4 py-2">Jugador</th>
                                <th className="px-4 py-2 text-right">Puntos</th>
                                <th className="px-4 py-2 text-right">Pruebas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map((f) => {
                                const primero = f.posicion === 1;
                                return (
                                    <tr
                                        key={`${f.posicion}-${f.nombre}`}
                                        className={`border-t border-[#D5D9DC] ${primero ? "bg-[#EAF6EF]" : ""}`}
                                    >
                                        <td className={`px-4 py-2 font-semibold ${primero ? "text-[#F0443A]" : ""}`}>
                                            {f.posicion}
                                        </td>
                                        <td className="px-4 py-2">{f.nombre}</td>
                                        <td className="px-4 py-2 text-right font-medium">{f.puntos}</td>
                                        <td className="px-4 py-2 text-right">{f.pruebasJugadas}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}