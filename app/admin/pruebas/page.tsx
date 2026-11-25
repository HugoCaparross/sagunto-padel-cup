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
        return <p className="p-6 text-[var(--color-danger)]">{res.error}</p>;
    }

    return (
        <main className="space-y-6 p-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-semibold">Pruebas</h1>
                <Link
                    href="/admin/pruebas/nueva"
                    className="btn btn-primario btn-md"
                >
                    Nueva prueba
                </Link>
            </header>

            <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-[var(--color-border)]">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--color-surface)] text-left text-sm uppercase text-[var(--color-muted)]">
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
                            <tr key={p.id} className="border-t border-[var(--color-border)]">
                                <td className="px-4 py-2">
                                    <Link href={`/admin/pruebas/${p.id}`} className="font-medium hover:underline">
                                        {p.nombre}
                                    </Link>
                                    {p.esMaster && (
                                        <span className="ml-2 rounded bg-[var(--color-warning-bg)] px-1.5 py-0.5 text-sm text-[var(--color-warning)]">
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
                                <td colSpan={7} className="px-4 py-6 text-center text-[var(--color-muted)]">
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
