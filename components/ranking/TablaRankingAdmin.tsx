import type { FilaRankingAdmin } from "@/lib/ranking/admin-datos";

type Props = {
    filas: FilaRankingAdmin[];
    marcas: Record<string, "ascenso" | "descenso">;
};

export default function TablaRankingAdmin({ filas, marcas }: Props) {
    if (filas.length === 0) {
        return (
            <p className="rounded-xl bg-white p-4 text-sm text-[#68737D] ring-1 ring-[#D5D9DC]">
                Sin resultados en la ventana de esta fecha.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
                <table className="w-full text-sm">
                    <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
                        <tr>
                            <th className="px-3 py-2">Pos.</th>
                            <th className="px-3 py-2">Jugador</th>
                            <th className="px-3 py-2 text-right">Puntos</th>
                            <th className="px-3 py-2 text-right">1.º</th>
                            <th className="px-3 py-2 text-right">2.º</th>
                            <th className="px-3 py-2 text-right">3.º</th>
                            <th className="px-3 py-2 text-right">Victorias</th>
                            <th className="px-3 py-2 text-right">Partidos</th>
                            <th className="px-3 py-2 text-right">% vict.</th>
                            <th className="px-3 py-2 text-right">Pruebas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((f) => {
                            const marca = marcas[f.clave];
                            const fondo =
                                marca === "ascenso"
                                    ? "bg-[#EAF6EF]"
                                    : marca === "descenso"
                                        ? "bg-[#FDECEC]"
                                        : "";
                            return (
                                <tr key={f.clave} className={`border-t border-[#D5D9DC] ${fondo}`}>
                                    <td className="px-3 py-2 font-medium">{f.posicion}</td>
                                    <td className="px-3 py-2">{f.nombre}</td>
                                    <td className="px-3 py-2 text-right font-medium">{f.puntos}</td>
                                    <td className="px-3 py-2 text-right">{f.primeros}</td>
                                    <td className="px-3 py-2 text-right">{f.segundos}</td>
                                    <td className="px-3 py-2 text-right">{f.terceros}</td>
                                    <td className="px-3 py-2 text-right">{f.victorias}</td>
                                    <td className="px-3 py-2 text-right">{f.partidos}</td>
                                    <td className="px-3 py-2 text-right">{f.porcentajeVictorias}%</td>
                                    <td className="px-3 py-2 text-right">{f.pruebasJugadas}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <p className="flex flex-wrap gap-4 text-xs text-[#68737D]">
                <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded bg-[#EAF6EF]" /> Zona de ascenso
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded bg-[#FDECEC]" /> Zona de descenso
                </span>
            </p>
        </div>
    );
}