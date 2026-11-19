import Link from "next/link";
import { listarPruebasAdmin } from "@/actions/pruebas";
import {
    CATEGORIAS,
    ETIQUETAS_CATEGORIA,
    ETIQUETAS_ESTADO_PRUEBA,
} from "@/lib/constantes";
import { euros, fechaCorta } from "@/lib/formato";

export default async function PaginaPruebas() {
    const res = await listarPruebasAdmin();

    if (!res.ok) {
        return <p className="p-6 text-[#C73535]">{res.error}</p>;
    }

    return (
        <main className="space-y-6 p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Pruebas</h1>
                <Link
                    href="/admin/pruebas/nueva"
                    className="rounded-lg bg-[#F0443A] px-3 py-2 text-sm font-medium text-white"
                >
                    Nueva prueba
                </Link>
            </header>

            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[#D5D9DC]">
                <table className="w-full text-sm">
                    <thead className="bg-[#F4F5F4] text-left text-xs uppercase text-[#68737D]">
                        <tr>
                            <th className="px-4 py-2">Prueba</th>
                            <th className="px-4 py-2">Fechas</th>
                            <th className="px-4 py-2">Sede</th>
                            <th className="px-4 py-2">Categorías</th>
                            <th className="px-4 py-2">Parejas</th>
                            <th className="px-4 py-2">Precio</th>
                            <th className="px-4 py-2">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {res.pruebas.map((p) => (
                            <tr key={p.id} className="border-t border-[#D5D9DC]">
                                <td className="px-4 py-2">
                                    <Link href={`/admin/pruebas/${p.id}`} className="font-medium hover:underline">
                                        {p.nombre}
                                    </Link>
                                    {p.esMaster && (
                                        <span className="ml-2 rounded bg-[#FFF4DE] px-1.5 py-0.5 text-xs text-[#B77912]">
                                            Máster
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-2">
                                    {fechaCorta(p.fechaInicio)}
                                    {p.fechaFin !== p.fechaInicio && ` – ${fechaCorta(p.fechaFin)}`}
                                </td>
                                <td className="px-4 py-2">{p.sede}</td>
                                <td className="px-4 py-2">
                                    {CATEGORIAS.filter((c) => p.categorias.includes(c))
                                        .map((c) => ETIQUETAS_CATEGORIA[c])
                                        .join(", ") || "Sin categorías"}
                                </td>
                                <td className="px-4 py-2">
                                    {p.ocupadas} / {p.plazasMaximas}
                                </td>
                                <td className="px-4 py-2">{euros(p.precioCentimos)}</td>
                                <td className="px-4 py-2">{ETIQUETAS_ESTADO_PRUEBA[p.estado]}</td>
                            </tr>
                        ))}
                        {res.pruebas.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-[#68737D]">
                                    Todavía no hay pruebas. Crea la primera.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}