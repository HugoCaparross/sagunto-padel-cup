import Link from "next/link";
import type { FilaRankingPublica } from "@/lib/ranking/publico";

type Props = { filas: FilaRankingPublica[] };

export default function TablaRankingPublica({ filas }: Props) {
    if (filas.length === 0) {
        return (
            <p className="rounded-xl bg-white p-6 text-sm text-[#68737D] ring-1 ring-[#D5D9DC]">
                Todavía no hay resultados en esta categoría para la fecha elegida.
            </p>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
            <table className="w-full text-sm">
                <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
                    <tr>
                        <th className="px-4 py-2">Pos.</th>
                        <th className="px-4 py-2">Jugador</th>
                        <th className="px-4 py-2 text-right">Puntos</th>
                        <th className="px-4 py-2 text-right">Pruebas</th>
                        <th className="px-4 py-2 text-right">Partidos</th>
                        <th className="px-4 py-2 text-right">% victorias</th>
                    </tr>
                </thead>
                <tbody>
                    {filas.map((f) => {
                        const primero = f.posicion === 1;
                        return (
                            <tr
                                key={f.clave}
                                className={`border-t border-[#D5D9DC] ${primero ? "bg-[#EAF6EF]" : ""}`}
                            >
                                <td className={`px-4 py-2 font-semibold ${primero ? "text-[#F0443A]" : ""}`}>
                                    {f.posicion}
                                </td>
                                <td className="px-4 py-2">
                                    {f.enlace ? (
                                        <Link href={f.enlace} className="font-medium hover:underline">
                                            {f.nombre}
                                        </Link>
                                    ) : (
                                        <span className="text-[#68737D]">{f.nombre}</span>
                                    )}
                                </td>
                                <td className="px-4 py-2 text-right font-medium">{f.puntos}</td>
                                <td className="px-4 py-2 text-right">{f.pruebasJugadas}</td>
                                <td className="px-4 py-2 text-right">{f.partidos}</td>
                                <td className="px-4 py-2 text-right">{f.porcentajeVictorias}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}